import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from 'src/user/user.service';
import { AuthService } from './auth.service';
import { AuthCredentialsDto } from './dto/auth-credentials.dto';

const mockJwtService = () => ({
  sign: jest.fn(),
});

const credsWithUsername: AuthCredentialsDto = {
  username: 'TestUser',
  password: 'TestPassword',
};
const credsWithEmail: AuthCredentialsDto = {
  username: 'test@test.com',
  password: 'TestPassword',
};

const mockUserService = () => ({
  create: jest.fn(),
  findOneByUsername: jest.fn((username: string) =>
    !username || username.includes('@')
      ? null
      : {
          ...credsWithUsername,
          validatePassword: jest.fn(() => true),
        },
  ),
  findOneByEmail: jest.fn((username: string) =>
    !username || !username.includes('@')
      ? null
      : {
          ...credsWithUsername,
          validatePassword: jest.fn(() => true),
        },
  ),
});

describe('AuthService', () => {
  let authService: AuthService;
  let userService;
  let jwtService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: JwtService, useFactory: mockJwtService },
        { provide: UserService, useFactory: mockUserService },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
    jwtService = module.get<JwtService>(JwtService);
    userService = module.get<UserService>(UserService);
  });

  it('should be defined', () => {
    expect(authService).toBeDefined();
  });

  describe('signUp', () => {
    it('calls userRepository.signUp(), return is void', () => {
      expect(userService.create).not.toHaveBeenCalled();
      authService.signUp(credsWithUsername);
      expect(userService.create).toHaveBeenCalledWith(credsWithUsername);
    });
  });

  describe('validateUserPassword', () => {
    it('calls userService.findOneByUsername(), returns a User without password or salt fields', async () => {
      expect(userService.findOneByUsername).not.toHaveBeenCalled();
      expect(userService.findOneByEmail).not.toHaveBeenCalled();
      const result = await authService.validateUserPassword(credsWithUsername);
      expect(userService.findOneByUsername).toHaveBeenCalledWith(
        credsWithUsername.username,
      );
      expect(result).toBeDefined();
      expect(result.username).toBe(credsWithUsername.username);
      expect(result.password).not.toBeDefined();
    });

    it('calls userService.findOneByEmail(), returns a User without password or salt fields', async () => {
      expect(userService.findOneByUsername).not.toHaveBeenCalled();
      expect(userService.findOneByEmail).not.toHaveBeenCalled();
      const result = await authService.validateUserPassword(credsWithEmail);
      expect(userService.findOneByEmail).toHaveBeenCalledWith(
        credsWithEmail.username,
      );
      expect(result).toBeDefined();
      expect(result.username).toBe(credsWithUsername.username);
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
      jwtService.sign.mockReturnValue(mockToken.accessToken);
      const result = authService.generateJwtToken(credsWithUsername.username);
      expect(result).toStrictEqual(mockToken);
    });
  });
});
