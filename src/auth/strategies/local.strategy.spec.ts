import { UnauthorizedException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from '../auth.service';
import { LocalStrategy } from './local.strategy';

jest.mock('../auth.service');

const creds = {
  username: 'TestUser',
  password: 'TestPassword',
};

describe('Local Strategy', () => {
  let localStrategy: LocalStrategy;
  let authService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AuthService],
    }).compile();

    authService = module.get<AuthService>(AuthService);
    localStrategy = new LocalStrategy(authService);
  });

  it('should be defined', () => {
    expect(localStrategy).toBeDefined();
  });

  it('validate should call authService.validateUserPassword and return user with valid creds', async () => {
    authService.validateUserPassword.mockResolvedValueOnce(creds);
    const result = await localStrategy.validate(creds.username, creds.password);
    expect(authService.validateUserPassword).toHaveBeenCalledWith(creds);
    expect(authService.validateUserPassword).toHaveBeenCalledTimes(1);
    expect(result).toEqual(creds);
  });

  it('validate should call authService.validateUserPassword and throw UnauthorizedException with invalid creds', async () => {
    authService.validateUserPassword.mockResolvedValueOnce(undefined);
    const error = await localStrategy
      .validate(creds.username, creds.password)
      .catch((e) => e);
    expect(authService.validateUserPassword).toHaveBeenCalledWith(creds);
    expect(authService.validateUserPassword).toHaveBeenCalledTimes(1);
    expect(error).toEqual(new UnauthorizedException());
  });
});
