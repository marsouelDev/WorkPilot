import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PullRequest, StatutPullRequest } from '@prisma/client';
import { DatabaseService } from '../database/database.service';
import { GithubService } from '../github/github.service';
import { NotificationService } from '../notification/notification.service';
import { CreatePullRequestDto } from './dto/create-pull-request.dto';

const GITHUB_API_HEADERS = {
  'X-GitHub-Api-Version': '2022-11-28',
  Accept: 'application/vnd.github.v3+json',
};

@Injectable()
export class PullRequestsService {
  private readonly logger = new Logger(PullRequestsService.name);

  constructor(
    private readonly databaseService: DatabaseService,
    private readonly notifications: NotificationService,
    private readonly github: GithubService,
  ) {}

  private async verifierAcces(projetId: number, userId: number) {
    const projet = await this.databaseService.projet.findUnique({
      where: { id: projetId },
      include: {
        membres: { select: { utilisateurId: true } },
        createur: {
          select: {
            id: true,
            nom: true,
            prenom: true,
            githubToken: true,
            githubUsername: true,
          },
        },
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

    return projet;
  }

  private async verifierRoleRelecteur(projetId: number, userId: number) {
    const projet = await this.databaseService.projet.findUnique({
      where: { id: projetId },
    });

    if (!projet) {
      throw new NotFoundException('Projet introuvable');
    }

    /*  créateur du projet = chef de projet */
    if (projet.createurId === userId) {
      return;
    }
    /* relecteur*/
    const membre = await this.databaseService.membre.findFirst({
      where: { projetId, utilisateurId: userId },
    });

    if (membre?.role === 'relecteur') {
      return;
    }
    /*aucun des deux */
    throw new ForbiddenException(
      'Seuls le chef de projet et les relecteurs peuvent fusionner ou rejeter une PR',
    );
  }

  private async calculerCanMergeEtAuteur(
    prs: any[],
    userId: number,
  ): Promise<PullRequest[]> {
    if (prs.length === 0) return [];

    /* Récupère les projets uniques concernés */
    const projetIds = [
      ...new Set(
        prs
          .map((pr) => pr.tache?.projetId ?? pr.tache?.projet?.id)
          .filter(Boolean),
      ),
    ] as number[];

    /* Récupère le rôle de l'utilisateur dans chaque projet */
    const projetsAvecRole = await this.databaseService.projet.findMany({
      where: { id: { in: projetIds } },
      select: {
        id: true,
        createurId: true,
        membres: {
          where: { utilisateurId: userId },
          select: { role: true },
        },
      },
    });

    const rolesParProjet = new Map<
      number,
      'createur' | 'relecteur' | 'membre' | null
    >();
    for (const p of projetsAvecRole) {
      if (p.createurId === userId) {
        rolesParProjet.set(p.id, 'createur');
      } else if (p.membres[0]?.role === 'relecteur') {
        rolesParProjet.set(p.id, 'relecteur');
      } else {
        rolesParProjet.set(p.id, p.membres[0] ? 'membre' : null);
      }
    }

    return prs.map((pr) => {
      const projetId = pr.tache?.projetId ?? pr.tache?.projet?.id;
      const role = rolesParProjet.get(projetId);

      /* Seul le chef de projet et les relecteurs peuvent fusionner une PR ouverte */
      const peutFusionner =
        pr.statut === 'ouverte' &&
        (role === 'createur' || role === 'relecteur');

      return {
        ...pr,
        auteur: pr.tache?.assignee ?? null,
        canMerge: peutFusionner,
      };
    });
  }

  private mapperStatut(prGithub: {
    state: string;
    merged_at: string | null;
  }): StatutPullRequest {
    if (prGithub.merged_at || prGithub.state === 'merged') return 'fusionnee';
    if (prGithub.state === 'closed') return 'rejetee';
    return 'ouverte';
  }

  async creerPullRequest(userId: number, dto: CreatePullRequestDto) {
    const tache = await this.databaseService.tache.findUnique({
      where: { id: dto.tacheId },
      include: { projet: true },
    });

    if (!tache) {
      throw new NotFoundException('Tâche introuvable');
    }

    const projet = await this.verifierAcces(tache.projetId, userId);

    if (!projet.depotGitUrl) {
      throw new BadRequestException("Ce projet n'a pas de dépôt GitHub");
    }

    const auteur = await this.databaseService.utilisateur.findUnique({
      where: { id: userId },
      select: { nom: true, prenom: true },
    });

    const auteurNom = auteur ? `${auteur.prenom} ${auteur.nom}` : 'Un membre';

    const octokit = await this.github.obtenirOctokit(projet, userId);
    const { owner, repo } = this.github.extraireOwnerEtRepo(projet.depotGitUrl);

    const { data: repoData } = await octokit.repos.get({ owner, repo });

    if (dto.branche === repoData.default_branch) {
      throw new BadRequestException(
        `La branche "${dto.branche}" est la branche par défaut. Utilise une branche de feature.`,
      );
    }

    /* VÉRIFICATION : PR existante pour cette branche ? */
    const prExistante = await this.github.trouverPrExistante(
      octokit,
      owner,
      repo,
      dto.branche,
      repoData.default_branch,
    );

    if (prExistante) {
      /* Option A : renvoyer la PR existante (sans erreur) */
      this.logger.log(
        `PR #${prExistante.numero} déjà existante pour ${dto.branche} — réutilisation`,
      );

      /* On vérifie si elle est déjà en DB, sinon on la crée */
      const prDbExistante = await this.databaseService.pullRequest.findFirst({
        where: { tacheId: dto.tacheId, numero: prExistante.numero },
      });

      if (prDbExistante) {
        return prDbExistante;
      }

      const pullRequest = await this.databaseService.pullRequest.create({
        data: {
          tacheId: dto.tacheId,
          auteurId: userId,
          url: prExistante.url,
          numero: prExistante.numero,
          branche: dto.branche,
          statut: 'ouverte',
        },
      });

      await this.databaseService.tache.update({
        where: { id: dto.tacheId },
        data: { statut: 'en_revue' },
      });

      return pullRequest;
    }

    /* Aucune PR existante : création normale */
    let pr: { url: string; numero: number };

    try {
      pr = await this.github.creerPullRequest(octokit, owner, repo, {
        head: dto.branche,
        titre: dto.titre ?? `PR — ${tache.titre}`,
        description:
          dto.description ??
          `Pull request WorkPilot pour la tâche "${tache.titre}".`,
      });
    } catch (error: any) {
      /* Gestion propre de l'erreur 422 "already exists" (double filet de sécurité) */
      const errorMsg = error?.response?.data?.errors?.[0]?.message ?? '';
      if (error?.status === 422 && errorMsg.includes('already exists')) {
        throw new BadRequestException(
          `Une pull request existe déjà pour la branche "${dto.branche}". ` +
            `Veuillez la fermer ou la fusionner avant d'en créer une nouvelle.`,
        );
      }

      this.logger.error('Erreur création PR', {
        status: error?.status,
        message: error?.message,
        response: error?.response?.data,
      });
      throw new BadRequestException(
        error?.response?.data?.message ?? error?.message ?? 'Erreur inconnue',
      );
    }

    const pullRequest = await this.databaseService.pullRequest.create({
      data: {
        tacheId: dto.tacheId,
        auteurId: userId,
        url: pr.url,
        numero: pr.numero,
        branche: dto.branche,
        statut: 'ouverte',
      },
    });

    await this.databaseService.tache.update({
      where: { id: dto.tacheId },
      data: { statut: 'en_revue' },
    });

    /* Notifications */
    const relecteurs = await this.databaseService.membre.findMany({
      where: { projetId: projet.id, role: 'relecteur' },
      select: { utilisateurId: true },
    });

    const destinataires = new Set<number>([projet.createurId]);
    for (const r of relecteurs) {
      destinataires.add(r.utilisateurId);
    }
    destinataires.delete(userId);

    const message =
      `${auteurNom} a ouvert la PR #${pr.numero} sur "${tache.titre}" ` +
      `(branche ${dto.branche}). Une relecture technique est nécessaire.`;

    for (const destinataireId of destinataires) {
      await this.notifications.creer(destinataireId, {
        type: 'systeme',
        titre: 'Pull request à relire',
        message,
        projetId: projet.id,
        tacheId: dto.tacheId,
      });
    }

    this.logger.log(
      `PR #${pr.numero} créée sur ${owner}/${repo} — ${destinataires.size} personne(s) notifiée(s) — tâche en_revue`,
    );

    return pullRequest;
  }
  /*Toutes les PRs d'un projet */
  async listerParProjet(projetId: number, userId: number) {
    await this.verifierAcces(projetId, userId);

    const prs = await this.databaseService.pullRequest.findMany({
      where: { tache: { projetId } },
      include: {
        tache: {
          select: {
            id: true,
            titre: true,
            statut: true,
            projetId: true,
            projet: { select: { id: true, titre: true, createurId: true } },
            assignee: { select: { id: true, nom: true, prenom: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return this.calculerCanMergeEtAuteur(prs, userId);
  }

  /*PRs des tâches qui me sont assignées */
  async listerMesPr(userId: number) {
    const prs = await this.databaseService.pullRequest.findMany({
      where: { tache: { assigneeId: userId } },
      include: {
        tache: {
          select: {
            id: true,
            titre: true,
            statut: true,
            projetId: true,
            projet: { select: { id: true, titre: true, createurId: true } },
            assignee: { select: { id: true, nom: true, prenom: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return this.calculerCanMergeEtAuteur(prs, userId);
  }

  /*Toutes les PRs des projets dont je suis membre ou créateur */
  async listerPrDeMesProjets(userId: number) {
    const projets = await this.databaseService.projet.findMany({
      where: {
        OR: [
          { createurId: userId },
          { membres: { some: { utilisateurId: userId } } },
        ],
      },
      select: { id: true },
    });

    const projetIds = projets.map((p) => p.id);

    const prs = await this.databaseService.pullRequest.findMany({
      where: { tache: { projetId: { in: projetIds } } },
      include: {
        tache: {
          select: {
            id: true,
            titre: true,
            statut: true,
            projetId: true,
            projet: { select: { id: true, titre: true, createurId: true } },
            assignee: { select: { id: true, nom: true, prenom: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return this.calculerCanMergeEtAuteur(prs, userId);
  }

  async listerParTache(tacheId: number, userId: number) {
    const tache = await this.databaseService.tache.findUnique({
      where: { id: tacheId },
    });

    if (!tache) {
      throw new NotFoundException('Tâche introuvable');
    }

    await this.verifierAcces(tache.projetId, userId);

    return this.databaseService.pullRequest.findMany({
      where: { tacheId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async obtenirParId(pullRequestId: number, userId: number) {
    const pr = await this.databaseService.pullRequest.findUnique({
      where: { id: pullRequestId },
      include: { tache: { include: { projet: true } } },
    });

    if (!pr) {
      throw new NotFoundException('Pull request introuvable');
    }

    await this.verifierAcces(pr.tache.projetId, userId);

    const projet = pr.tache.projet;

    if (!projet.depotGitUrl || !pr.numero) {
      return pr;
    }

    try {
      const octokit = await this.github.obtenirOctokit(projet, userId);
      const { owner, repo } = this.github.extraireOwnerEtRepo(
        projet.depotGitUrl,
      );

      const prGithub = await this.github.obtenirPullRequest(
        octokit,
        owner,
        repo,
        pr.numero,
      );

      const statut = this.mapperStatut(prGithub);

      if (statut !== pr.statut) {
        const maj = await this.databaseService.pullRequest.update({
          where: { id: pr.id },
          data: { statut },
        });

        return maj;
      }

      return pr;
    } catch {
      return pr;
    }
  }

  /**
   * Rejeter une Pull Request (ferme sans fusion sur GitHub)
   * → Chef de projet ou relecteur uniquement
   * → La tâche retourne en statut "attribuee" pour correction
   */
  async rejeter(prId: number, userId: number, motif: string) {
    const pr = await this.databaseService.pullRequest.findUnique({
      where: { id: prId },
      include: { tache: { include: { projet: true } } },
    });

    if (!pr) {
      throw new NotFoundException('Pull request introuvable');
    }

    /* ✅ Idempotence : déjà rejetée */
    if (pr.statut === 'rejetee') {
      this.logger.log(`PR #${pr.numero} déjà rejetée — aucune action`);
      return pr;
    }

    /* ✅ Idempotence : déjà fusionnée → impossible de rejeter */
    if (pr.statut === 'fusionnee') {
      throw new BadRequestException(
        `La PR #${pr.numero} est déjà fusionnée. Impossible de la rejeter.`,
      );
    }

    const projet = await this.verifierAcces(pr.tache.projetId, userId);

    /* ✅ Vérifie le rôle : chef de projet ou relecteur */
    await this.verifierRoleRelecteur(pr.tache.projetId, userId);

    if (!projet.depotGitUrl || !pr.numero) {
      throw new BadRequestException('Pull request invalide');
    }

    const octokit = await this.github.obtenirOctokit(projet, userId);
    const { owner, repo } = this.github.extraireOwnerEtRepo(projet.depotGitUrl);

    /* 1. Vérifier l'état actuel sur GitHub */
    const etatGithub = await this.github.obtenirPullRequest(
      octokit,
      owner,
      repo,
      pr.numero,
    );

    /* ✅ Déjà fermée/fusionnée sur GitHub */
    if (etatGithub.merged_at) {
      throw new BadRequestException(
        `La PR #${pr.numero} est déjà fusionnée sur GitHub.`,
      );
    }

    /* 2. Fermer la PR sur GitHub (sans merge) */
    try {
      await octokit.pulls.update({
        owner,
        repo,
        pull_number: pr.numero,
        state: 'closed',
        headers: GITHUB_API_HEADERS,
      });

      /* 3. Ajouter un commentaire avec le motif du rejet */
      await octokit.issues.createComment({
        owner,
        repo,
        issue_number: pr.numero,
        body: `❌ **Pull Request rejetée**\n\n**Motif** : ${motif}\n\nCorrigez les problèmes et soumettez une nouvelle PR.`,
        headers: GITHUB_API_HEADERS,
      });
    } catch (error) {
      const message = (error as Error).message ?? '';
      this.logger.error(`Erreur fermeture PR #${pr.numero} : ${message}`);
      throw new BadRequestException(
        `Impossible de fermer la PR sur GitHub : ${message}`,
      );
    }

    /* 4. Mettre à jour le statut en DB */
    const prMaj = await this.databaseService.pullRequest.update({
      where: { id: pr.id },
      data: { statut: 'rejetee' },
    });

    /* 5. Remettre la tâche en "attribuee" pour correction */
    await this.databaseService.tache.update({
      where: { id: pr.tacheId },
      data: { statut: 'attribuee' },
    });

    this.logger.log(
      `❌ PR #${pr.numero} rejetée — tâche #${pr.tacheId} retourne en "attribuee"`,
    );

    /* 6. Notifier l'assigné */
    if (pr.tache.assigneeId) {
      await this.notifications.creer(pr.tache.assigneeId, {
        type: 'pr_rejetee',
        titre: `PR #${pr.numero} rejetée`,
        message: `Votre PR sur "${pr.tache.titre}" a été rejetée. Motif : ${motif}`,
        projetId: projet.id,
        tacheId: pr.tacheId,
      });
    }

    return { ...prMaj, motifRejet: motif };
  }

  async fusionner(pullRequestId: number, userId: number) {
    const pr = await this.databaseService.pullRequest.findUnique({
      where: { id: pullRequestId },
      include: { tache: { include: { projet: true } } },
    });

    if (!pr) {
      throw new NotFoundException('Pull request introuvable');
    }

    if (pr.statut === 'fusionnee') {
      this.logger.log(`PR #${pr.numero} déjà fusionnée — aucune action`);
      return pr;
    }

    const projet = await this.verifierAcces(pr.tache.projetId, userId);

    if (!projet.depotGitUrl || !pr.numero) {
      throw new BadRequestException('Pull request invalide');
    }

    const octokit = await this.github.obtenirOctokit(projet, userId);
    const { owner, repo } = this.github.extraireOwnerEtRepo(projet.depotGitUrl);

    /* Vérifier l'état actuel sur GitHub */
    const etatGithub = await this.github.obtenirPullRequest(
      octokit,
      owner,
      repo,
      pr.numero,
    );

    /* Déjà fusionnée sur GitHub juste  synchronisation avec la DB uniquement */
    if (etatGithub.merged_at) {
      this.logger.log(
        `PR #${pr.numero} déjà fusionnée sur GitHub et synchronisation DB`,
      );
      return this.marquerFusionnee(pr.id, pr.tacheId, pr.numero, projet);
    }

    /* Fermée sans être fusionnée (rejetée) */
    if (etatGithub.state === 'closed') {
      await this.databaseService.pullRequest.update({
        where: { id: pr.id },
        data: { statut: 'rejetee' },
      });
      throw new BadRequestException(
        `La PR #${pr.numero} a été fermée sans être fusionnée.`,
      );
    }

    /*  Tenter la fusion */
    try {
      await this.github.fusionnerPullRequest(octokit, owner, repo, pr.numero);
    } catch (error) {
      const message = (error as Error).message ?? '';

      /* GitHub indique déjà fusionnée et juste  synchronisation */
      if (message.includes('already merged')) {
        this.logger.warn(
          `PR #${pr.numero} déjà fusionnée juste  synchronisation DB`,
        );
        return this.marquerFusionnee(pr.id, pr.tacheId, pr.numero, projet);
      }

      /* Conflit de fusion réel */
      if (message.includes('conflict') || message.includes('not mergeable')) {
        throw new BadRequestException(
          `Conflit de fusion sur la PR #${pr.numero}. Résous les conflits sur GitHub avant de réessayer.`,
        );
      }

      /* PR fermée ou autre erreur */
      this.logger.error(`Erreur fusion PR #${pr.numero} : ${message}`);
      throw new BadRequestException(
        `Impossible de fusionner la PR #${pr.numero} : ${message}. Vérifie sur GitHub.`,
      );
    }

    /* 3. Fusion réussie et mise à jour DB + notifications */
    return this.marquerFusionnee(pr.id, pr.tacheId, pr.numero, projet);
  }
  private async marquerFusionnee(
    prId: number,
    tacheId: number,
    numero: number,
    projet: { id: number; titre: string },
  ) {
    const maj = await this.databaseService.pullRequest.update({
      where: { id: prId },
      data: { statut: 'fusionnee' },
    });

    await this.databaseService.tache.update({
      where: { id: tacheId },
      data: { statut: 'terminee' },
    });

    try {
      const relecteurs = await this.databaseService.membre.findMany({
        where: { projetId: projet.id, role: 'relecteur' },
        select: { utilisateurId: true },
      });

      const aPrevenir = new Set<number>(relecteurs.map((r) => r.utilisateurId));

      const tache = await this.databaseService.tache.findUnique({
        where: { id: tacheId },
        select: { assigneeId: true, titre: true },
      });

      if (tache?.assigneeId) {
        aPrevenir.add(tache.assigneeId);
      }

      for (const id of aPrevenir) {
        await this.notifications.creer(id, {
          type: 'tache_terminee',
          titre: 'Pull request fusionnée',
          message: `La PR #${numero} sur "${tache?.titre ?? 'la tâche'}" a été fusionnée. La tâche est maintenant terminée.`,
          projetId: projet.id,
          tacheId,
        });
      }
    } catch (notifError) {
      this.logger.warn(
        `Erreur envoi notifications (non bloquant) : ${(notifError as Error).message}`,
      );
    }

    this.logger.log(`PR #${numero} fusionnée — tâche #${tacheId} terminée`);

    return maj;
  }
}
