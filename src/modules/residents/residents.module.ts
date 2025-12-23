// src/modules/residents/residents.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ResidentsService } from '../users/services/residents.service';
import { ResidentsController } from './controllers/residents.controllers';
import { Resident } from './entities/resident.entity';
import { User } from '../users/entities/user.entity';
import { Sede } from '../sedes/entities/sede.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Resident, User, Sede])
  ],
  controllers: [ResidentsController],
  providers: [ResidentsService],
  exports: [ResidentsService]
})
export class ResidentsModule {}