// src/modules/residents/controllers/residents.controller.ts
import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  Patch, 
  Param, 
  Delete, 
  Query,
  UseGuards,
  Request 
} from '@nestjs/common';
import { 
  ApiTags, 
  ApiOperation, 
  ApiResponse, 
  ApiBearerAuth,
  ApiQuery 
} from '@nestjs/swagger';

import { ResidentsService } from 'src/modules/users/services/residents.service';
import { UpdateResidentDto } from '../dto/update-residents';
import { CreateResidentDto } from '../dto/create-residents';
import { Resident, ResidentEstado } from '../entities/resident.entity';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { UserRole } from '../../users/entities/user.entity';
import { CreateSedeDto } from 'src/modules/sedes/dto/create-sede.dto';

@ApiTags('Residentes')
@ApiBearerAuth()
@Controller('residents')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ResidentsController {
  constructor(private readonly residentsService: ResidentsService) {}

  @Post()
  @Roles(UserRole.DIRECTORA, UserRole.ADMIN, UserRole.TRABAJADORA_SOCIAL)
  @ApiOperation({ summary: 'Crear nuevo residente' })
  @ApiResponse({ status: 201, description: 'Residente creado', type: Resident })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  @ApiResponse({ status: 409, description: 'RUT ya existe' })
  async create(
    @Body() createResidentDto: CreateResidentDto,
    @Request() req
  ) {
    // Agregar el usuario que crea el residente
    createResidentDto.createdById = req.user.id;
    return this.residentsService.create(createResidentDto);
  }

  @Get()
  @Roles(UserRole.DIRECTORA, UserRole.ADMIN, UserRole.PSICOLOGA, 
         UserRole.TRABAJADORA_SOCIAL, UserRole.VOLUNTARIO)
  @ApiOperation({ summary: 'Obtener todos los residentes' })
  @ApiQuery({ name: 'sedeId', required: false, type: String })
  @ApiQuery({ name: 'estado', required: false, enum: ResidentEstado })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiResponse({ status: 200, description: 'Lista de residentes', type: [Resident] })
  async findAll(
    @Query('sedeId') sedeId?: string,
    @Query('estado') estado?: ResidentEstado,
    @Query('search') search?: string
  ) {
    if (sedeId) {
      return this.residentsService.findBySede(sedeId);
    }
    
    if (estado || search) {
      return this.residentsService.findAll({ 
        estado, 
        search,
        sedeId 
      });
    }
    
    return this.residentsService.findAll();
  }

  @Get('activos')
  @ApiOperation({ summary: 'Obtener residentes activos' })
  @ApiResponse({ status: 200, description: 'Residentes activos', type: [Resident] })
  async findActive() {
    return this.residentsService.findActive();
  }

  @Get('estadisticas')
  @Roles(UserRole.DIRECTORA, UserRole.ADMIN)
  @ApiOperation({ summary: 'Obtener estadísticas de residentes' })
  @ApiResponse({ status: 200, description: 'Estadísticas de residentes' })
  async getEstadisticas(@Query('sedeId') sedeId?: string) {
    return this.residentsService.getEstadisticas(sedeId);
  }

  @Get('search')
  @ApiOperation({ summary: 'Buscar residentes por criterios' })
  @ApiQuery({ name: 'nombres', required: false })
  @ApiQuery({ name: 'apellidoPaterno', required: false })
  @ApiQuery({ name: 'rut', required: false })
  @ApiQuery({ name: 'estado', required: false, enum: ResidentEstado })
  @ApiResponse({ status: 200, description: 'Resultados de búsqueda', type: [Resident] })
  async search(
    @Query('nombres') nombres?: string,
    @Query('apellidoPaterno') apellidoPaterno?: string,
    @Query('rut') rut?: string,
    @Query('estado') estado?: ResidentEstado
  ) {
    return this.residentsService.search({
      nombres,
      apellidoPaterno,
      rut,
      estado
    });
  }

  @Get('sin-responsable')
  @Roles(UserRole.DIRECTORA, UserRole.ADMIN, UserRole.TRABAJADORA_SOCIAL)
  @ApiOperation({ summary: 'Obtener residentes sin responsable asignado' })
  @ApiQuery({ name: 'sedeId', required: false })
  @ApiResponse({ status: 200, description: 'Residentes sin responsable', type: [Resident] })
  async findSinResponsable(@Query('sedeId') sedeId?: string) {
    return this.residentsService.findSinResponsable(sedeId);
  }

  @Get('cumpleaneros')
  @ApiOperation({ summary: 'Obtener cumpleañeros del mes' })
  @ApiResponse({ status: 200, description: 'Cumpleañeros del mes', type: [Resident] })
  async getCumpleanerosMes() {
    return this.residentsService.getCumpleanerosMes();
  }

  @Get(':id')
  @Roles(UserRole.DIRECTORA, UserRole.ADMIN, UserRole.PSICOLOGA, 
         UserRole.TRABAJADORA_SOCIAL, UserRole.VOLUNTARIO)
  @ApiOperation({ summary: 'Obtener residente por ID' })
  @ApiResponse({ status: 200, description: 'Residente encontrado', type: Resident })
  @ApiResponse({ status: 404, description: 'Residente no encontrado' })
  async findOne(@Param('id') id: string) {
    return this.residentsService.findOne(id);
  }

  @Get('rut/:rut')
  @Roles(UserRole.DIRECTORA, UserRole.ADMIN, UserRole.TRABAJADORA_SOCIAL)
  @ApiOperation({ summary: 'Obtener residente por RUT' })
  @ApiResponse({ status: 200, description: 'Residente encontrado', type: Resident })
  @ApiResponse({ status: 404, description: 'Residente no encontrado' })
  async findByRut(@Param('rut') rut: string) {
    return this.residentsService.findByRut(rut);
  }

  @Patch(':id')
  @Roles(UserRole.DIRECTORA, UserRole.ADMIN, UserRole.TRABAJADORA_SOCIAL)
  @ApiOperation({ summary: 'Actualizar residente' })
  @ApiResponse({ status: 200, description: 'Residente actualizado', type: Resident })
  @ApiResponse({ status: 404, description: 'Residente no encontrado' })
  async update(
    @Param('id') id: string,
    @Body() updateResidentDto: UpdateResidentDto
  ) {
    return this.residentsService.update(id, updateResidentDto);
  }

  @Delete(':id')
  @Roles(UserRole.DIRECTORA, UserRole.ADMIN)
  @ApiOperation({ summary: 'Eliminar residente' })
  @ApiResponse({ status: 204, description: 'Residente eliminado' })
  @ApiResponse({ status: 404, description: 'Residente no encontrado' })
  async remove(@Param('id') id: string) {
    return this.residentsService.remove(id);
  }

  @Patch(':id/egresar')
  @Roles(UserRole.DIRECTORA, UserRole.ADMIN, UserRole.TRABAJADORA_SOCIAL)
  @ApiOperation({ summary: 'Marcar residente como egresado' })
  @ApiResponse({ status: 200, description: 'Residente egresado', type: Resident })
  @ApiResponse({ status: 404, description: 'Residente no encontrado' })
  async egresar(
    @Param('id') id: string,
    @Body('motivoEgreso') motivoEgreso: string,
    @Body('fechaEgreso') fechaEgreso?: Date
  ) {
    return this.residentsService.egresar(id, motivoEgreso, fechaEgreso);
  }

  // CORRECCIÓN: Este endpoint requiere un servicio diferente o eliminarlo
  @Get(':id/historial')
  @Roles(UserRole.DIRECTORA, UserRole.ADMIN, UserRole.PSICOLOGA)
  @ApiOperation({ summary: 'Obtener información del residente' })
  @ApiResponse({ status: 200, description: 'Información del residente', type: Resident })
  @ApiResponse({ status: 404, description: 'Residente no encontrado' })
  async getInformacion(@Param('id') id: string) {
    // Cambié el nombre del método para que coincida con el servicio existente
    return this.residentsService.findOne(id);
  }

  @Patch(':id/asignar-responsable/:responsableId')
  @Roles(UserRole.DIRECTORA, UserRole.ADMIN, UserRole.TRABAJADORA_SOCIAL)
  @ApiOperation({ summary: 'Asignar responsable a residente' })
  @ApiResponse({ status: 200, description: 'Responsable asignado', type: Resident })
  async asignarResponsable(
    @Param('id') id: string,
    @Param('responsableId') responsableId: string
  ) {
    return this.residentsService.update(id, { responsableId });
  }

  @Patch(':id/cambiar-sede/:sedeId')
  @Roles(UserRole.DIRECTORA, UserRole.ADMIN, UserRole.TRABAJADORA_SOCIAL)
  @ApiOperation({ summary: 'Cambiar sede de residente' })
  @ApiResponse({ status: 200, description: 'Sede cambiada', type: Resident })
  async cambiarSede(
    @Param('id') id: string,
    @Param('sedeId') sedeId: string
  ) {
    return this.residentsService.update(id, { sedeId });
  }

  @Patch(':id/activar')
  @Roles(UserRole.DIRECTORA, UserRole.ADMIN, UserRole.TRABAJADORA_SOCIAL)
  @ApiOperation({ summary: 'Activar residente (si estaba inactivo)' })
  @ApiResponse({ status: 200, description: 'Residente activado', type: Resident })
  async activar(@Param('id') id: string) {
    return this.residentsService.update(id, { estado: ResidentEstado.ACTIVO });
  }
}