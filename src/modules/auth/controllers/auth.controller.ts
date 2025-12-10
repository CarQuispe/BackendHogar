import { Controller, Post, Body, UseGuards, Get, Request, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from '../services/auth.service';
import { LoginDto } from '../dto/login.dto';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { Public } from '../decorators/public.decorator';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Iniciar sesión' })
  @ApiResponse({ 
    status: 200, 
    description: 'Login exitoso',
    schema: {
      example: {
        access_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        user: {
          id: '123e4567-e89b-12d3-a456-426614174000',
          name: 'Administrador',
          email: 'admin@residencias.com',
          role: 'DIRECTORA',
          isActive: true,
          createdAt: '2024-01-01T00:00:00.000Z'
        }
      }
    }
  })
  @ApiResponse({ 
    status: 401, 
    description: 'Credenciales inválidas' 
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Datos de entrada inválidos' 
  })
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obtener perfil del usuario autenticado' })
  @ApiResponse({ 
    status: 200, 
    description: 'Perfil del usuario',
    schema: {
      example: {
        userId: '123e4567-e89b-12d3-a456-426614174000',
        email: 'admin@residencias.com',
        role: 'DIRECTORA',
        name: 'Administrador'
      }
    }
  })
  @ApiResponse({ 
    status: 401, 
    description: 'No autorizado' 
  })
  getProfile(@Request() req) {
    return req.user;
  }

  @Public()
  @Get('health')
  @ApiOperation({ summary: 'Verificar estado del servicio' })
  @ApiResponse({ 
    status: 200, 
    description: 'Servicio funcionando',
    schema: {
      example: {
        status: 'OK',
        timestamp: '2024-01-01T00:00:00.000Z',
        service: 'auth-service'
      }
    }
  })
  healthCheck() {
    return { 
      status: 'OK', 
      timestamp: new Date().toISOString(),
      service: 'auth-service' 
    };
  }
}