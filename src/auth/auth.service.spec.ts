import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { JwtService } from '@nestjs/jwt';
import { AuthCredentialsDto } from './dto/auth-credentials.dto';
import { UnauthorizedException } from '@nestjs/common';
import { UserService } from 'src/user/user.service';

const mockJwtService = () => ({
  sign: jest.fn(),
});

const creds: AuthCredentialsDto = {
  username: 'TestUser',
  email: 'test@test.com',
  password: 'TestPassword',
};

const mockUserService = () => ({
  create: jest.fn(),
  findOneByUsername: jest.fn(() => ({
    username: creds.username,
    password: creds.password,
    validatePassword: jest.fn(() => true),
  })),
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
      authService.signUp(creds);
      expect(userService.create).toHaveBeenCalledWith(creds);
    });
  });

  describe('signIn', () => {
    it('calls userService.findOneByUsername(), returns a token', async () => {
      const mockToken = { accessToken: 'mock-token' };
      jwtService.sign.mockReturnValue(mockToken.accessToken);

      expect(userService.findOneByUsername).not.toHaveBeenCalled();
      const result = await authService.signIn(creds);
      expect(userService.findOneByUsername).toHaveBeenCalledWith(
        creds.username,
      );
      expect(result).toStrictEqual(mockToken);
    });

    it('throws UnauthorizedException with invalid creds', async () => {
      userService.findOneByUsername.mockResolvedValue(undefined);

      expect(authService.signIn(creds)).rejects.toThrowError(
        UnauthorizedException,
      );
    });
  });
});
