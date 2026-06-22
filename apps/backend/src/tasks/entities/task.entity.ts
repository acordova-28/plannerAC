import {
  Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany,
  CreateDateColumn, UpdateDateColumn, JoinColumn,
} from 'typeorm'
import { Modulo } from '../../modulos/entities/modulo.entity'
import { TaskResponsable } from './task-responsable.entity'
import { TaskDinamico } from '../../campos/entities/task-dinamico.entity'

@Entity('tasks')
export class Task {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ name: 'modulo_id', type: 'char', length: 36 })
  moduloId: string

  @Column({ type: 'text' })
  nombre: string

  @Column({ name: 'horas_estimadas', type: 'float', nullable: true })
  horasEstimadas: number | null

  @Column({ name: 'horas_baseline', type: 'float', nullable: true })
  horasBaseline: number | null

  @Column({ length: 10, default: 'Media' })
  prioridad: string

  @Column({ length: 20, default: 'Pendiente' })
  estado: string

  @Column({ length: 30, nullable: true })
  tipo: string | null

  @Column({ type: 'smallint', unsigned: true, default: 0 })
  orden: number

  @Column({ name: 'fecha_inicio', type: 'date', nullable: true })
  fechaInicio: string | null

  @Column({ name: 'fecha_fin', type: 'date', nullable: true })
  fechaFin: string | null

  @Column({ name: 'fecha_inicio_baseline', type: 'date', nullable: true })
  fechaInicioBaseline: string | null

  @Column({ name: 'fecha_fin_baseline', type: 'date', nullable: true })
  fechaFinBaseline: string | null

  @Column({ name: 'porcentaje_progreso', type: 'tinyint', unsigned: true, default: 0 })
  porcentajeProgreso: number

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date

  @ManyToOne(() => Modulo, modulo => modulo.tasks, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'modulo_id' })
  modulo: Modulo

  @OneToMany(() => TaskResponsable, tr => tr.task, { cascade: true })
  responsables: TaskResponsable[]

  @OneToMany(() => TaskDinamico, td => td.task, { cascade: true })
  dinamicos: TaskDinamico[]
}
