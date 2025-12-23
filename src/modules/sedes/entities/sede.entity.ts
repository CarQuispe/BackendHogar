// src/modules/sedes/entities/sede.entity.ts
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { User } from '../../users/entities/user.entity';
import { Resident } from '../../residents/entities/resident.entity';

export enum TipoSede {
  CASA_ACOGIDA = 'CASA_ACOGIDA',
  CENTRO_DIA = 'CENTRO_DIA',
  RESIDENCIA = 'RESIDENCIA',
  OTRO = 'OTRO',
}

@Entity('sedes')
export class Sede {
  @PrimaryGeneratedColumn('uuid')
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  id: string;

  @Column({ type: 'varchar', length: 200 })
  @ApiProperty({ example: 'Residencia Santa María' })
  nombre: string;

  @Column({
    type: 'varchar',
    length: 50,
    enum: TipoSede,
    default: TipoSede.RESIDENCIA,
  })
  @ApiProperty({ enum: TipoSede, example: TipoSede.RESIDENCIA })
  tipo: TipoSede;

  @Column({ type: 'text' })
  @ApiProperty({ example: 'Av. Principal 123, Santiago' })
  direccion: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  @ApiPropertyOptional({ example: 'Santiago' })
  comuna: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  @ApiPropertyOptional({ example: 'Metropolitana' })
  region: string | null;

  @Column({ type: 'varchar', length: 20, nullable: true })
  @ApiPropertyOptional({ example: '+56 2 1234 5678' })
  telefono: string | null;

  @Column({ name: 'capacidad_maxima', type: 'int', default: 20 })
  @ApiProperty({ example: 20 })
  capacidadMaxima: number;

  @Column({ name: 'capacidad_actual', type: 'int', default: 0 })
  @ApiProperty({ example: 5 })
  capacidadActual: number;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  @ApiProperty({ example: true })
  isActive: boolean;

  // Relaciones
  @OneToMany(() => User, (user) => user.sede)
  @ApiPropertyOptional({ type: () => [User] })
  usuarios: User[];

  @OneToMany(() => Resident, (resident) => resident.sede)
  @ApiPropertyOptional({ type: () => [Resident] })
  residentes: Resident[];

  @CreateDateColumn({ name: 'created_at' })
  @ApiProperty()
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  @ApiProperty()
  updatedAt: Date;

  // Campos virtuales calculados
  get lugaresDisponibles(): number {
    return this.capacidadMaxima - this.capacidadActual;
  }

  get porcentajeOcupacion(): number {
    if (this.capacidadMaxima === 0) return 0;
    return Math.round((this.capacidadActual / this.capacidadMaxima) * 100);
  }

  get direccionCompleta(): string {
    let direccion = this.direccion;
    if (this.comuna) direccion += `, ${this.comuna}`;
    if (this.region) direccion += `, ${this.region}`;
    return direccion;
  }

  // Métodos
  puedeAgregarResidente(): boolean {
    return this.lugaresDisponibles > 0 && this.isActive;
  }

  incrementarCapacidad(): void {
    if (this.capacidadActual < this.capacidadMaxima) {
      this.capacidadActual += 1;
    }
  }

  decrementarCapacidad(): void {
    if (this.capacidadActual > 0) {
      this.capacidadActual -= 1;
    }
  }
}