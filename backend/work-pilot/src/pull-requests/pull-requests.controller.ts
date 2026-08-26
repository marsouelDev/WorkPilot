import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Request,
  UseGuards,
  Req,
  Patch,
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
import { RoleGlobal } from '@prisma/client';
import { Roles } from '../users/user-app.decorator';

interface RequestAvecUtilisateur extends Request {
  user: {
    id: number;
    email: string;
    role: string;
  };
}
@ApiTags('Pull Requests')
@Controller('pull-requests')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT')
export class PullRequestsController {
  constructor(private readonly pullRequestsService: PullRequestsService) {}

  @Post()
  @Roles(RoleGlobal.membre)
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

  @Get('mes-pr')
  @Roles(RoleGlobal.membre)
  @ApiOperation({
    summary: 'Lister mes pull requests (tâches assignées)',
  })
  @ApiResponse({ status: 200, description: 'Liste de mes PR' })
  mesPr(@Request() req: requestWithUserInterface.RequestWithUser) {
    return this.pullRequestsService.listerMesPr(req.user.id);
  }

  @Get('mes-projets')
  @Roles(RoleGlobal.membre)
  @ApiOperation({
    summary: 'Lister les pull requests de tous mes projets',
  })
  @ApiResponse({ status: 200, description: 'Liste des PR de mes projets' })
  mesProjets(@Request() req: requestWithUserInterface.RequestWithUser) {
    return this.pullRequestsService.listerPrDeMesProjets(req.user.id);
  }

  @Get('projet/:projetId')
  @Roles(RoleGlobal.membre)
  @ApiOperation({
    summary: "Lister les pull requests d'un projet",
  })
  @ApiResponse({ status: 200, description: 'Liste des PR du projet' })
  @ApiResponse({ status: 403, description: 'Accès au projet refusé' })
  @ApiResponse({ status: 404, description: 'Projet introuvable' })
  listerParProjet(
    @Request() req: requestWithUserInterface.RequestWithUser,
    @Param('projetId', ParseIntPipe) projetId: number,
  ) {
    return this.pullRequestsService.listerParProjet(projetId, req.user.id);
  }

  @Get('tache/:tacheId')
  @Roles(RoleGlobal.membre)
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
  @Roles(RoleGlobal.membre)
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

  @Patch(':id/rejeter')
  @Roles(RoleGlobal.membre)
  @ApiOperation({ summary: 'Rejeter une Pull Request (chef/relecteur)' })
  @ApiResponse({ status: 200, description: 'PR rejetée' })
  @ApiResponse({ status: 400, description: 'PR déjà fusionnée' })
  @ApiResponse({ status: 403, description: 'Non autorisé' })
  rejeter(
    @Req() req: RequestAvecUtilisateur,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: { motif: string },
  ) {
    return this.pullRequestsService.rejeter(id, req.user.id, dto.motif);
  }
}
