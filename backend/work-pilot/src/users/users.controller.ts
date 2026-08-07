import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  HttpCode,
  BadRequestException,
  Query,
  NotFoundException,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { RoleGlobal, StatutCompte } from '@prisma/client';
import { RoleGuard } from '../../common/guards/roles.guard';
import { Roles } from './user-app.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt.auth.guard';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CreateUserByAdminDto } from './dto/create-user-by-admin.dto';

@ApiTags('Utilisateurs')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('admin-only')
  @UseGuards(RoleGuard)
  @Roles(RoleGlobal.admin)
  getAdminData() {
    return {
      message: 'Données administrateur',
    };
  }

  @ApiOperation({
    summary: 'creer  de utilisateur ',
  })
  @ApiBearerAuth('JWT')
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles(RoleGlobal.admin)
  @Post()
  @HttpCode(201)
  async create(@Body() createUser: CreateUserDto) {
    const user = await this.usersService.create(createUser);

    if (!user) {
      throw new BadRequestException('Impossible de créer utilisateur');
    }

    return user;
  }
  @ApiOperation({
    summary: 'liste tous les utilisateur connecter',
  })
  @ApiBearerAuth('JWT')
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles(RoleGlobal.admin)
  @Get()
  async findAll(@Query('role') role?: RoleGlobal) {
    return this.usersService.findAll(role);
  }

  @ApiOperation({
    summary: 'lister un seul utilisateur connecter',
  })
  @ApiBearerAuth('JWT')
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles(RoleGlobal.admin)
  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const user = await this.usersService.findOne(id);

    if (!user) {
      throw new NotFoundException('Utilisateur introuvable');
    }

    return user;
  }

  @ApiOperation({
    summary: 'Modifier les donnes de utitilisateur choisir',
  })
  @ApiBearerAuth('JWT')
  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateUser: UpdateUserDto,
  ) {
    return this.usersService.update(id, updateUser);
  }

  @ApiBearerAuth('JWT')
  @ApiOperation({
    summary: 'change le statut de un  un utilisateur connecter',
  })
  @Patch(':id/statut')
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles(RoleGlobal.admin)
  async changeStatut(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { statut: StatutCompte },
  ) {
    return this.usersService.changeStatut(id, body.statut);
  }

  @Post('create-by-admin')
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles(RoleGlobal.admin)
  async createByAdmin(@Body() createUserDto: CreateUserByAdminDto) {
    const user = await this.usersService.createByAdmin(createUserDto);

    return {
      message:
        'Utilisateur créé avec succès. Les informations ont été envoyées par email.',
      user,
    };
  }
}
