import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { User } from 'src/user/user.entity';
import { UserService } from 'src/user/user.service';
import { AuthCredentialsDto } from './dto/auth-credentials.dto';
import { JwtPayload } from './strategies/jwt-payload.interface';

@Injectable()
export class AuthService {
  constructor(
    private userService: UserService,
    private jwtService: JwtService,
  ) {}

  async signUpWithPassword(
    authCredentialsDto: AuthCredentialsDto,
  ): Promise<void> {
    return await this.userService.createWithPassword(authCredentialsDto);
  }

  async validateUserPassword(
    authCredentialsDto: AuthCredentialsDto,
  ): Promise<any> {
    let user = await this.userService.findOneByUsername(
      authCredentialsDto.username,
    );
    if (!user) {
      user = await this.userService.findOneByEmail(authCredentialsDto.username);
    }

    if (!user || !(await user.validatePassword(authCredentialsDto.password))) {
      throw new UnauthorizedException('Invalid credentials');
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, salt, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  async validateOAuthLogin({
    profile,
    accessToken = '',
    refreshToken = '',
  }: {
    profile: any;
    accessToken: string;
    refreshToken: string;
  }): Promise<any> {
    const user = await this.userService.findOrCreateOneByOAuth({
      profile,
      accessToken,
      refreshToken,
    });

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, salt, tokens, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  public generateJwtToken(user: User) {
    const payload: JwtPayload = { username: user.username, sub: user.id };
    const accessToken = this.jwtService.sign(payload);
    // this.logger.debug(
    //   `Generated JWT Token with payload ${JSON.stringify(payload)}`,
    // );
    return { accessToken };
  }
}
