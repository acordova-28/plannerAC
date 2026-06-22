import { Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository, DataSource, In } from 'typeorm'
import { Task } from './entities/task.entity'
import { TaskResponsable } from './entities/task-responsable.entity'
import { Modulo } from '../modulos/entities/modulo.entity'
import { User } from '../users/entities/user.entity'
import { CreateTaskDto } from './dto/create-task.dto'
import { UpdateTaskDto } from './dto/update-task.dto'
import { ReorderTasksDto } from './dto/reorder-tasks.dto'
import { WorkingDaysService } from '../shared/working-days.service'

export interface FlatTask {
  id: string
  modulo: string
  tarea: string
  horas: number | null
  prioridad: string
  responsable: string
  estado: string
  tipo: string
  fechaInicio: string | null
  fechaFin: string | null
}

@Injectable()
export class TasksService {
  constructor(
    @InjectRepository(Task) private readonly taskRepo: Repository<Task>,
    @InjectRepository(TaskResponsable) private readonly respRepo: Repository<TaskResponsable>,
    @InjectRepository(Modulo) private readonly moduloRepo: Repository<Modulo>,
    @InjectRepository(User) private readonly userRepo: Repository<User>,
    private readonly dataSource: DataSource,
    private readonly workingDays: WorkingDaysService,
  ) {}

  // ── Lista plana de todas las tareas (para Estimacion_WUOLLA.html) ──────────

  async findAll(): Promise<FlatTask[]> {
    const tasks = await this.taskRepo.find({
      relations: { modulo: true, responsables: { user: true } },
      order: { modulo: { orden: 'ASC' }, orden: 'ASC' },
    })
    return tasks.map((t) => this.toFlat(t))
  }

  async exportCsv(): Promise<string> {
    const tasks = await this.findAll()
    const BOM = '﻿'
    const header = 'ID,Módulo,Tarea,Horas,Prioridad,Responsable,Estado,Fecha Inicio,Fecha Fin,Tipo'
    const rows = tasks.map(
      (t) =>
        `"${t.id}","${t.modulo}","${t.tarea.replace(/"/g, '""')}","${t.horas ?? ''}",` +
        `"${t.prioridad}","${t.responsable}","${t.estado}","${t.fechaInicio ?? ''}",` +
        `"${t.fechaFin ?? ''}","${t.tipo}"`,
    )
    return BOM + [header, ...rows].join('\n')
  }

  private toFlat(task: Task): FlatTask {
    const responsable =
      task.responsables
        ?.map((r) => r.user?.nombre)
        .filter(Boolean)
        .join(', ') ?? ''

    return {
      id: task.id,
      modulo: task.modulo?.nombre ?? '',
      tarea: task.nombre,
      horas: task.horasEstimadas,
      prioridad: task.prioridad,
      responsable,
      estado: task.estado,
      tipo: task.tipo ?? '',
      fechaInicio: task.fechaInicio,
      fechaFin: task.fechaFin,
    }
  }

  // ── Operaciones anidadas existentes ────────────────────────────────────────

  findByModulo(moduloId: string): Promise<Task[]> {
    return this.taskRepo.find({
      where: { moduloId },
      relations: { responsables: { user: true }, dinamicos: true },
      order: { orden: 'ASC' },
    })
  }

  async findOne(id: string): Promise<Task> {
    const task = await this.taskRepo.findOne({
      where: { id },
      relations: { responsables: { user: true }, dinamicos: { campo: true } },
    })
    if (!task) throw new NotFoundException(`Tarea ${id} no encontrada`)
    return task
  }

  async create(moduloId: string, dto: CreateTaskDto): Promise<Task> {
    const modulo = await this.moduloRepo.findOne({ where: { id: moduloId }, relations: { plan: true } })
    if (!modulo) throw new NotFoundException(`Módulo ${moduloId} no encontrado`)

    const count = await this.taskRepo.countBy({ moduloId })
    const task = this.taskRepo.create({
      moduloId,
      nombre: dto.nombre,
      horasEstimadas: dto.horasEstimadas ?? null,
      prioridad: dto.prioridad ?? 'Media',
      estado: dto.estado ?? 'Pendiente',
      tipo: dto.tipo ?? null,
      orden: dto.orden ?? count,
      porcentajeProgreso: dto.porcentajeProgreso ?? 0,
    })
    const saved = await this.taskRepo.save(task)

    if (dto.responsableIds?.length) {
      await this.setResponsables(saved.id, dto.responsableIds)
    }

    await this.recalculateProjectDates(modulo.planId)
    return this.findOne(saved.id)
  }

