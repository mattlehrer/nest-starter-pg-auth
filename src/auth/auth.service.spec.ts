import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from 'src/user/user.service';
import { AuthService } from './auth.service';
import { AuthCredentialsDto } from './dto/auth-credentials.dto';
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
      userService.createWithPassword.mockResolvedValueOnce(mockUser);

      const result = await authService.signUpWithPassword(signUpDto);

      expect(userService.createWithPassword).toHaveBeenCalledWith(signUpDto);
      expect(userService.createWithPassword).toHaveBeenCalledTimes(1);
      expect(result.username).toBe(authDto.username);
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
      expect(userService.findOneByUsername).toHaveBeenCalledTimes(1);
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
