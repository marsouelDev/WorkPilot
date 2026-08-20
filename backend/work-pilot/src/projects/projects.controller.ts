import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt.auth.guard';
import { ProjectsService } from './projects.service';
import { CreateProjectDto } from './dto/create-project-dto';
import { InviteMemberDto } from './dto/invite-member.dto';
import { ChangeRoleDto } from './dto/change-role.dto';
import { RoleGlobal } from '@prisma/client';
import { RoleGuard } from '../../common/guards/roles.guard';
import { ChefProjetGuard } from '../../common/guards/chef-projet.guard';
import { Roles } from '../users/user-app.decorator';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

interface RequestAvecUtilisateur extends Request {
  user: {
    id: number;
    email: string;
    role: string;
  };
}

@ApiTags('Projects')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard)
@Controller('projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @ApiOperation({ summary: 'Créer un projet' })
  @Post()
  @Roles(RoleGlobal.membre)
  creerProjet(
    @Req() req: RequestAvecUtilisateur,
    @Body() dto: CreateProjectDto,
  ) {
    return this.projectsService.creerProjet(req.user.id, dto);
  }

  @ApiOperation({
    summary: 'Supprimer un projet',
  })
  @Delete(':id')
  @Roles(RoleGlobal.membre)
  supprimerProjet(
    @Param('id', ParseIntPipe) projetId: number,
    @Req() req: RequestAvecUtilisateur,
  ) {
    return this.projectsService.retirerProject(projetId, req.user.id);
  }

  @ApiOperation({ summary: "Lister les projets de l'utilisateur" })
  @Get()
  @Roles(RoleGlobal.membre)
  listerMesProjets(@Req() req: RequestAvecUtilisateur) {
    return this.projectsService.listerProjetsDeUtilisateur(req.user.id);
  }

  @ApiOperation({ summary: 'Lister tous les projets du système' })
  @Get('admin/projects')
  @UseGuards(RoleGuard)
  @Roles(RoleGlobal.admin)
  listeDesProjetSysteme() {
    return this.projectsService.listeDesProjetSysteme();
  }

  @ApiOperation({ summary: 'Trouver un projet par son ID' })
  @Get(':id')
  @Roles(RoleGlobal.membre)
  obtenirProjet(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: RequestAvecUtilisateur,
  ) {
    return this.projectsService.trouverParId(id, req.user.id);
  }

  @ApiOperation({ summary: 'Régénérer le cahier des charges' })
  @Post(':id/regenerer')
  @Roles(RoleGlobal.membre)
  @UseGuards(ChefProjetGuard)
  regenererCahierDesCharges(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: RequestAvecUtilisateur,
  ) {
    return this.projectsService.regenererCahierDesCharges(id, req.user.id);
  }

  @ApiOperation({ summary: 'Inviter un membre dans un projet' })
  @Post(':id/membres')
  @Roles(RoleGlobal.membre)
  @UseGuards(ChefProjetGuard)
  inviterMembre(
    @Param('id', ParseIntPipe) projetId: number,
    @Body() dto: InviteMemberDto,
    @Req() req: RequestAvecUtilisateur,
  ) {
    return this.projectsService.inviterMembre(projetId, dto, req.user.id);
  }

  @ApiOperation({ summary: 'Rechercher des utilisateurs par email' })
  @Get('utilisateur/recherche')
  @Roles(RoleGlobal.membre)
  async rechercherUtilisateursParEmail(@Query('email') email: string) {
    return this.projectsService.rechercherUtilisateursParEmail(email);
  }

  @ApiOperation({ summary: "Lister les membres d'un projet" })
  @Get(':id/listes/membres')
  @Roles(RoleGlobal.membre)
  listerMembresProjet(@Param('id', ParseIntPipe) projetId: number) {
    return this.projectsService.listerMembresProjet(projetId);
  }

  @ApiOperation({ summary: "Changer le rôle d'un membre" })
  @Patch(':id/membres/:membreId/role')
  @Roles(RoleGlobal.membre)
  @UseGuards(ChefProjetGuard)
  changerRole(
    @Param('id', ParseIntPipe) projetId: number,
    @Param('membreId', ParseIntPipe) membreId: number,
    @Body() dto: ChangeRoleDto,
  ) {
    return this.projectsService.changeDeRole(projetId, membreId, dto.role);
  }

  @ApiOperation({ summary: "Supprimer un membre d'un projet" })
  @Delete(':id/membres/:utilisateurId/retirer')
  @HttpCode(HttpStatus.OK)
  @Roles(RoleGlobal.membre)
  @UseGuards(ChefProjetGuard)
  retirerMembre(
    @Param('id', ParseIntPipe) projetId: number,
    @Param('utilisateurId', ParseIntPipe) utilisateurId: number,
  ) {
    return this.projectsService.retirerMembre(projetId, utilisateurId);
  }

  @ApiOperation({ summary: "Obtenir le cahier des charges d'un projet" })
  @Get(':id/cahier-des-charges')
  @Roles(RoleGlobal.membre)
  obtenirCahierDesCharges(
    @Param('id', ParseIntPipe) projetId: number,
    @Req() req: RequestAvecUtilisateur,
  ) {
    return this.projectsService.obtenirCahierDesCharges(projetId, req.user.id);
  }

  @ApiOperation({ summary: 'Obtenir toutes les tâches du projet' })
  @Get(':projetId/taches')
  @Roles(RoleGlobal.membre)
  listerTachesDuProjet(
    @Param('projetId', ParseIntPipe) projetId: number,
    @Req() req: RequestAvecUtilisateur, // ✅ corrigé (était `any`)
  ) {
    return this.projectsService.listerTachesDuProjet(projetId, req.user.id);
  }

  @Get(':id/chargement-github')
  @ApiOperation({
    summary: 'Charger les fichiers du projet depuis GitHub',
  })
  @ApiResponse({ status: 200, description: 'Fichiers du projet chargés' })
  chargerProjetGithub(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: RequestAvecUtilisateur,
  ) {
    return this.projectsService.chargerProjetGithub(id, req.user.id);
  }

  @Post(':id/sync')
  @ApiOperation({
    summary: 'Synchroniser les fichiers vers GitHub',
  })
  @ApiResponse({ status: 201, description: 'Synchronisation réussie' })
  synchroniser(
    @Param('id', ParseIntPipe) id: number,
    @Body()
    dto: {
      fichiers: { path: string; contenu: string }[];
      branche?: string;
    },
    @Req() req: RequestAvecUtilisateur,
  ) {
    return this.projectsService.synchroniserFichiers(
      id,
      req.user.id,
      dto.fichiers,
      dto.branche,
    );
  }

  @Get(':id/branches')
  @ApiOperation({
    summary: 'Lister toutes les branches du dépôt GitHub',
  })
  @ApiResponse({ status: 200, description: 'Liste des branches' })
  listerBranches(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: RequestAvecUtilisateur,
  ) {
    return this.projectsService.listerBranches(id, req.user.id);
  }
}
