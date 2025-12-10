import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  // Configuración CORS para React
  app.enableCors({
    origin: configService.get('CORS_ORIGINS').split(','),
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  // Prefijo global
  app.setGlobalPrefix(configService.get('API_PREFIX') || 'api');

  // Validación global
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Swagger Documentación
  const config = new DocumentBuilder()
    .setTitle('Sistema de Gestión de Residentes API')
    .setDescription('API para el sistema de gestión de residencias')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  // Iniciar servidor
  const port = configService.get('PORT') || 3000;
  await app.listen(port);
  console.log(`🚀 Aplicación corriendo en: http://localhost:${port}`);
  console.log(`📚 Documentación Swagger en: http://localhost:${port}/api/docs`);
}
bootstrap();
