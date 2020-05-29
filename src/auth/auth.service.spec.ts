import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from 'src/user/user.service';
import { v4 as uuid } from 'uuid';
import { AuthService } from './auth.service';
import { AuthCredentialsDto } from './dto/auth-credentials.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { SignUpDto } from './dto/sign-up.dto';

const authDto: AuthCredentialsDto = {
  username: 'TestUser',
  password: 'TestPassword',
};
const authDtoWithEmailAsUsername: AuthCredentialsDto = {
  username: 'test@test.com',
  password: 'TestPassword',
};
const signUpDto: SignUpDto = {
  username: authDto.username,
  email: authDtoWithEmailAsUsername.username,
  password: authDto.password,
};
const mockUser: any = {
  id: 1,
  ...signUpDto,
  validatePassword: jest.fn(() => true),
};
const forgotPassDto: ForgotPasswordDto = {
  username: 'mock',
};

jest.mock('src/user/user.service');
jest.mock('@nestjs/jwt');
jest.mock('@nestjs/config');
jest.mock('uuid', () => ({
  v4: jest.fn(() => 'mock-uuid'),
}));

describe('AuthService', () => {
  let authService: AuthService;
  let userService;
  let jwtService;
  let configService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [AuthService, JwtService, UserService, ConfigService],
    }).compile();

    authService = module.get<AuthService>(AuthService);
    jwtService = module.get<JwtService>(JwtService);
    userService = module.get<UserService>(UserService);
    configService = module.get<ConfigService>(ConfigService);
  });

  it('should be defined', () => {
    expect(authService).toBeDefined();
  });

  describe('signUpWithPassword', () => {
    it('calls userService.signUpWithPassword(), return is Promise<User>', async () => {
      userService.createWithPassword.mockResolvedValueOnce(mockUser);

      const result = await authService.signUpWithPassword(signUpDto);

      expect(userService.createWithPassword).toHaveBeenCalledWith(signUpDto);
      expect(userService.createWithPassword).toHaveBeenCalledTimes(1);
      expect(result.username).toBe(authDto.username);
    });
  });

  describe('forgotPassword', () => {
    it('calls userService.sendResetPasswordEmail', async () => {
      const result = await authService.forgotPassword(forgotPassDto);

      expect(userService.sendResetPasswordEmail).toHaveBeenCalledWith(
        forgotPassDto,
      );
      expect(userService.sendResetPasswordEmail).toHaveBeenCalledTimes(1);
      expect(result).toBeNull;
    });
  });

  describe('resetPassword', () => {
    it('calls userService.resetPassword with valid token', async () => {
      const mockResetPasswordDto = {
        code: 'mock code',
        newPassword: 'new!P2ssword',
      };
      userService.resetPassword.mockResolvedValue(true);

      const result = await authService.resetPassword(mockResetPasswordDto);

      expect(userService.resetPassword).toHaveBeenCalledWith(
        mockResetPasswordDto,
      );
      expect(userService.resetPassword).toHaveBeenCalledTimes(1);
      expect(result).toBe(true);
    });

    it('should throw on invalid token', async () => {
      const mockResetPasswordDto = {
        code: 'mock code',
        newPassword: 'new!P2ssword',
      };
      userService.resetPassword.mockRejectedValueOnce(
        new UnauthorizedException(),
      );

      const error = await authService
        .resetPassword(mockResetPasswordDto)
        .catch((e) => e);

      expect(userService.resetPassword).toHaveBeenCalledWith(
        mockResetPasswordDto,
      );
      expect(userService.resetPassword).toHaveBeenCalledTimes(1);
      expect(error).toBeInstanceOf(UnauthorizedException);
    });
  });

  describe('validateUserPassword', () => {
    it('when authDto has username and correct password, calls userService.findOneByUsername, returns User', async () => {
      userService.findOneByUsername.mockResolvedValueOnce(mockUser);

      const result = await authService.validateUserPassword(authDto);

      expect(userService.findOneByUsername).toHaveBeenCalledWith(
        authDto.username,
      );
      expect(userService.findOneByUsername).toHaveBeenCalledTimes(1);
      expect(userService.findOneByEmail).not.toHaveBeenCalled();
      expect(mockUser.validatePassword).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockUser);
    });

    it('when authDto has email in username field and correct password, calls userService.findOneByEmail, returns User', async () => {
      expect(userService.findOneByUsername).not.toHaveBeenCalled();
      expect(userService.findOneByEmail).not.toHaveBeenCalled();
      userService.findOneByUsername.mockResolvedValueOnce(undefined);
      userService.findOneByEmail.mockResolvedValueOnce(mockUser);

      const result = await authService.validateUserPassword(
        authDtoWithEmailAsUsername,
      );

      expect(userService.findOneByEmail).toHaveBeenCalledWith(
        authDtoWithEmailAsUsername.username,
      );
      expect(userService.findOneByUsername).not.toHaveBeenCalled();
      expect(userService.findOneByEmail).toHaveBeenCalledTimes(1);
      expect(mockUser.validatePassword).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockUser);
    });

    it('throws UnauthorizedException with invalid password', async () => {
      userService.findOneByUsername.mockResolvedValue(undefined);

      const error = await authService
        .validateUserPassword(authDto)
        .catch((e) => e);

      expect(error).toBeInstanceOf(UnauthorizedException);
      expect(error).toMatchInlineSnapshot(`[Error: Invalid credentials]`);
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

  describe('createCookieWithJwt', () => {
    it('returns a cookie string with Authentication', () => {
      const mockJwt = 'MockJwt';
      jwtService.sign.mockReturnValueOnce(mockJwt);
      configService.get.mockReturnValueOnce('2592000');
      const mockCookie = `Authentication=${mockJwt}; Id=mock-uuid; HttpOnly; Path=/; Max-Age=2592000`;

      const result = authService.createCookieWithJwt(mockUser);

      expect(result).toBe(mockCookie);
      expect(uuid).toHaveBeenCalledWith(/* nothing */);
      expect(uuid).toHaveBeenCalledTimes(1);
      expect(jwtService.sign).toHaveBeenCalledTimes(1);
      expect(configService.get).toHaveBeenCalledWith('cookie.expiresIn');
      expect(configService.get).toHaveBeenCalledTimes(1);
    });
  });

  describe('createNoAuthCookieForLogOut', () => {
    it('returns a cookie string with Authentication and reuses Id', () => {
      const result = authService.createNoAuthCookieForLogOut('mock-uuid');

      expect(uuid).not.toHaveBeenCalled();
      expect(result).toMatchInlineSnapshot(
        `"Authentication=; Id=mock-uuid; HttpOnly; Path=/; Max-Age=0"`,
      );
    });

    it('returns a cookie string with Authentication and generates new Id', () => {
      const result = authService.createNoAuthCookieForLogOut(undefined);

      expect(uuid).toHaveBeenCalledWith(/* nothing */);
      expect(uuid).toHaveBeenCalledTimes(1);
      expect(result).toMatchInlineSnapshot(
        `"Authentication=; Id=mock-uuid; HttpOnly; Path=/; Max-Age=0"`,
      );
    });
  });

  describe('validateOAuthLogin', () => {
    it('calls userService.findOrCreateOneByOAuth(), return is Promise<User>', async () => {
      userService.findOrCreateOneByOAuth.mockResolvedValueOnce(mockUser);
      const profile = { id: 'FAKE_ID' };
      const accessToken = 'FAKE_ACCESS_TOKEN';
      const refreshToken = 'FAKE_REFRESH_TOKEN';
      const code = 'FAKE_CODE';

      const result = await authService.validateOAuthLogin({
        profile,
        accessToken,
        refreshToken,
        code,
      });

      expect(userService.findOrCreateOneByOAuth).toHaveBeenCalledWith({
        profile,
        accessToken,
        refreshToken,
        code,
      });
      expect(userService.findOrCreateOneByOAuth).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockUser);
    });
  });
});
