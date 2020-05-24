import { Response } from 'express';
import * as hash from 'object-hash';
import * as pino from 'pino';

export default (): Record<string, unknown> => ({
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
      genReqId: (req: Record<string, any>): string =>
        hash({
          remote: req.remoteAddress,
          agent: req.headers['user-agent'],
          authorization: req.headers.authorization,
        }),
      customLogLevel: (res: Response, err: Error): string => {
        if (res.statusCode >= 500 || err) {
          return 'error';
        } else if (res.statusCode >= 400) {
          return 'warn';
        }
        return 'info';
      },
      logger: pino({
        mixin(): Record<string, string> {
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
  email: {
    sendGridApiKey: process.env.SENDGRID_API_KEY,
    domain: process.env.SENDGRID_DOMAIN,
    from: {
      verifyEmail: 'info',
    },
  },
});
