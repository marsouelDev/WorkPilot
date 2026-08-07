import {
  ConflictException,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';

export class EmailDejaUtiliseException extends ConflictException {
  constructor() {
    super('Cette adresse e-mail est déjà associée à un compte');
  }
}

export class IdentifiantsIncorrectsException extends UnauthorizedException {
  constructor() {
    super('E-mail ou mot de passe incorrect');
  }
}

export class CompteNonVerifieException extends ForbiddenException {
  constructor() {
    super('Veuillez vérifier votre e-mail avant de vous connecter');
  }
}

export class CompteSuspenduException extends ForbiddenException {
  constructor() {
    super('Ce compte a été suspendu, contactez le support');
  }
}

export class CodeIncorrectException extends UnauthorizedException {
  constructor() {
    super('Code incorrect');
  }
}

export class CodeExpireException extends UnauthorizedException {
  constructor() {
    super('Code expiré, veuillez en redemander un');
  }
}
