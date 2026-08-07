import { IsEmail, Length } from 'class-validator';

export class VerifyCodeDto {
  @IsEmail({}, { message: "Le format de l'e-mail est invalide" })
  email!: string;

  @Length(6, 6, { message: 'Le code doit contenir 6 chiffres' })
  code!: string;
}
