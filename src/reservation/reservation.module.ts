import { Module } from '@nestjs/common';
import { MailModule } from 'src/mail/mail.module';
import { PrismaModule } from 'src/prisma/prisma.module';
import { ReservationController } from './reservation.controller';
import { ReservationService } from './reservation.service';

@Module({
  imports: [PrismaModule, MailModule],
  providers: [ReservationService],
  controllers: [ReservationController],
})
export class ReservationModule {}
