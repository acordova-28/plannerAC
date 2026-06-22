import { IsString, Length, IsDateString, IsInt, Min, Max } from 'class-validator'

export class CreatePlanDto {
  @IsString()
  @Length(1, 255)
  nombre: string

  @IsDateString()
  fechaInicio: string

  @IsInt()
  @Min(1)
  @Max(24)
  horasPorDia: number = 8
}
