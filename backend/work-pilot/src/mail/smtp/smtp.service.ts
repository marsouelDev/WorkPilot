import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MailerService } from '@nestjs-modules/mailer';

@Injectable()
export class SmtpService {
  constructor(
    private readonly mailer: MailerService,
    private readonly config: ConfigService,
  ) {}

  async send(to: string, subject: string, html: string) {
    return this.mailer.sendMail({
      to,
      subject,
      html,
    });
  }
}
