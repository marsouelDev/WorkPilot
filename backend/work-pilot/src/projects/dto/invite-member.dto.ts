import { IsEmail, IsIn, IsNotEmpty } from 'class-validator';

export class InviteMemberDto {
  @IsEmail({}, { message: "L'email doit être valide" })
  @IsNotEmpty({ message: "L'email est obligatoire" })
  email!: string;

  @IsIn(['developpeur', 'relecteur', 'chef_projet'], {
    message: 'Le rôle doit être : developpeur, relecteur ou chef_projet',
  })
  @IsNotEmpty({ message: 'Le rôle est obligatoire' })
  role!: 'developpeur' | 'relecteur' | 'chef_projet';
}
