import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Modulo } from './entities/modulo.entity';
import { CreateModuloDto } from './dto/create-modulo.dto';
import { UpdateModuloDto } from './dto/update-modulo.dto';

@Injectable()
export class ModulosService {
  constructor(
    @InjectRepository(Modulo) private readonly repo: Repository<Modulo>,
  ) {}

  findByPlan(planId: string): Promise<Modulo[]> {
    return this.repo.find({
      where: { planId },
      relations: { tasks: true },
      order: { orden: 'ASC' },
    });
  }

  async findOne(id: string): Promise<Modulo> {
    const modulo = await this.repo.findOne({
      where: { id },
      relations: { tasks: true },
    });
    if (!modulo) throw new NotFoundException(`Módulo ${id} no encontrado`);
    return modulo;
  }

  async create(planId: string, dto: CreateModuloDto): Promise<Modulo> {
    const count = await this.repo.countBy({ planId });
    const modulo = this.repo.create({
      planId,
      nombre: dto.nombre,
      orden: dto.orden ?? count,
    });
    return this.repo.save(modulo);
  }

  async update(id: string, dto: UpdateModuloDto): Promise<Modulo> {
    const modulo = await this.findOne(id);
    Object.assign(modulo, dto);
    return this.repo.save(modulo);
  }

  async remove(id: string): Promise<void> {
    const modulo = await this.findOne(id);
    await this.repo.remove(modulo);
  }
}
