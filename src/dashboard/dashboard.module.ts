import { Module } from '@nestjs/common';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { PrismaModule } from 'src/prisma/prisma.module'; // Assurez-vous que le module Prisma est accessible

@Module({
  imports: [PrismaModule], // Le service Dashboard a besoin de PrismaService
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
