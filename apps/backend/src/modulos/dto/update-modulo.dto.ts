import { IsString, Length, IsInt, Min, IsOptional } from 'class-validator'

export class UpdateModuloDto {
  @IsOptional()
  @IsString()
  @Length(1, 150)
  nombre?: string

  @IsOptional()
  @IsInt()
  @Min(0)
  orden?: number
}
