import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';
import { EventEmitter } from 'events';
import { NestEmitterModule } from 'nest-emitter';
import { AuthModule } from './auth/auth.module';
import appConfig from './config/app.config';
import databaseConfig from './config/typeorm.config';
import validationSchema from './config/validation-schema';
import { UserModule } from './user/user.module';
import { AnalyticsModule } from './analytics/analytics.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [appConfig, databaseConfig],
      validationSchema,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) =>
        configService.get('database') as TypeOrmModuleOptions,
    }),
    AuthModule,
    UserModule,
    NestEmitterModule.forRoot(new EventEmitter()),
    AnalyticsModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
