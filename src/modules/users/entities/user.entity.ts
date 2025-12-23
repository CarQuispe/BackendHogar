// src/modules/users/entities/user.entity.ts
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Sede } from '../../sedes/entities/sede.entity'; // CORREGIDO: Importar Sede
import { Resident } from '../../residents/entities/resident.entity'; // CORREGIDA LA RUTA

export enum UserRole {
  DIRECTORA = 'DIRECTORA',
  PSICOLOGA = 'PSICOLOGA',
  TRABAJADORA_SOCIAL = 'TRABAJADORA_SOCIAL',
  ADMIN = 'ADMIN',
  VOLUNTARIO = 'VOLUNTARIO',
}

@Entity('users') // Verificar si tu tabla se llama 'users' o 'usuarios'
export class User {
  @PrimaryGeneratedColumn('uuid')
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  id: string;

  @Column({ name: 'nombre', type: 'varchar', length: 100 })
  @ApiProperty({ example: 'María' })
  nombre: string;

  @Column({ name: 'apellido', type: 'varchar', length: 100 })
  @ApiProperty({ example: 'González' })
  apellido: string;

  @Column({ name: 'email', type: 'varchar', length: 255, unique: true })
  @ApiProperty({ example: 'maria@residencias.com' })
  email: string;

  @Column({ name: 'password_hash', type: 'varchar', length: 255 })
  password: string;

  @Column({ name: 'rut', type: 'varchar', length: 12, unique: true, nullable: true })
  @ApiPropertyOptional({ example: '12.345.678-9' })
  rut: string | null;

  @Column({ name: 'telefono', type: 'varchar', length: 20, nullable: true })
  @ApiPropertyOptional({ example: '+56 9 1234 5678' })
  telefono: string | null;

  @Column({ name: 'rol', type: 'varchar', length: 50 })
  @ApiProperty({ enum: UserRole, example: UserRole.DIRECTORA })
  role: UserRole;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  @ApiProperty({ example: true })
  isActive: boolean;

  // CORRECCIÓN: Usar Sede en lugar de Residence
  @ManyToOne(() => Sede, { nullable: true })
  @JoinColumn({ name: 'sede_id' })
  @ApiPropertyOptional({ type: () => Sede })
  sede: Sede | null;

  // Relación con Residentes creados por este usuario
  @OneToMany(() => Resident, (resident) => resident.creadoPor)
  residentesCreados: Resident[];

  // Relación con Residentes donde este usuario es responsable
  @OneToMany(() => Resident, (resident) => resident.responsable)
  residentesResponsables: Resident[];

  @CreateDateColumn({ name: 'created_at' })
  @ApiProperty()
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  @ApiProperty()
  updatedAt: Date;

  @Column({ name: 'last_login', type: 'timestamp', nullable: true })
  @ApiPropertyOptional()
  lastLogin: Date | null;

  // Campo virtual para nombre completo
  get nombreCompleto(): string {
    return `${this.nombre} ${this.apellido}`.trim();
  }

  // Campos virtuales para estadísticas
  get cantidadResidentesCreados(): number {
    return this.residentesCreados?.length || 0;
  }

  get cantidadResidentesResponsables(): number {
    return this.residentesResponsables?.length || 0;
  }

  // Excluir la contraseña en las respuestas
  toJSON() {
    const { password, ...userWithoutPassword } = this;
    return userWithoutPassword;
  }
}
