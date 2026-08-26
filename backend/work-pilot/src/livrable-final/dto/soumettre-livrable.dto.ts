import { IsNotEmpty, IsString, IsUrl, IsInt } from 'class-validator';

export class SoumettreLivrableDto {
  @IsInt({ message: 'tacheId doit être un entier' })
  @IsNotEmpty({ message: 'tacheId est obligatoire' })
  tacheId!: number;

  @IsString({ message: 'fichierUrl doit être une chaîne de caractères' })
  @IsNotEmpty({ message: 'fichierUrl est obligatoire' })
  @IsUrl({}, { message: 'fichierUrl doit être une URL valide' })
  fichierUrl!: string;
}
