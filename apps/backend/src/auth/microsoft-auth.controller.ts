import {
  Controller,
  Get,
  Query,
  Res,
  NotFoundException,
} from '@nestjs/common';
import { Response } from 'express';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { MicrosoftAuthService } from './microsoft-auth.service';

const STATE_PURPOSE = 'ms-oauth-state';

@Controller()
export class MicrosoftAuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly microsoftAuth: MicrosoftAuthService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  private get enabled(): boolean {
    return this.config.get<string>('AUTH_MICROSOFT_ENABLED', 'false') === 'true';
  }

  private get frontendUrl(): string {
    return this.config.get<string>('FRONTEND_URL', 'http://localhost:5173');
  }

  // GET /api/auth/microsoft (el prefijo /api lo añade el global prefix) — inicia el flujo, redirige a Microsoft
  @Get('auth/microsoft')
  async startLogin(@Res() res: Response) {
    if (!this.enabled) throw new NotFoundException();

    const state = this.jwt.sign({ purpose: STATE_PURPOSE }, { expiresIn: '5m' });
    const url = await this.microsoftAuth.getAuthCodeUrl(state);
    return res.redirect(url);
  }

  // GET /login — callback registrado en Azure (Web platform), sin prefijo /api
  @Get('login')
  async callback(
    @Query('code') code: string | undefined,
    @Query('state') state: string | undefined,
    @Query('error_description') errorDescription: string | undefined,
    @Res() res: Response,
  ) {
    if (!this.enabled) throw new NotFoundException();

    if (errorDescription || !code || !state) {
      return res.redirect(`${this.frontendUrl}/login?error=ms_auth_failed`);
    }

    try {
      const payload = this.jwt.verify(state) as { purpose?: string };
      if (payload.purpose !== STATE_PURPOSE) throw new Error('bad state purpose');
    } catch {
      return res.redirect(`${this.frontendUrl}/login?error=ms_auth_state`);
    }

    try {
      const session = await this.authService.loginWithMicrosoft(code);
      const params = new URLSearchParams({
        token: session.access_token,
        user: JSON.stringify(session.user),
      });
      return res.redirect(`${this.frontendUrl}/auth/callback#${params.toString()}`);
    } catch {
      return res.redirect(`${this.frontendUrl}/login?error=ms_auth_failed`);
    }
  }
}
