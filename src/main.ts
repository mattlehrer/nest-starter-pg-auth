import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import * as rateLimit from 'express-rate-limit';
import * as helmet from 'helmet';
import { AppModule } from './app.module';
import { LoggerService } from './logger/logger.service';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    logger: false,
  });
  app.useLogger(await app.resolve(LoggerService));
  const configService = app.get(ConfigService);
  app.use(helmet(configService.get('helmet')));
  app.enableCors();
  app.set('trust proxy', 1);
  app.use(rateLimit(configService.get('rateLimit')));
  const port = configService.get('server.port');
  await app.listen(port);
  const logger = await app.resolve(LoggerService);
  logger.setContext('Bootstrap');
  logger.log(`Application listening on port ${port}`);
}
bootstrap();
