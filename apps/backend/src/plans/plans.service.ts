import { Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { Plan } from './entities/plan.entity'
import { CreatePlanDto } from './dto/create-plan.dto'
import { UpdatePlanDto } from './dto/update-plan.dto'
import { TasksService } from '../tasks/tasks.service'

@Injectable()
export class PlansService {
  constructor(
    @InjectRepository(Plan) private readonly repo: Repository<Plan>,
    private readonly tasksService: TasksService,
  ) {}

  findAll(): Promise<Plan[]> {
    return this.repo.find({ order: { createdAt: 'DESC' } })
  }

  async findOne(id: string): Promise<Plan> {
    const plan = await this.repo.findOne({
      where: { id },
      relations: { modulos: { tasks: true }, campos: true },
      order: { modulos: { orden: 'ASC' } },
    })
    if (!plan) throw new NotFoundException(`Plan ${id} no encontrado`)
    return plan
  }

  async create(dto: CreatePlanDto): Promise<Plan> {
    const plan = this.repo.create(dto)
    return this.repo.save(plan)
  }

  async update(id: string, dto: UpdatePlanDto): Promise<Plan> {
    const plan = await this.findOne(id)
    const needsRecalc = dto.fechaInicio !== undefined || dto.horasPorDia !== undefined

    Object.assign(plan, dto)
    await this.repo.save(plan)

    if (needsRecalc) {
      await this.tasksService.recalculateProjectDates(id)
    }

    return this.findOne(id)
  }

  async remove(id: string): Promise<void> {
    const plan = await this.findOne(id)
    await this.repo.remove(plan)
  }

  async freezeBaseline(id: string): Promise<void> {
    await this.findOne(id)
    await this.tasksService.freezeBaselineForPlan(id)
  }

  async recalculate(id: string): Promise<void> {
    await this.findOne(id)
    await this.tasksService.recalculateProjectDates(id)
  }
}
