import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  MinLength,
} from 'class-validator';

export class CreateProjectDto {
  @IsString()
  @IsNotEmpty({ message: 'Le titre du projet est obligatoire' })
  titre!: string;

  @IsString()
  @MinLength(20, {
    message:
      "Décrivez votre besoin en au moins 20 caractères pour que l'IA puisse l'exploiter et donne un cahier de charge et des taches precis",
  })
  description!: string;

  @IsOptional()
  @IsUrl({}, { message: 'Le lien du dépôt Git doit être une URL valide' })
  depotGitUrl!: string;
}
