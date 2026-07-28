import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as ldap from 'ldapjs';

export interface LdapUser {
  username: string;
  nombre: string;
  email: string;
  roles: string[];
}

@Injectable()
export class LdapService {
  private readonly logger = new Logger(LdapService.name);

  constructor(private readonly config: ConfigService) {}

  async authenticate(username: string, password: string): Promise<LdapUser> {
    const isDev = this.config.get<string>('NODE_ENV') !== 'production';

    try {
      return await this.ldapBind(username, password);
    } catch (err) {
      // Si el error fue autenticación inválida y NO estamos en dev, propagarlo como 401
      if (err instanceof UnauthorizedException && !isDev) throw err;

      if (isDev) {
        this.logger.warn(
          `LDAP falló — fallback de desarrollo: ${(err as Error).message}`,
        );
        return this.devFallback(username, password);
      }

      // Producción: cualquier error de infraestructura LDAP = 401 (no exponer detalles)
      this.logger.error(
        'Error de infraestructura LDAP',
        (err as Error).message,
      );
      throw new UnauthorizedException('Error de autenticación');
    }
  }

  private ldapBind(username: string, password: string): Promise<LdapUser> {
    return new Promise((resolve, reject) => {
      const url = this.config.get<string>('LDAP_URL', '');
      const bindDn = this.config.get<string>('LDAP_BIND_DN', '');
      const bindPw = this.config.get<string>('LDAP_BIND_PASSWORD', '');
      const baseDn = this.config.get<string>('LDAP_BASE_DN', '');

      if (!url || !bindDn || !baseDn) {
        return reject(
          new Error(
            'LDAP no configurado (LDAP_URL, LDAP_BIND_DN o LDAP_BASE_DN ausentes)',
          ),
        );
      }

      const client = ldap.createClient({
        url,
        reconnect: false,
        timeout: 5000,
        connectTimeout: 4000,
      });

      client.on('error', (err: Error) => {
        client.destroy();
        reject(new Error(`Conexión LDAP falló: ${err.message}`));
      });

      client.bind(bindDn, bindPw, (bindErr) => {
        if (bindErr) {
          client.destroy();
          return reject(
            new Error(`Bind de cuenta de servicio falló: ${bindErr.message}`),
          );
        }

        const safeUsername = username.replace(/[*()\\\x00/]/g, '\\$&');
        const searchOpts: ldap.SearchOptions = {
          filter: `(sAMAccountName=${safeUsername})`,
          scope: 'sub',
          attributes: ['dn', 'cn', 'mail', 'memberOf'],
        };

        client.search(baseDn, searchOpts, (searchErr, res) => {
          if (searchErr) {
            client.destroy();
            return reject(
              new Error(`Búsqueda LDAP falló: ${searchErr.message}`),
            );
          }

          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          let entry: any = null;

          res.on('searchEntry', (e) => {
            entry = e;
          });

          res.on('error', (err) => {
            client.destroy();
            reject(new Error(`Error durante la búsqueda LDAP: ${err.message}`));
          });

          res.on('end', () => {
            // Envolver en try/catch: errores síncronos dentro de callbacks de
            // EventEmitter no son capturados por el try/catch del await externo
            try {
              if (!entry) {
                client.destroy();
                return reject(
                  new UnauthorizedException('Credenciales incorrectas'),
                );
              }

              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const obj: Record<string, any> = entry.object ?? {};
              // entry.objectName puede ser string o un objeto DN según la versión de ldapjs
              const userDn: string = String(entry.objectName ?? entry.dn ?? '');
              const nombre: string = String(obj['cn'] ?? username);
              const email: string = String(
                obj['mail'] ?? `${username}@farmcorp.com.ec`,
              );
              const raw = obj['memberOf'];
              const roles: string[] = Array.isArray(raw)
                ? raw.map(String)
                : raw
                  ? [String(raw)]
                  : [];

              if (!userDn) {
                client.destroy();
                return reject(
                  new UnauthorizedException(
                    'No se pudo obtener el DN del usuario',
                  ),
                );
              }

              client.bind(userDn, password, (userBindErr) => {
                client.destroy();
                if (userBindErr) {
                  return reject(
                    new UnauthorizedException('Credenciales incorrectas'),
                  );
                }
                resolve({ username, nombre, email, roles });
              });
            } catch (syncErr) {
              client.destroy();
              reject(syncErr);
            }
          });
        });
      });
    });
  }

  private devFallback(username: string, password: string): LdapUser {
    const raw = this.config.get<string>('DEV_USERS', '');
    const pairs = raw
      .split(',')
      .filter(Boolean)
      .map((p) => p.trim().split(':'));

    const found = pairs.find(([u]) => u === username);
    if (!found || found[1] !== password) {
      throw new UnauthorizedException('Credenciales incorrectas');
    }

    const nombre = username.charAt(0).toUpperCase() + username.slice(1);
    return { username, nombre, email: `${username}@dev.local`, roles: [] };
  }
}
