// src/modules/users/dto/create-user.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';
import { UserRole } from '../entities/user.entity';

export class CreateUserDto {
  @ApiProperty({ example: 'María' })
  @IsNotEmpty()
  @IsString()
  nombre: string;

  @ApiProperty({ example: 'González' })
  @IsNotEmpty()
  @IsString()
  apellido: string;

  @ApiProperty({ example: 'maria@residencias.com' })
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'password123' })
  @IsNotEmpty()
  @MinLength(8)
  password: string;

  @ApiProperty({ example: '12.345.678-9', required: false })
  @IsOptional()
  @IsString()
  rut?: string;

  @ApiProperty({ example: '+56 9 1234 5678', required: false })
  @IsOptional()
  @IsString()
  telefono?: string;

  @ApiProperty({ enum: UserRole })
  @IsEnum(UserRole)
  role: UserRole;
}