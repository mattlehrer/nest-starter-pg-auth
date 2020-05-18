import {
  ClassSerializerInterceptor,
  Controller,
  Get,
  NotFoundException,
  Param,
  UseInterceptors,
} from '@nestjs/common';
import { User } from './user.entity';
import { UserService } from './user.service';

@UseInterceptors(ClassSerializerInterceptor)
@Controller('user')
export class UserController {
  constructor(private userService: UserService) {}

  @Get('/:username')
  async getByUsername(@Param('username') username: string): Promise<User> {
    const user = await this.userService.findOneByUsername(username);
    if (user) return user;
    throw new NotFoundException();
  }
}
