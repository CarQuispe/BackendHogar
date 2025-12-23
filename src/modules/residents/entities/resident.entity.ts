// src/modules/residents/entities/resident.entity.ts
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { User } from '../../users/entities/user.entity';
import { Sede } from '../../sedes/entities/sede.entity'; // CORREGIDO: Importar Sede

export enum ResidentEstado {
  ACTIVO = 'ACTIVO',
  INACTIVO = 'INACTIVO',
  EGRESADO = 'EGRESADO',
  TRANSFERIDO = 'TRANSFERIDO',
}

export enum ResidentGenero {
  MASCULINO = 'MASCULINO',
  FEMENINO = 'FEMENINO',
  OTRO = 'OTRO',
  NO_ESPECIFICA = 'NO_ESPECIFICA',
}

@Entity('residentes') // Nombre de la tabla en PostgreSQL
export class Resident {
  @PrimaryGeneratedColumn('uuid')
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  id: string;

  @Column({ name: 'rut', type: 'varchar', length: 12, unique: true })
  @ApiProperty({ example: '12.345.678-9' })
  rut: string;

  @Column({ name: 'nombres', type: 'varchar', length: 100 })
  @ApiProperty({ example: 'Juan Carlos' })
  nombres: string;

  @Column({ name: 'apellido_paterno', type: 'varchar', length: 100 })
  @ApiProperty({ example: 'González' })
  apellidoPaterno: string;

  @Column({ name: 'apellido_materno', type: 'varchar', length: 100, nullable: true })
  @ApiPropertyOptional({ example: 'Pérez' })
  apellidoMaterno?: string;

  @Column({ name: 'fecha_nacimiento', type: 'date' })
  @ApiProperty({ example: '1990-05-15' })
  fechaNacimiento: Date;

  @Column({ 
    name: 'genero', 
    type: 'varchar', 
    length: 20,
    nullable: true 
  })
  @ApiPropertyOptional({ enum: ResidentGenero, example: ResidentGenero.MASCULINO })
  genero?: ResidentGenero;

  @Column({ name: 'nacionalidad', type: 'varchar', length: 100, default: 'Chilena' })
  @ApiPropertyOptional({ example: 'Chilena' })
  nacionalidad: string;

  @Column({ name: 'estado_civil', type: 'varchar', length: 50, nullable: true })
  @ApiPropertyOptional({ example: 'Soltero/a' })
  estadoCivil?: string;

  @Column({ name: 'telefono', type: 'varchar', length: 20, nullable: true })
  @ApiPropertyOptional({ example: '+56 9 1234 5678' })
  telefono?: string;

  @Column({ name: 'email', type: 'varchar', length: 255, nullable: true })
  @ApiPropertyOptional({ example: 'juan@email.com' })
  email?: string;

  @Column({ name: 'fecha_ingreso', type: 'date' })
  @ApiProperty({ example: '2024-01-15' })
  fechaIngreso: Date;

  @Column({ name: 'motivo_ingreso', type: 'text' })
  @ApiProperty({ example: 'Protección del SENAME' })
  motivoIngreso: string;

  @Column({ name: 'procedencia', type: 'varchar', length: 200, nullable: true })
  @ApiPropertyOptional({ example: 'Santiago Centro' })
  procedencia?: string;

  @Column({ name: 'situación_legal', type: 'varchar', length: 100, nullable: true })
  @ApiPropertyOptional({ example: 'Medida de protección' })
  situacionLegal?: string;

  @Column({ name: 'grupo_sanguineo', type: 'varchar', length: 5, nullable: true })
  @ApiPropertyOptional({ example: 'O+' })
  grupoSanguineo?: string;

  @Column({ name: 'alergias', type: 'text', nullable: true })
  @ApiPropertyOptional({ example: 'Penicilina, polvo' })
  alergias?: string;

  @Column({ name: 'medicamentos', type: 'text', nullable: true })
  @ApiPropertyOptional({ example: 'Metformina 500mg cada 12 horas' })
  medicamentos?: string;

  @Column({ name: 'observaciones_salud', type: 'text', nullable: true })
  @ApiPropertyOptional({ example: 'Control mensual con psicólogo' })
  observacionesSalud?: string;

  @Column({ name: 'nivel_educacional', type: 'varchar', length: 50, nullable: true })
  @ApiPropertyOptional({ example: 'Educación Media Completa' })
  nivelEducacional?: string;

  @Column({ name: 'ocupacion_actual', type: 'varchar', length: 100, nullable: true })
  @ApiPropertyOptional({ example: 'Estudiante' })
  ocupacionActual?: string;

  @Column({ name: 'actividad_diaria', type: 'text', nullable: true })
  @ApiPropertyOptional({ example: 'Taller de manualidades, deporte' })
  actividadDiaria?: string;

  @Column({ 
    name: 'estado', 
    type: 'varchar', 
    length: 50,
    default: ResidentEstado.ACTIVO 
  })
  @ApiProperty({ enum: ResidentEstado, example: ResidentEstado.ACTIVO })
  estado: ResidentEstado;

  @Column({ name: 'fecha_egreso', type: 'date', nullable: true })
  @ApiPropertyOptional({ example: '2024-12-31' })
  fechaEgreso?: Date;

  @Column({ name: 'motivo_egreso', type: 'text', nullable: true })
  @ApiPropertyOptional({ example: 'Mayoría de edad' })
  motivoEgreso?: string;

  // Relaciones - CORREGIDO: Usar Sede en lugar de Residence
  @ManyToOne(() => Sede, { nullable: true })
  @JoinColumn({ name: 'sede_id' })
  @ApiPropertyOptional({ type: () => Sede })
  sede?: Sede;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'responsable_id' })
  @ApiPropertyOptional({ type: () => User })
  responsable?: User;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'created_by' })
  @ApiProperty({ type: () => User })
  creadoPor: User;

  @CreateDateColumn({ name: 'created_at' })
  @ApiProperty()
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  @ApiProperty()
  updatedAt: Date;

  // Campo virtual para nombre completo
  get nombreCompleto(): string {
    return `${this.nombres} ${this.apellidoPaterno} ${this.apellidoMaterno || ''}`.trim();
  }

  // Campo virtual para edad
  get edad(): number {
    const hoy = new Date();
    const nacimiento = new Date(this.fechaNacimiento);
    let edad = hoy.getFullYear() - nacimiento.getFullYear();
    const mes = hoy.getMonth() - nacimiento.getMonth();
    if (mes < 0 || (mes === 0 && hoy.getDate() < nacimiento.getDate())) {
      edad--;
    }
    return edad;
  }
}