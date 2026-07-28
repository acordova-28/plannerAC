import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Task } from '../tasks/entities/task.entity';

export interface EstadisticasDto {
  totalTareas: number;
  horasEstimadas: number;
  horasBaseline: number | null;
  porEstado: Record<string, number>;
  porModulo: Record<string, number>;
  porResponsable: Record<string, number>;
  porcentajeAvance: number;
}

@Injectable()
export class EstadisticasService {
  constructor(
    @InjectRepository(Task) private readonly taskRepo: Repository<Task>,
  ) {}

  async getEstadisticas(): Promise<EstadisticasDto> {
    const tasks = await this.taskRepo.find({
      relations: { modulo: true, responsables: { user: true } },
    });

    const totalTareas = tasks.length;
    const horasEstimadas = tasks.reduce(
      (s, t) => s + (t.horasEstimadas ?? 0),
      0,
    );
    const horasBaseline = tasks.some((t) => t.horasBaseline !== null)
      ? tasks.reduce((s, t) => s + (t.horasBaseline ?? 0), 0)
      : null;

    const porEstado: Record<string, number> = {};
    const porModulo: Record<string, number> = {};
    const porResponsable: Record<string, number> = {};

    for (const t of tasks) {
      porEstado[t.estado] = (porEstado[t.estado] ?? 0) + 1;

      const mod = t.modulo?.nombre ?? 'Sin módulo';
      porModulo[mod] = (porModulo[mod] ?? 0) + 1;

      const responsables =
        t.responsables?.map((r) => r.user?.nombre).filter(Boolean) ?? [];
      for (const r of responsables) {
        porResponsable[r!] = (porResponsable[r!] ?? 0) + 1;
      }
    }

    const completadas = tasks.filter((t) => t.estado === 'Completado').length;
    const porcentajeAvance = totalTareas
      ? Math.round((completadas / totalTareas) * 100)
      : 0;

    return {
      totalTareas,
      horasEstimadas,
      horasBaseline,
      porEstado,
      porModulo,
      porResponsable,
      porcentajeAvance,
    };
  }
}
