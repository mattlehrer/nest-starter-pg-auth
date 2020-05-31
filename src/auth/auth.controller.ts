import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  InternalServerErrorException,
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
import { FacebookAuthGuard } from './guards/facebook-auth.guard';
import { GithubAuthGuard } from './guards/github-auth.guard';
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
    this.addJwtToCookie(req);
    // redirect on frontend
    // https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS/Errors/CORSExternalRedirectNotAllowed
  }

  @UseGuards(JwtAuthGuard)
  @Get('/logout')
  public logOut(@Request() req: IUserRequest): void {
    req.session = null;
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
    this.addJwtToCookie(req);
    req.res.redirect(
      HttpStatus.TEMPORARY_REDIRECT,
      `${this.configService.get('frontend.baseUrl')}${this.configService.get(
        'frontend.loginSuccess',
      )}`,
    );
  }

  @Get('facebook')
  @UseGuards(FacebookAuthGuard)
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  public facebookLogin(): void {}

  @Get('facebook/callback')
  @UseGuards(FacebookAuthGuard)
  async facebookLoginCallback(@Request() req: IUserRequest): Promise<void> {
    this.addJwtToCookie(req);
    req.res.redirect(
      HttpStatus.TEMPORARY_REDIRECT,
      `${this.configService.get('frontend.baseUrl')}${this.configService.get(
        'frontend.loginSuccess',
      )}`,
    );
  }

  @Get('github')
  @UseGuards(GithubAuthGuard)
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  public githubLogin(): void {}

  @Get('github/callback')
  @UseGuards(GithubAuthGuard)
  async githubLoginCallback(@Request() req: IUserRequest): Promise<void> {
    this.addJwtToCookie(req);
    req.res.redirect(
      HttpStatus.TEMPORARY_REDIRECT,
      `${this.configService.get('frontend.baseUrl')}${this.configService.get(
        'frontend.loginSuccess',
      )}`,
    );
  }

  private addJwtToCookie(req: IUserRequest) {
    try {
      req.session.jwt = this.authService.generateJwtToken(req.user).accessToken;
    } catch (err) {
      throw new InternalServerErrorException(
        err,
        'Problem with cookie-session middleware?',
      );
    }
  }
}
