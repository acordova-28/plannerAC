import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Plan } from './entities/plan.entity';
import { PlanUser } from './entities/plan-user.entity';
import { CreatePlanDto } from './dto/create-plan.dto';
import { UpdatePlanDto } from './dto/update-plan.dto';
import { TasksService } from '../tasks/tasks.service';

export interface PlanMemberDto {
  id: string;
  nombre: string;
  email: string;
  horasPorDia: number;
}

@Injectable()
export class PlansService {
  constructor(
    @InjectRepository(Plan) private readonly repo: Repository<Plan>,
    @InjectRepository(PlanUser)
    private readonly planUserRepo: Repository<PlanUser>,
    private readonly tasksService: TasksService,
  ) {}

  findAll(): Promise<Plan[]> {
    return this.repo.find({ order: { createdAt: 'DESC' } });
  }

  async getMembers(planId: string): Promise<PlanMemberDto[]> {
    const planUsers = await this.planUserRepo.find({
      where: { planId },
      relations: { user: true },
    });
    return planUsers.map((pu) => ({
      id: pu.userId,
      nombre: pu.user.nombre,
      email: pu.user.email,
      horasPorDia: pu.horasPorDia,
    }));
  }

  async addMember(planId: string, userId: string): Promise<PlanMemberDto[]> {
    await this.findOne(planId);
    const exists = await this.planUserRepo.findOneBy({ planId, userId });
    if (!exists) {
      const pu = this.planUserRepo.create({ planId, userId, rol: 'miembro' });
      await this.planUserRepo.save(pu);
    }
    return this.getMembers(planId);
  }

  async removeMember(planId: string, userId: string): Promise<void> {
    await this.planUserRepo.delete({ planId, userId });
  }

  async updateMemberHours(
    planId: string,
    userId: string,
    horasPorDia: number,
  ): Promise<PlanMemberDto[]> {
    await this.planUserRepo.update({ planId, userId }, { horasPorDia });
    return this.getMembers(planId);
  }

  async findOne(id: string): Promise<Plan> {
    const plan = await this.repo.findOne({
      where: { id },
      relations: { modulos: { tasks: true }, campos: true },
      order: { modulos: { orden: 'ASC' } },
    });
    if (!plan) throw new NotFoundException(`Plan ${id} no encontrado`);
    return plan;
  }

  async create(dto: CreatePlanDto): Promise<Plan> {
    const plan = this.repo.create(dto);
    return this.repo.save(plan);
  }

  async update(id: string, dto: UpdatePlanDto): Promise<Plan> {
    const plan = await this.findOne(id);
    const needsRecalc =
      dto.fechaInicio !== undefined || dto.horasPorDia !== undefined;

    Object.assign(plan, dto);
    await this.repo.save(plan);

    if (needsRecalc) {
      await this.tasksService.recalculateProjectDates(id);
    }

    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    const plan = await this.findOne(id);
    await this.repo.remove(plan);
  }

  async freezeBaseline(id: string): Promise<void> {
    await this.findOne(id);
    await this.tasksService.freezeBaselineForPlan(id);
  }

  async recalculate(id: string): Promise<void> {
    await this.findOne(id);
    await this.tasksService.recalculateProjectDates(id);
  }

  async syncUserGroups(userId: string, groupNames: string[]): Promise<void> {
    for (const name of groupNames) {
      let plan = await this.repo.findOne({ where: { nombre: name } });
      if (!plan) {
        const today = new Date().toISOString().split('T')[0];
        plan = await this.repo.save(
          this.repo.create({
            nombre: name,
            fechaInicio: today,
            horasPorDia: 8,
          }),
        );
      }
      const exists = await this.planUserRepo.findOneBy({
        planId: plan.id,
        userId,
      });
      if (!exists) {
        await this.planUserRepo.save(
          this.planUserRepo.create({ planId: plan.id, userId, rol: 'miembro' }),
        );
      }
    }
  }
}
