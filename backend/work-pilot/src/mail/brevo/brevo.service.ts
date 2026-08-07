import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

@Injectable()
export class BrevoService {
  constructor(private readonly config: ConfigService) {}

  async send(to: string, subject: string, html: string): Promise<void> {
    await axios.post(
      'https://api.brevo.com/v3/smtp/email',
      {
        sender: {
          name: this.config.get<string>('MAIL_FROM_NAME'),
          email: this.config.get<string>('MAIL_FROM'),
        },

        to: [
          {
            email: to,
          },
        ],

        subject,

        htmlContent: html,
      },
      {
        headers: {
          'api-key': this.config.get<string>('BREVO_API_KEY'),
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
      },
    );
  }
}
