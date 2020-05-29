import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Request,
  UseGuards,
  UseInterceptors,
  ValidationPipe,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Roles } from 'src/shared/decorators/roles.decorator';
import { RolesGuard } from 'src/shared/guards/roles.guard';
import { Role } from 'src/shared/interfaces/roles.enum';
import { IUserRequest } from 'src/shared/interfaces/user-request.interface';
import { User } from 'src/user/user.entity';
import { AuthService } from './auth.service';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { SignUpDto } from './dto/sign-up.dto';
import { GoogleAuthGuard } from './guards/google-auth.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { LocalAuthGuard } from './guards/local-auth.guard';

@UseInterceptors(ClassSerializerInterceptor)
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

  @Post('/signup')
  signUp(@Body(ValidationPipe) signUpDto: SignUpDto): Promise<User> {
    return this.authService.signUpWithPassword(signUpDto);
  }

  @UseGuards(LocalAuthGuard)
  @HttpCode(HttpStatus.OK)
  @Post('/signin')
  public signIn(@Request() req: IUserRequest): void {
    const cookie = this.authService.createCookieWithJwt(req.user);
    req.res.setHeader('Set-Cookie', cookie);
    req.res.redirect(
      `${this.configService.get('frontend.baseUrl')}${this.configService.get(
        'frontend.loginSuccess',
      )}`,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Get('/logout')
  public logOut(@Request() req: IUserRequest): void {
    req.res.setHeader(
      'Set-Cookie',
      this.authService.createNoAuthCookieForLogOut(req.cookies?.Id),
    );
    req.res.redirect(`${this.configService.get('frontend.baseUrl')}`);
  }

  @Post('/forgot-password')
  async forgotPassword(
    @Body(ValidationPipe) forgotPasswordDto: ForgotPasswordDto,
  ): Promise<void> {
    return await this.authService.forgotPassword(forgotPasswordDto);
  }

  @Post('/reset-password/')
  async resetPassword(
    @Body(ValidationPipe) resetPasswordDto: ResetPasswordDto,
  ): Promise<boolean> {
    return await this.authService.resetPassword(resetPasswordDto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.USER)
  @Get('/protected')
  getProtected(): string {
    return `JWT is working`;
  }

  @Get('google')
  @UseGuards(GoogleAuthGuard)
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  public googleLogin(): void {}

  @Get('google/callback')
  @UseGuards(GoogleAuthGuard)
  async googleLoginCallback(@Request() req: IUserRequest): Promise<void> {
    const cookie = this.authService.createCookieWithJwt(req.user);
    req.res.setHeader('Set-Cookie', cookie);
    req.res.redirect(
      `${this.configService.get('frontend.baseUrl')}${this.configService.get(
        'frontend.loginSuccess',
      )}`,
    );
  }
}
