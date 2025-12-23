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
   * CONFIGURACIÓN CORS (SAFE)
   * ===============================
   */
  const corsOrigins =
    configService.get<string>('CORS_ORIGINS')?.split(',') ?? ['*'];

  app.enableCors({
    origin: corsOrigins,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  /**
   * ===============================
   * PREFIJO GLOBAL API
   * ===============================
   */
  app.setGlobalPrefix(configService.get('API_PREFIX') || 'api');

  /**
   * ===============================
   * VALIDACIÓN GLOBAL
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
   * SWAGGER DOCUMENTATION
   * ===============================
   */
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Sistema de Gestión de Residentes API')
    .setDescription('API para el sistema de gestión del Hogar de Niños')
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
  console.log(`📚 Swagger: /api/docs`);
}

bootstrap();
