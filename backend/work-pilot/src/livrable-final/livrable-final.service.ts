import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { NotificationService } from '../notification/notification.service';
import { SoumettreLivrableDto } from './dto/soumettre-livrable.dto';
import { RejeterLivrableDto } from './dto/rejeter-livrable.dto';

@Injectable()
export class LivrableFinalService {
  private readonly logger = new Logger(LivrableFinalService.name);

  constructor(
    private readonly databaseService: DatabaseService,
    private readonly notifications: NotificationService,
  ) {}

  private async verifierAcces(projetId: number, userId: number) {
    const membre = await this.databaseService.membre.findFirst({
      where: { projetId, utilisateurId: userId },
    });

    const projet = await this.databaseService.projet.findUnique({
      where: { id: projetId },
    });

    if (!projet) {
      throw new NotFoundException('Projet introuvable');
    }

    if (!membre && projet.createurId !== userId) {
      throw new ForbiddenException("Vous n'avez pas accès à ce projet");
    }

    return projet;
  }

  private async verifierRoleRelecteur(projetId: number, userId: number) {
    const projet = await this.databaseService.projet.findUnique({
      where: { id: projetId },
    });

    if (!projet) {
      throw new NotFoundException('Projet introuvable');
    }

    const membre = await this.databaseService.membre.findFirst({
      where: { projetId, utilisateurId: userId },
    });

    const estChef = projet.createurId === userId;
    const estRelecteur = membre?.role === 'relecteur';

    if (!estChef && !estRelecteur) {
      throw new ForbiddenException(
        'Seuls le chef de projet et les relecteurs peuvent valider ou rejeter un livrable',
      );
    }
  }

  async soumettre(userId: number, dto: SoumettreLivrableDto) {
    const tache = await this.databaseService.tache.findUnique({
      where: { id: dto.tacheId },
      include: { projet: true },
    });

    if (!tache) {
      throw new NotFoundException('Tâche introuvable');
    }

    await this.verifierAcces(tache.projetId, userId);

    if (tache.assigneeId !== userId) {
      throw new ForbiddenException(
        'Seul le membre assigné à cette tâche peut soumettre un livrable',
      );
    }

    if (tache.statut !== 'attribuee') {
      throw new BadRequestException(
        `La tâche est en statut "${tache.statut}". Elle doit être "attribuee" pour soumettre un livrable.`,
      );
    }

    const livrableExistant = await this.databaseService.livrableFinal.findFirst(
      {
        where: {
          tacheId: dto.tacheId,
          statut: 'soumis',
        },
      },
    );

    if (livrableExistant) {
      throw new ConflictException(
        'Un livrable est déjà soumis pour cette tâche. Attendez la validation ou le rejet.',
      );
    }

    const livrable = await this.databaseService.livrableFinal.create({
      data: {
        tacheId: dto.tacheId,
        fichierUrl: dto.fichierUrl,
        statut: 'soumis',
      },
      include: { tache: true },
    });
    await this.databaseService.tache.update({
      where: { id: dto.tacheId },
      data: { statut: 'en_revue' },
    });

    this.logger.log(`Livrable soumis pour la tâche ${dto.tacheId}`);

    await this.notifierRelecteurs(
      tache.projetId,
      userId,
      'livrable_soumis',
      'Livrable à valider',
      `${tache.titre} : un livrable a été soumis et attend votre validation.`,
      tache.projetId,
      dto.tacheId,
    );

    return livrable;
  }

