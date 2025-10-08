import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    // Autoriser uniquement le port de développement d'Angular
    origin: 'https://ng-resa-chap.vercel.app',
    // Autoriser toutes les méthodes (GET, POST, PATCH, DELETE, etc.)
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    // Autoriser les headers nécessaires (Content-Type, Authorization, etc.)
    allowedHeaders: 'Content-Type, Accept, Authorization',
    // Permet aux cookies et autres identifiants d'être envoyés (important pour les futurs tokens)
    credentials: true,
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

  await app.listen(process.env.PORT ?? 3000);

  console.log(`Application is running on: ${await app.getUrl()}`);
  console.log(`Swagger api docs: ${await app.getUrl()}/api/docs`);
}
bootstrap();
