import * as hash from 'object-hash';
import * as pino from 'pino';
import AppConfig from './app.config';
import DbConfig from './typeorm.config';
import ValidationSchema from './validation-schema';

const mockHash = 'MOCKHASH';
jest.mock('object-hash', () => {
  return jest.fn(() => mockHash);
});

jest.mock('pino');

beforeEach(() => {
  jest.clearAllMocks();
});

describe('app.config', () => {
  it('app.config should be a function', () => {
    expect(typeof AppConfig).toBe('function');
  });
  it('app.config() should be json object', () => {
    expect(typeof AppConfig()).toBe('object');
  });
  describe('pino.pinoHttp', () => {
    it('genReqId should call object-hash', () => {
      const { pino } = AppConfig() as any;
      const genReqId = pino.pinoHttp.genReqId;
      const mockReq = {
        remoteAddress: 'localhost',
        headers: {
          ['user-agent']: 'header',
          authorization: 'true',
        },
      };

      const result = genReqId(mockReq);

      expect(hash).toHaveBeenCalledWith({
        remote: mockReq.remoteAddress,
        agent: mockReq.headers['user-agent'],
        authorization: mockReq.headers.authorization,
      });
      expect(hash).toHaveBeenCalledTimes(1);
      expect(result).toBe(mockHash);
    });

    it('customLogLevel should be a callback, return info for res.statuscode < 400', () => {
      const { pino } = AppConfig() as any;
      const customLogLevel = pino.pinoHttp.customLogLevel;
      const mockRes = {
        statusCode: 200,
      };
      const error = null;

      const result = customLogLevel(mockRes, error);

      expect(result).toBe('info');
    });

    it('customLogLevel should be a callback, return warn for res.statuscode >= 400', () => {
      const { pino } = AppConfig() as any;
      const customLogLevel = pino.pinoHttp.customLogLevel;
      const mockRes = {
        statusCode: 400,
      };
      const error = null;

      const result = customLogLevel(mockRes, error);

      expect(result).toBe('warn');
    });

    it('customLogLevel should be a callback, return error for res.statuscode >= 500', () => {
      const { pino } = AppConfig() as any;
      const customLogLevel = pino.pinoHttp.customLogLevel;
      const mockRes = {
        statusCode: 500,
      };
      const error = null;

      const result = customLogLevel(mockRes, error);

      expect(result).toBe('error');
    });

    it('customLogLevel should be a callback, return error on errors', () => {
      const { pino } = AppConfig() as any;
      const customLogLevel = pino.pinoHttp.customLogLevel;
      const mockRes = {
        statusCode: 208,
      };
      const error = new Error();

      const result = customLogLevel(mockRes, error);

      expect(result).toBe('error');
    });

    it('logger should call pino', () => {
      AppConfig() as any;

      expect(pino).toHaveBeenCalledWith({ mixin: expect.any(Function) });
      expect(pino).toHaveBeenCalledTimes(1);
    });
  });
});

describe('typeorm.config', () => {
  const dbConfig = DbConfig();
  it('typeorm.config should be a function', () => {
    expect(typeof DbConfig).toBe('function');
  });
  it('typeorm.config() should be json object', () => {
    expect(typeof dbConfig).toBe('object');
  });
  it('typeorm.config.database should be defined', () => {
    expect(dbConfig.database).toBeDefined();
  });
});

describe('validation-schema', () => {
  it('validation-schema should be defined', () => {
    expect(typeof ValidationSchema).toBe('object');
  });
});
