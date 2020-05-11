import {
  IsEmail,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { IsStrongPassword } from '../../shared/decorators/is-strong-password.decorator';

export class AuthCredentialsDto {
  @IsOptional()
  @IsString()
  @MinLength(4)
  @MaxLength(20)
  username?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsStrongPassword()
  password: string;
}
