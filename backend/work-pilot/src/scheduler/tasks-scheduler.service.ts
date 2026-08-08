import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { TasksService } from '../tasks/tasks.service';

@Injectable()
export class TasksSchedulerService {
  private readonly logger = new Logger(TasksSchedulerService.name);

  constructor(private readonly tasksService: TasksService) {}

  @Cron('0 */15 * * * *')
  async verifierDelaisDepasses() {
    this.logger.debug('Vérification des délais dépassés...');
    const resultat = await this.tasksService.retirerTachesNonTermine();
    const nombreRetirees = resultat.tachesRetirees;
    if (nombreRetirees > 0) {
      this.logger.log(
        `${nombreRetirees} tâche(s) retirée(s) automatiquement (délai dépassé)`,
      );
    }
  }
}
