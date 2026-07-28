import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Task } from '../tasks/entities/task.entity';
import { TaskResponsable } from '../tasks/entities/task-responsable.entity';
import { Modulo } from '../modulos/entities/modulo.entity';
import { EstadisticasService } from './estadisticas.service';
import { EstadisticasController } from './estadisticas.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Task, TaskResponsable, Modulo])],
  controllers: [EstadisticasController],
  providers: [EstadisticasService],
})
export class EstadisticasModule {}
