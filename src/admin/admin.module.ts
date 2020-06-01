import { Module } from '@nestjs/common';
import { LoggerModule } from 'src/logger/logger.module';
import { UserModule } from 'src/user/user.module';
import { AdminController } from './admin.controller';

@Module({
  imports: [UserModule, LoggerModule],
  controllers: [AdminController],
})
export class AdminModule {}
