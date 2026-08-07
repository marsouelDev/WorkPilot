import { IsEmail, IsIn, IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class InviteMemberDto {
  @ApiProperty({
    description: "Email de l'utilisateur à inviter",
    example: 'marie.dupont@example.com',
  })
  @IsEmail({}, { message: "L'email doit être valide" })
  @IsNotEmpty({ message: "L'email est obligatoire" })
  email!: string;

  @ApiProperty({
    description: 'Rôle à attribuer au membre',
    enum: ['developpeur', 'relecteur', 'chef_projet'],
    example: 'developpeur',
  })
  @IsIn(['developpeur', 'relecteur', 'chef_projet'], {
    message: 'Le rôle doit être : developpeur, relecteur ou chef_projet',
  })
  @IsNotEmpty({ message: 'Le rôle est obligatoire' })
  role!: 'developpeur' | 'relecteur' | 'chef_projet';
}
