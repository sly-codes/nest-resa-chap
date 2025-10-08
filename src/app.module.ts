import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { MailModule } from './mail/mail.module';
import { PrismaModule } from './prisma/prisma.module';
import { ReservationModule } from './reservation/reservation.module';
import { ResourceModule } from './resource/resource.module';
import { ConfigModule } from '@nestjs/config'; // ⬅️ NOUVEL IMPORT
import { UserModule } from './users/user.module';
import { DashboardModule } from './dashboard/dashboard.module';

@Module({
  imports: [
    // 1. CONFIGURATION GLOBALE D'ABORD : Lit le .env et expose ConfigService
    ConfigModule.forRoot({
      isGlobal: true, // Ceci rend ConfigService disponible partout
    }),
    PrismaModule,
    AuthModule,
    ResourceModule,
    ReservationModule,
    MailModule,
    UserModule,
    DashboardModule
  ],

  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
