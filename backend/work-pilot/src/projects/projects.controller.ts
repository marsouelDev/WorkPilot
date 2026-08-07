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
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

interface RequestAvecUtilisateur extends Request {
  user: { id: number; email: string; role: string };
}

@ApiTags('Projects')
@UseGuards(JwtAuthGuard)
@Controller('projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @ApiOperation({
    summary: 'creer project  ',
  })
  @ApiBearerAuth('JWT')
  @Post()
  @Roles(RoleGlobal.membre)
  creerProjet(
    @Req() req: RequestAvecUtilisateur,
    @Body() dto: CreateProjectDto,
  ) {
    return this.projectsService.creerProjet(req.user.id, dto);
  }

  @ApiOperation({
    summary: 'liste les projects de chaques utilisateurs  ',
  })
  @ApiBearerAuth('JWT')
  @Get()
  @Roles(RoleGlobal.membre)
  listerMesProjets(@Req() req: RequestAvecUtilisateur) {
    return this.projectsService.listerProjetsDeUtilisateur(req.user.id);
  }

  @ApiOperation({
    summary: ' trouver le project par id',
  })
  @ApiBearerAuth('JWT')
  @Get(':id')
  @Roles(RoleGlobal.membre)
  obtenirProjet(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: RequestAvecUtilisateur,
  ) {
    return this.projectsService.trouverParId(id, req.user.id);
  }
  @ApiOperation({
    summary: 'regenerer les cahier de charges ',
  })
  @ApiBearerAuth('JWT')
  @Roles(RoleGlobal.membre)
  @UseGuards(ChefProjetGuard)
  @Post(':id/regenerer')
  regenererCahierDesCharges(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: RequestAvecUtilisateur,
  ) {
    return this.projectsService.regenererCahierDesCharges(id, req.user.id);
  }
  @ApiOperation({
    summary: 'inviter un membre dans un project  ',
  })
  @ApiBearerAuth('JWT')
  @Roles(RoleGlobal.membre)
  @UseGuards(ChefProjetGuard)
  @Post(':id/membres')
  inviterMembre(
    @Param('id', ParseIntPipe) projetId: number,
    @Body() dto: InviteMemberDto,
    @Req() req: RequestAvecUtilisateur,
  ) {
    return this.projectsService.inviterMembre(projetId, dto, req.user.id);
  }
  @ApiOperation({
    summary: 'change de role pour un membre dans un project  ',
  })
  @ApiBearerAuth('JWT')
  @Roles(RoleGlobal.membre)
  @UseGuards(ChefProjetGuard)
  @Patch(':id/membres/:membreId/role')
  changerRole(
    @Param('id', ParseIntPipe) projetId: number,
    @Param('membreId', ParseIntPipe) membreId: number,
    @Body() dto: ChangeRoleDto,
  ) {
    return this.projectsService.changeDeRole(projetId, membreId, dto.role);
  }
  @ApiOperation({
    summary: 'supprimer un membre dans un poject  ',
  })
  @ApiBearerAuth('JWT')
  @Roles(RoleGlobal.membre)
  @UseGuards(ChefProjetGuard)
  @Delete(':id/membres/:utilisateurId/retirer')
  @HttpCode(HttpStatus.OK)
  retirerMembre(
    @Param('id', ParseIntPipe) projetId: number,
    @Param('utilisateurId', ParseIntPipe) utilisateurId: number,
  ) {
    return this.projectsService.retirerMembre(projetId, utilisateurId);
  }

  @ApiOperation({
    summary: 'liste tous les projects du systemes ',
  })
  @ApiBearerAuth('JWT')
  @Get('admin/projects')
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles(RoleGlobal.admin)
  async listeDesProjetSysteme() {
    return this.projectsService.listeDesProjetSysteme();
  }
}
