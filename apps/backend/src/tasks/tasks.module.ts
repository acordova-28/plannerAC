import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { Task } from './entities/task.entity'
import { TaskResponsable } from './entities/task-responsable.entity'
import { Modulo } from '../modulos/entities/modulo.entity'
import { User } from '../users/entities/user.entity'
import { TasksService } from './tasks.service'
import { TasksController } from './tasks.controller'
import { SharedModule } from '../shared/shared.module'

@Module({
  imports: [
    TypeOrmModule.forFeature([Task, TaskResponsable, Modulo, User]),
    SharedModule,
  ],
  providers: [TasksService],
  controllers: [TasksController],
  exports: [TasksService],
})
export class TasksModule {}
