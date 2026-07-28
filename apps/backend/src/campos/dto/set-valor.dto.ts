import { IsString, IsOptional } from 'class-validator';

export class SetValorDto {
  @IsOptional()
  @IsString()
  valor: string | null;
}
