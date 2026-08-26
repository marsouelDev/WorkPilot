import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Logger,
  Patch,
  Post,
  Query,
  Request,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { ConfigService } from '@nestjs/config';
import type { Response } from 'express';

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
  private readonly logger = new Logger(AuthController.name);

  constructor(
    private readonly authService: AuthService,
    private readonly config: ConfigService,
  ) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @ApiOperation({ summary: "Inscription d'un nouvel utilisateur" })
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('verify-code')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @ApiOperation({ summary: 'Vérifier le code reçu par email' })
  verifyCode(@Body() body: { email: string; code: string }) {
    return this.authService.verifyCode(body.email, body.code);
  }

  @Post('resend-code')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Renvoyer un nouveau code' })
  resendCode(@Body() body: { email: string }) {
    return this.authService.resendCode(body.email);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @ApiOperation({ summary: 'Connexion' })
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: "Afficher le profil de l'utilisateur connecté" })
  me(@Request() req: requestWithUserInterface.RequestWithUser) {
    return this.authService.me(req.user.id);
  }

  @Patch('profile/update')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Modifier son profil' })
  updateProfile(
    @Request() req: requestWithUserInterface.RequestWithUser,
    @Body() dto: UpdateProfileDto,
  ) {
    return this.authService.updateProfile(req.user.id, dto);
  }

  @Patch('change-password')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Modifier son mot de passe' })
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

  @Get('github')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: "Générer l'URL OAuth GitHub" })
  githubLogin(@Request() req: requestWithUserInterface.RequestWithUser) {
    const clientId = this.config.get<string>('GITHUB_CLIENT_ID');
    const callback = this.config.get<string>('GITHUB_CALLBACK_URL');

    if (!clientId || !callback) {
      throw new Error(
        'Configuration GitHub manquante (GITHUB_CLIENT_ID ou GITHUB_CALLBACK_URL)',
      );
    }

    const stateToken = this.authService['jwtService'].sign(
      { id: req.user.id },
      { expiresIn: '10m' },
    );

    const scope = 'repo user:email';

    const url =
      `https://github.com/login/oauth/authorize` +
      `?client_id=${clientId}` +
      `&redirect_uri=${encodeURIComponent(callback)}` +
      `&scope=${encodeURIComponent(scope)}` +
      `&state=${encodeURIComponent(stateToken)}`;

    return { url };
  }

  @Get('github/callback')
  @ApiOperation({ summary: 'Callback OAuth GitHub' })
  async githubCallback(
    @Query('code') code: string,
    @Query('state') state: string,
    @Res() res: Response,
  ) {
    const frontend =
      this.config.get<string>('FRONTEND_URL') ?? 'http://localhost:3000';

    try {
      let userId: number | undefined;

      try {
        const payload = this.authService['jwtService'].verify(state);
        userId = payload.id ?? payload.sub;
      } catch {
        this.logger.warn('State JWT invalide ou expiré');
        return res.redirect(`${frontend}/profile?github=erreur_state`);
      }

      if (!userId) {
        this.logger.warn('userId introuvable dans le state');
        return res.redirect(`${frontend}/profile?github=erreur_state`);
      }

      this.logger.log(`Callback GitHub OAuth pour user ${userId}`);

      const clientId = this.config.get<string>('GITHUB_CLIENT_ID') ?? '';
      const clientSecret =
        this.config.get<string>('GITHUB_CLIENT_SECRET') ?? '';

      const tokenRes = await fetch(
        'https://github.com/login/oauth/access_token',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          body: JSON.stringify({
            client_id: clientId,
            client_secret: clientSecret,
            code,
          }),
        },
      );

      const tokenData = await tokenRes.json();
      const accessToken: string | undefined = tokenData.access_token;
      const scope: string | undefined = tokenData.scope;

      if (!accessToken) {
        this.logger.error('Pas de access_token GitHub', tokenData);
        return res.redirect(`${frontend}/profile?github=erreur_token`);
      }

      if (!scope || !scope.includes('repo')) {
        this.logger.warn(
          `Scope GitHub insuffisant : "${scope}". "repo" est requis pour les dépôts privés.`,
        );
      } else {
        this.logger.log(`Scopes GitHub : ${scope}`);
      }

      const ghRes = await fetch('https://api.github.com/user', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'User-Agent': 'WorkPilot/1.0',
        },
      });

      const ghUser = await ghRes.json();

      if (!ghUser?.login) {
        this.logger.error('Pas de login GitHub', ghUser);
        return res.redirect(`${frontend}/profile?github=erreur_user`);
      }

      await this.authService.linkGithub(state, {
        githubUsername: ghUser.login,
        githubToken: accessToken,
      });

      this.logger.log(`GitHub lié pour user ${userId} → @${ghUser.login}`);

      return res.redirect(`${frontend}/profile?github=ok`);
    } catch (err) {
      this.logger.error('Erreur callback GitHub', err);
      return res.redirect(`${frontend}/profile?github=erreur`);
    }
  }
}
