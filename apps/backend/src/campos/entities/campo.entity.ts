import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { Plan } from '../../plans/entities/plan.entity';
import { TaskDinamico } from './task-dinamico.entity';

@Entity('campos')
export class Campo {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'plan_id', type: 'char', length: 36 })
  planId: string;

  @Column({ length: 150 })
  nombre: string;

  @Column({ name: 'tipo_dato', length: 20, default: 'texto' })
  tipoDato: string;

  @Column({ type: 'smallint', unsigned: true, default: 0 })
  orden: number;

  @ManyToOne(() => Plan, (plan) => plan.campos, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'plan_id' })
  plan: Plan;

  @OneToMany(() => TaskDinamico, (td) => td.campo, { cascade: true })
  taskDinamicos: TaskDinamico[];
}
