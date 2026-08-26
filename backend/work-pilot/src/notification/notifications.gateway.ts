import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { Logger } from '@nestjs/common';

@WebSocketGateway({
  cors: {
    origin: '*',
    credentials: true,
  },
  transports: ['websocket', 'polling'],
})
export class NotificationsGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(NotificationsGateway.name);

  constructor(private readonly jwtService: JwtService) {}

  afterInit(): void {
    this.logger.log('WebSocket Gateway initialisé avec succès');
  }

  private disconnectClient(client: Socket): void {
    try {
      client.disconnect(true);
    } catch (err) {
      this.logger.warn(
        `Erreur déconnexion ${client.id}: ${(err as Error).message}`,
      );
    }
  }

  private joinRoom(client: Socket, room: string): void {
    try {
      const result = client.join(room);
      // Si c'est une Promise, on gère les rejets
      if (result && typeof (result as Promise<unknown>).then === 'function') {
        (result as Promise<unknown>).catch((err) => {
          this.logger.warn(`Erreur join ${room}: ${(err as Error).message}`);
        });
      }
    } catch (err) {
      this.logger.warn(`Erreur join ${room}: ${(err as Error).message}`);
    }
  }

  handleConnection(client: Socket): void {
    const token =
      client.handshake.auth?.token || (client.handshake.query?.token as string);

    if (!token) {
      this.logger.warn(` Pas de token`);
      this.disconnectClient(client);
      return;
    }

    try {
      const payload = this.jwtService.verify(token);
      const userId = payload.id ?? payload.sub;

      if (!userId) {
        this.logger.warn(` Pas de userId dans le token`);
        this.disconnectClient(client);
        return;
      }

      this.joinRoom(client, `user-${userId}`);
      this.logger.log(` Connecté user-${userId}`);
    } catch (error) {
      this.logger.warn(` Token invalide: ${(error as Error).message}`);
      this.disconnectClient(client);
    }
  }

  handleDisconnect(client: Socket): void {
    this.logger.log(`[${client.id}] Déconnecté`);
  }

  envoyer(userId: number, notification: unknown): void {
    this.server
      .to(`user-${userId}`)
      .emit('nouvelle-notification', notification);
    this.logger.log(`Notification envoyée  user-${userId}`);
  }
}
