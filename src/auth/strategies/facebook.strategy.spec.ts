import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { Profile } from 'passport-facebook';
import { AuthService } from '../auth.service';
import { FacebookStrategy } from './facebook.strategy';

jest.mock('../auth.service');
jest.mock('@nestjs/config');

const mockUser: any = {
  id: 1,
  username: 'SOME_USER',
};

const request: any = { query: { code: 'FAKE_CODE' } };
const accessToken = 'FAKE_ACCESS_TOKEN';
const refreshToken = 'FAKE_REFRESH_TOKEN';
const profile: Profile = {
  provider: 'blah',
  id: '13343',
  birthday: undefined,
  displayName: 'Blah Blah',
  profileUrl: 'http://blah.com/blah',
  _raw: 'blah',
  _json: {},
};

describe('Facebook Strategy', () => {
  let facebookStrategy: FacebookStrategy;
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
    facebookStrategy = new FacebookStrategy(authService, configService);
  });

  it('should be defined', () => {
    expect(facebookStrategy).toBeDefined();
  });

  it('validate should call authService.validateOAuthLogin and return user with valid creds', async () => {
    authService.validateOAuthLogin.mockResolvedValueOnce(mockUser);

    const result = await facebookStrategy.validate(
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
