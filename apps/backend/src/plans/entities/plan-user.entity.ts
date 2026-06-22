import { Entity, Column, ManyToOne, JoinColumn, PrimaryColumn } from 'typeorm'
import { Plan } from './plan.entity'
import { User } from '../../users/entities/user.entity'

@Entity('plan_users')
export class PlanUser {
  @PrimaryColumn({ name: 'plan_id', type: 'char', length: 36 })
  planId: string

  @PrimaryColumn({ name: 'user_id', type: 'char', length: 36 })
  userId: string

  @Column({ length: 20 })
  rol: string

  @ManyToOne(() => Plan, plan => plan.planUsers, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'plan_id' })
  plan: Plan

  @ManyToOne(() => User, user => user.planUsers, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User
}
