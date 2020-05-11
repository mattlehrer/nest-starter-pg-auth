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
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { UpdateUserInput } from './dto/update-user.dto';
import { User } from './user.entity';
import { UserService } from './user.service';

@UseInterceptors(ClassSerializerInterceptor)
@Controller('user')
export class UserController {
  constructor(private userService: UserService) {}

  @UseGuards(JwtAuthGuard)
  @Get('/me')
  async getMe(@Request() req): Promise<User> {
    return await this.userService.findOneById(req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Post('/me')
  async updateMe(
    @Request() req,
    @Body(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
      }),
    )
    updateUserInput: UpdateUserInput,
  ): Promise<User> {
    return await this.userService.update(req.user, updateUserInput);
  }
}
