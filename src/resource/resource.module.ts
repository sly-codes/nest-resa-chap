import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { PrismaModule } from 'src/prisma/prisma.module';
import { ResourceController } from './resource.controller';
import { ResourceService } from './resource.service';
import { CloudinaryModule } from 'src/cloudinary/cloudinary.module';

@Module({
  imports: [
    PrismaModule,
    CloudinaryModule,
    MulterModule.register({
      // Vous pouvez mettre la configuration de Multer ici ou la laisser dans le contrôleur
    }),
  ],
  controllers: [ResourceController],
  providers: [ResourceService],
})
export class ResourceModule {}
