import { Injectable, UnauthorizedException, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import * as ldap from 'ldapjs'

export interface LdapUser {
  username: string
  nombre: string
  email: string
  roles: string[]
}

@Injectable()
export class LdapService {
  private readonly logger = new Logger(LdapService.name)

  constructor(private readonly config: ConfigService) {}

  async authenticate(username: string, password: string): Promise<LdapUser> {
    if (this.config.get('NODE_ENV') === 'development') {
      try {
        return await this.ldapBind(username, password)
      } catch (err) {
        this.logger.warn(`LDAP no disponible — usando fallback de desarrollo: ${(err as Error).message}`)
        return this.devFallback(username, password)
      }
    }
    return this.ldapBind(username, password)
  }

  private ldapBind(username: string, password: string): Promise<LdapUser> {
    return new Promise((resolve, reject) => {
      const url = this.config.getOrThrow<string>('LDAP_URL')
      const bindDn = this.config.getOrThrow<string>('LDAP_BIND_DN')
      const bindPw = this.config.getOrThrow<string>('LDAP_BIND_PASSWORD')
      const baseDn = this.config.getOrThrow<string>('LDAP_BASE_DN')

      const client = ldap.createClient({ url, reconnect: false, timeout: 5000 })

      client.on('error', (err: Error) => {
        client.destroy()
        reject(new Error(`Conexión LDAP falló: ${err.message}`))
      })

      client.bind(bindDn, bindPw, (bindErr) => {
        if (bindErr) {
          client.destroy()
          return reject(new Error(`Bind de cuenta de lectura falló: ${bindErr.message}`))
        }

        // Sanitizar username para evitar LDAP injection
        const safeUsername = username.replace(/[*()\\\x00/]/g, '\\$&')
        const searchOpts: ldap.SearchOptions = {
          filter: `(sAMAccountName=${safeUsername})`,
          scope: 'sub',
          attributes: ['dn', 'cn', 'mail', 'memberOf'],
        }

        client.search(baseDn, searchOpts, (searchErr, res) => {
          if (searchErr) {
            client.destroy()
            return reject(new UnauthorizedException('Error de búsqueda LDAP'))
          }

          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          let entry: any = null

          res.on('searchEntry', (e) => { entry = e })

          res.on('error', () => {
            client.destroy()
            reject(new UnauthorizedException('Credenciales incorrectas'))
          })

          res.on('end', () => {
            if (!entry) {
              client.destroy()
              return reject(new UnauthorizedException('Credenciales incorrectas'))
            }

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const obj = entry.object as Record<string, any>
            const userDn: string = entry.objectName ?? entry.dn?.toString() ?? ''
            const nombre: string = obj['cn'] || username
            const email: string = obj['mail'] || `${username}@empresa.com`
            const memberOf = obj['memberOf']
            const roles: string[] = Array.isArray(memberOf)
              ? memberOf
              : memberOf
              ? [String(memberOf)]
              : []

            client.bind(userDn, password, (userBindErr) => {
              client.destroy()
              if (userBindErr) {
                return reject(new UnauthorizedException('Credenciales incorrectas'))
              }
              resolve({ username, nombre, email, roles })
            })
          })
        })
      })
    })
  }

  private devFallback(username: string, password: string): LdapUser {
    const raw = this.config.get<string>('DEV_USERS', '')
    const pairs = raw
      .split(',')
      .filter(Boolean)
      .map((p) => p.trim().split(':'))

    const found = pairs.find(([u]) => u === username)
    if (!found || found[1] !== password) {
      throw new UnauthorizedException('Credenciales incorrectas')
    }

    const nombre = username.charAt(0).toUpperCase() + username.slice(1)
    return { username, nombre, email: `${username}@dev.local`, roles: [] }
  }
}
