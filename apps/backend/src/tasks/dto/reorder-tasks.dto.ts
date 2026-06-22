import { IsArray, ValidateNested, IsUUID, IsInt, Min } from 'class-validator'
import { Type } from 'class-transformer'

class TaskOrderItem {
  @IsUUID('4')
  taskId: string

  @IsUUID('4')
  moduloId: string

  @IsInt()
  @Min(0)
  orden: number
}

export class ReorderTasksDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TaskOrderItem)
  items: TaskOrderItem[]
}
