import { NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { SignUpDto } from './dto/sign-up.dto';

jest.mock('./auth.service');
jest.mock('@nestjs/config');

const frontend = 'http://front.end';
const success = '/login/success';
const failure = '/login/failure';

beforeEach(() => {
  jest.clearAllMocks();
});

describe('Auth Controller', () => {
  let authController: AuthController;
  let authService;
  let configService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [AuthService, ConfigService],
    }).compile();

    authController = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);
    configService = module.get<ConfigService>(ConfigService);
  });

  it('should be defined', () => {
    expect(authController).toBeDefined();
  });

  describe('POST /auth/signup', () => {
    it('should call authService.signUpWithPassword', async () => {
      const signUpDto: SignUpDto = {
        username: 'TestUser',
        email: 'test@test.com',
        password: 'TestPassword',
      };

      const result = await authController.signUp(signUpDto);

      expect(authService.signUpWithPassword).toHaveBeenCalledWith(signUpDto);
      expect(result).toMatchInlineSnapshot(`undefined`);
    });
  });

  describe('POST /auth/signin', () => {
    it('should call authService.generateJwtToken and return a token', async () => {
      const mockCookie = `Authentication=MockJwt; HttpOnly; Path=/; Max-Age=0`;
      authService.createCookieWithJwt.mockReturnValueOnce(mockCookie);
      configService.get
        .mockReturnValueOnce(frontend)
        .mockReturnValueOnce(success);
      const req: any = {
        user: {
          id: 1,
          username: 'TestUser',
          email: 'test@test.com',
        },
        res: { setHeader: jest.fn(), redirect: jest.fn() },
      };

      const result = authController.signIn(req);

      expect(authService.createCookieWithJwt).toHaveBeenCalledWith(req.user);
      expect(req.res.setHeader).toHaveBeenCalledWith('Set-Cookie', mockCookie);
      expect(req.res.setHeader).toHaveBeenCalledTimes(1);
      expect(req.res.redirect).toHaveBeenCalledWith(`${frontend}${success}`);
      expect(req.res.redirect).toHaveBeenCalledTimes(1);
      expect(result).toBeUndefined();
    });
  });

  describe('POST /auth/logout', () => {
    it('should call authService.createNoAuthCookieForLogOut and return void with new cookie, reusing old cookie ID', async () => {
      const mockUuid = 'mock-uuid';
      const noAuthCookie = `Authentication=; Id=${mockUuid}; HttpOnly; Path=/; Max-Age=0`;
      authService.createNoAuthCookieForLogOut.mockReturnValueOnce(noAuthCookie);
      configService.get
        .mockReturnValueOnce(frontend)
        .mockReturnValueOnce(failure);
      const req: any = {
        user: {
          id: 1,
          username: 'TestUser',
          email: 'test@test.com',
        },
        cookies: {
          Id: mockUuid,
        },
        res: { setHeader: jest.fn(), redirect: jest.fn() },
      };

      const result = authController.logOut(req);

      expect(req.res.setHeader).toHaveBeenCalledWith(
        'Set-Cookie',
        noAuthCookie,
      );
      expect(req.res.setHeader).toHaveBeenCalledTimes(1);
      expect(req.res.redirect).toHaveBeenCalledWith(`${frontend}`);
      expect(req.res.redirect).toHaveBeenCalledTimes(1);
      expect(result).toBeUndefined();
    });

    it(`should generate new cookie ID if there isn't an old one`, async () => {
      const noAuthCookie = `Authentication=; Id=new-mock-uuid; HttpOnly; Path=/; Max-Age=0`;
      authService.createNoAuthCookieForLogOut.mockReturnValueOnce(noAuthCookie);
      configService.get.mockReturnValueOnce(frontend);
      const req: any = {
        user: {
          id: 1,
          username: 'TestUser',
          email: 'test@test.com',
        },
        res: { setHeader: jest.fn(), redirect: jest.fn() },
      };

      const result = authController.logOut(req);

      expect(req.res.setHeader).toHaveBeenCalledWith(
        'Set-Cookie',
        noAuthCookie,
      );
      expect(req.res.setHeader).toHaveBeenCalledTimes(1);
      expect(req.res.redirect).toHaveBeenCalledWith(frontend);
      expect(req.res.redirect).toHaveBeenCalledTimes(1);
      expect(authService.createNoAuthCookieForLogOut).toHaveBeenCalledWith(
        undefined,
      );
      expect(authService.createNoAuthCookieForLogOut).toHaveBeenCalledTimes(1);
      expect(result).toBeUndefined();
    });
  });

  describe('POST /auth/reset-password', () => {
    it('should call authService.forgotPassword', async () => {
      const mockForgotPassDto: ForgotPasswordDto = {
        username: 'mockuser',
      };

      await authController.forgotPassword(mockForgotPassDto);

      expect(authService.forgotPassword).toHaveBeenCalledWith(
        mockForgotPassDto,
      );
      expect(authService.forgotPassword).toHaveBeenCalledTimes(1);
    });
  });

  describe('POST /auth/reset-password/', () => {
    it('should call authService.resetPasswordVerify and return true on valid code', async () => {
      authService.resetPassword.mockResolvedValueOnce(true);
      const mockResetPasswordDto: ResetPasswordDto = {
        code: 'mock code',
        newPassword: 'newP@ssword1',
      };

      await authController.resetPassword(mockResetPasswordDto);

      expect(authService.resetPassword).toHaveBeenCalledWith(
        mockResetPasswordDto,
      );
      expect(authService.resetPassword).toHaveBeenCalledTimes(1);
    });
  });

  describe('POST /auth/reset-password/', () => {
    it('should call authService.resetPassword and throw Unauthorized on invalid code', async () => {
      authService.resetPassword.mockImplementation(() => {
        throw new NotFoundException();
      });
      const mockResetPasswordDto: ResetPasswordDto = {
        code: 'mock code',
        newPassword: 'newP@ssword1',
      };

      const error = await authController
        .resetPassword(mockResetPasswordDto)
        .catch((e) => e);

      expect(error).toBeInstanceOf(NotFoundException);
      expect(authService.resetPassword).toHaveBeenCalledWith(
        mockResetPasswordDto,
      );
      expect(authService.resetPassword).toHaveBeenCalledTimes(1);
    });
  });

  describe('GET /auth/protected', () => {
    it('should return string', () => {
      const result = authController.getProtected();

      expect(result).toMatchInlineSnapshot(`"JWT is working"`);
    });
  });

  describe('GET /auth/google', () => {
    it('should return void', () => {
      const result = authController.googleLogin();

      expect(result).toBeUndefined();
    });
  });

  describe('GET /auth/google/callback', () => {
    it('should call authService.generateJwtToken and return a token', async () => {
      const mockCookie = `Authentication=MockJwt; HttpOnly; Path=/; Max-Age=0`;
      authService.createCookieWithJwt.mockReturnValueOnce(mockCookie);
      configService.get
        .mockReturnValueOnce(frontend)
        .mockReturnValueOnce(success);
      const req: any = {
        query: { code: 'FAKE_CODE' },
        user: {
          id: 1,
          username: 'TestUser',
          email: 'test@test.com',
        },
        res: { setHeader: jest.fn(), redirect: jest.fn() },
      };

      const result = await authController.googleLoginCallback(req);

      expect(authService.createCookieWithJwt).toHaveBeenCalledWith(req.user);
      expect(req.res.setHeader).toHaveBeenCalledWith('Set-Cookie', mockCookie);
      expect(req.res.setHeader).toHaveBeenCalledTimes(1);
      expect(req.res.redirect).toHaveBeenCalledWith(`${frontend}${success}`);
      expect(req.res.redirect).toHaveBeenCalledTimes(1);
      expect(result).toBeUndefined();
    });
  });
});
