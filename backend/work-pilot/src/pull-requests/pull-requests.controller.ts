import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { PullRequestsService } from './pull-requests.service';
import { CreatePullRequestDto } from './dto/create-pull-request.dto';
import { JwtAuthGuard } from '../auth/guards/jwt.auth.guard';
import * as requestWithUserInterface from '../auth/interfaces/request-with-user.interface';

@ApiTags('Pull Requests')
@Controller('pull-requests')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT')
export class PullRequestsController {
  constructor(private readonly pullRequestsService: PullRequestsService) {}

  @Post()
  @ApiOperation({
    summary: 'Créer une pull request',
  })
  @ApiResponse({ status: 201, description: 'PR créée avec succès' })
  @ApiResponse({ status: 400, description: 'Branche invalide ou sans commits' })
  @ApiResponse({ status: 403, description: 'Accès au projet refusé' })
  creer(
    @Request() req: requestWithUserInterface.RequestWithUser,
    @Body() dto: CreatePullRequestDto,
  ) {
    return this.pullRequestsService.creerPullRequest(req.user.id, dto);
  }

  @Get('tache/:tacheId')
  @ApiOperation({
    summary: "Lister les pull requests d'une tâche",
  })
  @ApiResponse({ status: 200, description: 'Liste des PR' })
  @ApiResponse({ status: 404, description: 'Tâche introuvable' })
  listerParTache(
    @Request() req: requestWithUserInterface.RequestWithUser,
    @Param('tacheId', ParseIntPipe) tacheId: number,
  ) {
    return this.pullRequestsService.listerParTache(tacheId, req.user.id);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Obtenir une pull request',
  })
  @ApiResponse({ status: 200, description: 'PR avec statut synchronisé' })
  @ApiResponse({ status: 404, description: 'PR introuvable' })
  obtenir(
    @Request() req: requestWithUserInterface.RequestWithUser,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.pullRequestsService.obtenirParId(id, req.user.id);
  }

  @Post(':id/fusionner')
  @ApiOperation({
    summary: 'Fusionner une pull request',
  })
  @ApiResponse({ status: 200, description: 'PR fusionnée' })
  @ApiResponse({ status: 400, description: 'Conflit ou PR déjà fermée' })
  fusionner(
    @Request() req: requestWithUserInterface.RequestWithUser,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.pullRequestsService.fusionner(id, req.user.id);
  }
}
