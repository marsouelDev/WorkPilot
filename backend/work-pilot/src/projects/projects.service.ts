import {
  Injectable,
  Logger,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { AiService, TacheGeneree } from '../ai/ai.service';
import { DatabaseService } from '../database/database.service';
import { CreateProjectDto } from './dto/create-project-dto';
import { EmailService } from '../email/email.service';
import { InviteMemberDto } from './dto/invite-member.dto';

@Injectable()
export class ProjectsService {
  private readonly logger = new Logger(ProjectsService.name);

  constructor(
    private readonly ai: AiService,
    private readonly databaseService: DatabaseService,
    private readonly emailService: EmailService,
  ) {}

  async creerProjet(createurId: number, dto: CreateProjectDto) {
    if (dto.depotGitUrl) {
      const existant = await this.databaseService.projet.findUnique({
        where: { depotGitUrl: dto.depotGitUrl },
      });
      if (existant) {
        throw new Error(
          `Un projet avec l'URL "${dto.depotGitUrl}" existe déjà (ID: ${existant.id})`,
        );
      }
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
      this.logger.error('❌ Erreur IA', error);
    }

    return this.databaseService.$transaction(async (tx) => {
      const projet = await tx.projet.create({
        data: {
          titre: dto.titre,
          descriptionSommaire: dto.description,
          depotGitUrl: dto.depotGitUrl || null,
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

      this.logger.log(`Projet créé avec ${taches.length} tâches`);

      return {
        projet,
        cahierDesCharges,
        taches,
        generationReussie: !!cahierDesCharges,
      };
    });
  }

  async trouverParId(projetId: number, utilisateurId: number) {
    const projet = await this.databaseService.projet.findUnique({
      where: { id: projetId },
      include: {
        cahierDesCharges: true,
        taches: true,
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
        membres: {
          some: { utilisateurId },
        },
      },
      include: {
        _count: { select: { taches: true, membres: true } },
        createur: { select: { nom: true, prenom: true } },
        membres: {
          where: { utilisateurId },
          select: { role: true },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async inviterMembre(
    projetId: number,
    dto: InviteMemberDto,
    inviteurId: number,
  ) {
    const projet = await this.databaseService.projet.findUnique({
      where: { id: projetId },
      include: { createur: true },
    });
    if (!projet) {
      throw new NotFoundException('Projet introuvable');
    }

    const utilisateur = await this.databaseService.utilisateur.findUnique({
      where: { email: dto.email },
    });
    if (!utilisateur) {
      throw new NotFoundException('Utilisateur introuvable');
    }

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

      this.logger.log(
        `Membre ${utilisateur.email} invité au projet "${projet.titre}" avec le rôle ${dto.role},par ${inviteur?.email}`,
      );

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

  async changeDeRole(
    projetId: number,
    membreId: number,
    nouveauRole: 'developpeur' | 'relecteur' | 'chef_projet',
  ) {
    const membre = await this.databaseService.membre.findUnique({
      where: { id: membreId },
      include: {
        projet: true,
        utilisateur: true,
      },
    });

    if (!membre) {
      throw new NotFoundException('Membre introuvable');
    }

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

    this.logger.log(
      `Rôle de ${membre.utilisateur.email} changé : ${ancienRole} → ${nouveauRole}`,
    );

    return membreUpdated;
  }

  async retirerMembre(projetId: number, utilisateurId: number) {
    const projet = await this.databaseService.projet.findUnique({
      where: { id: projetId },
    });
    if (!projet) {
      throw new NotFoundException('Projet introuvable');
    }

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

      this.logger.log(
        `Membre ${utilisateur.email} retiré du projet "${projet.titre}"`,
      );
    }

    return { message: 'Membre retiré avec succès' };
  }

  async regenererCahierDesCharges(projetId: number, utilisateurId: number) {
    const projet = await this.databaseService.projet.findUnique({
      where: { id: projetId },
      include: {
        membres: {
          where: { utilisateurId },
          select: { role: true },
        },
      },
    });

    if (!projet) {
      throw new NotFoundException('Projet introuvable');
    }

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

      await tx.cahierDesCharges.deleteMany({
        where: { projetId },
      });

      let cahierDesCharges: {
        id: number;
        projetId: number;
        contenuGenere: string;
        dateGeneration: Date;
      } | null = null;
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
        `✅ CDC régénéré : ${tachesSupprimees.count} tâches supprimées, ${taches.length} créées`,
      );

      return {
        cahierDesCharges,
        taches,
        tachesSupprimees: tachesSupprimees.count,
        generationReussie: !!cahierDesCharges,
      };
    });
  }

  async listeDesProjetSysteme() {
    return this.databaseService.projet.findMany({
      orderBy: { updatedAt: 'desc' },
      include: {
        _count: { select: { taches: true, membres: true } },
        createur: { select: { nom: true, prenom: true } },
      },
    });
  }

  private async genererCahierDesChargesPourProjet(
    projetId: number,
    titre: string,
    description: string,
    tx?: any,
  ) {
    const db = tx || this.databaseService;
    try {
      const contenuGenere = await this.ai.genererCahierDesCharges(
        titre,
        description,
      );
      return await db.cahierDesCharges.create({
        data: { projetId, contenuGenere },
      });
    } catch (error) {
      this.logger.error(
        `Échec de la génération du CDC pour le projet ${projetId}`,
        error,
      );
      return null;
    }
  }

  private async genererTachesPourProjet(
    projetId: number,
    contenuCahierDesCharges: string,
    tx?: any,
  ) {
    const db = tx || this.databaseService;
    const tachesGenerees = await this.ai.genererTaches(contenuCahierDesCharges);

    if (tachesGenerees.length === 0) {
      this.logger.warn(`Aucune tâche identifiable pour le projet ${projetId}`);
      return [];
    }

    await db.tache.createMany({
      data: tachesGenerees.map((t) => ({
        projetId,
        titre: t.titre,
        descriptionGeneree: t.descriptionGeneree,
        competences: t.competences,
        complexite: t.complexite as any,
        statut: 'disponible',
      })),
    });

    return db.tache.findMany({
      where: { projetId },
      select: { id: true, titre: true, competences: true, complexite: true },
    });
  }
}
