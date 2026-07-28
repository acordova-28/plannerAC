import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Campo } from './entities/campo.entity';
import { TaskDinamico } from './entities/task-dinamico.entity';
import { CreateCampoDto } from './dto/create-campo.dto';
import { SetValorDto } from './dto/set-valor.dto';

@Injectable()
export class CamposService {
  constructor(
    @InjectRepository(Campo) private readonly campoRepo: Repository<Campo>,
    @InjectRepository(TaskDinamico)
    private readonly dinamicoRepo: Repository<TaskDinamico>,
  ) {}

  findByPlan(planId: string): Promise<Campo[]> {
    return this.campoRepo.find({
      where: { planId },
      order: { orden: 'ASC' },
    });
  }

  async findOne(id: string): Promise<Campo> {
    const campo = await this.campoRepo.findOneBy({ id });
    if (!campo) throw new NotFoundException(`Campo ${id} no encontrado`);
    return campo;
  }

  async create(planId: string, dto: CreateCampoDto): Promise<Campo> {
    const count = await this.campoRepo.countBy({ planId });
    const campo = this.campoRepo.create({
      planId,
      nombre: dto.nombre,
      tipoDato: dto.tipoDato ?? 'texto',
      orden: dto.orden ?? count,
    });
    return this.campoRepo.save(campo);
  }

  async update(id: string, dto: Partial<CreateCampoDto>): Promise<Campo> {
    const campo = await this.findOne(id);
    Object.assign(campo, dto);
    return this.campoRepo.save(campo);
  }

  async remove(id: string): Promise<void> {
    const campo = await this.findOne(id);
    await this.campoRepo.remove(campo);
  }

  async setValor(
    taskId: string,
    campoId: string,
    dto: SetValorDto,
  ): Promise<TaskDinamico> {
    let dinamico = await this.dinamicoRepo.findOneBy({ taskId, campoId });
    if (!dinamico) {
      dinamico = this.dinamicoRepo.create({
        taskId,
        campoId,
        valor: dto.valor,
      });
    } else {
      dinamico.valor = dto.valor;
    }
    return this.dinamicoRepo.save(dinamico);
  }

  getValoresByTask(taskId: string): Promise<TaskDinamico[]> {
    return this.dinamicoRepo.find({
      where: { taskId },
      relations: { campo: true },
    });
  }
}
