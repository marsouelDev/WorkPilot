import {
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
  OnApplicationBootstrap,
} from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { DatabaseService } from '../database/database.service';
import { EmailService } from '../email/email.service';

const DELAI_LIVRAISON_JOURS = 3;

@Injectable()
export class TasksService implements OnApplicationBootstrap {
  private readonly logger = new Logger(TasksService.name);

  constructor(
    private readonly databaseService: DatabaseService,
    private readonly emailService: EmailService,
  ) {}

  async onApplicationBootstrap() {
    try {
      const result = await this.retirerTachesNonTermine();
      this.logger.log(`Nettoyage initial : ${result.tachesRetirees} tâche(s)`);
    } catch (error) {
      this.logger.error('Erreur lors du nettoyage initial', error);
    }
  }

  async choisirTache(tacheId: number, utilisateurId: number) {
    const tache = await this.trouverTacheOuEchouer(tacheId);

    if (tache.statut !== 'disponible') {
      throw new ConflictException(
        'Cette tâche a déjà été choisie par un autre membre',
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

  @Cron(CronExpression.EVERY_HOUR)
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

    if (tachesExpirees.length === 0) {
      this.logger.log('Aucune tâche expirée trouvée');

      return { tachesRetirees: 0 };
    }

    this.logger.log(`${tachesExpirees.length} tâche(s) expirée(s) trouvée(s)`);

    let successCount = 0;
    let errorCount = 0;

    for (const tache of tachesExpirees) {
      try {
        await this.databaseService.tache.update({
          where: { id: tache.id },
          data: {
            statut: 'disponible',
            assigneeId: null,
            echeance: null,
          },
        });

        if (tache.assignee) {
          await this.emailService.envoyer(
            tache.assignee.email,
            'tache_retiree',
            {
              nom: `${tache.assignee.prenom} ${tache.assignee.nom}`,
              projetTitre: tache.projet.titre,
              projetId: tache.projetId,
              tacheTitre: tache.titre,
              raison: `Délai de ${DELAI_LIVRAISON_JOURS} jours dépassé`,
            },
          );

          this.logger.log(
            `Email envoyé à ${tache.assignee.email} pour tâche ${tache.id}`,
          );
        }

        this.logger.log(`Tâche ${tache.id} retirée (délai dépassé)`);

        successCount++;
      } catch (error) {
        errorCount++;

        this.logger.error(
          `Erreur lors du retrait de la tâche ${tache.id}`,
          error,
        );
      }
    }

    this.logger.log(`Bilan : ${successCount} succès, ${errorCount} erreur(s)`);

    return {
      tachesRetirees: successCount,
      erreurs: errorCount,
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
