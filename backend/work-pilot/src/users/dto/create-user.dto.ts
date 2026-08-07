import { RoleGlobal, StatutCompte } from '@prisma/client';
import { IsEnum } from 'class-validator';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsPhoneNumber,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateUserDto {
  @IsString({ message: 'Le nom doit être une chaîne de caractères.' })
  @IsNotEmpty({ message: 'Le nom est requis.' })
  @MaxLength(20)
  nom!: string;

  @IsString({ message: 'Le prenom doit être une chaîne de caractères.' })
  @IsNotEmpty({ message: 'Le prenom est requis.' })
  @MaxLength(20)
  prenom!: string;

  @IsString()
  @IsNotEmpty({ message: 'Le mot de passe est requis.' })
  @MinLength(8)
  @MaxLength(15)
  motDePasse!: string;

  @IsEmail({}, { message: 'Adresse email invalide.' })
  @IsNotEmpty()
  email!: string;

  @IsPhoneNumber(undefined, { message: 'Le numéro de téléphone est invalide' })
  telephone!: string;

  @IsOptional()
  role?: RoleGlobal;

  @IsOptional()
  @IsEnum(StatutCompte)
  statut?: StatutCompte;

  @IsOptional()
  @IsString()
  codeVerificationHache?: string | null;

  @IsOptional()
  codeVerificationExpire?: Date | null;
}
