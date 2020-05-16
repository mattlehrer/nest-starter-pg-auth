import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from '../auth.service';
import { GoogleStrategy } from './google.strategy';

jest.mock('../auth.service');
jest.mock('@nestjs/config');

const mockUser: any = {
  id: 1,
  username: 'SOME_USER',
};

const request: any = { query: { code: 'FAKE_CODE' } };
const accessToken = 'FAKE_ACCESS_TOKEN';
const refreshToken = 'FAKE_REFRESH_TOKEN';
const profile = {};

describe('Google Strategy', () => {
  let googleStrategy: GoogleStrategy;
  let authService;
  let configService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [AuthService, ConfigService],
    }).compile();

    authService = module.get<AuthService>(AuthService);
    configService = module.get<ConfigService>(ConfigService);
    configService.get.mockReturnValue('SOME STRING');
    googleStrategy = new GoogleStrategy(authService, configService);
  });

  it('should be defined', () => {
    expect(googleStrategy).toBeDefined();
  });

  it('validate should call authService.validateOAuthLogin and return user with valid creds', async () => {
    authService.validateOAuthLogin.mockResolvedValueOnce(mockUser);
    const result = await googleStrategy.validate(
      request,
      accessToken,
      refreshToken,
      profile,
    );

    expect(authService.validateOAuthLogin).toHaveBeenCalledWith({
      code: request.query.code,
      profile,
      accessToken,
      refreshToken,
    });
    expect(authService.validateOAuthLogin).toHaveBeenCalledTimes(1);
    expect(result).toEqual(mockUser);
  });
});
