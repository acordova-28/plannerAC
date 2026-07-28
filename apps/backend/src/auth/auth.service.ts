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
import { PlansService } from '../plans/plans.service';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly ldap: LdapService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly plansService: PlansService,
    @InjectRepository(User) private readonly userRepo: Repository<User>,
  ) {}

  async login(username: string, password: string) {
    // 1. Autenticar con LDAP (o fallback DEV_USERS en development)
    const ldapUser = await this.ldap.authenticate(username, password);

    // 2. Registrar / actualizar el usuario en la BD local
    let user: User;
    try {
      user = await this.userRepo.findOne({ where: { ldapUid: username } });
      if (!user) {
        user = this.userRepo.create({
          ldapUid: ldapUser.username,
          nombre: ldapUser.nombre,
          email: ldapUser.email,
        });
        user = await this.userRepo.save(user);
      }
    } catch (err) {
      this.logger.error(
        `Error de BD durante el login del usuario "${username}": ${(err as Error).message}`,
      );
      throw new InternalServerErrorException(
        'Error interno al procesar el login',
      );
    }

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

    const payload = {
      sub: user.ldapUid,
      nombre: user.nombre,
      email: user.email,
      roles: ldapUser.roles,
    };

    return {
      access_token: this.jwt.sign(payload),
      user: {
        id: user.id,
        ldapUid: user.ldapUid,
        nombre: user.nombre,
        email: user.email,
      },
    };
  }
}
