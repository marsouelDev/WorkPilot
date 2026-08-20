import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { StatutPullRequest } from '@prisma/client';
import { DatabaseService } from '../database/database.service';
import { GithubService } from '../github/github.service';
import { NotificationService } from '../notification/notification.service';
import { CreatePullRequestDto } from './dto/create-pull-request.dto';

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

    let pr: { url: string; numero: number };

    try {
      pr = await this.github.creerPullRequest(octokit, owner, repo, {
        head: dto.branche,
        titre: dto.titre ?? `PR — ${tache.titre}`,
        description:
          dto.description ??
          `Pull request WorkPilot pour la tâche "${tache.titre}".`,
      });
    } catch {
      throw new BadRequestException(
        'Impossible de créer la PR : vérifie que la branche existe et contient des commits',
      );
    }

    const pullRequest = await this.databaseService.pullRequest.create({
      data: {
        tacheId: dto.tacheId,
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
      `PR #${pr.numero} créée sur ${owner}/${repo} — ${destinataires.size} personne(s) notifiée(s)`,
    );

    return pullRequest;
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

        if (statut === 'fusionnee') {
          await this.databaseService.tache.update({
            where: { id: pr.tacheId },
            data: { statut: 'terminee' },
          });
        }

        return maj;
      }

      return pr;
    } catch {
      return pr;
    }
  }

  async fusionner(pullRequestId: number, userId: number) {
    const pr = await this.databaseService.pullRequest.findUnique({
      where: { id: pullRequestId },
      include: { tache: { include: { projet: true } } },
    });

    if (!pr) {
      throw new NotFoundException('Pull request introuvable');
    }

    const projet = await this.verifierAcces(pr.tache.projetId, userId);

    if (!projet.depotGitUrl || !pr.numero) {
      throw new BadRequestException('Pull request invalide');
    }

    const octokit = await this.github.obtenirOctokit(projet, userId);
    const { owner, repo } = this.github.extraireOwnerEtRepo(projet.depotGitUrl);

    try {
      await this.github.fusionnerPullRequest(octokit, owner, repo, pr.numero);
    } catch {
      throw new BadRequestException(
        'Impossible de fusionner : conflit ou PR déjà fermée',
      );
    }

    const maj = await this.databaseService.pullRequest.update({
      where: { id: pr.id },
      data: { statut: 'fusionnee' },
    });

    await this.databaseService.tache.update({
      where: { id: pr.tacheId },
      data: { statut: 'terminee' },
    });

    if (pr.tache.assigneeId) {
      await this.notifications.creer(pr.tache.assigneeId, {
        type: 'tache_terminee',
        titre: 'Pull request fusionnée 🎉',
        message: `Ta PR #${pr.numero} sur "${pr.tache.titre}" a été fusionnée.`,
        projetId: projet.id,
        tacheId: pr.tacheId,
      });
    }

    /* Après la fusion réussie dans fusionner() */

    const relecteurs = await this.databaseService.membre.findMany({
      where: { projetId: projet.id, role: 'relecteur' },
      select: { utilisateurId: true },
    });

    const aPrevenir = new Set<number>(relecteurs.map((r) => r.utilisateurId));

    if (pr.tache.assigneeId) {
      aPrevenir.add(pr.tache.assigneeId);
    }

    for (const id of aPrevenir) {
      await this.notifications.creer(id, {
        type: 'tache_terminee',
        titre: 'Pull request fusionnée',
        message: `La PR #${pr.numero} sur "${pr.tache.titre}" a été fusionnée dans ${projet.depotGitUrl ? 'la branche principale' : 'main'}.`,
        projetId: projet.id,
        tacheId: pr.tacheId,
      });
    }

    this.logger.log(`PR #${pr.numero} fusionnée sur ${owner}/${repo}`);

    return maj;
  }
}
