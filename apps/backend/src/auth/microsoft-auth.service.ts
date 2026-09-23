import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  ConfidentialClientApplication,
  AuthenticationResult,
} from '@azure/msal-node';

export interface MicrosoftUser {
  username: string;
  nombre: string;
  email: string;
  picture?: string;
}

const SCOPES = ['User.Read'];

@Injectable()
export class MicrosoftAuthService {
  private readonly logger = new Logger(MicrosoftAuthService.name);
  private msalClient: ConfidentialClientApplication | null = null;
  private readonly tenantId: string;
  private readonly redirectUri: string;

  constructor(private readonly config: ConfigService) {
    this.tenantId = this.config.get<string>('AZURE_TENANT_ID', '');
    this.redirectUri = this.config.get<string>('AZURE_REDIRECT_URI', '');
  }

  // Construido bajo demanda: si AUTH_MICROSOFT_ENABLED=true pero aún no se
  // configuró AZURE_CLIENT_SECRET, MSAL lanza al crear el cliente — no debe
  // tumbar el arranque de Nest (que instancia todos los providers al boot).
  private getClient(): ConfidentialClientApplication {
    if (!this.msalClient) {
      const clientSecret = this.config.get<string>('AZURE_CLIENT_SECRET', '');
      if (!clientSecret) {
        throw new Error(
          'AZURE_CLIENT_SECRET no está configurado — completa el .env con el secreto de la app registrada en Entra ID',
        );
      }
      this.msalClient = new ConfidentialClientApplication({
        auth: {
          clientId: this.config.get<string>('AZURE_CLIENT_ID', ''),
          authority: `https://login.microsoftonline.com/${this.tenantId}`,
          clientSecret,
        },
      });
    }
    return this.msalClient;
  }

  getAuthCodeUrl(state: string): Promise<string> {
    return this.getClient().getAuthCodeUrl({
      scopes: SCOPES,
      redirectUri: this.redirectUri,
      state,
    });
  }

  async acquireTokenByCode(code: string): Promise<MicrosoftUser> {
    let result: AuthenticationResult | null;
    try {
      result = await this.getClient().acquireTokenByCode({
        code,
        scopes: SCOPES,
        redirectUri: this.redirectUri,
      });
    } catch (err) {
      this.logger.error(
        'Error intercambiando código con Microsoft',
        (err as Error).message,
      );
      throw new UnauthorizedException('No se pudo completar el inicio de sesión con Microsoft');
    }

    const claims = result?.idTokenClaims as
      | (Record<string, unknown> & { tid?: string; preferred_username?: string; email?: string; name?: string; oid?: string })
      | undefined;

    if (!result || !claims) {
      throw new UnauthorizedException('Respuesta inválida de Microsoft');
    }

    // "Solo mi organización" — el authority de un solo tenant ya restringe el login,
    // pero validamos el claim tid como defensa adicional.
    if (!this.tenantId || claims.tid !== this.tenantId) {
      this.logger.warn(
        `Login de Microsoft rechazado: tenant "${claims.tid}" no coincide con el tenant configurado`,
      );
      throw new UnauthorizedException('Usuario no pertenece a la organización autorizada');
    }

    const upn = claims.preferred_username ?? result.account?.username ?? '';
    const email = claims.email ?? upn;
    const nombre = claims.name ?? result.account?.name ?? upn;

    if (!upn) {
      throw new UnauthorizedException('No se pudo obtener el usuario de Microsoft');
    }

    const picture = result.accessToken
      ? await this.fetchProfilePhoto(result.accessToken)
      : undefined;

    return {
      username: upn.split('@')[0],
      nombre,
      email,
      picture,
    };
  }

  // La foto de perfil vive en Graph, no en el ID token — si el usuario no
  // tiene foto configurada en Entra ID, Graph responde 404 y se omite.
  private async fetchProfilePhoto(accessToken: string): Promise<string | undefined> {
    try {
      const res = await fetch('https://graph.microsoft.com/v1.0/me/photo/$value', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!res.ok) return undefined;

      const contentType = res.headers.get('content-type') ?? 'image/jpeg';
      const buffer = Buffer.from(await res.arrayBuffer());
      return `data:${contentType};base64,${buffer.toString('base64')}`;
    } catch (err) {
      this.logger.warn(
        `No se pudo obtener la foto de perfil de Microsoft: ${(err as Error).message}`,
      );
      return undefined;
    }
  }
}
