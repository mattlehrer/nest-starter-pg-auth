import { Controller, Get, Response, UseGuards } from '@nestjs/common';
import { Response as IResponse } from 'express';
import * as fs from 'fs';
import * as path from 'path';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { LoggerService } from 'src/logger/logger.service';
import { Roles } from 'src/shared/decorators/roles.decorator';
import { RolesGuard } from 'src/shared/guards/roles.guard';
import { Role } from 'src/shared/interfaces/roles.enum';
import * as v8 from 'v8';
import { User } from '../user/user.entity';
import { UserService } from '../user/user.service';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN, Role.ROOT)
@Controller('admin')
export class AdminController {
  constructor(
    private readonly userService: UserService,
    private readonly logger: LoggerService,
  ) {
    this.logger.setContext(AdminController.name);
  }

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

  @Roles(Role.ROOT)
  @Get('/ops/heapdump')
  async heapdump(@Response() res: IResponse): Promise<void> {
    // https://github.com/goldbergyoni/nodebestpractices/blob/master/sections/production/createmaintenanceendpoint.md
    this.logger.log('Generating heapdump...');
    const stream = v8.getHeapSnapshot();
    const heapFilename = path.join(
      __dirname,
      '/../../heapdumps/',
      String(Date.now()) + '.heapsnapshot',
    );
    const writeStream = fs.createWriteStream(heapFilename, {
      flags: 'w',
      emitClose: true,
    });
    stream.pipe(writeStream);
    this.logger.log(`The heapdump was saved to: ${heapFilename}`);
    res.set({
      'Content-Type': 'application/json',
    });
    const file = fs.createReadStream(heapFilename);
    file.pipe(res);
  }
}
