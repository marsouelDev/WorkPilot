import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MailerModule } from '@nestjs-modules/mailer';
import { SmtpService } from './smtp/smtp.service';
import { BrevoService } from './brevo/brevo.service';
import { MailService } from './mail.service';

@Module({
  imports: [
    ConfigModule,

    MailerModule.forRootAsync({
      imports: [ConfigModule],

      inject: [ConfigService],

      useFactory: (config: ConfigService) => ({
        transport: {
          host: config.get<string>('SMTP_HOST'),

          port: Number(config.get<string>('SMTP_PORT')),

          secure: false,

          auth: {
            user: config.get<string>('SMTP_USER'),

            pass: config.get<string>('SMTP_PASSWORD'),
          },

          tls: {
            rejectUnauthorized: false,
          },
        },

        defaults: {
          from: `"${config.get<string>('MAIL_FROM_NAME')}" <${config.get<string>('MAIL_FROM')}>`,
        },
      }),
    }),
  ],

  providers: [SmtpService, BrevoService, MailService],

  exports: [MailService],
})
export class MailModule {}
