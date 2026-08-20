import {
  Controller,
  Get,
  Patch,
  Delete,
  Param,
  ParseIntPipe,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt.auth.guard';
import * as requestWithUserInterface from '../auth/interfaces/request-with-user.interface';
import { NotificationService } from './notification.service';

@ApiTags('Notifications')
@Controller('notification')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT')
export class NotificationController {
  constructor(private readonly notificationsService: NotificationService) {}

  @Get()
  @ApiOperation({ summary: 'Lister mes notifications' })
  lister(@Request() req: requestWithUserInterface.RequestWithUser) {
    return this.notificationsService.lister(req.user.id);
  }

  @Patch('tout-lire')
  @ApiOperation({ summary: 'Tout marquer comme lu' })
  toutMarquerLues(@Request() req: requestWithUserInterface.RequestWithUser) {
    return this.notificationsService.toutMarquerLues(req.user.id);
  }

  @Patch(':id/lue')
  @ApiOperation({ summary: 'Marquer une notification comme lue' })
  marquerLue(
    @Request() req: requestWithUserInterface.RequestWithUser,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.notificationsService.marquerLue(req.user.id, id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Supprimer une notification' })
  supprimer(
    @Request() req: requestWithUserInterface.RequestWithUser,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.notificationsService.supprimer(req.user.id, id);
  }
}
