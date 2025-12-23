// src/modules/residents/dto/update-resident.dto.ts
import { PartialType } from '@nestjs/swagger';
import { CreateResidentDto } from './create-residents';

export class UpdateResidentDto extends PartialType(CreateResidentDto) {
  // Campos específicos para actualización si es necesario
}