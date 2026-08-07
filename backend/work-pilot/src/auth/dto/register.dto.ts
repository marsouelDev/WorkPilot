import { RoleGlobal } from '@prisma/client';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsPhoneNumber,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class RegisterDto {
  @IsString()
  @IsNotEmpty({ message: 'Le nom est obligatoire' })
  @MaxLength(20)
  nom!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  prenom!: string;

  @IsNotEmpty({ message: 'Le prenom est obligatoire' })
  @MinLength(8, {
    message: 'Le mot de passe doit contenir au moins 8 caractères',
  })
  motDePasse!: string;

  @IsEmail({}, { message: "Le format de l'e-mail est invalide" })
  @IsNotEmpty({ message: "L'email est obligatoire" })
  email!: string;

  @IsPhoneNumber(undefined, { message: 'Le numéro de téléphone est invalide' })
  telephone!: string;

  @IsOptional()
  role?: RoleGlobal;

  @IsOptional()
  @IsString()
  statut?: string;

  @IsOptional()
  @IsString()
  codeVerificationHache?: string;

  @IsOptional()
  codeVerificationExpire?: Date;
}
