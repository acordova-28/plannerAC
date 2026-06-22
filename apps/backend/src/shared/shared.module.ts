import { Module } from '@nestjs/common'
import { WorkingDaysService } from './working-days.service'

@Module({
  providers: [WorkingDaysService],
  exports: [WorkingDaysService],
})
export class SharedModule {}
