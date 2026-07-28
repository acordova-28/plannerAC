import {
  IsString,
  Length,
  IsNumber,
  Min,
  Max,
  IsIn,
  IsInt,
  IsOptional,
  IsArray,
  IsUUID,
  IsDateString,
} from 'class-validator';

const PRIORIDADES = ['Alta', 'Media', 'Baja'];
const ESTADOS = ['Pendiente', 'En progreso', 'Completado', 'Bloqueado'];
const TIPOS = ['Frontend', 'Backend', 'Front/Back'];

export class UpdateTaskDto {
  @IsOptional()
  @IsString()
  @Length(1, 1000)
  nombre?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  horasEstimadas?: number | null;

  @IsOptional()
  @IsNumber()
  @Min(0)
  horasBaseline?: number | null;

  @IsOptional()
  @IsIn(PRIORIDADES)
  prioridad?: string;

  @IsOptional()
  @IsIn(ESTADOS)
  estado?: string;

  @IsOptional()
  @IsIn(TIPOS)
  tipo?: string | null;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  porcentajeProgreso?: number;

  @IsOptional()
  @IsDateString()
  fechaInicio?: string | null;

  @IsOptional()
  @IsString()
  description?: string | null;

  @IsOptional()
  @IsString()
  notes?: string | null;

  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  responsableIds?: string[];
}
