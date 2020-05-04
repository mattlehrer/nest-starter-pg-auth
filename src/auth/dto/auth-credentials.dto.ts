import {
  IsString,
  MinLength,
  MaxLength,
  Matches,
  IsOptional,
  IsEmail,
} from 'class-validator';

export class AuthCredentialsDto {
  @IsOptional()
  @IsString()
  @MinLength(4)
  @MaxLength(20)
  username: string;

  @IsOptional()
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  @MaxLength(40)
  @Matches(/((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/, {
    message: 'password too weak',
  })
  password: string;
}
