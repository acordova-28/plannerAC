import { IsEmail, IsString, Length } from 'class-validator';

export class CreateUserDto {
  @IsString()
  @Length(1, 100)
  ldapUid: string;

  @IsString()
  @Length(1, 150)
  nombre: string;

  @IsEmail()
  email: string;
}
