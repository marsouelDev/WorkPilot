import { RoleGlobal } from '@prisma/client';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsPhoneNumber,
  IsString,
  MaxLength,
} from 'class-validator';

export class CreateUserByAdminDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  nom!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  prenom!: string;

  @IsEmail()
  email!: string;

  @IsPhoneNumber()
  telephone!: string;

  @IsOptional()
  role?: RoleGlobal;
}
