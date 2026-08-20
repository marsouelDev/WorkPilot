import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { CryptoService } from '../crypto/crypto.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { RoleGlobal, StatutCompte, Utilisateur, Prisma } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { UpdateProfileDto } from '../auth/dto/update-profile.dto';
import { randomBytes } from 'crypto';
import { EmailService } from '../email/email.service';
import { CreateUserByAdminDto } from './dto/create-user-by-admin.dto';

const SALT_ROUNDS = 10;

@Injectable()
export class UsersService {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly emailService: EmailService,
    private readonly crypto: CryptoService,
  ) {}

  private generatePassword(length = 8): string {
    return randomBytes(length)
      .toString('base64')
      .replace(/[^a-zA-Z0-9]/g, '')
      .slice(0, length);
  }

  private generateVerificationCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  async create(createUser: CreateUserDto): Promise<Utilisateur> {
    const hashedPassword = await bcrypt.hash(
      createUser.motDePasse,
      SALT_ROUNDS,
    );

    return this.databaseService.utilisateur.create({
      data: {
        nom: createUser.nom,
        prenom: createUser.prenom,
        email: createUser.email,
        telephone: createUser.telephone,
        motDePasse: hashedPassword,
        roleGlobal: createUser.role ?? RoleGlobal.membre,
        statut: createUser.statut ?? StatutCompte.en_attente_verification,
        codeVerificationHache: createUser.codeVerificationHache,
        codeVerificationExpire: createUser.codeVerificationExpire,
      },
    });
  }

  async createByAdmin(createUser: CreateUserByAdminDto) {
    const password = this.generatePassword();
    const code = this.generateVerificationCode();
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
    const hashedCode = await bcrypt.hash(code, SALT_ROUNDS);

    const expiration = new Date();
    expiration.setMinutes(expiration.getMinutes() + 10);

    const user = await this.databaseService.utilisateur.create({
      data: {
        nom: createUser.nom,
        prenom: createUser.prenom,
        email: createUser.email,
        telephone: createUser.telephone,
        motDePasse: hashedPassword,
        roleGlobal: createUser.role ?? RoleGlobal.membre,
        statut: StatutCompte.en_attente_verification,
        codeVerificationHache: hashedCode,
        codeVerificationExpire: expiration,
      },
    });

    await this.emailService.envoyer(user.email, 'code_verification_password', {
      nom: user.nom,
      code,
      password,
    });

    return user;
  }

  async findAll(role?: RoleGlobal): Promise<Utilisateur[]> {
    return this.databaseService.utilisateur.findMany({
      where: role ? { roleGlobal: role } : undefined,
    });
  }

  async findOne(id: number): Promise<Utilisateur | null> {
    return this.databaseService.utilisateur.findUnique({
      where: { id },
    });
  }

  async findById(id: number): Promise<Utilisateur | null> {
    return this.databaseService.utilisateur.findUnique({
      where: { id },
    });
  }

  async findByEmail(email: string): Promise<Utilisateur | null> {
    return this.databaseService.utilisateur.findUnique({
      where: { email },
    });
  }

  async findByGithubUsername(username: string) {
    return this.databaseService.utilisateur.findUnique({
      where: { githubUsername: username },
    });
  }

  async verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  async getProfile(id: number) {
    const user = await this.findById(id);

    if (!user) {
      return null;
    }

    const {
      motDePasse: _motDePasse,
      codeVerificationHache: _codeVerificationHache,
      codeVerificationExpire: _codeVerificationExpire,
      githubToken: _githubToken,
      ...profile
    } = user;

    return profile;
  }

  async updateProfile(id: number, dto: UpdateProfileDto) {
    return this.databaseService.utilisateur.update({
      where: { id },
      data: dto,
    });
  }

  async update(id: number, updateUser: UpdateUserDto): Promise<Utilisateur> {
    const data: Prisma.UtilisateurUpdateInput = {};

    if (updateUser.nom) {
      data.nom = updateUser.nom;
    }

    if (updateUser.prenom) {
      data.prenom = updateUser.prenom;
    }

    if (updateUser.email) {
      data.email = updateUser.email;
    }

    if (updateUser.telephone) {
      data.telephone = updateUser.telephone;
    }

    if (updateUser.motDePasse) {
      data.motDePasse = await bcrypt.hash(updateUser.motDePasse, SALT_ROUNDS);
    }

    if (updateUser.role) {
      data.roleGlobal = updateUser.role;
    }

    if (updateUser.statut) {
      data.statut = updateUser.statut;
    }

    return this.databaseService.utilisateur.update({
      where: { id },
      data,
    });
  }

  async changeStatut(id: number, statut: StatutCompte): Promise<Utilisateur> {
    const user = await this.databaseService.utilisateur.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException('Utilisateur introuvable');
    }

    if (user.roleGlobal === RoleGlobal.admin) {
      throw new BadRequestException(
        "Impossible de modifier le statut d'un administrateur.",
      );
    }

    await this.emailService.envoyer(user.email, 'statut', {
      nom: user.nom,
      statut: statut === StatutCompte.actif ? 'actif' : 'suspendu',
    });

    return this.databaseService.utilisateur.update({
      where: { id },
      data: { statut },
    });
  }

  async linkGithubAccount(
    userId: number,
    data: { githubUsername: string; githubToken: string },
  ) {
    const tokenChiffre = this.crypto.chiffrer(data.githubToken);

    return this.databaseService.utilisateur.update({
      where: { id: userId },
      data: {
        githubUsername: data.githubUsername,
        githubToken: tokenChiffre,
        githubLieAt: new Date(),
      },
    });
  }

  async getGithubToken(userId: number): Promise<string | null> {
    const user = await this.databaseService.utilisateur.findUnique({
      where: { id: userId },
      select: { githubToken: true },
    });

    if (!user?.githubToken) {
      return null;
    }

    try {
      return this.crypto.dechiffrer(user.githubToken);
    } catch (error) {
      throw new Error(
        `Impossible de déchiffrer le token GitHub : ${(error as Error).message}`,
      );
    }
  }
}
