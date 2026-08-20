import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class CreatePullRequestDto {
  @ApiProperty({
    description: 'ID de la tâche liée à cette PR',
  })
  @IsInt()
  tacheId!: number;

  @ApiProperty({
    description: 'Branche source (celle qui contient les modifications)',
  })
  @IsString()
  @IsNotEmpty({ message: 'La branche est obligatoire' })
  @MaxLength(100, { message: 'Le nom de la branche est trop long' })
  branche!: string;

  @ApiPropertyOptional({
    description: 'Titre de la PR (optionnel, sinon "PR — {titre de la tâche}")',
  })
  @IsString()
  @IsOptional()
  @MaxLength(200, { message: 'Le titre ne doit pas dépasser 200 caractères' })
  titre?: string;

  @ApiPropertyOptional({
    description: 'Description détaillée de la PR',
  })
  @IsString()
  @IsOptional()
  @MaxLength(5000, {
    message: 'La description ne doit pas dépasser 5000 caractères',
  })
  description?: string;
}
