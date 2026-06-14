
import { ValidationPipe, Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use(cookieParser());
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: false,
    }),
  );

  const config = app.get(ConfigService);
  const port = Number(config.get('port') ?? 3000);

  const configDocument = new DocumentBuilder()
    .setTitle('IAM Service')
    .setDescription('Authentication and authorization API for the IAM service')
    .setVersion('0.1')
    .build();

  const document = SwaggerModule.createDocument(app, configDocument);
  SwaggerModule.setup('api', app, document);

  await app.listen(port);
  Logger.log(`Application is running on: http://localhost:${port}`);
}

bootstrap();
