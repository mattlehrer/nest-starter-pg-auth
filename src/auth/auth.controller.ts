import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Get,
  Post,
  Request,
  UseGuards,
  UseInterceptors,
  ValidationPipe,
} from '@nestjs/common';
import { Roles } from 'src/shared/decorators/roles.decorator';
import { RolesGuard } from 'src/shared/guards/roles.guard';
import { Role } from 'src/shared/interfaces/roles.enum';
import { IUserRequest } from 'src/shared/interfaces/user-request.interface';
import { User } from 'src/user/user.entity';
import { AuthService } from './auth.service';
import { SignUpDto } from './dto/sign-up.dto';
import { GoogleAuthGuard } from './guards/google-auth.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { LocalAuthGuard } from './guards/local-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @UseInterceptors(ClassSerializerInterceptor)
  @Post('/signup')
  signUp(@Body(ValidationPipe) signUpDto: SignUpDto): Promise<User> {
    return this.authService.signUpWithPassword(signUpDto);
  }

  @UseGuards(LocalAuthGuard)
  @Post('/signin')
  async signIn(@Request() req: IUserRequest): Promise<{ accessToken: string }> {
    return this.authService.generateJwtToken(req.user);
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
  async googleLoginCallback(
    @Request() req: IUserRequest,
  ): Promise<{ accessToken: string }> {
    return this.authService.generateJwtToken(req.user);
  }
}
