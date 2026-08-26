import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MinLength, MaxLength } from 'class-validator';

export class RejeterLivrableDto {
  @ApiProperty({
    description: 'Raison du rejet du livrable',
  })
  @IsString({ message: 'motif doit être une chaîne de caractères' })
  @IsNotEmpty({ message: 'Le motif de rejet est obligatoire' })
  @MinLength(10, { message: 'Le motif doit contenir au moins 10 caractères' })
  @MaxLength(500, { message: 'Le motif ne peut pas dépasser 500 caractères' })
  motif!: string;
}
