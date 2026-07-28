import {
  IsString,
  Length,
  IsIn,
  IsInt,
  Min,
  IsOptional,
} from 'class-validator';

const TIPOS_DATO = ['texto', 'numero', 'fecha', 'booleano'];

export class CreateCampoDto {
  @IsString()
  @Length(1, 150)
  nombre: string;

  @IsOptional()
  @IsIn(TIPOS_DATO)
  tipoDato?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  orden?: number;
}
