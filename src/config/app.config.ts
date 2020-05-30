import { Response } from 'express';
import * as pino from 'pino';
import { v4 as uuid } from 'uuid';

export default (): Record<string, unknown> => ({
  env: process.env.NODE_ENV,
  server: {
    port: parseInt(process.env.PORT, 10),
    baseUrl: process.env.BASE_URL,
  },
  frontend: {
    baseUrl: process.env.FRONTEND_BASE_URL,
    loginSuccess: '/login/success/',
    loginFailure: '/login/failure/',
  },
  cors: {
    // https://github.com/expressjs/cors#configuration-options
    credentials: true,
    origin: process.env.FRONTEND_BASE_URL,
  },
  jwt: {
    expiresIn: process.env.EXPIRES_IN,
    secret: process.env.JWT_SECRET,
  },
  cookie: {
    sessionOpts: {
      // https://github.com/expressjs/cookie-session#options
      secret: process.env.COOKIE_SECRET,
      name: 'sess',
      // cookie options
      // https://github.com/pillarjs/cookies#cookiesset-name--value---options--
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 1000 * 60 * 60 * 24 * 30, // 30 days
    },
  },
  pino: {
    // https://github.com/iamolegga/nestjs-pino#configuration-params
    pinoHttp: {
      // https://github.com/pinojs/pino-http#pinohttpopts-stream
      genReqId: (
        req: Record<string, any>,
      ): { sessionId: string; reqId: string } => ({
        // https://github.com/goldbergyoni/nodebestpractices/blob/49da9e5e41bd4617856a6ecd847da5b9c299852e/sections/production/assigntransactionid.md
        sessionId: req.session?.id,
        reqId: uuid(),
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
        mixin: addContextRequest,
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
      resetPasswordEmail: 'info',
    },
    shouldSendInDev: false, // set to true to send emails when NODE_ENV is !== production
  },
});

export function addContextRequest(): Record<string, string> {
  return { context: 'Request' };
}
