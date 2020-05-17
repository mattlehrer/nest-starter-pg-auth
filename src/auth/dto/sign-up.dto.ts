import { IsEmail } from 'class-validator';
import { AuthCredentialsDto } from './auth-credentials.dto';

export class SignUpDto extends AuthCredentialsDto {
  @IsEmail()
  email: string;
}
