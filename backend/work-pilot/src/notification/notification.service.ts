import {
  Injectable,
  Logger,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { TypeNotification } from '@prisma/client';
import { DatabaseService } from '../database/database.service';
import { NotificationsGateway } from './notifications.gateway';

export interface CreerNotificationData {
  type: TypeNotification;
  titre: string;
  message: string;
  projetId?: number;
  tacheId?: number;
}

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(
    private readonly databaseService: DatabaseService,
    private readonly gateway: NotificationsGateway,
  ) {}

  async creer(userId: number, data: CreerNotificationData) {
    try {
      const notification = await this.databaseService.notification.create({
        data: { userId, ...data },
      });
      this.gateway.envoyer(userId, notification);
      this.logger.log(`Notification créée pour user ${userId} : ${data.titre}`);

      return notification;
    } catch {
      this.logger.warn(`⚠️ Notification non créée pour user ${userId}`);

      return null;
    }
  }

  async lister(userId: number) {
    const [notifications, nonLues] = await Promise.all([
      this.databaseService.notification.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 50,
      }),

      this.databaseService.notification.count({
        where: { userId, lue: false },
      }),
    ]);

    return { notifications, nonLues };
  }

  async marquerLue(userId: number, notificationId: number) {
    const notification = await this.databaseService.notification.findUnique({
      where: { id: notificationId },
    });

    if (!notification) {
      throw new NotFoundException('Notification introuvable');
    }

    if (notification.userId !== userId) {
      throw new ForbiddenException('Cette notification ne vous appartient pas');
    }

    return this.databaseService.notification.update({
      where: { id: notificationId },
      data: { lue: true },
    });
  }

  async toutMarquerLues(userId: number) {
    return this.databaseService.notification.updateMany({
      where: { userId, lue: false },
      data: { lue: true },
    });
  }

  async supprimer(userId: number, notificationId: number) {
    const notification = await this.databaseService.notification.findUnique({
      where: { id: notificationId },
    });

    if (!notification) {
      throw new NotFoundException('Notification introuvable');
    }

    if (notification.userId !== userId) {
      throw new ForbiddenException('Cette notification ne vous appartient pas');
    }

    await this.databaseService.notification.delete({
      where: { id: notificationId },
    });

    return { message: 'Notification supprimée' };
  }
}
