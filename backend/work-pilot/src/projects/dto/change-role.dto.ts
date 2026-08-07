import { IsIn, IsNotEmpty } from 'class-validator';

export class ChangeRoleDto {
  @IsIn(['developpeur', 'relecteur', 'chef_projet'], {
    message: 'Le rôle doit être : developpeur, relecteur ou chef_projet',
  })
  @IsNotEmpty({ message: 'Le rôle est obligatoire' })
  role!: 'developpeur' | 'relecteur' | 'chef_projet';
}
