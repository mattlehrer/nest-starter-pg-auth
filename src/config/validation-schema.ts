import * as Joi from '@hapi/joi';

export default Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test', 'provision')
    .default('development'),
  PORT: Joi.number().default(3000),

  //  Database
  DB_HOSTNAME: Joi.string().required(),
  DB_PORT: Joi.number().required(),
  DB_NAME: Joi.string().required(),
  DB_USERNAME: Joi.string().required(),
  DB_PASSWORD: Joi.string().required(),
  TYPEORM_SYNC: Joi.boolean().default(false),

  // JWT
  EXPIRES_IN: Joi.string().default('1d'),
  JWT_SECRET: Joi.string().required(),

  // Google
  GOOGLE_CLIENT_ID: Joi.string(),
  GOOGLE_CLIENT_SECRET: Joi.string(),
});
