import {
  Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, JoinColumn,
} from 'typeorm'
import { Plan } from '../../plans/entities/plan.entity'
import { Task } from '../../tasks/entities/task.entity'

@Entity('modulos')
export class Modulo {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ name: 'plan_id', type: 'char', length: 36 })
  planId: string

  @Column({ length: 150 })
  nombre: string

  @Column({ type: 'smallint', unsigned: true, default: 0 })
  orden: number

  @ManyToOne(() => Plan, plan => plan.modulos, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'plan_id' })
  plan: Plan

  @OneToMany(() => Task, task => task.modulo, { cascade: true })
  tasks: Task[]
}
