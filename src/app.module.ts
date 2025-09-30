import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { ResourceService } from './resource/resource.service';
import { ResourceController } from './resource/resource.controller';
import { ResourceModule } from './resource/resource.module';

@Module({
  imports: [PrismaModule, AuthModule, ResourceModule],
  controllers: [AppController, ResourceController],
  providers: [AppService, ResourceService],
})
export class AppModule {}
