import { IsString, Length, IsInt, Min, IsOptional } from 'class-validator'

export class CreateModuloDto {
  @IsString()
  @Length(1, 150)
  nombre: string

  @IsOptional()
  @IsInt()
  @Min(0)
  orden?: number
}
