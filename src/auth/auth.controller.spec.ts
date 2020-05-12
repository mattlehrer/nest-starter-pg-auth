import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { AuthCredentialsDto } from './dto/auth-credentials.dto';

// const mockAuthService = () => ({
//   signUpWithPassword: jest.fn(),
//   signIn: jest.fn(),
// });
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

  describe('/signUp', () => {
    it('should call authService.signUpWithPassword', async () => {
      expect(authService.signUpWithPassword).not.toHaveBeenCalled();
      const creds: AuthCredentialsDto = {
        username: 'TestUser',
        email: 'test@test.com',
        password: 'TestPassword',
      };
      await authController.signUp(creds);
      expect(authService.signUpWithPassword).toHaveBeenCalledWith(creds);
    });
  });
});
