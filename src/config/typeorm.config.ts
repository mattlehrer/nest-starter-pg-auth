import { TypeOrmModuleOptions } from '@nestjs/typeorm';

export const typeOrmConfig: TypeOrmModuleOptions = {
  type: 'postgres',
  host: process.env.RDS_HOSTNAME || 'localhost',
  port: Number(process.env.RDS_PORT) || 5432,
  username: process.env.RDS_USERNAME || 'postgres',
  password: process.env.RDS_PASSWORD || 'postgres',
  database: process.env.RDS_DB_NAME || 'api',
  entities: [__dirname + '/../**/*.entity.{js,ts}'],
  synchronize: Boolean(process.env.TYPEORM_SYNC) || false,
  // synchronize: Boolean(process.env.TYPEORM_SYNC) || true,
};
