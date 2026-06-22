import * as path from 'path'
import { Module } from '@nestjs/common'
import { APP_GUARD } from '@nestjs/core'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { TypeOrmModule } from '@nestjs/typeorm'
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler'
import { ServeStaticModule } from '@nestjs/serve-static'

import { User } from './users/entities/user.entity'
import { Plan } from './plans/entities/plan.entity'
import { PlanUser } from './plans/entities/plan-user.entity'
import { Modulo } from './modulos/entities/modulo.entity'
import { Task } from './tasks/entities/task.entity'
import { TaskResponsable } from './tasks/entities/task-responsable.entity'
import { Campo } from './campos/entities/campo.entity'
import { TaskDinamico } from './campos/entities/task-dinamico.entity'

import { SharedModule } from './shared/shared.module'
import { UsersModule } from './users/users.module'
import { PlansModule } from './plans/plans.module'
import { ModulosModule } from './modulos/modulos.module'
import { TasksModule } from './tasks/tasks.module'
import { CamposModule } from './campos/campos.module'
import { AuthModule } from './auth/auth.module'

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),

    // Limitar 200 req/min por defecto; el endpoint de login usa su propio @Throttle
    ThrottlerModule.forRoot([
      { name: 'default', ttl: 60000, limit: 200 },
    ]),

    // Sirve public/ en la raíz; las rutas /api/* tienen prioridad (son controladores)
    ServeStaticModule.forRoot({
      rootPath: path.join(__dirname, '..', 'public'),
      exclude: ['/api/(.*)'],
    }),

    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (cfg: ConfigService) => ({
        type: 'mysql',
        host: cfg.get('DB_HOST', 'localhost'),
        port: cfg.get<number>('DB_PORT', 3306),
        username: cfg.get('DB_USER', 'root'),
        password: cfg.get('DB_PASSWORD', ''),
        database: cfg.get('DB_NAME', 'wuolla_planner'),
        entities: [User, Plan, PlanUser, Modulo, Task, TaskResponsable, Campo, TaskDinamico],
        synchronize: false,
        charset: 'utf8mb4',
        timezone: 'Z',
      }),
    }),

    AuthModule,
    SharedModule,
    UsersModule,
    PlansModule,
    ModulosModule,
    TasksModule,
    CamposModule,
  ],
  providers: [
    // ThrottlerGuard aplicado globalmente
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}
