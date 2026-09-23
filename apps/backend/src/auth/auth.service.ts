import {
  Injectable,
  Logger,
  InternalServerErrorException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { LdapService } from './ldap.service';
import { MicrosoftAuthService } from './microsoft-auth.service';
import { PlansService } from '../plans/plans.service';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly ldap: LdapService,
    private readonly microsoftAuth: MicrosoftAuthService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly plansService: PlansService,
    @InjectRepository(User) private readonly userRepo: Repository<User>,
  ) {}

  private async findOrCreateUser(
    where: { ldapUid?: string; email?: string },
    data: { ldapUid: string; nombre: string; email: string },
    contextLabel: string,
  ): Promise<User> {
    try {
      let user = where.email
        ? await this.userRepo.findOne({ where: { email: where.email } })
        : null;
      if (!user && where.ldapUid) {
        user = await this.userRepo.findOne({
          where: { ldapUid: where.ldapUid },
        });
      }
      if (!user) {
        user = this.userRepo.create(data);
        user = await this.userRepo.save(user);
      }
      return user;
    } catch (err) {
      this.logger.error(
        `Error de BD durante el login de "${contextLabel}": ${(err as Error).message}`,
      );
      throw new InternalServerErrorException(
        'Error interno al procesar el login',
      );
    }
  }

  async login(username: string, password: string) {
    // 1. Autenticar con LDAP (o fallback DEV_USERS en development)
    const ldapUser = await this.ldap.authenticate(username, password);

    // 2. Registrar / actualizar el usuario en la BD local
    const user = await this.findOrCreateUser(
      { ldapUid: username },
      {
        ldapUid: ldapUser.username,
        nombre: ldapUser.nombre,
        email: ldapUser.email,
      },
      username,
    );

    // Sincronizar grupos LDAP → planes automáticamente
    const planGroupBase = this.config.get<string>('LDAP_PLANS_BASE', '');
    this.logger.log(
      `[LDAP sync] ${username} — ${ldapUser.roles.length} grupo(s) recibidos`,
    );
    if (ldapUser.roles.length > 0) {
      this.logger.debug(
        `[LDAP sync] grupos raw: ${ldapUser.roles.join(' | ')}`,
      );
    }

    const groupNames = ldapUser.roles
      .filter(
        (dn) =>
          !planGroupBase ||
          dn.toLowerCase().includes(planGroupBase.toLowerCase()),
      )
      .map((dn) => {
        const m = dn.match(/^CN=([^,]+)/i);
        return m ? m[1] : '';
      })
      .filter(Boolean);

    this.logger.log(
      `[LDAP sync] planes a sincronizar: ${groupNames.length > 0 ? groupNames.join(', ') : '(ninguno)'}`,
    );

    if (groupNames.length > 0) {
      try {
        await this.plansService.syncUserGroups(user.id, groupNames);
        this.logger.log(`[LDAP sync] sync completado para "${username}"`);
      } catch (err) {
        this.logger.warn(
          `[LDAP sync] error sincronizando grupos de "${username}": ${(err as Error).message}`,
        );
      }
    }

    return this.issueSession(user, ldapUser.roles);
  }

  async loginWithMicrosoft(code: string) {
    const msUser = await this.microsoftAuth.acquireTokenByCode(code);

    // Empareja por email para fusionar con una cuenta ya creada vía LDAP;
    // si no existe ninguna, se crea una nueva usando el username de Microsoft.
    const user = await this.findOrCreateUser(
      { email: msUser.email, ldapUid: msUser.username },
      {
        ldapUid: msUser.username,
        nombre: msUser.nombre,
        email: msUser.email,
      },
      msUser.username,
    );

    // El login con Microsoft no trae grupos de AD, por lo que no hay
    // sincronización automática de planes aquí (a diferencia del flujo LDAP).
    return this.issueSession(user, [], msUser.picture);
  }

  private issueSession(user: User, roles: string[], picture?: string) {
    const payload = {
      sub: user.ldapUid,
      nombre: user.nombre,
      email: user.email,
      roles,
    };

    return {
      access_token: this.jwt.sign(payload),
      user: {
        id: user.id,
        ldapUid: user.ldapUid,
        nombre: user.nombre,
        email: user.email,
        picture,
      },
    };
  }
}
