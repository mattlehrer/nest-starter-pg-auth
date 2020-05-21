import { TypeOrmModuleOptions } from '@nestjs/typeorm';

export default (): Record<string, unknown> => ({
  database: {
    type: 'postgres',
    host: process.env.DB_HOSTNAME,
    port: Number(process.env.DB_PORT),
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    entities: [__dirname + '/../**/*.entity.{js,ts}'],
    synchronize: Boolean(process.env.TYPEORM_SYNC === 'true'),
  } as TypeOrmModuleOptions,
});
