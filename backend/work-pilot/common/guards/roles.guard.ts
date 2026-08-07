import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RoleGlobal } from '@prisma/client';
import { ROLES_KEY } from '../../src/users/user-app.decorator';

@Injectable()
export class RoleGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    /*  Récupère les rôles autorisés définis avec le décorateur @Roles()*/
    const requiredRoles = this.reflector.getAllAndOverride<RoleGlobal[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    /**Si aucun rôle n'est demandé,l'utilisateur est automatiquement autorisé.*/
    if (!requiredRoles) {
      return true;
    }

    /* Récupère la requête HTTP ainsi que l'utilisateur authentifié par le JwtAuthGuard.*/
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      return false;
    }

    return requiredRoles.includes(user.roleGlobal);
  }
}
