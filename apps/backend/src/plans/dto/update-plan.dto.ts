import {
  IsString,
  Length,
  IsDateString,
  IsInt,
  Min,
  Max,
  IsOptional,
} from 'class-validator';

export class UpdatePlanDto {
  @IsOptional()
  @IsString()
  @Length(1, 255)
  nombre?: string;

  @IsOptional()
  @IsDateString()
  fechaInicio?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(24)
  horasPorDia?: number;
}
