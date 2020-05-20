import * as pino from 'pino';

export default () => ({
  server: {
    port: parseInt(process.env.PORT, 10),
    baseUrl: process.env.BASE_URL,
  },
  jwt: {
    expiresIn: process.env.EXPIRES_IN,
    secret: process.env.JWT_SECRET,
  },
  pino: {
    pinoHttp: {
      logger: pino({
        mixin() {
          return { context: 'Request' };
        },
      }),
    },
  },
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackUrl: process.env.GOOGLE_CALLBACK_URL,
  },
  helmet: {}, // for custom config
  rateLimit: {
    windowMs: 10 * 60 * 1000, // 10 minutes
    max: 100, // limit each IP to 100 requests per windowMs
  },
});
