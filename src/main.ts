// apps/backend/src/main.ts
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  /**
   * ===============================
   * CORS CONFIG (RENDER + REACT SAFE)
   * ===============================
   */
  const corsOrigins =
    configService.get<string>('CORS_ORIGINS')?.split(',') || [];

  app.enableCors({
    origin: (origin, callback) => {
      if (!origin || corsOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`CORS bloqueado: ${origin}`));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  });

  /**
   * ===============================
   * GLOBAL PREFIX
   * ===============================
   */
  app.setGlobalPrefix(configService.get('API_PREFIX') || 'api');

  /**
   * ===============================
   * VALIDATION
   * ===============================
   */
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  /**
   * ===============================
   * SWAGGER
   * ===============================
   */
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Sistema de Gestión de Residentes API')
    .setDescription('API para el sistema del Hogar de Niños')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document);

  /**
   * ===============================
   * START SERVER
   * ===============================
   */
  const port = configService.get<number>('PORT') || 3000;
  await app.listen(port);

  console.log(`🚀 Backend corriendo en puerto ${port}`);
  console.log(`🌍 CORS habilitado para: ${corsOrigins.join(', ')}`);
}

bootstrap();
