import { IsString, MaxLength, MinLength } from 'class-validator';
import { IsStrongPassword } from 'src/shared/decorators/is-strong-password.decorator';

export class ResetPasswordDto {
  @IsString()
  @MinLength(50)
  @MaxLength(75)
  code: string;

  @IsStrongPassword()
  newPassword: string;
}
