import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // CORS
  app.enableCors({
    origin: ['http://localhost:4200', 'https://ng-resa-chap.vercel.app'],
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
  });
}
bootstrap();
