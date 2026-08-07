import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ForbiddenException,
} from '@nestjs/common';
import { DatabaseService } from '../../src/database/database.service';

@Injectable()
export class ChefProjetGuard implements CanActivate {
  constructor(private readonly db: DatabaseService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const utilisateurId = request.user.id;
    const projetId = parseInt(request.params.id);

    const membre = await this.db.membre.findFirst({
      where: { projetId, utilisateurId },
    });

    if (!membre || membre.role !== 'chef_projet') {
      throw new ForbiddenException(
        'Seul le chef de projet peut effectuer cette action',
      );
    }

    return true;
  }
}
