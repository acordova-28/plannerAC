import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToMany,
} from 'typeorm';
import { PlanUser } from '../../plans/entities/plan-user.entity';
import { TaskResponsable } from '../../tasks/entities/task-responsable.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'ldap_uid', length: 100, unique: true })
  ldapUid: string;

  @Column({ length: 150 })
  nombre: string;

  @Column({ length: 255, unique: true })
  email: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @OneToMany(() => PlanUser, (pu) => pu.user)
  planUsers: PlanUser[];

  @OneToMany(() => TaskResponsable, (tr) => tr.user)
  taskResponsables: TaskResponsable[];
}
