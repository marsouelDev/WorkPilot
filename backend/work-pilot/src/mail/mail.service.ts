import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SmtpService } from './smtp/smtp.service';
import { BrevoService } from './brevo/brevo.service';

@Injectable()
export class MailService {
  constructor(
    private readonly smtp: SmtpService,

    private readonly brevo: BrevoService,

    private readonly config: ConfigService,
  ) {}

  async sendMail(to: string, subject: string, html: string) {
    const provider = this.config.get<string>('MAIL_PROVIDER');

    if (provider === 'brevo') {
      return this.brevo.send(to, subject, html);
    }

    return this.smtp.send(to, subject, html);
  }
}
