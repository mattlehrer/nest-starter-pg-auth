import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { SignUpDto } from './dto/sign-up.dto';

jest.mock('./auth.service');
beforeEach(() => {
  jest.clearAllMocks();
});

describe('Auth Controller', () => {
  let authController: AuthController;
  let authService: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [AuthService],
    }).compile();

    authController = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(authController).toBeDefined();
  });

  describe('/auth/signUp', () => {
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

  describe('/auth/signin', () => {
    it('should call authService.generateJwtToken and return a token', async () => {
      const mockJwt = 'FAKE_JWT';
      authService.generateJwtToken.mockReturnValueOnce(mockJwt);
      const req: any = {
        user: {
          id: 1,
          username: 'TestUser',
          email: 'test@test.com',
        },
      };

      const result = await authController.signIn(req);

      expect(authService.generateJwtToken).toHaveBeenCalledWith(req.user);
      expect(result).toBe(mockJwt);
    });
  });

  describe('/auth/protected', () => {
    it('should return string', () => {
      const result = authController.getProtected();

      expect(result).toMatchInlineSnapshot(`"JWT is working"`);
    });
  });

  describe('/auth/google', () => {
    it('should return void', () => {
      const result = authController.googleLogin();

      expect(result).toBeUndefined();
    });
  });

  describe('/auth/google/callback', () => {
    it('should call authService.generateJwtToken and return a token', async () => {
      const mockJwt = 'FAKE_JWT';
      authService.generateJwtToken.mockReturnValueOnce(mockJwt);
      const req: any = {
        query: { code: 'FAKE_CODE' },
        user: {
          id: 1,
          username: 'TestUser',
          email: 'test@test.com',
        },
      };

      const result = await authController.googleLoginCallback(req);

      expect(authService.generateJwtToken).toHaveBeenCalledWith(req.user);
      expect(result).toBe(mockJwt);
    });
  });
});
