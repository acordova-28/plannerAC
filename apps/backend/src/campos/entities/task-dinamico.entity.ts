import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { Task } from '../../tasks/entities/task.entity';
import { Campo } from './campo.entity';

@Entity('task_dinamicos')
@Unique(['taskId', 'campoId'])
export class TaskDinamico {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'task_id', type: 'char', length: 36 })
  taskId: string;

  @Column({ name: 'campo_id', type: 'char', length: 36 })
  campoId: string;

  @Column({ type: 'text', nullable: true })
  valor: string | null;

  @ManyToOne(() => Task, (task) => task.dinamicos, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'task_id' })
  task: Task;

  @ManyToOne(() => Campo, (campo) => campo.taskDinamicos, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'campo_id' })
  campo: Campo;
}
