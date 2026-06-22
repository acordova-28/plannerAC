import { Injectable, Logger, InternalServerErrorException } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { User } from '../users/entities/user.entity'
import { LdapService } from './ldap.service'

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name)

  constructor(
    private readonly ldap: LdapService,
    private readonly jwt: JwtService,
    @InjectRepository(User) private readonly userRepo: Repository<User>,
  ) {}

  async login(username: string, password: string) {
    // 1. Autenticar con LDAP (o fallback DEV_USERS en development)
    const ldapUser = await this.ldap.authenticate(username, password)

    // 2. Registrar / actualizar el usuario en la BD local
    let user: User
    try {
      user = await this.userRepo.findOne({ where: { ldapUid: username } })
      if (!user) {
        user = this.userRepo.create({
          ldapUid: ldapUser.username,
          nombre: ldapUser.nombre,
          email: ldapUser.email,
        })
        user = await this.userRepo.save(user)
      }
    } catch (err) {
      this.logger.error(`Error de BD durante el login del usuario "${username}": ${(err as Error).message}`)
      throw new InternalServerErrorException('Error interno al procesar el login')
    }

    const payload = {
      sub: user.ldapUid,
      nombre: user.nombre,
      email: user.email,
      roles: ldapUser.roles,
    }

    return {
      token: this.jwt.sign(payload),
      user: {
        username: user.ldapUid,
        nombre: user.nombre,
        email: user.email,
      },
    }
  }
}
