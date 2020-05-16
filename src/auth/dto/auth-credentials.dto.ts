import { PickType } from '@nestjs/swagger';
import { SignUpDto } from './sign-up.dto';

export class AuthCredentialsDto extends PickType(SignUpDto, [
  'username',
  'password',
]) {}
