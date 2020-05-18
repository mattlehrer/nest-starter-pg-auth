import { Test, TestingModule } from '@nestjs/testing';
import { Role } from 'src/shared/interfaces/roles.enum';
import { UserService } from '../user/user.service';
import { AdminController } from './admin.controller';

jest.mock('../user/user.service');

const mockUser = {
  id: 1,
  username: 'FAKE_NAME',
  email: 'F@KE.COM',
  roles: [Role.ADMIN],
};

const mockUser2 = {
  ...mockUser,
  id: 2,
  roles: [Role.USER],
};

describe('Admin Controller', () => {
  let adminController: AdminController;
  let userService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdminController],
      providers: [UserService],
    }).compile();

    adminController = module.get<AdminController>(AdminController);
    userService = module.get<UserService>(UserService);
  });

  it('should be defined', () => {
    expect(adminController).toBeDefined();
  });

  it('GET /admin/user/ should return all users', async () => {
    userService.findAll.mockResolvedValueOnce([mockUser, mockUser2]);

    const response = await adminController.getAll();

    expect(userService.findAll).toHaveBeenCalledWith(/* nothing */);
    expect(userService.findAll).toHaveBeenCalledTimes(1);
    expect(response).toEqual([mockUser, mockUser2]);
  });

  it('GET /admin/user/deleted should return all deleted users', async () => {
    userService.findAllDeleted.mockResolvedValueOnce([mockUser, mockUser2]);

    const response = await adminController.getAllDeleted();

    expect(userService.findAllDeleted).toHaveBeenCalledWith(/* nothing */);
    expect(userService.findAllDeleted).toHaveBeenCalledTimes(1);
    expect(response).toEqual([mockUser, mockUser2]);
  });

  it('GET /admin/user/including-deleted should return all deleted users', async () => {
    userService.findAllIncludingDeleted.mockResolvedValueOnce([
      mockUser,
      mockUser2,
    ]);

    const response = await adminController.getAllIncludingDeleted();

    expect(
      userService.findAllIncludingDeleted,
    ).toHaveBeenCalledWith(/* nothing */);
    expect(userService.findAllIncludingDeleted).toHaveBeenCalledTimes(1);
    expect(response).toEqual([mockUser, mockUser2]);
  });
});
