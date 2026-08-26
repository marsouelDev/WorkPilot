import {
  Injectable,
  Logger,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { Octokit } from '@octokit/rest';
import { AiService, TacheGeneree } from '../ai/ai.service';
import { DatabaseService } from '../database/database.service';
import { EmailService } from '../email/email.service';
import { CreateProjectDto } from './dto/create-project-dto';
import { InviteMemberDto } from './dto/invite-member.dto';
import { NotificationService } from '../notification/notification.service';
import { CryptoService } from '../crypto/crypto.service';
import { GithubService } from '../github/github.service';

const GITHUB_API_HEADERS = {
  'X-GitHub-Api-Version': '2022-11-28',
};

@Injectable()
export class ProjectsService {
  private readonly logger = new Logger(ProjectsService.name);

  constructor(
    private readonly ai: AiService,
    private readonly databaseService: DatabaseService,
    private readonly emailService: EmailService,
    private readonly notifications: NotificationService,
    private readonly crypto: CryptoService,
    private readonly github: GithubService,
  ) {}

  async creerProjet(createurId: number, dto: CreateProjectDto) {
    const createur = await this.databaseService.utilisateur.findUnique({
      where: { id: createurId },
    });

    if (!createur) {
      throw new BadRequestException('Utilisateur introuvable');
    }

    const tokenGithub = await this.getGithubToken(createurId);

    if (!tokenGithub || !createur.githubUsername) {
      throw new BadRequestException(
        'Vous devez connecter votre compte GitHub avant de créer un projet.',
      );
    }

    const nomDepot = this.genererNomDepot(dto.titre);

    const octokit = new Octokit({
      auth: tokenGithub,
      userAgent: 'WorkPilot/1.0',
    });

    let depotGitUrl: string;

    try {
      this.logger.log(
        `Création du dépôt "${nomDepot}" chez @${createur.githubUsername}...`,
      );

      const descriptionPropre = dto.description
        .replace(/[\n\r\t]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .substring(0, 350);

      const { data: repo } = await octokit.repos.createForAuthenticatedUser({
        name: nomDepot,
        description: descriptionPropre,
        private: true,
        auto_init: false,
        headers: GITHUB_API_HEADERS,
      });

      depotGitUrl = repo.html_url;
      this.logger.log(`Dépôt créé : ${depotGitUrl}`);
    } catch (error: any) {
      this.logger.error('Erreur création dépôt GitHub', error);
      throw new BadRequestException(
        `Impossible de créer le dépôt "${nomDepot}" sur votre compte GitHub. Vérifiez que ce nom n'existe pas déjà.`,
      );
    }

    let contenuCdc: string | null = null;
    let tachesGenerees: TacheGeneree[] = [];

    try {
      this.logger.log(`Génération du CDC pour "${dto.titre}"...`);

      contenuCdc = await this.ai.genererCahierDesCharges(
        dto.titre,
        dto.description,
      );

      this.logger.log(`CDC généré (${contenuCdc?.length || 0} caractères)`);

      if (contenuCdc) {
        this.logger.log('Découpage en tâches...');
        tachesGenerees = await this.ai.genererTaches(contenuCdc);
        this.logger.log(`${tachesGenerees.length} tâches générées`);
      }
    } catch (error) {
      this.logger.error('Erreur IA (non bloquante)', error);
    }

    const result = await this.databaseService.$transaction(async (tx) => {
      const projet = await tx.projet.create({
        data: {
          titre: dto.titre,
          descriptionSommaire: dto.description,
          depotGitUrl: depotGitUrl,
          createurId,
        },
      });

      await tx.membre.create({
        data: {
          projetId: projet.id,
          utilisateurId: createurId,
          role: 'chef_projet',
        },
      });

      let cahierDesCharges: any = null;

      if (contenuCdc) {
        cahierDesCharges = await tx.cahierDesCharges.create({
          data: { projetId: projet.id, contenuGenere: contenuCdc },
        });
      }

      let taches: { id: number; titre: string }[] = [];

      if (tachesGenerees.length > 0) {
        await tx.tache.createMany({
          data: tachesGenerees.map((t) => ({
            projetId: projet.id,
            titre: t.titre,
            descriptionGeneree: t.descriptionGeneree,
            competences: t.competences,
            complexite: t.complexite as any,
            statut: 'disponible',
          })),
        });

        taches = await tx.tache.findMany({
          where: { projetId: projet.id },
          select: { id: true, titre: true },
        });
      }

      this.logger.log(`Projet créé en base avec ${taches.length} tâche(s)`);

      return { projet, cahierDesCharges, taches };
    });

    try {
      await this.pousserFichiersInitiaux(
        octokit,
        createur.githubUsername,
        nomDepot,
        dto.titre,
        dto.description,
        contenuCdc,
      );
      this.logger.log(`Fichiers initiaux poussés sur ${nomDepot}`);
    } catch (error: any) {
      this.logger.warn(
        `Impossible de pousser les fichiers sur GitHub : ${error.message}`,
      );
    }

    return {
      projet: result.projet,
      cahierDesCharges: result.cahierDesCharges,
      taches: result.taches,
      generationReussie: !!result.cahierDesCharges,
      depotGitUrl,
    };
  }

  async trouverParId(projetId: number, utilisateurId: number) {
    const projet = await this.databaseService.projet.findUnique({
      where: { id: projetId },
      include: {
        cahierDesCharges: true,
        taches: true,
        createur: {
          select: {
            id: true,
            nom: true,
            prenom: true,
            email: true,
            githubUsername: true,
            githubToken: true,
          },
        },
        membres: {
          include: {
            utilisateur: {
              select: { id: true, nom: true, prenom: true, email: true },
            },
          },
        },
      },
    });

    if (!projet) {
      throw new NotFoundException('Projet introuvable');
    }

    const estMembre = projet.membres.some(
      (m) => m.utilisateurId === utilisateurId,
    );
    const estCreateur = projet.createurId === utilisateurId;

    if (!estMembre && !estCreateur) {
      throw new ForbiddenException("Vous n'avez pas accès à ce projet");
    }

    return projet;
  }

  async listerProjetsDeUtilisateur(utilisateurId: number) {
    return this.databaseService.projet.findMany({
      where: {
        OR: [
          { createurId: utilisateurId },
          { membres: { some: { utilisateurId } } },
        ],
      },
      include: {
        _count: { select: { taches: true, membres: true } },
        createur: {
          select: { id: true, nom: true, prenom: true, email: true },
        },
        membres: {
          include: {
            utilisateur: {
              select: { id: true, nom: true, prenom: true, email: true },
            },
          },
        },
        cahierDesCharges: true,
        taches: true,
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async listeDesProjetSysteme() {
    return this.databaseService.projet.findMany({
      include: {
        createur: {
          select: { id: true, nom: true, prenom: true, email: true },
        },
        membres: {
          include: {
            utilisateur: {
              select: { id: true, nom: true, prenom: true, email: true },
            },
          },
        },
        taches: {
          select: {
            id: true,
            titre: true,
            statut: true,
            assigneeId: true,
          },
        },
        cahierDesCharges: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async obtenirCahierDesCharges(projetId: number, utilisateurId: number) {
    const projet = await this.databaseService.projet.findUnique({
      where: { id: projetId },
      include: {
        cahierDesCharges: true,
        createur: {
          select: { id: true, nom: true, prenom: true, email: true },
        },
        membres: {
          include: {
            utilisateur: {
              select: { id: true, nom: true, prenom: true, email: true },
            },
          },
        },
      },
    });

    if (!projet) throw new NotFoundException('Projet introuvable');

    const estMembre = projet.membres.some(
      (m) => m.utilisateurId === utilisateurId,
    );
    const estCreateur = projet.createurId === utilisateurId;

    if (!estMembre && !estCreateur) {
      throw new ForbiddenException("Vous n'avez pas accès à ce projet");
    }

    if (!projet.cahierDesCharges) {
      throw new NotFoundException(
        'Aucun cahier des charges généré pour ce projet',
      );
    }

    return {
      projet: {
        id: projet.id,
        titre: projet.titre,
        descriptionSommaire: projet.descriptionSommaire,
      },
      cahierDesCharges: {
        id: projet.cahierDesCharges.id,
        contenuGenere: projet.cahierDesCharges.contenuGenere,
        dateGeneration: projet.cahierDesCharges.dateGeneration,
      },
    };
  }

  async inviterMembre(
    projetId: number,
    dto: InviteMemberDto,
    inviteurId: number,
  ) {
    const projet = await this.databaseService.projet.findUnique({
      where: { id: projetId },
      include: {
        createur: {
          select: {
            id: true,
            nom: true,
            prenom: true,
            email: true,
            githubUsername: true,
            githubToken: true,
          },
        },
      },
    });

    if (!projet) throw new NotFoundException('Projet introuvable');

    const utilisateur = await this.databaseService.utilisateur.findUnique({
      where: { email: dto.email },
    });

    if (!utilisateur) throw new NotFoundException('Utilisateur introuvable');

    const inviteur = await this.databaseService.utilisateur.findUnique({
      where: { id: inviteurId },
    });

    try {
      const membre = await this.databaseService.membre.create({
        data: {
          projetId,
          utilisateurId: utilisateur.id,
          role: dto.role,
        },
        include: {
          utilisateur: {
            select: {
              id: true,
              nom: true,
              prenom: true,
              email: true,
              telephone: true,
            },
          },
        },
      });

      await this.emailService.envoyer(utilisateur.email, 'invitation_projet', {
        nom: `${utilisateur.prenom} ${utilisateur.nom}`,
        projetTitre: projet.titre,
        projetId: projet.id,
        role: membre.role,
        inviteurNom: inviteur
          ? `${inviteur.prenom} ${inviteur.nom}`
          : 'Un membre',
      });

      await this.notifications.creer(utilisateur.id, {
        type: 'invitation_projet',
        titre: 'Invitation à un projet',
        message: `${inviteur ? `${inviteur.prenom} ${inviteur.nom}` : 'Quelqu’un'} vous a invité au projet "${projet.titre}" en tant que ${dto.role}.`,
        projetId: projet.id,
      });

      this.logger.log(
        `Membre ${utilisateur.email} invité au projet "${projet.titre}" avec le rôle ${dto.role} par ${inviteur?.email}`,
      );

      if (utilisateur.githubUsername && projet.depotGitUrl) {
        await this.inviterSurGithub(projet, utilisateur.githubUsername);
      }

      return membre;
    } catch (error: any) {
      if (error?.code === 'P2002') {
        throw new Error('Cet utilisateur est déjà membre du projet');
      }
      this.logger.error(
        `Erreur lors de l'invitation de l'utilisateur ${dto.email}`,
        error,
      );
      throw error;
    }
  }

  async rechercherUtilisateursParEmail(email: string) {
    if (!email || email.trim().length === 0) return [];

    return this.databaseService.utilisateur.findMany({
      where: {
        email: { contains: email.trim(), mode: 'insensitive' },
      },
      select: {
        id: true,
        nom: true,
        prenom: true,
        email: true,
        telephone: true,
      },
      orderBy: { email: 'asc' },
      take: 10,
    });
  }

  async changeDeRole(
    projetId: number,
    membreId: number,
    nouveauRole: 'developpeur' | 'relecteur' | 'chef_projet',
  ) {
    const membre = await this.databaseService.membre.findUnique({
      where: { id: membreId },
      include: { projet: true, utilisateur: true },
    });

    if (!membre) throw new NotFoundException('Membre introuvable');

    if (membre.projetId !== projetId) {
      throw new ForbiddenException("Ce membre n'appartient pas à ce projet");
    }

    if (membre.projet.createurId === membre.utilisateurId) {
      throw new ForbiddenException(
        'Impossible de modifier le rôle du créateur du projet',
      );
    }

    if (membre.role === nouveauRole) {
      throw new Error('Le membre a déjà ce rôle');
    }

    const ancienRole = membre.role;

    const membreUpdated = await this.databaseService.membre.update({
      where: { id: membreId },
      data: { role: nouveauRole },
      include: {
        utilisateur: {
          select: { id: true, nom: true, prenom: true, email: true },
        },
      },
    });

    await this.emailService.envoyer(
      membre.utilisateur.email,
      'changement_role',
      {
        nom: `${membre.utilisateur.prenom} ${membre.utilisateur.nom}`,
        projetTitre: membre.projet.titre,
        projetId: membre.projetId,
        role: nouveauRole,
        ancienRole,
      },
    );

    await this.notifications.creer(membre.utilisateurId, {
      type: 'changement_role',
      titre: 'Changement de rôle',
      message: `Votre rôle sur le projet "${membre.projet.titre}" est passé de ${ancienRole} à ${nouveauRole}.`,
      projetId: membre.projetId,
    });

    this.logger.log(
      `Rôle de ${membre.utilisateur.email} changé : ${ancienRole} → ${nouveauRole}`,
    );

    return membreUpdated;
  }

  async retirerMembre(projetId: number, utilisateurId: number) {
    const projet = await this.databaseService.projet.findUnique({
      where: { id: projetId },
      include: {
        createur: {
          select: {
            id: true,
            nom: true,
            prenom: true,
            email: true,
            githubUsername: true,
            githubToken: true,
          },
        },
      },
    });

    if (!projet) throw new NotFoundException('Projet introuvable');

    if (projet.createurId === utilisateurId) {
      throw new ForbiddenException(
        'Impossible de retirer le créateur du projet',
      );
    }

    const utilisateur = await this.databaseService.utilisateur.findUnique({
      where: { id: utilisateurId },
    });

    const result = await this.databaseService.membre.deleteMany({
      where: { projetId, utilisateurId },
    });

    if (result.count === 0) {
      throw new NotFoundException("Cet utilisateur n'est pas membre du projet");
    }

    if (utilisateur) {
      await this.emailService.envoyer(utilisateur.email, 'retrait_projet', {
        nom: `${utilisateur.prenom} ${utilisateur.nom}`,
        projetTitre: projet.titre,
        projetId: projet.id,
      });

      await this.notifications.creer(utilisateurId, {
        type: 'retrait_projet',
        titre: 'Retrait d’un projet',
        message: `Vous avez été retiré du projet "${projet.titre}".`,
        projetId: projet.id,
      });

      this.logger.log(
        `Membre ${utilisateur.email} retiré du projet "${projet.titre}"`,
      );

      if (utilisateur.githubUsername && projet.depotGitUrl) {
        await this.retirerDeGithub(projet, utilisateur.githubUsername);
      }
    }

    return { message: 'Membre retiré avec succès' };
  }

  async listerMembresProjet(projetId: number) {
    const projet = await this.databaseService.projet.findUnique({
      where: { id: projetId },
    });

    if (!projet) throw new NotFoundException('Projet introuvable');

    return this.databaseService.membre.findMany({
      where: { projetId, role: { not: 'chef_projet' } },
      include: {
        utilisateur: {
          select: {
            id: true,
            nom: true,
            prenom: true,
            email: true,
            telephone: true,
          },
        },
      },
      orderBy: { id: 'desc' },
    });
  }

  async listerTachesDuProjet(projetId: number, utilisateurId: number) {
    const projet = await this.databaseService.projet.findUnique({
      where: { id: projetId },
      include: { membres: { select: { utilisateurId: true } } },
    });

    if (!projet) throw new NotFoundException('Projet introuvable');

    const estMembre = projet.membres.some(
      (membre) => membre.utilisateurId === utilisateurId,
    );
    const estCreateur = projet.createurId === utilisateurId;

    if (!estMembre && !estCreateur) {
      throw new ForbiddenException(
        "Vous n'avez pas accès aux tâches de ce projet",
      );
    }

    const taches = await this.databaseService.tache.findMany({
      where: { projetId },
      include: { assignee: { select: { id: true, nom: true, prenom: true } } },
      orderBy: { createdAt: 'asc' },
    });

    return {
      projetId,
      nombreTaches: taches.length,
      taches,
    };
  }

  async regenererCahierDesCharges(projetId: number, utilisateurId: number) {
    const projet = await this.databaseService.projet.findUnique({
      where: { id: projetId },
      include: {
        membres: { where: { utilisateurId }, select: { role: true } },
      },
    });

    if (!projet) throw new NotFoundException('Projet introuvable');

    const estMembre = projet.membres.length > 0;
    const estCreateur = projet.createurId === utilisateurId;

    if (!estMembre && !estCreateur) {
      throw new ForbiddenException("Vous n'avez pas accès à ce projet");
    }

    const estChefProjet = projet.membres.some((m) => m.role === 'chef_projet');

    if (!estChefProjet && !estCreateur) {
      throw new ForbiddenException(
        'Seul le chef de projet peut régénérer le cahier des charges',
      );
    }

    let contenuCdc: string | null = null;
    let tachesGenerees: TacheGeneree[] = [];

    try {
      this.logger.log(`Régénération du CDC pour le projet ${projetId}...`);

      contenuCdc = await this.ai.genererCahierDesCharges(
        projet.titre,
        projet.descriptionSommaire,
      );

      if (contenuCdc) {
        tachesGenerees = await this.ai.genererTaches(contenuCdc);
        this.logger.log(`${tachesGenerees.length} nouvelles tâches générées`);
      }
    } catch (error) {
      this.logger.error('❌ Erreur lors de la régénération IA', error);
    }

    return this.databaseService.$transaction(async (tx) => {
      const tachesSupprimees = await tx.tache.deleteMany({
        where: { projetId, statut: 'disponible' },
      });

      await tx.cahierDesCharges.deleteMany({ where: { projetId } });

      let cahierDesCharges: any = null;

      if (contenuCdc) {
        cahierDesCharges = await tx.cahierDesCharges.create({
          data: { projetId, contenuGenere: contenuCdc },
        });
      }

      let taches: { id: number; titre: string }[] = [];

      if (tachesGenerees.length > 0) {
        await tx.tache.createMany({
          data: tachesGenerees.map((t) => ({
            projetId,
            titre: t.titre,
            descriptionGeneree: t.descriptionGeneree,
            competences: t.competences,
            complexite: t.complexite as any,
            statut: 'disponible',
          })),
        });

        taches = await tx.tache.findMany({
          where: { projetId },
          select: { id: true, titre: true },
        });
      }

      this.logger.log(
        `CDC régénéré : ${tachesSupprimees.count} tâches supprimées, ${taches.length} créées`,
      );

      return {
        cahierDesCharges,
        taches,
        tachesSupprimees: tachesSupprimees.count,
        generationReussie: !!cahierDesCharges,
      };
    });
  }

  async retirerProject(projetId: number, userId: number) {
    const projet = await this.databaseService.projet.findUnique({
      where: { id: projetId },
      include: {
        createur: {
          select: {
            id: true,
            nom: true,
            prenom: true,
            email: true,
            githubUsername: true,
            githubToken: true,
          },
        },
      },
    });

    if (!projet) throw new NotFoundException('Projet introuvable');

    if (projet.createurId !== userId) {
      throw new ForbiddenException(
        'Seul le créateur du projet peut le supprimer',
      );
    }

    if (projet.depotGitUrl && projet.createur.githubToken) {
      await this.supprimerDepotGithub(projet);
    }

    await this.databaseService.projet.delete({ where: { id: projetId } });

    this.logger.log(`Projet ${projetId} supprimé par ${userId}`);

    return { message: 'Projet supprimé avec succès' };
  }

  async chargerProjetGithub(
    projetId: number,
    utilisateurId: number,
    brancheChoisie?: string,
  ) {
    this.logger.log(`Chargement projet ${projetId} pour user ${utilisateurId}`);

    const projet = await this.trouverParId(projetId, utilisateurId);

    this.logger.log(
      `Accès OK. depotGitUrl: ${projet.depotGitUrl}, createurId: ${projet.createurId}`,
    );

    if (!projet.depotGitUrl) {
      throw new BadRequestException("Ce projet n'a pas de dépôt GitHub");
    }

    const octokit = await this.github.obtenirOctokit(projet, utilisateurId);
    const { owner, repo } = this.github.extraireOwnerEtRepo(projet.depotGitUrl);

    const membre = await this.databaseService.membre.findUnique({
      where: { projetId_utilisateurId: { projetId, utilisateurId } },
    });

    this.logger.log(
      `Branche travail: ${membre?.brancheTravail ?? 'aucune (défaut)'}`,
    );

    return this.github.chargerFichiers(
      octokit,
      owner,
      repo,
      brancheChoisie ?? membre?.brancheTravail ?? undefined,
    );
  }

  async synchroniserFichiers(
    projetId: number,
    utilisateurId: number,
    fichiers: { path: string; contenu: string }[],
    brancheChoisie?: string,
  ) {
    if (fichiers.length === 0) {
      return { message: 'Aucun fichier à synchroniser' };
    }

    const projet = await this.trouverParId(projetId, utilisateurId);

    const octokit = await this.github.obtenirOctokit(projet, utilisateurId);
    const { owner, repo } = this.github.extraireOwnerEtRepo(
      projet.depotGitUrl!,
    );

    const result = await this.github.pousserFichiers(
      octokit,
      owner,
      repo,
      fichiers,
      brancheChoisie,
    );

    await this.databaseService.membre.update({
      where: { projetId_utilisateurId: { projetId, utilisateurId } },
      data: {
        brancheTravail: result.branche,
        dernierCommitSha: result.commit,
      },
    });

    return {
      message: 'Synchronisation réussie',
      branche: result.branche,
      commit: result.commit,
      fichiers: fichiers.length,
    };
  }

  async listerBranches(projetId: number, utilisateurId: number) {
    const projet = await this.trouverParId(projetId, utilisateurId);

    const octokit = await this.github.obtenirOctokit(projet, utilisateurId);
    const { owner, repo } = this.github.extraireOwnerEtRepo(
      projet.depotGitUrl!,
    );

    return { branches: await this.github.listerBranches(octokit, owner, repo) };
  }

  private genererNomDepot(titre: string): string {
    const slug = titre
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
      .substring(0, 60);

    return `${slug || 'projet'}`;
  }

  private async pousserFichiersInitiaux(
    octokit: Octokit,
    owner: string,
    repo: string,
    titre: string,
    description: string,
    contenuCdc: string | null,
  ) {
    const readme = [
      `# ${titre}`,
      '',
      description,
      '',
      '---',
      '',
      '',
      '## Structure',
      '',
      '- `docs/cahier-des-charges.md` — Cahier des charges généré par IA',
      '- `src/` — Code source du projet',
      '',
      '## Démarrage',
      '',
      '```bash',
      `git clone https://github.com/${owner}/${repo}.git`,
      `cd ${repo}`,
      '```',
    ].join('\n');

    await octokit.repos.createOrUpdateFileContents({
      owner,
      repo,
      path: 'README.md',
      message: 'docs: initialisation du projet par WorkPilot',
      content: Buffer.from(readme).toString('base64'),
      headers: GITHUB_API_HEADERS,
    });

    if (contenuCdc) {
      await octokit.repos.createOrUpdateFileContents({
        owner,
        repo,
        path: 'docs/cahier-des-charges.md',
        message: 'docs: ajout du cahier des charges',
        content: Buffer.from(contenuCdc).toString('base64'),
        headers: GITHUB_API_HEADERS,
      });
    }
  }

  private async inviterSurGithub(projet: any, githubUsername: string) {
    const tokenGithub = await this.getGithubToken(projet.createurId);

    if (!projet.depotGitUrl || !tokenGithub) return;

    try {
      const octokit = new Octokit({
        auth: tokenGithub,
        userAgent: 'WorkPilot/1.0',
      });

      const { owner, repo } = this.extraireOwnerEtRepo(projet.depotGitUrl);

      await octokit.repos.addCollaborator({
        owner,
        repo,
        username: githubUsername,
        permission: 'push',
        headers: GITHUB_API_HEADERS,
      });

      this.logger.log(`@${githubUsername} invité sur ${owner}/${repo}`);
    } catch (error: any) {
      this.logger.warn(
        `Impossible d'inviter @${githubUsername} sur GitHub : ${error.message}`,
      );
    }
  }

  private async retirerDeGithub(projet: any, githubUsername: string) {
    const tokenGithub = await this.getGithubToken(projet.createurId);

    if (!projet.depotGitUrl || !tokenGithub) return;

    try {
      const octokit = new Octokit({
        auth: tokenGithub,
        userAgent: 'WorkPilot/1.0',
      });

      const { owner, repo } = this.extraireOwnerEtRepo(projet.depotGitUrl);

      await octokit.repos.removeCollaborator({
        owner,
        repo,
        username: githubUsername,
        headers: GITHUB_API_HEADERS,
      });

      this.logger.log(`@${githubUsername} retiré de ${owner}/${repo}`);
    } catch (error: any) {
      this.logger.warn(
        `Impossible de retirer @${githubUsername} de GitHub : ${error.message}`,
      );
    }
  }

  private async supprimerDepotGithub(projet: any) {
    const tokenGithub = await this.getGithubToken(projet.createurId);

    if (!projet.depotGitUrl || !tokenGithub) return;

    try {
      const octokit = new Octokit({
        auth: tokenGithub,
        userAgent: 'WorkPilot/1.0',
      });

      const { owner, repo } = this.extraireOwnerEtRepo(projet.depotGitUrl);

      await octokit.repos.delete({
        owner,
        repo,
        headers: GITHUB_API_HEADERS,
      });

      this.logger.log(`Dépôt GitHub ${owner}/${repo} supprimé`);
    } catch (error: any) {
      this.logger.warn(
        `Impossible de supprimer le dépôt GitHub : ${error.message}`,
      );
    }
  }

  private extraireOwnerEtRepo(url: string): { owner: string; repo: string } {
    const match = /github\.com[/:]([^/]+)\/([^/]+?)(\.git)?$/.exec(url);

    if (!match) throw new BadRequestException('URL GitHub invalide');

    return { owner: match[1], repo: match[2] };
  }

  private async getGithubToken(userId: number): Promise<string | null> {
    const user = await this.databaseService.utilisateur.findUnique({
      where: { id: userId },
      select: { githubToken: true },
    });

    if (!user?.githubToken) return null;

    try {
      return this.crypto.dechiffrer(user.githubToken);
    } catch (error) {
      this.logger.error(
        `Token GitHub illisible pour user ${userId} : ${(error as Error).message}`,
      );
      return null;
    }
  }
  async listerBranchesDetaillees(projetId: number, userId: number) {
    const projet = await this.databaseService.projet.findUnique({
      where: { id: projetId },
      include: {
        membres: { select: { utilisateurId: true } },
      },
    });

    if (!projet) {
      throw new NotFoundException('Projet introuvable');
    }

    const estMembre =
      projet.membres.some((m) => m.utilisateurId === userId) ||
      projet.createurId === userId;

    if (!estMembre) {
      throw new ForbiddenException("Vous n'avez pas accès à ce projet");
    }

    if (!projet.depotGitUrl) {
      throw new BadRequestException("Ce projet n'a pas de dépôt GitHub");
    }

    const octokit = await this.github.obtenirOctokit(projet, userId);
    const { owner, repo } = this.github.extraireOwnerEtRepo(projet.depotGitUrl);

    return this.github.listerBranchesDetaillees(octokit, owner, repo);
  }
}
