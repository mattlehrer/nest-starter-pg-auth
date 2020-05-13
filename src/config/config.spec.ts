import AppConfig from './app.config';
import DbConfig from './typeorm.config';
import ValidationSchema from './validation-schema';

describe('app.config', () => {
  it('app.config should be a function', () => {
    expect(typeof AppConfig).toBe('function');
  });
  it('app.config() should be json object', () => {
    expect(typeof AppConfig()).toBe('object');
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
