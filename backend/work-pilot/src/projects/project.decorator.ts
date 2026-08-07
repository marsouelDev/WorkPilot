import { SetMetadata } from '@nestjs/common';
import { RoleProjet } from '@prisma/client';

export const ROLES_KEY = 'roles';

export const RolesProject = (...roles: RoleProjet[]) =>
  SetMetadata(ROLES_KEY, roles);
