// src/modules/residents/services/residents.service.ts
import { 
  Injectable, 
  NotFoundException, 
  ConflictException,
  BadRequestException,
  Logger 
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, IsNull } from 'typeorm';
import { Resident } from 'src/modules/residents/entities/resident.entity';
import { ResidentEstado } from 'src/modules/residents/entities/resident.entity';
import { CreateResidentDto } from 'src/modules/residents/dto/create-residents';
import { UpdateResidentDto } from 'src/modules/residents/dto/update-residents';
import { User } from '../../users/entities/user.entity';
import { Sede } from '../../sedes/entities/sede.entity';

@Injectable()
export class ResidentsService {
  private readonly logger = new Logger(ResidentsService.name);

  constructor(
    @InjectRepository(Resident)
    private residentsRepository: Repository<Resident>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(Sede)
    private sedesRepository: Repository<Sede>,
  ) {}

  /**
   * Crear un nuevo residente
   */
  async create(createResidentDto: CreateResidentDto): Promise<Resident> {
    try {
      // Validar formato de RUT chileno
      this.validateRut(createResidentDto.rut);

      // Verificar si el RUT ya existe
      const existingResident = await this.residentsRepository.findOne({
        where: { rut: createResidentDto.rut }
      });
      
      if (existingResident) {
        throw new ConflictException('El RUT ya está registrado en el sistema');
      }

      // Convertir fechas del DTO
      const fechaNacimiento = new Date(createResidentDto.fechaNacimiento);
      const fechaIngreso = new Date(createResidentDto.fechaIngreso);
      const hoy = new Date();
      
      // Validar fechas
      if (fechaNacimiento > hoy) {
        throw new BadRequestException('La fecha de nacimiento no puede ser futura');
      }

      if (fechaIngreso > hoy) {
        throw new BadRequestException('La fecha de ingreso no puede ser futura');
      }

      if (fechaIngreso < fechaNacimiento) {
        throw new BadRequestException('La fecha de ingreso no puede ser anterior a la fecha de nacimiento');
      }

      // Preparar datos para crear residente
      const residentData: Partial<Resident> = {
        rut: createResidentDto.rut,
        nombres: createResidentDto.nombres,
        apellidoPaterno: createResidentDto.apellidoPaterno,
        apellidoMaterno: createResidentDto.apellidoMaterno,
        fechaNacimiento,
        genero: createResidentDto.genero,
        nacionalidad: createResidentDto.nacionalidad || 'Chilena',
        estadoCivil: createResidentDto.estadoCivil,
        telefono: createResidentDto.telefono,
        email: createResidentDto.email,
        fechaIngreso,
        motivoIngreso: createResidentDto.motivoIngreso,
        procedencia: createResidentDto.procedencia,
        situacionLegal: createResidentDto.situacionLegal,
        grupoSanguineo: createResidentDto.grupoSanguineo,
        alergias: createResidentDto.alergias,
        medicamentos: createResidentDto.medicamentos,
        observacionesSalud: createResidentDto.observacionesSalud,
        nivelEducacional: createResidentDto.nivelEducacional,
        ocupacionActual: createResidentDto.ocupacionActual,
        actividadDiaria: createResidentDto.actividadDiaria,
        estado: createResidentDto.estado || ResidentEstado.ACTIVO,
      };

      // Asignar sede si existe
      if (createResidentDto.sedeId) {
        const sede = await this.sedesRepository.findOne({
          where: { id: createResidentDto.sedeId }
        });
        if (!sede) {
          throw new NotFoundException('Sede no encontrada');
        }
        
        // Verificar si la sede tiene capacidad
        if (sede.capacidadActual >= sede.capacidadMaxima) {
          throw new BadRequestException('La sede ha alcanzado su capacidad máxima');
        }
        
        residentData.sede = sede;
        
        // Incrementar capacidad de la sede
        sede.capacidadActual += 1;
        await this.sedesRepository.save(sede);
      }

      // Asignar responsable si existe
      if (createResidentDto.responsableId) {
        const responsable = await this.usersRepository.findOne({
          where: { id: createResidentDto.responsableId, isActive: true }
        });
        if (!responsable) {
          throw new NotFoundException('Responsable no encontrado o inactivo');
        }
        residentData.responsable = responsable;
      }

      // Asignar usuario creador
      if (createResidentDto.createdById) {
        const creador = await this.usersRepository.findOne({
          where: { id: createResidentDto.createdById }
        });
        if (!creador) {
          throw new NotFoundException('Usuario creador no encontrado');
        }
        residentData.creadoPor = creador;
      }

      const resident = this.residentsRepository.create(residentData);
      const savedResident = await this.residentsRepository.save(resident);
      
      this.logger.log(`Residente creado: ${savedResident.nombres} ${savedResident.apellidoPaterno} (ID: ${savedResident.id})`);
      return savedResident;

    } catch (error) {
      this.logger.error(`Error al crear residente: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Obtener todos los residentes con filtros opcionales
   */
  async findAll(filters?: {
    estado?: ResidentEstado;
    sedeId?: string;
    search?: string;
    fechaDesde?: Date;
    fechaHasta?: Date;
  }): Promise<Resident[]> {
    try {
      const queryBuilder = this.residentsRepository
        .createQueryBuilder('resident')
        .leftJoinAndSelect('resident.sede', 'sede')
        .leftJoinAndSelect('resident.responsable', 'responsable')
        .leftJoinAndSelect('resident.creadoPor', 'creadoPor')
        .orderBy('resident.nombres', 'ASC');

      // Aplicar filtros
      if (filters?.estado) {
        queryBuilder.andWhere('resident.estado = :estado', { estado: filters.estado });
      }

      if (filters?.sedeId) {
        queryBuilder.andWhere('sede.id = :sedeId', { sedeId: filters.sedeId });
      }

      if (filters?.search) {
        queryBuilder.andWhere(
          '(resident.nombres ILIKE :search OR resident.apellidoPaterno ILIKE :search OR resident.rut ILIKE :search)',
          { search: `%${filters.search}%` }
        );
      }

      if (filters?.fechaDesde) {
        queryBuilder.andWhere('resident.fechaIngreso >= :fechaDesde', { 
          fechaDesde: filters.fechaDesde 
        });
      }

      if (filters?.fechaHasta) {
        queryBuilder.andWhere('resident.fechaIngreso <= :fechaHasta', { 
          fechaHasta: filters.fechaHasta 
        });
      }

      return await queryBuilder.getMany();
    } catch (error) {
      this.logger.error(`Error al obtener residentes: ${error.message}`);
      throw error;
    }
  }

  /**
   * Obtener residentes activos
   */
  async findActive(): Promise<Resident[]> {
    return await this.findAll({ estado: ResidentEstado.ACTIVO });
  }

  /**
   * Obtener residente por ID
   */
  async findOne(id: string): Promise<Resident> {
    try {
      const resident = await this.residentsRepository.findOne({
        where: { id },
        relations: ['sede', 'responsable', 'creadoPor']
      });
      
      if (!resident) {
        throw new NotFoundException(`Residente con ID ${id} no encontrado`);
      }
      
      return resident;
    } catch (error) {
      this.logger.error(`Error al buscar residente ${id}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Obtener residente por RUT
   */
  async findByRut(rut: string): Promise<Resident> {
    try {
      const formattedRut = this.formatRut(rut);
      const resident = await this.residentsRepository.findOne({
        where: { rut: formattedRut },
        relations: ['sede', 'responsable']
      });
      
      if (!resident) {
        throw new NotFoundException(`Residente con RUT ${rut} no encontrado`);
      }
      
      return resident;
    } catch (error) {
      this.logger.error(`Error al buscar residente por RUT ${rut}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Obtener residentes por sede
   */
  async findBySede(sedeId: string): Promise<Resident[]> {
    try {
      return await this.residentsRepository.find({
        where: { sede: { id: sedeId } },
        relations: ['sede', 'responsable'],
        order: { nombres: 'ASC' }
      });
    } catch (error) {
      this.logger.error(`Error al buscar residentes por sede ${sedeId}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Actualizar residente
   */
  async update(id: string, updateResidentDto: UpdateResidentDto): Promise<Resident> {
    try {
      const resident = await this.findOne(id);
      
      // Si se actualiza el RUT, verificar que no exista
      if (updateResidentDto.rut && updateResidentDto.rut !== resident.rut) {
        this.validateRut(updateResidentDto.rut);
        
        const existingResident = await this.residentsRepository.findOne({
          where: { rut: updateResidentDto.rut }
        });
        
        if (existingResident) {
          throw new ConflictException('El RUT ya está registrado en el sistema');
        }
        resident.rut = updateResidentDto.rut;
        delete updateResidentDto.rut;
      }

      // Actualizar relaciones si se proporcionan IDs
      if (updateResidentDto.sedeId) {
        const nuevaSede = await this.sedesRepository.findOne({
          where: { id: updateResidentDto.sedeId }
        });
        if (!nuevaSede) {
          throw new NotFoundException('Sede no encontrada');
        }
        
        // Si cambia de sede, ajustar capacidades
        if (resident.sede && resident.sede.id !== updateResidentDto.sedeId) {
          // Decrementar capacidad de la sede anterior
          const sedeAnterior = resident.sede;
          sedeAnterior.capacidadActual = Math.max(0, sedeAnterior.capacidadActual - 1);
          await this.sedesRepository.save(sedeAnterior);
          
          // Verificar capacidad de la nueva sede
          if (nuevaSede.capacidadActual >= nuevaSede.capacidadMaxima) {
            throw new BadRequestException('La nueva sede ha alcanzado su capacidad máxima');
          }
          
          // Incrementar capacidad de la nueva sede
          nuevaSede.capacidadActual += 1;
          await this.sedesRepository.save(nuevaSede);
        }
        
        resident.sede = nuevaSede;
        delete updateResidentDto.sedeId;
      }

      if (updateResidentDto.responsableId) {
        const responsable = await this.usersRepository.findOne({
          where: { id: updateResidentDto.responsableId, isActive: true }
        });
        if (!responsable) {
          throw new NotFoundException('Responsable no encontrado o inactivo');
        }
        resident.responsable = responsable;
        delete updateResidentDto.responsableId;
      }

      // Validar fechas si se actualizan
      if (updateResidentDto.fechaNacimiento) {
        const fechaNacimiento = new Date(updateResidentDto.fechaNacimiento);
        if (fechaNacimiento > new Date()) {
          throw new BadRequestException('La fecha de nacimiento no puede ser futura');
        }
        resident.fechaNacimiento = fechaNacimiento;
      }

      if (updateResidentDto.fechaIngreso) {
        const fechaIngreso = new Date(updateResidentDto.fechaIngreso);
        if (fechaIngreso > new Date()) {
          throw new BadRequestException('La fecha de ingreso no puede ser futura');
        }
        
        // Validar que fecha de ingreso sea posterior o igual a fecha de nacimiento
        const fechaNacimiento = updateResidentDto.fechaNacimiento 
          ? new Date(updateResidentDto.fechaNacimiento)
          : resident.fechaNacimiento;
        
        if (fechaIngreso < fechaNacimiento) {
          throw new BadRequestException('La fecha de ingreso no puede ser anterior a la fecha de nacimiento');
        }
        
        resident.fechaIngreso = fechaIngreso;
      }

      // Actualizar otros campos del DTO
      Object.keys(updateResidentDto).forEach(key => {
        if (updateResidentDto[key] !== undefined && key !== 'createdById') {
          // Solo actualizar campos que no sean fechas (ya las manejamos arriba)
          if (!key.includes('fecha')) {
            resident[key] = updateResidentDto[key];
          }
        }
      });

      const updatedResident = await this.residentsRepository.save(resident);
      this.logger.log(`Residente actualizado: ${updatedResident.id}`);
      
      return updatedResident;
    } catch (error) {
      this.logger.error(`Error al actualizar residente ${id}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Eliminar residente
   */
  async remove(id: string): Promise<void> {
    try {
      const resident = await this.findOne(id);
      
      // Si tiene sede asignada, decrementar capacidad
      if (resident.sede) {
        const sede = resident.sede;
        sede.capacidadActual = Math.max(0, sede.capacidadActual - 1);
        await this.sedesRepository.save(sede);
      }
      
      await this.residentsRepository.remove(resident);
      this.logger.log(`Residente eliminado: ${id}`);
    } catch (error) {
      this.logger.error(`Error al eliminar residente ${id}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Marcar residente como egresado
   */
  async egresar(id: string, motivoEgreso: string, fechaEgreso?: Date): Promise<Resident> {
    try {
      const resident = await this.findOne(id);
      
      if (resident.estado === ResidentEstado.EGRESADO) {
        throw new BadRequestException('El residente ya está egresado');
      }
      
      resident.estado = ResidentEstado.EGRESADO;
      resident.motivoEgreso = motivoEgreso;
      resident.fechaEgreso = fechaEgreso || new Date();
      
      // Decrementar capacidad de la sede si está asignado
      if (resident.sede) {
        const sede = resident.sede;
        sede.capacidadActual = Math.max(0, sede.capacidadActual - 1);
        await this.sedesRepository.save(sede);
      }
      
      // Validar que la fecha de egreso no sea anterior a la fecha de ingreso
      if (resident.fechaEgreso < resident.fechaIngreso) {
        throw new BadRequestException('La fecha de egreso no puede ser anterior a la fecha de ingreso');
      }
      
      const updatedResident = await this.residentsRepository.save(resident);
      this.logger.log(`Residente egresado: ${id}`);
      
      return updatedResident;
    } catch (error) {
      this.logger.error(`Error al egresar residente ${id}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Obtener estadísticas de residentes
   */
  async getEstadisticas(sedeId?: string): Promise<any> {
    try {
      const queryBuilder = this.residentsRepository.createQueryBuilder('resident');
      
      if (sedeId) {
        queryBuilder.where('resident.sedeId = :sedeId', { sedeId });
      }

      const total = await queryBuilder.getCount();
      
      const porEstado = await this.residentsRepository
        .createQueryBuilder('resident')
        .select('resident.estado', 'estado')
        .addSelect('COUNT(*)', 'count')
        .where(sedeId ? 'resident.sedeId = :sedeId' : '1=1', { sedeId })
        .groupBy('resident.estado')
        .getRawMany();

      const porGenero = await this.residentsRepository
        .createQueryBuilder('resident')
        .select('resident.genero', 'genero')
        .addSelect('COUNT(*)', 'count')
        .where(sedeId ? 'resident.sedeId = :sedeId' : '1=1', { sedeId })
        .andWhere('resident.genero IS NOT NULL')
        .groupBy('resident.genero')
        .getRawMany();

      const ingresosPorMes = await this.residentsRepository
        .createQueryBuilder('resident')
        .select("TO_CHAR(resident.fechaIngreso, 'YYYY-MM')", 'mes')
        .addSelect('COUNT(*)', 'count')
        .where(sedeId ? 'resident.sedeId = :sedeId' : '1=1', { sedeId })
        .groupBy("TO_CHAR(resident.fechaIngreso, 'YYYY-MM')")
        .orderBy('mes', 'DESC')
        .limit(12)
        .getRawMany();

      return {
        total,
        porEstado,
        porGenero,
        ingresosPorMes,
      };
    } catch (error) {
      this.logger.error(`Error al obtener estadísticas: ${error.message}`);
      throw error;
    }
  }

  /**
   * Buscar residentes por criterios
   */
  async search(criterios: {
    nombres?: string;
    apellidoPaterno?: string;
    rut?: string;
    estado?: ResidentEstado;
  }): Promise<Resident[]> {
    try {
      const where: any = {};
      
      if (criterios.nombres) {
        where.nombres = Like(`%${criterios.nombres}%`);
      }
      
      if (criterios.apellidoPaterno) {
        where.apellidoPaterno = Like(`%${criterios.apellidoPaterno}%`);
      }
      
      if (criterios.rut) {
        where.rut = Like(`%${criterios.rut}%`);
      }
      
      if (criterios.estado) {
        where.estado = criterios.estado;
      }

      return await this.residentsRepository.find({
        where,
        relations: ['sede', 'responsable'],
        take: 50, // Limitar resultados
        order: { nombres: 'ASC' }
      });
    } catch (error) {
      this.logger.error(`Error en búsqueda de residentes: ${error.message}`);
      throw error;
    }
  }

  /**
   * Validar formato de RUT chileno
   */
  private validateRut(rut: string): void {
    // Formato básico: 12345678-9 o 12.345.678-9
    const rutRegex = /^(\d{1,3}(?:\.?\d{3}){2}-[\dkK])$/;
    
    if (!rutRegex.test(rut)) {
      throw new BadRequestException('Formato de RUT inválido. Use: 12345678-9 o 12.345.678-9');
    }
  }

  /**
   * Formatear RUT a formato estándar
   */
  private formatRut(rut: string): string {
    // Eliminar puntos y guiones
    let cleanRut = rut.replace(/\./g, '').replace(/-/g, '');
    
    // Separar número y dígito verificador
    const numero = cleanRut.slice(0, -1);
    const dv = cleanRut.slice(-1).toUpperCase();
    
    // Formatear con puntos y guión
    let formatted = '';
    for (let i = numero.length - 1, j = 1; i >= 0; i--, j++) {
      formatted = numero[i] + formatted;
      if (j % 3 === 0 && i !== 0) {
        formatted = '.' + formatted;
      }
    }
    
    return `${formatted}-${dv}`;
  }

  /**
   * Obtener residentes sin responsable asignado
   */
  async findSinResponsable(sedeId?: string): Promise<Resident[]> {
    try {
      const where: any = { responsable: IsNull(), estado: ResidentEstado.ACTIVO };
      
      if (sedeId) {
        where.sede = { id: sedeId };
      }

      return await this.residentsRepository.find({
        where,
        relations: ['sede'],
        order: { fechaIngreso: 'DESC' }
      });
    } catch (error) {
      this.logger.error(`Error al buscar residentes sin responsable: ${error.message}`);
      throw error;
    }
  }

  /**
   * Obtener cumpleañeros del mes
   */
  async getCumpleanerosMes(): Promise<Resident[]> {
    try {
      const now = new Date();
      const mesActual = now.getMonth() + 1; // 1-12
      
      return await this.residentsRepository
        .createQueryBuilder('resident')
        .where('EXTRACT(MONTH FROM resident.fechaNacimiento) = :mes', { mes: mesActual })
        .andWhere('resident.estado = :estado', { estado: ResidentEstado.ACTIVO })
        .orderBy('EXTRACT(DAY FROM resident.fechaNacimiento)', 'ASC')
        .getMany();
    } catch (error) {
      this.logger.error(`Error al obtener cumpleañeros: ${error.message}`);
      throw error;
    }
  }
}