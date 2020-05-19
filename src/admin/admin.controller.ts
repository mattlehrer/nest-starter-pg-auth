import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { Roles } from 'src/shared/decorators/roles.decorator';
import { RolesGuard } from 'src/shared/guards/roles.guard';
import { Role } from 'src/shared/interfaces/roles.enum';
import { User } from '../user/user.entity';
import { UserService } from '../user/user.service';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN, Role.ROOT)
@Controller('admin')
export class AdminController {
  constructor(private readonly userService: UserService) {}

  @Get('/user/')
  async getAll(): Promise<User[]> {
    return await this.userService.findAll();
  }

  @Get('/user/deleted')
  async getAllDeleted(): Promise<User[]> {
    return await this.userService.findAllDeleted();
  }

  @Get('/user/including-deleted')
  async getAllIncludingDeleted(): Promise<User[]> {
    return await this.userService.findAllIncludingDeleted();
  }
}
