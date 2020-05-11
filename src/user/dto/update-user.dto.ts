import {
  IsBoolean,
  IsEmail,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { IsStrongPassword } from 'src/shared/decorators/is-strong-password.decorator';
import { IsRequiredWith } from '../../shared/decorators/is-required-with.decorator';

export class UpdatePasswordInput {
  @IsString()
  oldPassword: string;

  @IsStrongPassword()
  newPassword: string;
}

export class UpdateUserInput {
  @IsOptional()
  @IsString()
  @MinLength(4)
  @MaxLength(20)
  username?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsRequiredWith(['newPassword'])
  @IsOptional()
  @IsString()
  oldPassword: string;

  @IsRequiredWith(['oldPassword'])
  @IsOptional()
  @IsStrongPassword()
  newPassword: string;
}
