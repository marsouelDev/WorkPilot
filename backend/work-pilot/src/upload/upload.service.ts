import {
  BadRequestException,
  Injectable,
  Logger,
  OnModuleInit,
} from '@nestjs/common';

const cleanEnv = (value?: string): string =>
  (value ?? '').trim().replace(/^["']+|["']+$/g, '');

/** MIME types acceptés */
const MIME_ACCEPTES = [
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/webp',
  'image/gif',
  'image/avif',
  'image/svg+xml',
  'image/x-icon',
  'image/vnd.microsoft.icon',
];

/* Nom exact du preset unsigned créé dans le dashboard Cloudinary */
const UPLOAD_PRESET = 'workpilot';

@Injectable()
export class UploadService implements OnModuleInit {
  private readonly logger = new Logger(UploadService.name);
  private cloudName = '';

  onModuleInit() {
    this.cloudName = cleanEnv(process.env.CLOUDINARY_CLOUD_NAME);

    if (!this.cloudName) {
      this.logger.error('CLOUDINARY_CLOUD_NAME manquante dans .env');
      return;
    }
    this.logger.log(`Cloudinary prêt `);
  }

  async uploadImage(
    file: Express.Multer.File,
  ): Promise<{ url: string; publicId: string }> {
    if (!this.cloudName) {
      throw new BadRequestException('Erreur ');
    }

    if (!file || !file.buffer || file.buffer.length === 0) {
      throw new BadRequestException('Fichier image vide ou invalide');
    }

    if (!MIME_ACCEPTES.includes(file.mimetype)) {
      throw new BadRequestException(
        `Type de fichier non supporté : ${file.mimetype}. Formats acceptés : PNG, JPG, WEBP, GIF, AVIF, SVG, ICO.`,
      );
    }

    const blob = new Blob([new Uint8Array(file.buffer)], {
      type: file.mimetype,
    });
    const form = new FormData();
    form.append('file', blob, file.originalname || 'upload.png');
    form.append('upload_preset', UPLOAD_PRESET);
    form.append('folder', 'workpilot/ia');

    try {
      const res = await fetch(
        `https://api.cloudinary.com/v1_1/${this.cloudName}/auto/upload`,
        { method: 'POST', body: form },
      );

      const data: any = await res.json().catch(() => ({}));

      if (!res.ok || !data?.secure_url) {
        const details: string = data?.error?.message ?? `HTTP ${res.status}`;
        this.logger.error(`Upload échoué : ${details}`);
        throw new BadRequestException(`Échec de l'upload : ${details}`);
      }

      this.logger.log(`Image uploadée : ${data.secure_url}`);
      return {
        url: String(data.secure_url),
        publicId: String(data.public_id),
      };
    } catch (err) {
      if (err instanceof BadRequestException) throw err;
      /*Typage explicite pour satisfaire ESLint */
      const errMsg = err instanceof Error ? err.message : String(err);
      throw new BadRequestException(`Erreur réseau lors de l'upload ${errMsg}`);
    }
  }

  async deleteImage(publicId: string): Promise<void> {
    this.logger.warn(
      `Suppression non supportée en mode unsigned (publicId: ${publicId})`,
    );
  }
}
