import { Injectable, NotFoundException, ConflictException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { User } from './entities/user.entity'
import { CreateUserDto } from './dto/create-user.dto'

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private readonly repo: Repository<User>,
  ) {}

  findAll(): Promise<User[]> {
    return this.repo.find({ order: { nombre: 'ASC' } })
  }

  async findOne(id: string): Promise<User> {
    const user = await this.repo.findOneBy({ id })
    if (!user) throw new NotFoundException(`Usuario ${id} no encontrado`)
    return user
  }

  async findByLdapUid(ldapUid: string): Promise<User | null> {
    return this.repo.findOneBy({ ldapUid })
  }

  async create(dto: CreateUserDto): Promise<User> {
    const existing = await this.repo.findOneBy({ ldapUid: dto.ldapUid })
    if (existing) throw new ConflictException(`ldap_uid '${dto.ldapUid}' ya existe`)
    const user = this.repo.create(dto)
    return this.repo.save(user)
  }
}
