import {
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { EmailService } from '../email/email.service';

const DELAI_LIVRAISON_JOURS = 3;

@Injectable()
export class TasksService {
  private readonly logger = new Logger(TasksService.name);

  constructor(
    private readonly databaseService: DatabaseService,
    private readonly emailService: EmailService,
  ) {}

  async choisirTache(tacheId: number, utilisateurId: number) {
    const tache = await this.trouverTacheOuEchouer(tacheId);

    if (tache.statut !== 'disponible') {
      throw new ConflictException(
        "Cette tâche a été choisir par un autre membre à quelqu'un d'autre",
      );
    }

    const echeance = new Date();
    echeance.setDate(echeance.getDate() + DELAI_LIVRAISON_JOURS);
    const tacheAttribuee = await this.databaseService.tache.update({
      where: { id: tacheId },
      data: {
        statut: 'attribuee',
        assigneeId: utilisateurId,
        echeance,
      },
      include: { assignee: true },
    });

    this.logger.log(
      `Tâche ${tacheId} attribuée à ${tacheAttribuee.assignee?.email} (échéance: ${echeance.toLocaleDateString()})`,
    );

    return tacheAttribuee;
  }

  async retirerTachesNonTermine() {
    const tachesExpirees = await this.databaseService.tache.findMany({
      where: {
        statut: 'attribuee',
        echeance: { lt: new Date() },
      },
      include: {
        assignee: true,
        projet: true,
      },
    });

    this.logger.log(`${tachesExpirees.length} tâche(s) expirée(s) trouvée(s)`);

    for (const tache of tachesExpirees) {
      await this.databaseService.tache.update({
        where: { id: tache.id },
        data: {
          statut: 'disponible',
          assigneeId: null,
          echeance: null,
        },
      });

      if (tache.assignee) {
        await this.emailService.envoyer(tache.assignee.email, 'tache_retiree', {
          nom: `${tache.assignee.prenom} ${tache.assignee.nom}`,
          projetTitre: tache.projet.titre,
          projetId: tache.projetId,
          tacheTitre: tache.titre,
          raison: `Délai de ${DELAI_LIVRAISON_JOURS} jours dépassé`,
        });

        this.logger.log(
          `Tâche ${tache.id} retirée à ${tache.assignee.email} (délai dépassé)`,
        );
      }
    }

    return {
      tachesRetirees: tachesExpirees.length,
    };
  }

  private async trouverTacheOuEchouer(tacheId: number, options: any = {}) {
    const tache = await this.databaseService.tache.findUnique({
      where: { id: tacheId },
      ...options,
    });

    if (!tache) {
      throw new NotFoundException('Tâche introuvable');
    }

    return tache;
  }

  private async trouverTacheAssigneeOuEchouer(
    tacheId: number,
    utilisateurId: number,
    options: any = {},
  ) {
    const tache = await this.trouverTacheOuEchouer(tacheId, options);

    if (tache.assigneeId !== utilisateurId) {
      throw new ForbiddenException('Cette tâche ne vous est pas attribuée');
    }

    return tache;
  }
}