  async update(id: string, dto: UpdateTaskDto): Promise<Task> {
    const task = await this.findOne(id)
    const modulo = await this.moduloRepo.findOneBy({ id: task.moduloId })
    if (!modulo) throw new NotFoundException(`Módulo de la tarea no encontrado`)

    const needsRecalc = dto.horasEstimadas !== undefined

    Object.assign(task, {
      ...(dto.nombre !== undefined && { nombre: dto.nombre }),
      ...(dto.horasEstimadas !== undefined && { horasEstimadas: dto.horasEstimadas }),
      ...(dto.horasBaseline !== undefined && { horasBaseline: dto.horasBaseline }),
      ...(dto.prioridad !== undefined && { prioridad: dto.prioridad }),
      ...(dto.estado !== undefined && { estado: dto.estado }),
      ...(dto.tipo !== undefined && { tipo: dto.tipo }),
      ...(dto.porcentajeProgreso !== undefined && { porcentajeProgreso: dto.porcentajeProgreso }),
    })
    await this.taskRepo.save(task)

    if (dto.responsableIds !== undefined) {
      await this.setResponsables(id, dto.responsableIds)
    }

    if (needsRecalc) {
      await this.recalculateProjectDates(modulo.planId)
    }

    return this.findOne(id)
  }

  async remove(id: string): Promise<void> {
    const task = await this.findOne(id)
    const modulo = await this.moduloRepo.findOne({ where: { id: task.moduloId }, relations: { plan: true } })
    await this.taskRepo.remove(task)
    if (modulo) {
      await this.recalculateProjectDates(modulo.planId)
    }
  }

  async reorder(dto: ReorderTasksDto): Promise<void> {
    await this.dataSource.transaction(async (manager) => {
      for (const item of dto.items) {
        await manager.update(Task, item.taskId, {
          moduloId: item.moduloId,
          orden: item.orden,
        })
      }
    })
  }

  async freezeBaselineForPlan(planId: string): Promise<void> {
    const modulos = await this.moduloRepo.findBy({ planId })
    const moduloIds = modulos.map((m) => m.id)
    if (!moduloIds.length) return

    await this.taskRepo
      .createQueryBuilder()
      .update(Task)
      .set({
        horasBaseline: () => 'horas_estimadas',
        fechaInicioBaseline: () => 'fecha_inicio',
        fechaFinBaseline: () => 'fecha_fin',
      })
      .where('modulo_id IN (:...ids)', { ids: moduloIds })
      .execute()
  }

  async recalculateProjectDates(planId: string): Promise<void> {
    const modulos = await this.moduloRepo.find({
      where: { planId },
      relations: { plan: true },
      order: { orden: 'ASC' },
    })
    if (!modulos.length) return

    const plan = modulos[0].plan
    const horasPorDia = plan.horasPorDia
    const planStart = new Date(plan.fechaInicio)

    let cursor = planStart

    for (const modulo of modulos) {
      const tasks = await this.taskRepo.find({
        where: { moduloId: modulo.id },
        order: { orden: 'ASC' },
      })

      for (const task of tasks) {
        if (!task.horasEstimadas) {
          await this.taskRepo.update(task.id, { fechaInicio: null, fechaFin: null })
          continue
        }
        const { fechaInicio, fechaFin } = this.workingDays.calcDates(
          cursor,
          task.horasEstimadas,
          horasPorDia,
        )
        await this.taskRepo.update(task.id, {
          fechaInicio: this.toDateStr(fechaInicio),
          fechaFin: this.toDateStr(fechaFin),
        })
        cursor = this.workingDays.nextWorkday(fechaFin)
      }
    }
  }

  private toDateStr(d: Date): string {
    return d.toISOString().slice(0, 10)
  }

  private async setResponsables(taskId: string, userIds: string[]): Promise<void> {
    await this.respRepo.delete({ taskId })
    if (!userIds.length) return
    const entries = userIds.map((userId) => this.respRepo.create({ taskId, userId }))
    await this.respRepo.save(entries)
  }
}
