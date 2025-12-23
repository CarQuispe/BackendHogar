// src/modules/sedes/sedes.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SedesService } from './services/sedes.service';
import { SedesController } from './controllers/sedes.controller';
import { Sede } from './entities/sede.entity';
import { User } from '../users/entities/user.entity';
import { Resident } from '../residents/entities/resident.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Sede, User, Resident])
  ],
  controllers: [SedesController],
  providers: [SedesService],
  exports: [SedesService]
})
export class SedesModule {}