import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Role } from 'src/shared/interfaces/roles.enum';
import { UserController } from './user.controller';
import { UserService } from './user.service';

jest.mock('./user.service');

const mockUser = {
  id: 1,
  username: 'FAKE_NAME',
  email: 'F@KE.COM',
  roles: [Role.ADMIN],
};

describe('User Controller', () => {
  let userController: UserController;
  let userService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserController],
      providers: [UserService],
    }).compile();

    userController = module.get<UserController>(UserController);
    userService = module.get<UserService>(UserService);
  });

  it('should be defined', () => {
    expect(userController).toBeDefined();
  });

  it('GET /:username should return a user by username', async () => {
    userService.findOneByUsername.mockResolvedValueOnce(mockUser);

    const response = await userController.getByUsername(mockUser.username);

    expect(userService.findOneByUsername).toHaveBeenCalledWith(
      mockUser.username,
    );
    expect(userService.findOneByUsername).toHaveBeenCalledTimes(1);
    expect(response).toEqual(mockUser);
  });

  it('GET /:username should return a 404 if user not found', async () => {
    userService.findOneByUsername.mockResolvedValueOnce(undefined);

    const error = await userController
      .getByUsername(mockUser.username)
      .catch((e) => e);

    expect(userService.findOneByUsername).toHaveBeenCalledWith(
      mockUser.username,
    );
    expect(userService.findOneByUsername).toHaveBeenCalledTimes(1);
    expect(error).toBeInstanceOf(NotFoundException);
  });
});
