import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config'; // ⬅️ NOUVEL IMPORT
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { MailModule } from './mail/mail.module';
import { PrismaModule } from './prisma/prisma.module';
import { ReservationModule } from './reservation/reservation.module';
import { ResourceModule } from './resource/resource.module';
import { UserModule } from './users/user.module';
import { AdminModule } from './admin/admin.module';

@Module({
  imports: [
    // 1. CONFIGURATION GLOBALE D'ABORD : Lit le .env et expose ConfigService
    ConfigModule.forRoot({
      isGlobal: true, // Rend le ConfigService disponible partout
      envFilePath: '.env', // Spécifie le fichier (par défaut, mais bonne pratique)
    }),
    PrismaModule,
    AuthModule,
    ResourceModule,
    ReservationModule,
    MailModule,
    UserModule,
    DashboardModule,
    AdminModule
  ],

  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
