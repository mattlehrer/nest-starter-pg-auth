export default () => ({
  server: {
    port: parseInt(process.env.PORT, 10) || 3000,
  },
  database: {
    type: 'postgres',
    host: process.env.DB_HOSTNAME || 'localhost',
    port: Number(process.env.DB_PORT) || 5432,
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_NAME || 'api',
    entities: [__dirname + '/../**/*.entity.{js,ts}'],
    synchronize: Boolean(process.env.TYPEORM_SYNC === 'true') || false,
    // synchronize: Boolean(process.env.TYPEORM_SYNC === 'true') || true,
  },
  jwt: {
    expiresIn: process.env.EXPIRES_IN || '1d',
    secret: process.env.JWT_SECRET,
  },
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  },
});
