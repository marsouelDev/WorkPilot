import {
  ArrayMaxSize,
  IsArray,
  IsOptional,
  IsString,
  Validate,
  ValidateNested,
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { Type } from 'class-transformer';

export class ProjectFileDto {
  @IsString()
  path!: string;

  @IsString()
  content!: string;
}

@ValidatorConstraint({ name: 'messageOrImages', async: false })
class MessageOuImagesConstraint implements ValidatorConstraintInterface {
  validate(_message: unknown, args: ValidationArguments): boolean {
    const obj = args.object as ChatTaskDto;
    const hasMessage =
      typeof obj.message === 'string' && obj.message.trim().length > 0;
    const hasImages = Array.isArray(obj.images) && obj.images.length > 0;
    return hasMessage || hasImages;
  }

  defaultMessage(): string {
    return 'Tu dois envoyer un message ou au moins une image.';
  }
}

export class ChatTaskDto {
  @IsOptional()
  @IsString()
  @Validate(MessageOuImagesConstraint)
  message?: string;

  @IsOptional()
  @IsString()
  projectStructure?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProjectFileDto)
  relevantFiles?: ProjectFileDto[];

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(7, { message: 'Maximum 7 images par message' })
  @IsString({ each: true })
  images?: string[];
}
