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

  async creer(
    userId: number,
    data: {
      type: string;
      titre: string;
      message: string;
      projetId?: number;
      tacheId?: number;
    },
  ) {
    const notification = await this.databaseService.notification.create({
      data: {
        userId,
        type: data.type as any,
        titre: data.titre,
        message: data.message,
        projetId: data.projetId,
        tacheId: data.tacheId,
        lue: false,
      },
    });

    this.logger.log(`Notification créée :  user ${userId}`);

    try {
      this.gateway.envoyer(userId, {
        id: notification.id,
        titre: notification.titre,
        message: notification.message,
        type: notification.type,
        projetId: notification.projetId,
        tacheId: notification.tacheId,
        lue: false,
        createdAt: notification.createdAt,
      });
    } catch (err) {
      this.logger.warn(`Erreur envoi WebSocket : ${(err as Error).message}`);
    }

    return notification;
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
