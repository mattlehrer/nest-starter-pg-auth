import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from 'src/user/user.service';
import { AuthService } from './auth.service';
import { AuthCredentialsDto } from './dto/auth-credentials.dto';

const credsWithUsername: AuthCredentialsDto = {
  username: 'TestUser',
  password: 'TestPassword',
};
const credsWithEmail: AuthCredentialsDto = {
  username: 'test@test.com',
  password: 'TestPassword',
};
const mockUser: any = {
  id: 1,
  ...credsWithUsername,
  validatePassword: jest.fn(() => true),
};

jest.mock('src/user/user.service');
jest.mock('@nestjs/jwt');

describe('AuthService', () => {
  let authService: AuthService;
  let userService;
  let jwtService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [AuthService, JwtService, UserService],
    }).compile();

    authService = module.get<AuthService>(AuthService);
    jwtService = module.get<JwtService>(JwtService);
    userService = module.get<UserService>(UserService);
  });

  it('should be defined', () => {
    expect(authService).toBeDefined();
  });

  describe('signUpWithPassword', () => {
    it('calls userService.signUpWithPassword(), return is Promise<User>', async () => {
      expect(userService.createWithPassword).not.toHaveBeenCalled();
      userService.createWithPassword.mockResolvedValueOnce(mockUser);

      const result = await authService.signUpWithPassword(credsWithUsername);
      expect(userService.createWithPassword).toHaveBeenCalledWith(
        credsWithUsername,
      );
      expect(userService.createWithPassword).toHaveBeenCalledTimes(1);
      expect(result.username).toBe(credsWithUsername.username);
    });
  });

  describe('validateUserPassword', () => {
    it('calls userService.findOneByUsername(), return is Promise<User>', async () => {
      expect(userService.findOneByUsername).not.toHaveBeenCalled();
      userService.findOneByUsername.mockResolvedValueOnce(mockUser);

      const result = await authService.validateUserPassword(credsWithUsername);
      expect(userService.findOneByUsername).toHaveBeenCalledWith(
        credsWithUsername.username,
      );
      expect(userService.findOneByUsername).toHaveBeenCalledTimes(1);
      expect(userService.findOneByEmail).not.toHaveBeenCalled();
      expect(result).toEqual(mockUser);
    });

    it('calls userService.findOneByEmail(), returns a User without password or salt fields', async () => {
      expect(userService.findOneByUsername).not.toHaveBeenCalled();
      expect(userService.findOneByEmail).not.toHaveBeenCalled();
      userService.findOneByUsername.mockResolvedValueOnce(undefined);
      userService.findOneByEmail.mockResolvedValueOnce(mockUser);

      const result = await authService.validateUserPassword(credsWithEmail);
      expect(userService.findOneByEmail).toHaveBeenCalledWith(
        credsWithEmail.username,
      );
      expect(userService.findOneByUsername).toHaveBeenCalledTimes(1);
      expect(userService.findOneByEmail).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockUser);
    });

    it('throws UnauthorizedException with invalid creds', async () => {
      userService.findOneByUsername.mockResolvedValue(undefined);

      expect(
        authService.validateUserPassword(credsWithUsername),
      ).rejects.toThrowError(UnauthorizedException);
    });
  });

  describe('generateJwt', () => {
    it('returns {accessToken: <token>}', () => {
      const mockToken = { accessToken: 'mock-token' };
      jwtService.sign.mockReturnValueOnce(mockToken.accessToken);

      const result = authService.generateJwtToken(mockUser);
      expect(result).toStrictEqual(mockToken);
    });
  });

  describe('validateOAuthLogin', () => {
    it('calls userService.findOrCreateOneByOAuth(), return is Promise<User>', async () => {
      expect(userService.findOrCreateOneByOAuth).not.toHaveBeenCalled();
      userService.findOrCreateOneByOAuth.mockResolvedValueOnce(mockUser);
      const profile = { id: 'FAKE_ID' };
      const accessToken = 'FAKE_ACCESS_TOKEN';
      const refreshToken = 'FAKE_REFRESH_TOKEN';

      const result = await authService.validateOAuthLogin({
        profile,
        accessToken,
        refreshToken,
      });
      expect(userService.findOrCreateOneByOAuth).toHaveBeenCalledWith({
        profile,
        accessToken,
        refreshToken,
      });
      expect(userService.findOrCreateOneByOAuth).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockUser);
    });
  });
});
