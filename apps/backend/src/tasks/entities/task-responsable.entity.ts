import { Entity, ManyToOne, JoinColumn, PrimaryColumn } from 'typeorm'
import { Task } from './task.entity'
import { User } from '../../users/entities/user.entity'

@Entity('task_responsables')
export class TaskResponsable {
  @PrimaryColumn({ name: 'task_id', type: 'char', length: 36 })
  taskId: string

  @PrimaryColumn({ name: 'user_id', type: 'char', length: 36 })
  userId: string

  @ManyToOne(() => Task, task => task.responsables, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'task_id' })
  task: Task

  @ManyToOne(() => User, user => user.taskResponsables, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User
}
