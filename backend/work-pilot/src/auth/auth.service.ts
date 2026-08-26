import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { RoleGlobal, StatutCompte, Utilisateur } from '@prisma/client';
import { UsersService } from '../users/users.service';
import { EmailService } from '../email/email.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { NotificationService } from '../notification/notification.service';

const SALT = 10;

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly emailService: EmailService,
    private readonly jwtService: JwtService,
    private readonly notifications: NotificationService,
  ) {}

  async register(registerDto: RegisterDto) {
    const existingUser = await this.usersService.findByEmail(registerDto.email);

    if (existingUser) {
      throw new BadRequestException('Email déjà utilisé');
    }

    const { code, codeHache, expiration } = await this.genererCode();

    const user = await this.usersService.create({
      nom: registerDto.nom,
      prenom: registerDto.prenom,
      email: registerDto.email,
      telephone: registerDto.telephone,
      motDePasse: registerDto.motDePasse,
      role: registerDto.role ?? RoleGlobal.membre,
      statut: StatutCompte.en_attente_verification,
      codeVerificationHache: codeHache,
      codeVerificationExpire: expiration,
    });

    await this.emailService.envoyer(user.email, 'code_verification', code);

    return {
      message:
        'Compte créé avec succès. Vérifiez votre adresse email afin de relever le code de vérification.',
    };
  }

  async verifyCode(email: string, code: string) {
    const user = await this.usersService.findByEmail(email);

    if (!user) {
      throw new BadRequestException('Utilisateur introuvable');
    }

    if (
      !user.codeVerificationExpire ||
      user.codeVerificationExpire < new Date()
    ) {
      throw new BadRequestException('Le code est expiré');
    }

    if (!user.codeVerificationHache) {
      throw new BadRequestException('Code invalide');
    }

    const isValid = await bcrypt.compare(code, user.codeVerificationHache);

    if (!isValid) {
      throw new BadRequestException('Code invalide');
    }

    await this.usersService.update(user.id, {
      statut: StatutCompte.actif,
      codeVerificationHache: null,
      codeVerificationExpire: null,
    });

    await this.emailService.envoyer(email, 'bienvenue');

    await this.notifications.creer(user.id, {
      type: 'systeme',
      titre: 'Bienvenue sur WorkPilot',
      message:
        'Votre compte est vérifié. Veuillez connecter votre compte GitHub pour profiter de toutes les fonctionnalités.',
    });

    return this.genererSession({
      ...user,
      statut: StatutCompte.actif,
      codeVerificationHache: null,
      codeVerificationExpire: null,
    });
  }

  async login(loginDto: LoginDto) {
    const user = await this.usersService.findByEmail(loginDto.email);

    if (!user) {
      throw new UnauthorizedException('Email ou mot de passe incorrect');
    }

    const passwordValid = await this.usersService.verifyPassword(
      loginDto.password,
      user.motDePasse,
    );

    if (!passwordValid) {
      throw new UnauthorizedException('Email ou mot de passe incorrect');
    }

    if (user.statut !== StatutCompte.actif) {
      throw new BadRequestException("Votre compte n'est pas encore vérifié.");
    }

    return this.genererSession(user);
  }

  async resendCode(email: string) {
    const user = await this.usersService.findByEmail(email);

    if (!user) {
      throw new BadRequestException('Utilisateur introuvable');
    }

    if (user.statut === StatutCompte.actif) {
      throw new BadRequestException('Votre compte est déjà activé.');
    }

    const { code, codeHache, expiration } = await this.genererCode();

    await this.usersService.update(user.id, {
      codeVerificationHache: codeHache,
      codeVerificationExpire: expiration,
    });

    await this.emailService.envoyer(email, 'code_verification', code);

    return { message: 'Un nouveau code a été envoyé.' };
  }

  async me(userId: number) {
    return this.usersService.getProfile(userId);
  }

  async updateProfile(userId: number, dto: UpdateProfileDto) {
    return this.usersService.updateProfile(userId, dto);
  }

  async changePassword(
    id: number,
    ancienMotDePasse: string,
    nouveauMotDePasse: string,
  ): Promise<{ message: string }> {
    const user = await this.usersService.findById(id);

    if (!user) {
      throw new BadRequestException('Utilisateur introuvable');
    }

    const passwordCorrect = await bcrypt.compare(
      ancienMotDePasse,
      user.motDePasse,
    );

    if (!passwordCorrect) {
      throw new BadRequestException("L'ancien mot de passe est incorrect.");
    }

    await this.usersService.update(id, {
      motDePasse: nouveauMotDePasse,
    });

    return { message: 'Mot de passe modifié avec succès.' };
  }

  async linkGithub(
    appToken: string,
    data: { githubUsername: string; githubToken: string },
  ) {
    let payload: any;

    try {
      payload = this.jwtService.verify(appToken);
    } catch {
      throw new UnauthorizedException('Session expirée. Reconnectez-vous.');
    }

    const userId = payload.id ?? payload.sub;

    const existing = await this.usersService.findByGithubUsername(
      data.githubUsername,
    );

    if (existing && existing.id !== userId) {
      throw new BadRequestException(
        `Le compte GitHub @${data.githubUsername} est déjà lié à un autre utilisateur.`,
      );
    }

    await this.usersService.linkGithubAccount(userId, {
      githubUsername: data.githubUsername,
      githubToken: data.githubToken,
    });

    await this.notifications.creer(userId, {
      type: 'systeme',
      titre: 'GitHub connecté',
      message: `Votre compte GitHub @${data.githubUsername} est maintenant lié à WorkPilot.`,
    });

    return true;
  }

  private genererSession(user: Utilisateur) {
    const accessToken = this.jwtService.sign({
      sub: user.id,
      email: user.email,
      role: user.roleGlobal,
    });

    return {
      access_token: accessToken,
      user: {
        id: user.id,
        nom: user.nom,
        prenom: user.prenom,
        email: user.email,
        telephone: user.telephone,
        role: user.roleGlobal,
        statut: user.statut,
        githubUsername: user.githubUsername,
        githubLieAt: user.githubLieAt,
      },
    };
  }

  private async genererCode() {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const codeHache = await bcrypt.hash(code, SALT);
    const expiration = new Date(Date.now() + 10 * 60 * 1000);

    return { code, codeHache, expiration };
  }
}
