import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { join } from 'path';
import { NestExpressApplication } from '@nestjs/platform-express';

// 💡 Fonction utilitaire pour formater l'utilisation de la mémoire
function formatMemoryUsage(data: NodeJS.MemoryUsage) {
  const format = (bytes: number) => (bytes / 1024 / 1024).toFixed(2) + ' MB';

  return `
    RSS (Total alloué): ${format(data.rss)}
    HEAP TOTAL (Taille de la pile): ${format(data.heapTotal)}
    HEAP UTILISÉ (Utilisé par JS): ${format(data.heapUsed)}
  `;
}

async function bootstrap() {
  // const app = await NestFactory.create(AppModule);
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // CORS
  app.enableCors({
    origin: ['http://localhost:4200', 'https://resachap.sly.codes'],
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
    credentials: true, // important pour les cookies ou headers auth
    preflightContinue: false,
    optionsSuccessStatus: 204,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const config = new DocumentBuilder()
    .setTitle('Resa Chap API')
    .setVersion('1.0')
    .build();
  const documentFactory = () => SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, documentFactory);

  // 💡 Injecter le ConfigService depuis l'application
  const configService = app.get(ConfigService);


  // 🚨 POINT CRITIQUE : Utiliser la variable d'environnement 'PORT'
  // Si Render ne fournit pas de PORT, utiliser un port par défaut (ex: 3000)
  const port = configService.get('PORT') || 3000;

  await app.listen(port, () => {
    console.log(`Application démarrée SUR http://localhost:${port}`);

    // 🚨 JOURNALISATION DE LA MÉMOIRE 🚨
    console.log('--- Utilisation de la mémoire après démarrage ---');
    console.log(formatMemoryUsage(process.memoryUsage()));
    console.log('---------------------------------------------');
  });
}
bootstrap();
