import { Injectable, Scope } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';

@Injectable({ scope: Scope.TRANSIENT })
export class LoggerService extends PinoLogger {
  verbose(...args: any[]): void {
    super.trace(args);
  }

  log(...args: any[]): void {
    super.info(args);
  }
}
