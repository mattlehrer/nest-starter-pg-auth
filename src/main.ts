import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import * as cookieParser from 'cookie-parser';
import * as rateLimit from 'express-rate-limit';
import * as helmet from 'helmet';
import { v4 as uuid } from 'uuid';
import { AppModule } from './app.module';
import { LoggerService } from './logger/logger.service';
import cookieSession = require('cookie-session');

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    // logger: false,
  });
  app.useLogger(await app.resolve(LoggerService));
  const configService = app.get(ConfigService);
  app.use(helmet(configService.get('helmet')));
  app.enableCors();
  if (configService.get('env') === 'production') app.set('trust proxy', 1);
  app.use(rateLimit(configService.get('rateLimit')));
  app.use(cookieParser(configService.get('cookie.sessionOpts.secret')));
  app.use(cookieSession(configService.get('cookie.sessionOpts')));
  app.use((req, res, next) => {
    // https://github.com/goldbergyoni/nodebestpractices/blob/49da9e5e41bd4617856a6ecd847da5b9c299852e/sections/production/assigntransactionid.md
    req.session.id = req?.session?.id ? req.session.id : uuid();
    next();
  });
  const port = configService.get('server.port');
  await app.listen(port);
  const logger = await app.resolve(LoggerService);
  logger.setContext('Bootstrap');
  logger.log(`Application listening on port ${port}`);
}
bootstrap();
