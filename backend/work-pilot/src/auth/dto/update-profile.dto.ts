import {
  IsEmail,
  IsOptional,
  IsPhoneNumber,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class UpdateProfileDto {
  @IsOptional()
  @IsString({ message: 'Le nom doit être une chaîne de caractères.' })
  @MaxLength(50)
  nom?: string;

  @IsOptional()
  @IsString({ message: 'Le prénom doit être une chaîne de caractères.' })
  @MaxLength(50)
  prenom?: string;

  @IsOptional()
  @IsEmail({}, { message: 'Adresse email invalide.' })
  email?: string;

  @IsOptional()
  @IsPhoneNumber(undefined, {
    message: 'Le numéro de téléphone est invalide.',
  })
  telephone?: string;

  @IsOptional()
  @IsString()
  @MinLength(8, {
    message: 'Le mot de passe doit contenir au moins 8 caractères.',
  })
  @MaxLength(30)
  motDePasse?: string;
}
