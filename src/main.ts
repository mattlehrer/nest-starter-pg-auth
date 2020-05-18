import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import * as helmet from 'helmet';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  const port = configService.get('server.port');
  app.use(helmet(configService.get('helmet')));
  app.enableCors();
  await app.listen(port);
  const logger = new Logger('Bootstrap');
  logger.log(`Application listening on port ${port}`);
}
bootstrap();
