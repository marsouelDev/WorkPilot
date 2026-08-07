import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';

export class ChangePasswordDto {
  @IsString()
  @IsNotEmpty({
    message: 'L’ancien mot de passe est obligatoire.',
  })
  ancienMotDePasse!: string;

  @IsString()
  @IsNotEmpty({
    message: 'Le nouveau mot de passe est obligatoire.',
  })
  @MinLength(8, {
    message: 'Le mot de passe doit contenir au moins 8 caractères.',
  })
  @MaxLength(30)
  nouveauMotDePasse!: string;
}
