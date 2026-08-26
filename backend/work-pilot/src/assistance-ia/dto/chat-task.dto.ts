import {
  IsArray,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class ProjectFileDto {
  @IsString()
  @IsNotEmpty()
  path!: string;

  @IsString()
  content!: string;
}

export class ChatTaskDto {
  @IsString()
  @IsNotEmpty()
  message!: string;

  @IsOptional()
  @IsString()
  projectStructure?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProjectFileDto)
  relevantFiles?: ProjectFileDto[];
}