  async valider(userId: number, livrableId: number) {
    const livrable = await this.databaseService.livrableFinal.findUnique({
      where: { id: livrableId },
      include: { tache: { include: { projet: true } } },
    });

    if (!livrable) {
      throw new NotFoundException('Livrable introuvable');
    }

    await this.verifierRoleRelecteur(livrable.tache.projetId, userId);

    if (livrable.statut !== 'soumis') {
      throw new BadRequestException(
        `Le livrable est déjà "${livrable.statut}". Seul un livrable "soumis" peut être validé ou rejeter.`,
      );
    }

    const livrableMaj = await this.databaseService.livrableFinal.update({
      where: { id: livrableId },
      data: { statut: 'valide' },
      include: { tache: true },
    });

    await this.databaseService.tache.update({
      where: { id: livrable.tacheId },
      data: { statut: 'terminee' },
    });

    this.logger.log(
      `Livrable ${livrableId} validé : tâche ${livrable.tacheId} terminée`,
    );

    if (livrable.tache.assigneeId) {
      await this.notifications.creer(livrable.tache.assigneeId, {
        type: 'tache_terminee',
        titre: 'Livrable validé 🎉',
        message: `Votre livrable sur "${livrable.tache.titre}" a été validé. La tâche est terminée.`,
        projetId: livrable.tache.projetId,
        tacheId: livrable.tacheId,
      });
    }

    return livrableMaj;
  }

  async rejeter(userId: number, livrableId: number, dto: RejeterLivrableDto) {
    const livrable = await this.databaseService.livrableFinal.findUnique({
      where: { id: livrableId },
      include: { tache: { include: { projet: true } } },
    });

    if (!livrable) {
      throw new NotFoundException('Livrable introuvable');
    }

    await this.verifierRoleRelecteur(livrable.tache.projetId, userId);

    if (livrable.statut !== 'soumis') {
      throw new BadRequestException(
        `Le livrable est déjà "${livrable.statut}". Seul un livrable "soumis" peut être rejeté.`,
      );
    }

    const livrableMaj = await this.databaseService.livrableFinal.update({
      where: { id: livrableId },
      data: { statut: 'rejete' },
      include: { tache: true },
    });

    await this.databaseService.tache.update({
      where: { id: livrable.tacheId },
      data: { statut: 'attribuee' },
    });

    this.logger.log(
      `Livrable #${livrableId} rejeté — tâche #${livrable.tacheId} retourne en "attribuee"`,
    );

    if (livrable.tache.assigneeId) {
      await this.notifications.creer(livrable.tache.assigneeId, {
        type: 'livrable_rejete',
        titre: 'Livrable rejeté',
        message: `Votre livrable sur "${livrable.tache.titre}" a été rejeté. Motif : ${dto.motif}`,
        projetId: livrable.tache.projetId,
        tacheId: livrable.tacheId,
      });
    }

    return { ...livrableMaj, motifRejet: dto.motif };
  }

  async obtenirParTache(userId: number, tacheId: number) {
    const tache = await this.databaseService.tache.findUnique({
      where: { id: tacheId },
    });

    if (!tache) {
      throw new NotFoundException('Tâche introuvable');
    }

    await this.verifierAcces(tache.projetId, userId);

    return this.databaseService.livrableFinal.findFirst({
      where: { tacheId },
      orderBy: { createdAt: 'desc' },
      include: { tache: true },
    });
  }

  async listerParProjet(userId: number, projetId: number) {
    await this.verifierAcces(projetId, userId);

    return this.databaseService.livrableFinal.findMany({
      where: { tache: { projetId } },
      orderBy: { createdAt: 'desc' },
      include: {
        tache: {
          select: {
            id: true,
            titre: true,
            statut: true,
            assignee: {
              select: { id: true, prenom: true, nom: true },
            },
          },
        },
      },
    });
  }

  private async notifierRelecteurs(
    projetId: number,
    auteurId: number,
    type: string,
    titre: string,
    message: string,
    projetIdNotif: number,
    tacheId: number,
  ) {
    const relecteurs = await this.databaseService.membre.findMany({
      where: { projetId, role: 'relecteur' },
      select: { utilisateurId: true },
    });

    const projet = await this.databaseService.projet.findUnique({
      where: { id: projetId },
    });

    const destinataires = new Set<number>(
      relecteurs.map((r) => r.utilisateurId),
    );

    if (projet?.createurId) {
      destinataires.add(projet.createurId);
    }

    destinataires.delete(auteurId);

    for (const destinataireId of destinataires) {
      await this.notifications.creer(destinataireId, {
        type,
        titre,
        message,
        projetId,
        tacheId,
      });
    }

    this.logger.log(
      `${destinataires.size} personne(s) notifiée(s) pour le livrable`,
    );
  }
}
