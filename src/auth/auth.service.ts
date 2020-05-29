import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { isEmail } from 'class-validator';
import { User } from 'src/user/user.entity';
import { UserService } from 'src/user/user.service';
import { AuthCredentialsDto } from './dto/auth-credentials.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { SignUpDto } from './dto/sign-up.dto';
import { JwtPayload } from './strategies/jwt-payload.interface';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async signUpWithPassword(signUpDto: SignUpDto): Promise<User> {
    return await this.userService.createWithPassword(signUpDto);
  }

  async forgotPassword(forgotPasswordDto: ForgotPasswordDto): Promise<void> {
    return await this.userService.sendResetPasswordEmail(forgotPasswordDto);
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto): Promise<boolean> {
    return await this.userService.resetPassword(resetPasswordDto);
  }

  async validateUserPassword(
    authCredentialsDto: AuthCredentialsDto,
  ): Promise<any> {
    const user = isEmail(authCredentialsDto.username)
      ? await this.userService.findOneByEmail(authCredentialsDto.username)
      : await this.userService.findOneByUsername(authCredentialsDto.username);

    if (!user || !(await user.validatePassword(authCredentialsDto.password))) {
      throw new UnauthorizedException('Invalid credentials');
    }
    return user;
  }

  async validateOAuthLogin({
    profile,
    accessToken,
    refreshToken,
    code,
  }: {
    profile: any;
    accessToken: string;
    refreshToken: string;
    code: string;
  }): Promise<User> {
    return await this.userService.findOrCreateOneByOAuth({
      profile,
      accessToken,
      refreshToken,
      code,
    });
  }

  public generateJwtToken(user: Partial<User>): { accessToken: string } {
    const payload: JwtPayload = {
      username: user.username,
      sub: user.id,
      roles: user.roles,
    };
    const accessToken = this.jwtService.sign(payload);
    return { accessToken };
  }
}
