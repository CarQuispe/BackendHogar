// src/modules/sedes/dto/create-sede.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { 
  IsString, 
  IsNotEmpty, 
  IsOptional, 
  IsEnum, 
  IsInt, 
  Min, 
  Max,
  IsPhoneNumber,
  IsBoolean 
} from 'class-validator';
import { TipoSede } from '../entities/sede.entity';

export class CreateSedeDto {
  @ApiProperty({ example: 'Residencia Santa María' })
  @IsNotEmpty()
  @IsString()
  nombre: string;

  @ApiProperty({ enum: TipoSede, example: TipoSede.RESIDENCIA })
  @IsNotEmpty()
  @IsEnum(TipoSede)
  tipo: TipoSede;

  @ApiProperty({ example: 'Av. Principal 123, Santiago' })
  @IsNotEmpty()
  @IsString()
  direccion: string;

  @ApiPropertyOptional({ example: 'Santiago' })
  @IsOptional()
  @IsString()
  comuna?: string;

  @ApiPropertyOptional({ example: 'Metropolitana' })
  @IsOptional()
  @IsString()
  region?: string;

  @ApiPropertyOptional({ example: '+56 2 1234 5678' })
  @IsOptional()
  @IsString()
  @IsPhoneNumber('CL') // Validación para Chile
  telefono?: string;

  @ApiProperty({ example: 20, minimum: 1, maximum: 500 })
  @IsInt()
  @Min(1)
  @Max(500)
  capacidadMaxima: number;

  @ApiPropertyOptional({ example: 0, minimum: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  capacidadActual?: number = 0;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean = true;
}