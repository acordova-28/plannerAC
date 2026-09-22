import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  NotFoundException,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly config: ConfigService,
  ) {}

  // Le indica al frontend qué métodos de login mostrar
  @Get('methods')
  methods() {
    return {
      ldap: this.config.get<string>('AUTH_LDAP_ENABLED', 'true') === 'true',
      microsoft:
        this.config.get<string>('AUTH_MICROSOFT_ENABLED', 'false') === 'true',
    };
  }

  // 10 intentos por IP cada 15 minutos
  @Throttle({ default: { limit: 10, ttl: 900000 } })
  @Post('login')
  @HttpCode(HttpStatus.OK)
  login(@Body() dto: LoginDto) {
    if (this.config.get<string>('AUTH_LDAP_ENABLED', 'true') !== 'true') {
      throw new NotFoundException();
    }
    return this.auth.login(dto.username, dto.password);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  me(@Request() req: Express.Request & { user: unknown }) {
    return req.user;
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  logout() {
    // JWT es stateless — el cliente elimina el token del localStorage
    return { mensaje: 'Sesión cerrada correctamente' };
  }
}
