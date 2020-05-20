import { Injectable, OnModuleInit } from '@nestjs/common';
import { classToPlain } from 'class-transformer';
import { InjectEventEmitter } from 'nest-emitter';
import { LoggerService } from 'src/logger/logger.service';
import { User } from 'src/user/user.entity';
import { UserEventEmitter } from 'src/user/user.events';

@Injectable()
export class AnalyticsService implements OnModuleInit {
  constructor(
    @InjectEventEmitter() private readonly emitter: UserEventEmitter,
    private readonly logger: LoggerService,
  ) {
    this.logger.setContext(AnalyticsService.name);
  }
  onModuleInit() {
    this.emitter.on('newUser', async (user) => await this.onNewUser(user));
  }
  async onNewUser(userObj: User): Promise<void> {
    const user = classToPlain(userObj);
    this.logger.debug(
      `Ready to send ${JSON.stringify(user, null, 2)} to analytics service`,
    );
  }
}
