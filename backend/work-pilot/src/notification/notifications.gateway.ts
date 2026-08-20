import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { Logger } from '@nestjs/common';

@WebSocketGateway({
  cors: {
    origin: ['http://localhost:3000', 'http://localhost:3001'],
    credentials: true,
  },
})
export class NotificationsGateway implements OnGatewayConnection {
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(NotificationsGateway.name);

  constructor(private readonly jwtService: JwtService) {}

  handleConnection(client: Socket) {
    try {
      const token = client.handshake.auth?.token;

      if (!token) {
        this.logger.warn('Connexion socket SANS token');
        void client.disconnect();
        return;
      }

      const payload = this.jwtService.verify(token);

      void client.join(`user-${payload.id ?? payload.sub}`);
      this.logger.log(`Socket connecté : user-${payload.id ?? payload.sub}}`);
    } catch {
      void client.disconnect();
    }
  }

  envoyer(userId: number, notification: any) {
    this.server
      .to(`user-${userId}`)
      .emit('nouvelle-notification', notification);
    this.logger.log(`Envoi notification à user-${userId}`);
  }
}
