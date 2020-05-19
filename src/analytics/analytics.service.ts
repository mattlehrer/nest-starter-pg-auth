import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { classToPlain } from 'class-transformer';
import { InjectEventEmitter } from 'nest-emitter';
import { User } from 'src/user/user.entity';
import { UserEventEmitter } from 'src/user/user.events';

@Injectable()
export class AnalyticsService implements OnModuleInit {
  private logger = new Logger(AnalyticsService.name);
  constructor(
    @InjectEventEmitter() private readonly emitter: UserEventEmitter,
  ) {}
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
