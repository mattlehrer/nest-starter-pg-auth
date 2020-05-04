import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { AuthCredentialsDto } from './dto/auth-credentials.dto';

const mockAuthService = () => ({
  signUp: jest.fn(),
  signIn: jest.fn(),
});

describe('Auth Controller', () => {
  let authController: AuthController;
  let authService: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useFactory: mockAuthService }],
    }).compile();

    authController = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(authController).toBeDefined();
  });

  describe('signUp', () => {
    it('should call authService.signUp', () => {
      expect(authService.signUp).not.toHaveBeenCalled();
      const creds: AuthCredentialsDto = {
        username: 'TestUser',
        email: 'test@test.com',
        password: 'TestPassword',
      };
      authController.signUp(creds);
      expect(authService.signUp).toHaveBeenCalledWith(creds);
    });
  });
});
