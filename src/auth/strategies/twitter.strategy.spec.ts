import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { Profile } from 'passport-twitter';
import { AuthService } from '../auth.service';
import { TwitterStrategy } from './twitter.strategy';

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
  provider: 'twitter',
  id: '13343',
  username: 'twitteruser',
  displayName: 'Blah Blah',
  _raw: 'blah',
  _json: {
    email: 'mock@test.com',
  },
  gender: undefined,
  _accessLevel: undefined,
};

describe('Twitter Strategy', () => {
  let twitterStrategy: TwitterStrategy;
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
    twitterStrategy = new TwitterStrategy(authService, configService);
  });

  it('should be defined', () => {
    expect(twitterStrategy).toBeDefined();
  });

  it('validate should call authService.validateOAuthLogin and return user with valid creds', async () => {
    authService.validateOAuthLogin.mockResolvedValueOnce(mockUser);

    const result = await twitterStrategy.validate(
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

  it('validate should use default email if no public profile email is included', async () => {
    authService.validateOAuthLogin.mockResolvedValueOnce(mockUser);
    profile._json = {};
    profile.emails = [{ value: 'mock@mail.com' }];

    await twitterStrategy.validate(request, accessToken, refreshToken, profile);

    expect(profile._json.email).toEqual(profile.emails[0].value);
  });

  it('validate should pass profile with empty emails array', async () => {
    authService.validateOAuthLogin.mockResolvedValueOnce(mockUser);
    profile._json = {};
    profile.emails = [];

    await twitterStrategy.validate(request, accessToken, refreshToken, profile);

    expect(profile._json.email).toBeUndefined();
  });

  it('validate should pass profile with undefined emails array', async () => {
    authService.validateOAuthLogin.mockResolvedValueOnce(mockUser);
    profile._json = {};
    profile.emails = undefined;

    await twitterStrategy.validate(request, accessToken, refreshToken, profile);

    expect(profile._json.email).toBeUndefined();
  });
});
