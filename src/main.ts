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
   * CORS CONFIG (FIX DEFINITIVO)
   * ===============================
   */
  const corsOrigins =
    configService.get<string>('CORS_ORIGINS')?.split(',') ?? [];

  app.enableCors({
    origin: (origin, callback) => {
      // Permitir llamadas sin origin (Postman, curl, health checks)
      if (!origin) {
        return callback(null, true);
      }

      if (corsOrigins.includes(origin)) {
        return callback(null, true);
      }

      console.error('❌ CORS bloqueado para:', origin);
      return callback(null, false); // ⬅️ IMPORTANTE (NO lanzar error)
    },
    credentials: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders: 'Content-Type, Authorization',
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

  console.log(` Backend corriendo en puerto ${port}`);
  console.log(` CORS habilitado para:`, corsOrigins);
}

bootstrap();
