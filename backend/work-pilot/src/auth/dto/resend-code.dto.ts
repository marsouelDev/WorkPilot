import { IsEmail } from 'class-validator';

export class ResendCodeDto {
  @IsEmail({}, { message: "Le format de l'e-mail est invalide" })
  email!: string;
}
