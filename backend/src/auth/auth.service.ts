import { Injectable } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { User } from '../users/entities/user.entity'
import { LdapService } from './ldap.service'

@Injectable()
export class AuthService {
  constructor(
    private readonly ldap: LdapService,
    private readonly jwt: JwtService,
    @InjectRepository(User) private readonly userRepo: Repository<User>,
  ) {}

  async login(username: string, password: string) {
    const ldapUser = await this.ldap.authenticate(username, password)

    // Registrar o actualizar el usuario en la BD local
    let user = await this.userRepo.findOne({ where: { ldapUid: username } })
    if (!user) {
      user = this.userRepo.create({
        ldapUid: ldapUser.username,
        nombre: ldapUser.nombre,
        email: ldapUser.email,
      })
      user = await this.userRepo.save(user)
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
