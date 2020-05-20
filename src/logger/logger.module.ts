import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { LoggerModule as PinoModule } from 'nestjs-pino';
import { PARAMS_PROVIDER_TOKEN } from 'nestjs-pino/dist/constants';
import { LoggerService } from './logger.service';

@Global()
@Module({
  imports: [
    PinoModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (config: ConfigService) => config.get('pino'),
    }),
  ],
  providers: [
    LoggerService,
    {
      provide: PARAMS_PROVIDER_TOKEN,
      useValue: {},
    },
  ],
  exports: [LoggerService],
})
export class LoggerModule {}
