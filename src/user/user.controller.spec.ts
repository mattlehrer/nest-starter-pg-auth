import { Test, TestingModule } from '@nestjs/testing';
import { UpdateUserInput } from './dto/update-user.dto';
import { UserController } from './user.controller';
import { UserService } from './user.service';

jest.mock('./user.service');

const mockUser = {
  id: 1,
  username: 'FAKE_NAME',
  email: 'F@KE.COM',
};

const mockReq = {
  user: mockUser,
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

  it('get /me should return current user', async () => {
    userService.findOneById.mockResolvedValueOnce(mockUser);

    const response = await userController.getMe(mockReq);

    expect(userService.findOneById).toHaveBeenCalledWith(mockUser.id);
    expect(userService.findOneById).toHaveBeenCalledTimes(1);
    expect(response).toEqual(mockUser);
  });

  it('post /me should update current user and return user with updates', async () => {
    const updateDto: UpdateUserInput = {
      email: 'F2@KE.COM',
    };
    userService.update.mockResolvedValueOnce({ ...mockUser, ...updateDto });

    const response = await userController.updateMe(mockReq, updateDto);

    expect(userService.update).toHaveBeenCalledWith(mockUser, updateDto);
    expect(userService.update).toHaveBeenCalledTimes(1);
    expect(response).toEqual({ ...mockUser, ...updateDto });
  });
});
