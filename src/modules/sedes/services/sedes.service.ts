// src/modules/sedes/services/sedes.service.ts
import { 
  Injectable, 
  NotFoundException, 
  ConflictException,
  BadRequestException,
  Logger 
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Sede, TipoSede } from '../entities/sede.entity';
import { CreateSedeDto } from '../dto/create-sede.dto';
import { UpdateSedeDto } from '../dto/update-sede.dto';
import { User } from '../../users/entities/user.entity';
import { Resident } from '../../residents/entities/resident.entity';

@Injectable()
export class SedesService {
  private readonly logger = new Logger(SedesService.name);

  constructor(
    @InjectRepository(Sede)
    private sedesRepository: Repository<Sede>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(Resident)
    private residentsRepository: Repository<Resident>,
  ) {}

  /**
   * Crear nueva sede
   */
  async create(createSedeDto: CreateSedeDto): Promise<Sede> {
    try {
      // Verificar si ya existe una sede con el mismo nombre
      const existingSede = await this.sedesRepository.findOne({
        where: { nombre: createSedeDto.nombre }
      });
      
      if (existingSede) {
        throw new ConflictException('Ya existe una sede con ese nombre');
      }

      // Validar capacidad - CORREGIDO
      const capacidadActual = createSedeDto.capacidadActual ?? 0; // Usar nullish coalescing
      const capacidadMaxima = createSedeDto.capacidadMaxima;
      
      if (capacidadActual > capacidadMaxima) {
        throw new BadRequestException('La capacidad actual no puede ser mayor que la capacidad máxima');
      }

      const sede = this.sedesRepository.create({
        ...createSedeDto,
        capacidadActual, // Asegurar que tenga valor
      });
      
      const savedSede = await this.sedesRepository.save(sede);
      
      this.logger.log(`Sede creada: ${savedSede.nombre} (ID: ${savedSede.id})`);
      return savedSede;

    } catch (error) {
      this.logger.error(`Error al crear sede: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Obtener todas las sedes
   */
  async findAll(filters?: {
    isActive?: boolean;
    tipo?: TipoSede;
    region?: string;
    conCapacidad?: boolean;
  }): Promise<Sede[]> {
    try {
      const query = this.sedesRepository.createQueryBuilder('sede')
        .orderBy('sede.nombre', 'ASC');

      if (filters?.isActive !== undefined) {
        query.andWhere('sede.isActive = :isActive', { isActive: filters.isActive });
      }

      if (filters?.tipo) {
        query.andWhere('sede.tipo = :tipo', { tipo: filters.tipo });
      }

      if (filters?.region) {
        query.andWhere('sede.region = :region', { region: filters.region });
      }

      if (filters?.conCapacidad) {
        query.andWhere('sede.capacidadActual < sede.capacidadMaxima');
      }

      return await query.getMany();
    } catch (error) {
      this.logger.error(`Error al obtener sedes: ${error.message}`);
      throw error;
    }
  }

  /**
   * Obtener sedes activas
   */
  async findActive(): Promise<Sede[]> {
    return await this.findAll({ isActive: true });
  }

  /**
   * Obtener sedes con capacidad disponible
   */
  async findConCapacidad(): Promise<Sede[]> {
    return await this.findAll({ isActive: true, conCapacidad: true });
  }

  /**
   * Obtener sede por ID
   */
  async findOne(id: string): Promise<Sede> {
    try {
      const sede = await this.sedesRepository.findOne({
        where: { id },
        relations: ['usuarios', 'residentes']
      });
      
      if (!sede) {
        throw new NotFoundException(`Sede con ID ${id} no encontrada`);
      }
      
      return sede;
    } catch (error) {
      this.logger.error(`Error al buscar sede ${id}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Obtener sede por nombre
   */
  async findByName(nombre: string): Promise<Sede> {
    try {
      const sede = await this.sedesRepository.findOne({
        where: { nombre },
        relations: ['usuarios']
      });
      
      if (!sede) {
        throw new NotFoundException(`Sede "${nombre}" no encontrada`);
      }
      
      return sede;
    } catch (error) {
      this.logger.error(`Error al buscar sede por nombre ${nombre}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Actualizar sede
   */
  async update(id: string, updateSedeDto: UpdateSedeDto): Promise<Sede> {
    try {
      const sede = await this.findOne(id);
      
      // Si se actualiza el nombre, verificar que no exista
      if (updateSedeDto.nombre && updateSedeDto.nombre !== sede.nombre) {
        const existingSede = await this.sedesRepository.findOne({
          where: { nombre: updateSedeDto.nombre }
        });
        
        if (existingSede) {
          throw new ConflictException('Ya existe una sede con ese nombre');
        }
      }

      // Validar capacidad - CORREGIDO
      if (updateSedeDto.capacidadMaxima !== undefined) {
        const capacidadActual = updateSedeDto.capacidadActual !== undefined 
          ? updateSedeDto.capacidadActual 
          : sede.capacidadActual;
        
        if (updateSedeDto.capacidadMaxima < capacidadActual) {
          throw new BadRequestException(
            'La capacidad máxima no puede ser menor que la capacidad actual'
          );
        }
      }

      if (updateSedeDto.capacidadActual !== undefined) {
        const capacidadMaxima = updateSedeDto.capacidadMaxima !== undefined 
          ? updateSedeDto.capacidadMaxima 
          : sede.capacidadMaxima;
        
        if (updateSedeDto.capacidadActual > capacidadMaxima) {
          throw new BadRequestException(
            'La capacidad actual no puede ser mayor que la capacidad máxima'
          );
        }
      }

      // Actualizar campos
      Object.assign(sede, updateSedeDto);
      
      const updatedSede = await this.sedesRepository.save(sede);
      this.logger.log(`Sede actualizada: ${id}`);
      
      return updatedSede;
    } catch (error) {
      this.logger.error(`Error al actualizar sede ${id}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Eliminar sede (soft delete lógico)
   */
  async remove(id: string): Promise<void> {
    try {
      const sede = await this.findOne(id);
      
      // Verificar si hay usuarios asignados
      const usuariosCount = await this.usersRepository.count({
        where: { sede: { id } }
      });
      
      if (usuariosCount > 0) {
        throw new BadRequestException(
          'No se puede eliminar la sede porque tiene usuarios asignados. ' +
          'Reasigna los usuarios primero o desactiva la sede.'
        );
      }

      // Verificar si hay residentes asignados
      const residentesCount = await this.residentsRepository.count({
        where: { sede: { id } }
      });
      
      if (residentesCount > 0) {
        throw new BadRequestException(
          'No se puede eliminar la sede porque tiene residentes asignados. ' +
          'Transfiere los residentes primero o desactiva la sede.'
        );
      }

      // Eliminar físicamente (o marcar como inactiva si prefieres soft delete)
      await this.sedesRepository.remove(sede);
      this.logger.log(`Sede eliminada: ${id}`);
    } catch (error) {
      this.logger.error(`Error al eliminar sede ${id}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Desactivar sede (marcar como inactiva)
   */
  async deactivate(id: string): Promise<Sede> {
    try {
      const sede = await this.findOne(id);
      
      if (!sede.isActive) {
        throw new BadRequestException('La sede ya está desactivada');
      }

      sede.isActive = false;
      const updatedSede = await this.sedesRepository.save(sede);
      
      this.logger.log(`Sede desactivada: ${id}`);
      return updatedSede;
    } catch (error) {
      this.logger.error(`Error al desactivar sede ${id}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Activar sede
   */
  async activate(id: string): Promise<Sede> {
    try {
      const sede = await this.findOne(id);
      
      if (sede.isActive) {
        throw new BadRequestException('La sede ya está activa');
      }

      sede.isActive = true;
      const updatedSede = await this.sedesRepository.save(sede);
      
      this.logger.log(`Sede activada: ${id}`);
      return updatedSede;
    } catch (error) {
      this.logger.error(`Error al activar sede ${id}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Incrementar capacidad actual (cuando se agrega residente)
   */
  async incrementarCapacidad(id: string): Promise<Sede> {
    try {
      const sede = await this.findOne(id);
      
      if (!sede.isActive) {
        throw new BadRequestException('No se pueden agregar residentes a una sede inactiva');
      }

      if (sede.capacidadActual >= sede.capacidadMaxima) {
        throw new BadRequestException('La sede ha alcanzado su capacidad máxima');
      }

      sede.capacidadActual += 1;
      return await this.sedesRepository.save(sede);
    } catch (error) {
      this.logger.error(`Error al incrementar capacidad de sede ${id}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Decrementar capacidad actual (cuando se elimina/egresa residente)
   */
  async decrementarCapacidad(id: string): Promise<Sede> {
    try {
      const sede = await this.findOne(id);
      
      if (sede.capacidadActual <= 0) {
        throw new BadRequestException('La capacidad actual ya es 0');
      }

      sede.capacidadActual -= 1;
      return await this.sedesRepository.save(sede);
    } catch (error) {
      this.logger.error(`Error al decrementar capacidad de sede ${id}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Obtener estadísticas de sedes
   */
  async getEstadisticas(): Promise<any> {
    try {
      const totalSedes = await this.sedesRepository.count();
      const sedesActivas = await this.sedesRepository.count({ where: { isActive: true } });
      
      const porTipo = await this.sedesRepository
        .createQueryBuilder('sede')
        .select('sede.tipo', 'tipo')
        .addSelect('COUNT(*)', 'count')
        .groupBy('sede.tipo')
        .getRawMany();

      const capacidadTotal = await this.sedesRepository
        .createQueryBuilder('sede')
        .select('SUM(sede.capacidadMaxima)', 'capacidadTotal')
        .addSelect('SUM(sede.capacidadActual)', 'ocupacionTotal')
        .where('sede.isActive = :isActive', { isActive: true })
        .getRawOne();

      const sedesPorRegion = await this.sedesRepository
        .createQueryBuilder('sede')
        .select('sede.region', 'region')
        .addSelect('COUNT(*)', 'count')
        .where('sede.region IS NOT NULL')
        .groupBy('sede.region')
        .getRawMany();

      return {
        totalSedes,
        sedesActivas,
        sedesInactivas: totalSedes - sedesActivas,
        porTipo,
        capacidad: {
          total: parseInt(capacidadTotal?.capacidadTotal) || 0,
          ocupada: parseInt(capacidadTotal?.ocupacionTotal) || 0,
          disponible: (parseInt(capacidadTotal?.capacidadTotal) || 0) - 
                     (parseInt(capacidadTotal?.ocupacionTotal) || 0),
        },
        sedesPorRegion,
      };
    } catch (error) {
      this.logger.error(`Error al obtener estadísticas: ${error.message}`);
      throw error;
    }
  }

  /**
   * Buscar sedes por criterios
   */
  async search(criterios: {
    nombre?: string;
    tipo?: TipoSede;
    region?: string;
    comuna?: string;
    conCapacidad?: boolean;
  }): Promise<Sede[]> {
    try {
      const query = this.sedesRepository.createQueryBuilder('sede')
        .where('sede.isActive = :isActive', { isActive: true })
        .orderBy('sede.nombre', 'ASC');

      if (criterios.nombre) {
        query.andWhere('sede.nombre ILIKE :nombre', { 
          nombre: `%${criterios.nombre}%` 
        });
      }

      if (criterios.tipo) {
        query.andWhere('sede.tipo = :tipo', { tipo: criterios.tipo });
      }

      if (criterios.region) {
        query.andWhere('sede.region ILIKE :region', { 
          region: `%${criterios.region}%` 
        });
      }

      if (criterios.comuna) {
        query.andWhere('sede.comuna ILIKE :comuna', { 
          comuna: `%${criterios.comuna}%` 
        });
      }

      if (criterios.conCapacidad) {
        query.andWhere('sede.capacidadActual < sede.capacidadMaxima');
      }

      return await query.getMany();
    } catch (error) {
      this.logger.error(`Error en búsqueda de sedes: ${error.message}`);
      throw error;
    }
  }

  /**
   * Obtener sedes por región
   */
  async findByRegion(region: string): Promise<Sede[]> {
    return await this.sedesRepository.find({
      where: { region, isActive: true },
      order: { nombre: 'ASC' }
    });
  }

  /**
   * Obtener sedes por tipo
   */
  async findByTipo(tipo: TipoSede): Promise<Sede[]> {
    return await this.sedesRepository.find({
      where: { tipo, isActive: true },
      order: { nombre: 'ASC' }
    });
  }

  /**
   * Verificar si una sede tiene capacidad para más residentes
   */
  async tieneCapacidad(id: string): Promise<boolean> {
    const sede = await this.findOne(id);
    return sede.lugaresDisponibles > 0 && sede.isActive;
  }

  /**
   * Obtener usuarios de una sede
   */
  async getUsuarios(id: string): Promise<User[]> {
    const sede = await this.findOne(id);
    return await this.usersRepository.find({
      where: { sede: { id } },
      relations: ['sede'],
      order: { nombre: 'ASC' }
    });
  }

  /**
   * Obtener residentes de una sede
   */
  async getResidentes(id: string): Promise<Resident[]> {
    const sede = await this.findOne(id);
    return await this.residentsRepository.find({
      where: { sede: { id } },
      relations: ['sede', 'responsable'],
      order: { nombres: 'ASC' }
    });
  }

  /**
   * Obtener sedes con su información básica (sin relaciones pesadas)
   */
  async findBasicInfo(): Promise<Sede[]> {
    try {
      return await this.sedesRepository.find({
        select: ['id', 'nombre', 'tipo', 'region', 'capacidadActual', 'capacidadMaxima', 'isActive'],
        order: { nombre: 'ASC' }
      });
    } catch (error) {
      this.logger.error(`Error al obtener información básica de sedes: ${error.message}`);
      throw error;
    }
  }

  /**
   * Verificar si se puede eliminar una sede
   */
  async canDelete(id: string): Promise<{ canDelete: boolean; reasons: string[] }> {
    const sede = await this.findOne(id);
    const reasons: string[] = [];
    
    // Verificar usuarios
    const usuariosCount = await this.usersRepository.count({
      where: { sede: { id } }
    });
    
    if (usuariosCount > 0) {
      reasons.push(`Tiene ${usuariosCount} usuario(s) asignado(s)`);
    }
    
    // Verificar residentes
    const residentesCount = await this.residentsRepository.count({
      where: { sede: { id } }
    });
    
    if (residentesCount > 0) {
      reasons.push(`Tiene ${residentesCount} residente(s) asignado(s)`);
    }
    
    return {
      canDelete: reasons.length === 0,
      reasons
    };
  }

  /**
   * Obtener sedes cercanas a una región
   */
  async findNearby(region: string, limit: number = 5): Promise<Sede[]> {
    try {
      return await this.sedesRepository.find({
        where: { region, isActive: true },
        take: limit,
        order: { nombre: 'ASC' }
      });
    } catch (error) {
      this.logger.error(`Error al buscar sedes cercanas a ${region}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Actualizar solo la capacidad máxima
   */
  async updateCapacidadMaxima(id: string, capacidadMaxima: number): Promise<Sede> {
    try {
      const sede = await this.findOne(id);
      
      if (capacidadMaxima < sede.capacidadActual) {
        throw new BadRequestException(
          'La nueva capacidad máxima no puede ser menor que la capacidad actual'
        );
      }
      
      sede.capacidadMaxima = capacidadMaxima;
      return await this.sedesRepository.save(sede);
    } catch (error) {
      this.logger.error(`Error al actualizar capacidad máxima de sede ${id}: ${error.message}`);
      throw error;
    }
  }
}