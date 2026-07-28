import {
  IsString,
  Length,
  IsInt,
  Min,
  IsOptional,
  Matches,
} from 'class-validator';

export class UpdateModuloDto {
  @IsOptional()
  @IsString()
  @Length(1, 150)
  nombre?: string;

  @IsOptional()
  @IsString()
  @Matches(/^#[0-9a-fA-F]{6}$/)
  color?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  orden?: number;
}
