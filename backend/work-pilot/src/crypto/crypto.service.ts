import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const SALT_LENGTH = 16;
const KEY_LENGTH = 32;
const ITERATIONS = 100000;

@Injectable()
export class CryptoService {
  private readonly masterKey: string;

  constructor(private readonly configService: ConfigService) {
    this.masterKey = this.configService.get<string>('CRYPTO_KEY') ?? '';

    if (!this.masterKey || this.masterKey.length < 32) {
      throw new Error(
        'CRYPTO_KEY manquante ou trop courte dans le .env (minimum 32 caractères)',
      );
    }
  }

  /* CHIFFRER (avant stockage en base)
     Retourne : salt:iv:tag:ciphertext (tout en hex) */

  chiffrer(texte: string): string {
    const iv = crypto.randomBytes(IV_LENGTH);
    const salt = crypto.randomBytes(SALT_LENGTH);

    /* Dérive la clé à partir du masterKey + salt (PBKDF2) */
    const key = crypto.pbkdf2Sync(
      this.masterKey,
      salt,
      ITERATIONS,
      KEY_LENGTH,
      'sha512',
    );

    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

    let encrypted = cipher.update(texte, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const tag = cipher.getAuthTag();

    /* Format : salt:iv:tag:ciphertext */
    return [
      salt.toString('hex'),
      iv.toString('hex'),
      tag.toString('hex'),
      encrypted,
    ].join(':');
  }

  /* DÉCHIFFRER (avant utilisation API) */

  dechiffrer(texteChiffre: string): string {
    try {
      const [saltHex, ivHex, tagHex, encrypted] = texteChiffre.split(':');

      if (!saltHex || !ivHex || !tagHex || !encrypted) {
        throw new Error('Format de chiffrement invalide');
      }

      const salt = Buffer.from(saltHex, 'hex');
      const iv = Buffer.from(ivHex, 'hex');
      const tag = Buffer.from(tagHex, 'hex');

      const key = crypto.pbkdf2Sync(
        this.masterKey,
        salt,
        ITERATIONS,
        KEY_LENGTH,
        'sha512',
      );

      const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
      decipher.setAuthTag(tag);

      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');

      return decrypted;
    } catch {
      throw new Error(
        'Impossible de déchiffrer le token (corrompu ou clé invalide)',
      );
    }
  }
}
