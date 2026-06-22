import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { Campo } from './entities/campo.entity'
import { TaskDinamico } from './entities/task-dinamico.entity'
import { CamposService } from './campos.service'
import { CamposController } from './campos.controller'

@Module({
  imports: [TypeOrmModule.forFeature([Campo, TaskDinamico])],
  providers: [CamposService],
  controllers: [CamposController],
  exports: [CamposService],
})
export class CamposModule {}
