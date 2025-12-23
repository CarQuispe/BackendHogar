// src/modules/residents/dto/create-resident.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { 
  IsString, 
  IsNotEmpty, 
  IsOptional, 
  IsDateString, 
  IsEmail, 
  IsEnum,
  IsUUID 
} from 'class-validator';
import { Type } from 'class-transformer';
import { ResidentEstado, ResidentGenero } from '../entities/resident.entity';

export class CreateResidentDto {
  @ApiProperty({ example: '12.345.678-9' })
  @IsNotEmpty()
  @IsString()
  rut: string;

  @ApiProperty({ example: 'Juan Carlos' })
  @IsNotEmpty()
  @IsString()
  nombres: string;

  @ApiProperty({ example: 'González' })
  @IsNotEmpty()
  @IsString()
  apellidoPaterno: string;

  @ApiPropertyOptional({ example: 'Pérez' })
  @IsOptional()
  @IsString()
  apellidoMaterno?: string;

  @ApiProperty({ example: '1990-05-15' })
  @IsNotEmpty()
  @IsDateString()
  fechaNacimiento: Date;

  @ApiPropertyOptional({ enum: ResidentGenero, example: ResidentGenero.MASCULINO })
  @IsOptional()
  @IsEnum(ResidentGenero)
  genero?: ResidentGenero;

  @ApiPropertyOptional({ example: 'Chilena' })
  @IsOptional()
  @IsString()
  nacionalidad?: string;

  @ApiPropertyOptional({ example: 'Soltero/a' })
  @IsOptional()
  @IsString()
  estadoCivil?: string;

  @ApiPropertyOptional({ example: '+56 9 1234 5678' })
  @IsOptional()
  @IsString()
  telefono?: string;

  @ApiPropertyOptional({ example: 'juan@email.com' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({ example: '2024-01-15' })
  @IsNotEmpty()
  @IsDateString()
  fechaIngreso: Date;

  @ApiProperty({ example: 'Protección del SENAME' })
  @IsNotEmpty()
  @IsString()
  motivoIngreso: string;

  @ApiPropertyOptional({ example: 'Santiago Centro' })
  @IsOptional()
  @IsString()
  procedencia?: string;

  @ApiPropertyOptional({ example: 'Medida de protección' })
  @IsOptional()
  @IsString()
  situacionLegal?: string;

  @ApiPropertyOptional({ example: 'O+' })
  @IsOptional()
  @IsString()
  grupoSanguineo?: string;

  @ApiPropertyOptional({ example: 'Penicilina, polvo' })
  @IsOptional()
  @IsString()
  alergias?: string;

  @ApiPropertyOptional({ example: 'Metformina 500mg cada 12 horas' })
  @IsOptional()
  @IsString()
  medicamentos?: string;

  @ApiPropertyOptional({ example: 'Control mensual con psicólogo' })
  @IsOptional()
  @IsString()
  observacionesSalud?: string;

  @ApiPropertyOptional({ example: 'Educación Media Completa' })
  @IsOptional()
  @IsString()
  nivelEducacional?: string;

  @ApiPropertyOptional({ example: 'Estudiante' })
  @IsOptional()
  @IsString()
  ocupacionActual?: string;

  @ApiPropertyOptional({ example: 'Taller de manualidades, deporte' })
  @IsOptional()
  @IsString()
  actividadDiaria?: string;

  @ApiProperty({ enum: ResidentEstado, example: ResidentEstado.ACTIVO })
  @IsEnum(ResidentEstado)
  estado: ResidentEstado = ResidentEstado.ACTIVO;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  sedeId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  responsableId?: string;

  // Este campo se establecerá automáticamente desde el token JWT
  @IsOptional()
  @IsUUID()
  createdById?: string;
}