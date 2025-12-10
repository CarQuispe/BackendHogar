import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { join } from 'path';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        // Para Neon.tech
        const databaseUrl = configService.get<string>('DATABASE_URL');
        
        if (databaseUrl) {
          // Usar la URL completa de Neon
          return {
            type: 'postgres',
            url: databaseUrl,
            synchronize: configService.get<string>('NODE_ENV') === 'development',
            logging: configService.get<string>('NODE_ENV') === 'development',
            entities: [join(__dirname, '..', '**', '*.entity{.ts,.js}')],
            migrations: [join(__dirname, '..', 'database', 'migrations', '*.{ts,js}')],
            ssl: {
              rejectUnauthorized: false
            },
            extra: {
              max: 20, // Pool de conexiones
            }
          };
        }
        
        // Configuración local (fallback)
        return {
          type: 'postgres',
          host: configService.get<string>('DB_HOST', 'localhost'),
          port: configService.get<number>('DB_PORT', 5432),
          username: configService.get<string>('DB_USERNAME', 'postgres'),
          password: configService.get<string>('DB_PASSWORD', 'postgres'),
          database: configService.get<string>('DB_NAME', 'residencias_db'),
          synchronize: configService.get<string>('NODE_ENV') === 'development',
          logging: configService.get<string>('NODE_ENV') === 'development',
          entities: [join(__dirname, '..', '**', '*.entity{.ts,.js}')],
          migrations: [join(__dirname, '..', 'database', 'migrations', '*.{ts,js}')],
        };
      },
    }),
  ],
  exports: [TypeOrmModule],
})
export class DatabaseModule {}