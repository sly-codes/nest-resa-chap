import { MailerModule } from '@nestjs-modules/mailer';
import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config'; // Pour charger les variables d'environnement
import { MailService } from './mail.service';

// Le module est Global pour être injecté partout
@Global()
@Module({
  imports: [
    // Utilisation de MailerModule.forRootAsync pour charger la configuration de façon asynchrone
    // Ce qui permet d'utiliser le ConfigService (variables d'environnement)
    MailerModule.forRootAsync({
      useFactory: async (configService: ConfigService) => ({
        // ⚠️ Utilisation d'Ethereal Mail pour le développement/test (simule un SMTP)
        // Vous DEVEZ utiliser un service réel comme SendGrid, Mailgun ou un SMTP d'entreprise en production.
        transport: {
          host: configService.get<string>('MAIL_HOST'),
          port: configService.get<number>('MAIL_PORT'),
          secure: configService.get<string>('MAIL_SECURE') === 'true',
          auth: {
            user: configService.get<string>('MAIL_USER'),
            pass: configService.get<string>('MAIL_PASS'),
          },
        },
        defaults: {
          from: '"Resa Chap Notification" <ik3576898@gmail.com>',
        },
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [MailService],
  exports: [MailService], // Exporter le service pour les autres modules
})
export class MailModule {}
