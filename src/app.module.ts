import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { ResourceModule } from './resource/resource.module';
import { ReservationModule } from './reservation/reservation.module';

@Module({
  // Tous les modules fonctionnels sont importés ici.
  // NestJS lit les Controllers de ces modules et les ajoute automatiquement.
  imports: [PrismaModule, AuthModule, ResourceModule, ReservationModule],

  // Seul l'AppController (racine de l'API) reste généralement ici
  controllers: [AppController],

  // Seul l'AppService reste ici
  providers: [AppService],
})
export class AppModule {}
