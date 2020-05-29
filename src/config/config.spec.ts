import * as pino from 'pino';
import { v4 as uuid } from 'uuid';
import AppConfig from './app.config';
import DbConfig from './typeorm.config';
import ValidationSchema from './validation-schema';

const mockUuid = 'mock-uuid';
jest.mock('uuid', () => {
  return { v4: jest.fn(() => mockUuid) };
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
    describe('genReqId', () => {
      it('genReqId should call uuid, include existing session id', () => {
        const { pino } = AppConfig() as any;
        const genReqId = pino.pinoHttp.genReqId;
        const mockReq = {
          session: { id: 'mocksessid' },
        };

        const result = genReqId(mockReq);

        expect(uuid).toHaveBeenCalledWith(/* nothing */);
        expect(uuid).toHaveBeenCalledTimes(1);
        expect(result).toMatchInlineSnapshot(`
                  Object {
                    "reqId": "mock-uuid",
                    "sessionId": "mocksessid",
                  }
              `);
      });

      it('genReqId should call uuid, even if session id is undefined', () => {
        const { pino } = AppConfig() as any;
        const genReqId = pino.pinoHttp.genReqId;
        const mockReq = {
          // session: undefined,
        };

        const result = genReqId(mockReq);

        expect(uuid).toHaveBeenCalledWith(/* nothing */);
        expect(uuid).toHaveBeenCalledTimes(1);
        expect(result).toMatchInlineSnapshot(`
          Object {
            "reqId": "mock-uuid",
            "sessionId": undefined,
          }
        `);
      });
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
