import {
  BadRequestException,
  Controller,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import {
  ApiBearerAuth,
  ApiConsumes,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt.auth.guard';
import { UploadService } from './upload.service';

const MIME_VALIDES = [
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

const TAILLE_MAX = 5 * 1024 * 1024;

@ApiTags('Upload')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard)
@Controller('upload')
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Post('image')
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Uploader une image (Cloudinary)' })
  @ApiResponse({ status: 201, description: 'Image uploadée avec succès' })
  @ApiResponse({ status: 400, description: 'Fichier invalide ou trop lourd' })
  @UseInterceptors(
    FilesInterceptor('images', 4, {
      storage: memoryStorage(),
      limits: { fileSize: TAILLE_MAX },
      fileFilter: (_req, file, cb) => {
        if (!MIME_VALIDES.includes(file.mimetype)) {
          cb(
            new BadRequestException(
              `Format non supporté : ${file.mimetype}. Formats acceptés : PNG, JPG, WEBP, GIF, AVIF, SVG, ICO.`,
            ),
            false,
          );
          return;
        }
        cb(null, true);
      },
    }),
  )
  async uploadImage(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('Aucune image reçue');
    }

    return this.uploadService.uploadImage(file);
  }
}
