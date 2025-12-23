// src/modules/sedes/controllers/sedes.controller.ts
import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  Patch, 
  Param, 
  Delete, 
  Query,
  UseGuards 
} from '@nestjs/common';
import { 
  ApiTags, 
  ApiOperation, 
  ApiResponse, 
  ApiBearerAuth,
  ApiQuery 
} from '@nestjs/swagger';
import { SedesService } from '../services/sedes.service';
import { CreateSedeDto } from '../dto/create-sede.dto';
import { UpdateSedeDto } from '../dto/update-sede.dto';
import { Sede, TipoSede } from '../entities/sede.entity';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { UserRole } from '../../users/entities/user.entity';

@ApiTags('Sedes')
@ApiBearerAuth()
@Controller('sedes')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SedesController {
  constructor(private readonly sedesService: SedesService) {}

  @Post()
  @Roles(UserRole.DIRECTORA, UserRole.ADMIN)
  @ApiOperation({ summary: 'Crear nueva sede' })
  @ApiResponse({ status: 201, description: 'Sede creada', type: Sede })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  @ApiResponse({ status: 409, description: 'Nombre de sede ya existe' })
  async create(@Body() createSedeDto: CreateSedeDto) {
    return this.sedesService.create(createSedeDto);
  }

  @Get()
  @Roles(UserRole.DIRECTORA, UserRole.ADMIN, UserRole.PSICOLOGA, 
         UserRole.TRABAJADORA_SOCIAL, UserRole.VOLUNTARIO)
  @ApiOperation({ summary: 'Obtener todas las sedes' })
  @ApiQuery({ name: 'isActive', required: false, type: Boolean })
  @ApiQuery({ name: 'tipo', required: false, enum: TipoSede })
  @ApiQuery({ name: 'region', required: false, type: String })
  @ApiQuery({ name: 'conCapacidad', required: false, type: Boolean })
  @ApiResponse({ status: 200, description: 'Lista de sedes', type: [Sede] })
  async findAll(
    @Query('isActive') isActive?: boolean,
    @Query('tipo') tipo?: TipoSede,
    @Query('region') region?: string,
    @Query('conCapacidad') conCapacidad?: boolean,
  ) {
    return this.sedesService.findAll({ 
      isActive, 
      tipo, 
      region,
      conCapacidad: conCapacidad === true 
    });
  }

  @Get('activas')
  @ApiOperation({ summary: 'Obtener sedes activas' })
  @ApiResponse({ status: 200, description: 'Sedes activas', type: [Sede] })
  async findActive() {
    return this.sedesService.findActive();
  }

  @Get('con-capacidad')
  @ApiOperation({ summary: 'Obtener sedes con capacidad disponible' })
  @ApiResponse({ status: 200, description: 'Sedes con capacidad', type: [Sede] })
  async findConCapacidad() {
    return this.sedesService.findConCapacidad();
  }

  @Get('estadisticas')
  @Roles(UserRole.DIRECTORA, UserRole.ADMIN)
  @ApiOperation({ summary: 'Obtener estadísticas de sedes' })
  @ApiResponse({ status: 200, description: 'Estadísticas' })
  async getEstadisticas() {
    return this.sedesService.getEstadisticas();
  }

  @Get('search')
  @ApiOperation({ summary: 'Buscar sedes por criterios' })
  @ApiQuery({ name: 'nombre', required: false })
  @ApiQuery({ name: 'tipo', required: false, enum: TipoSede })
  @ApiQuery({ name: 'region', required: false })
  @ApiQuery({ name: 'comuna', required: false })
  @ApiQuery({ name: 'conCapacidad', required: false, type: Boolean })
  @ApiResponse({ status: 200, description: 'Resultados de búsqueda', type: [Sede] })
  async search(
    @Query('nombre') nombre?: string,
    @Query('tipo') tipo?: TipoSede,
    @Query('region') region?: string,
    @Query('comuna') comuna?: string,
    @Query('conCapacidad') conCapacidad?: boolean,
  ) {
    return this.sedesService.search({ 
      nombre, 
      tipo, 
      region, 
      comuna,
      conCapacidad: conCapacidad === true 
    });
  }

  @Get(':id')
  @Roles(UserRole.DIRECTORA, UserRole.ADMIN, UserRole.PSICOLOGA, 
         UserRole.TRABAJADORA_SOCIAL, UserRole.VOLUNTARIO)
  @ApiOperation({ summary: 'Obtener sede por ID' })
  @ApiResponse({ status: 200, description: 'Sede encontrada', type: Sede })
  @ApiResponse({ status: 404, description: 'Sede no encontrada' })
  async findOne(@Param('id') id: string) {
    return this.sedesService.findOne(id);
  }

  @Get(':id/usuarios')
  @Roles(UserRole.DIRECTORA, UserRole.ADMIN)
  @ApiOperation({ summary: 'Obtener usuarios de una sede' })
  @ApiResponse({ status: 200, description: 'Usuarios de la sede' })
  async getUsuarios(@Param('id') id: string) {
    return this.sedesService.getUsuarios(id);
  }

  @Get(':id/residentes')
  @Roles(UserRole.DIRECTORA, UserRole.ADMIN, UserRole.PSICOLOGA, 
         UserRole.TRABAJADORA_SOCIAL)
  @ApiOperation({ summary: 'Obtener residentes de una sede' })
  @ApiResponse({ status: 200, description: 'Residentes de la sede' })
  async getResidentes(@Param('id') id: string) {
    return this.sedesService.getResidentes(id);
  }

  @Patch(':id')
  @Roles(UserRole.DIRECTORA, UserRole.ADMIN)
  @ApiOperation({ summary: 'Actualizar sede' })
  @ApiResponse({ status: 200, description: 'Sede actualizada', type: Sede })
  @ApiResponse({ status: 404, description: 'Sede no encontrada' })
  async update(
    @Param('id') id: string,
    @Body() updateSedeDto: UpdateSedeDto
  ) {
    return this.sedesService.update(id, updateSedeDto);
  }

  @Delete(':id')
  @Roles(UserRole.DIRECTORA, UserRole.ADMIN)
  @ApiOperation({ summary: 'Eliminar sede' })
  @ApiResponse({ status: 204, description: 'Sede eliminada' })
  @ApiResponse({ status: 404, description: 'Sede no encontrada' })
  async remove(@Param('id') id: string) {
    return this.sedesService.remove(id);
  }

  @Patch(':id/desactivar')
  @Roles(UserRole.DIRECTORA, UserRole.ADMIN)
  @ApiOperation({ summary: 'Desactivar sede' })
  @ApiResponse({ status: 200, description: 'Sede desactivada', type: Sede })
  async deactivate(@Param('id') id: string) {
    return this.sedesService.deactivate(id);
  }

  @Patch(':id/activar')
  @Roles(UserRole.DIRECTORA, UserRole.ADMIN)
  @ApiOperation({ summary: 'Activar sede' })
  @ApiResponse({ status: 200, description: 'Sede activada', type: Sede })
  async activate(@Param('id') id: string) {
    return this.sedesService.activate(id);
  }

  @Get(':id/tiene-capacidad')
  @ApiOperation({ summary: 'Verificar si sede tiene capacidad disponible' })
  @ApiResponse({ status: 200, description: 'Estado de capacidad' })
  async tieneCapacidad(@Param('id') id: string) {
    const tieneCapacidad = await this.sedesService.tieneCapacidad(id);
    return { tieneCapacidad };
  }

  @Get('region/:region')
  @ApiOperation({ summary: 'Obtener sedes por región' })
  @ApiResponse({ status: 200, description: 'Sedes de la región', type: [Sede] })
  async findByRegion(@Param('region') region: string) {
    return this.sedesService.findByRegion(region);
  }

  @Get('tipo/:tipo')
  @ApiOperation({ summary: 'Obtener sedes por tipo' })
  @ApiResponse({ status: 200, description: 'Sedes del tipo', type: [Sede] })
  async findByTipo(@Param('tipo') tipo: TipoSede) {
    return this.sedesService.findByTipo(tipo);
  }
}