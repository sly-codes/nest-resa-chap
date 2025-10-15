import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MailService } from './mail.service';

// Le module est Global pour être injecté partout
@Global()
@Module({
  imports: [
    // ⚠️ SUPPRESSION du MailerModule.forRootAsync
    // La configuration du service se fait directement dans MailService
  ],
  providers: [MailService],
  exports: [MailService], // Exporter le service pour les autres modules
})
export class MailModule {}
