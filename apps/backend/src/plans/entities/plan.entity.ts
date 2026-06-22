import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, UpdateDateColumn, OneToMany,
} from 'typeorm'
import { PlanUser } from './plan-user.entity'
import { Modulo } from '../../modulos/entities/modulo.entity'
import { Campo } from '../../campos/entities/campo.entity'

@Entity('plans')
export class Plan {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ length: 255 })
  nombre: string

  @Column({ name: 'fecha_inicio', type: 'date' })
  fechaInicio: string

  @Column({ name: 'horas_por_dia', type: 'tinyint', unsigned: true, default: 8 })
  horasPorDia: number

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date

  @OneToMany(() => PlanUser, pu => pu.plan, { cascade: true })
  planUsers: PlanUser[]

  @OneToMany(() => Modulo, m => m.plan, { cascade: true })
  modulos: Modulo[]

  @OneToMany(() => Campo, c => c.plan, { cascade: true })
  campos: Campo[]
}
