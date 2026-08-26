import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt.auth.guard';
import { LivrableFinalService } from './livrable-final.service';
import { SoumettreLivrableDto } from './dto/soumettre-livrable.dto';
import { RejeterLivrableDto } from './dto/rejeter-livrable.dto';
import { RoleGlobal } from '@prisma/client';
import { Roles } from '../users/user-app.decorator';

interface RequestAvecUtilisateur extends Request {
  user: { id: number; email: string; role: string };
}

@ApiTags('livrable-final')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard)
@Controller('livrables')
export class LivrableFinalController {
  constructor(private readonly livrableService: LivrableFinalService) {}

  @Post()
  @Roles(RoleGlobal.membre)
  @ApiOperation({ summary: 'Soumettre un livrable pour une tâche' })
  @ApiResponse({ status: 201, description: 'Livrable soumis' })
  @ApiResponse({ status: 403, description: 'Non assigné à la tâche' })
  @ApiResponse({ status: 409, description: 'Livrable déjà soumis' })
  soumettre(
    @Req() req: RequestAvecUtilisateur,
    @Body() dto: SoumettreLivrableDto,
  ) {
    return this.livrableService.soumettre(req.user.id, dto);
  }

  @Patch(':id/valider')
  @Roles(RoleGlobal.membre)
  @ApiOperation({ summary: 'Valider un livrable (chef/relecteur)' })
  @ApiResponse({ status: 200, description: 'Livrable validé' })
  @ApiResponse({ status: 403, description: 'Non autorisé' })
  valider(
    @Req() req: RequestAvecUtilisateur,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.livrableService.valider(req.user.id, id);
  }

  @Patch(':id/rejeter')
  @Roles(RoleGlobal.membre)
  @ApiOperation({ summary: 'Rejeter un livrable avec motif (chef/relecteur)' })
  @ApiResponse({ status: 200, description: 'Livrable rejeté' })
  @ApiResponse({ status: 403, description: 'Non autorisé' })
  rejeter(
    @Req() req: RequestAvecUtilisateur,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: RejeterLivrableDto,
  ) {
    return this.livrableService.rejeter(req.user.id, id, dto);
  }

  @Get('tache/:tacheId')
  @Roles(RoleGlobal.membre)
  @ApiOperation({ summary: "Obtenir le livrable d'une tâche" })
  @ApiResponse({ status: 200, description: 'Livrable trouvé' })
  obtenirParTache(
    @Req() req: RequestAvecUtilisateur,
    @Param('tacheId', ParseIntPipe) tacheId: number,
  ) {
    return this.livrableService.obtenirParTache(req.user.id, tacheId);
  }

  @Get('projet/:projetId')
  @Roles(RoleGlobal.membre)
  @ApiOperation({ summary: "Lister les livrables d'un projet" })
  @ApiResponse({ status: 200, description: 'Liste des livrables' })
  listerParProjet(
    @Req() req: RequestAvecUtilisateur,
    @Param('projetId', ParseIntPipe) projetId: number,
  ) {
    return this.livrableService.listerParProjet(req.user.id, projetId);
  }
}
