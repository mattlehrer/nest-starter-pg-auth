import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { Profile } from 'passport-github2';
import { AuthService } from '../auth.service';
import { GithubStrategy } from './github.strategy';

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
  displayName: 'Blah Blah',
  profileUrl: 'http://blah.com/blah',
  _raw: 'blah',
  _json: {
    email: 'mock@test.com',
  },
};

describe('Github Strategy', () => {
  let githubStrategy: GithubStrategy;
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
    githubStrategy = new GithubStrategy(authService, configService);
  });

  it('should be defined', () => {
    expect(githubStrategy).toBeDefined();
  });

  it('validate should call authService.validateOAuthLogin and return user with valid creds', async () => {
    authService.validateOAuthLogin.mockResolvedValueOnce(mockUser);

    const result = await githubStrategy.validate(
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

    await githubStrategy.validate(request, accessToken, refreshToken, profile);

    expect(profile._json.email).toEqual(profile.emails[0].value);
  });

  it('validate should pass profile with empty emails array', async () => {
    authService.validateOAuthLogin.mockResolvedValueOnce(mockUser);
    profile._json = {};
    profile.emails = [];

    await githubStrategy.validate(request, accessToken, refreshToken, profile);

    expect(profile._json.email).toBeUndefined();
  });

  it('validate should pass profile with undefined emails array', async () => {
    authService.validateOAuthLogin.mockResolvedValueOnce(mockUser);
    profile._json = {};
    profile.emails = undefined;

    await githubStrategy.validate(request, accessToken, refreshToken, profile);

    expect(profile._json.email).toBeUndefined();
  });
});
