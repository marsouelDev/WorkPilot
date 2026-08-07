import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Patch,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt.auth.guard';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import * as requestWithUserInterface from './interfaces/request-with-user.interface';

@ApiTags('Authentification')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @Throttle({
    default: {
      limit: 5,
      ttl: 60000,
    },
  })
  @ApiOperation({
    summary: "Inscription d'un nouvel utilisateur",
  })
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('verify-code')
  @HttpCode(HttpStatus.OK)
  @Throttle({
    default: {
      limit: 5,
      ttl: 60000,
    },
  })
  @ApiOperation({
    summary: 'Vérifier le code reçu par email',
  })
  verifyCode(
    @Body()
    body: {
      email: string;
      code: string;
    },
  ) {
    return this.authService.verifyCode(body.email, body.code);
  }

  @Post('resend-code')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Renvoyer un nouveau code',
  })
  resendCode(
    @Body()
    body: {
      email: string;
    },
  ) {
    return this.authService.resendCode(body.email);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @Throttle({
    default: {
      limit: 5,
      ttl: 60000,
    },
  })
  @ApiOperation({
    summary: 'Connexion',
  })
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT')
  @ApiOperation({
    summary: "Afficher le profil de l'utilisateur connecté",
  })
  me(@Request() req: requestWithUserInterface.RequestWithUser) {
    return this.authService.me(req.user.id);
  }

  @Patch('profile/update')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT')
  @ApiOperation({
    summary: 'Modifier son profil',
  })
  updateProfile(
    @Request() req: requestWithUserInterface.RequestWithUser,
    @Body() dto: UpdateProfileDto,
  ) {
    return this.authService.updateProfile(req.user.id, dto);
  }

  @Patch('change-password')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT')
  @ApiOperation({
    summary: 'Modifier son mot de passe',
  })
  changePassword(
    @Request() req: requestWithUserInterface.RequestWithUser,
    @Body() dto: ChangePasswordDto,
  ) {
    return this.authService.changePassword(
      req.user.id,
      dto.ancienMotDePasse,
      dto.nouveauMotDePasse,
    );
  }
}
