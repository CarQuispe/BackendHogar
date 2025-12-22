// src/modules/users/entities/user.entity.ts
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

export enum UserRole {
  DIRECTORA = 'DIRECTORA',
  PSICOLOGA = 'PSICOLOGA',
  TRABAJADORA_SOCIAL = 'TRABAJADORA_SOCIAL',
  ADMIN = 'ADMIN',
  VOLUNTARIO = 'VOLUNTARIO',
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  id: string;

  // ✅ CAMBIO CLAVE AQUÍ
  @Column({ type: 'varchar', length: 100, nullable: true })
  @ApiProperty({ example: 'María González', required: false })
  name: string | null;

  @Column({ type: 'varchar', length: 100, unique: true })
  @ApiProperty({ example: 'maria@residencias.com' })
  email: string;

  @Column({ type: 'varchar', length: 255 })
  password: string;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.VOLUNTARIO,
  })
  @ApiProperty({ enum: UserRole, example: UserRole.DIRECTORA })
  role: UserRole;

  @Column({ type: 'varchar', length: 20, nullable: true })
  @ApiProperty({ example: '+56 9 1234 5678', required: false })
  phone?: string;

  @Column({ type: 'boolean', default: true, name: 'is_active' })
  @ApiProperty({ example: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at' })
  @ApiProperty()
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  @ApiProperty()
  updatedAt: Date;

  @Column({ type: 'timestamp', nullable: true, name: 'last_login' })
  lastLogin: Date;

  // Excluir la contraseña en las respuestas
  toJSON() {
    const { password, ...userWithoutPassword } = this;
    return userWithoutPassword;
  }
}
