import { IsEmail, IsNotEmpty, MinLength } from 'class-validator';

export class LoginDto {
  @IsNotEmpty({ message: 'Le nom est requis' })
  @MinLength(8, { message: '8 caratee minimun' })
  password!: string;

  @IsEmail({}, { message: "Le format de l'e-mail est invalide" })
  @IsNotEmpty({ message: "L'email est requis" })
  email!: string;
}
