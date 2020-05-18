import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { Role } from './shared/interfaces/roles.enum';
import { UpdateUserInput } from './user/dto/update-user.dto';
import { UserService } from './user/user.service';

jest.mock('./user/user.service');

const mockUser = {
  id: 1,
  username: 'FAKE_NAME',
  email: 'F@KE.COM',
  roles: [Role.USER],
};

const mockReq = {
  user: mockUser,
};

describe('App Controller', () => {
  let appController: AppController;
  let userService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [UserService],
    }).compile();

    appController = module.get<AppController>(AppController);
    userService = module.get<UserService>(UserService);
  });

  it('should be defined', () => {
    expect(appController).toBeDefined();
  });

  it('GET /me should return current user', async () => {
    userService.findOneById.mockResolvedValueOnce(mockUser);

    const response = await appController.getMe(mockReq);

    expect(userService.findOneById).toHaveBeenCalledWith(mockUser.id);
    expect(userService.findOneById).toHaveBeenCalledTimes(1);
    expect(response).toEqual(mockUser);
  });

  it('PATCH /me should update current user and return user with updates', async () => {
    const updateDto: UpdateUserInput = {
      email: 'F2@KE.COM',
    };
    userService.updateOne.mockResolvedValueOnce({ ...mockUser, ...updateDto });

    const response = await appController.updateMe(mockReq, updateDto);

    expect(userService.updateOne).toHaveBeenCalledWith(mockUser, updateDto);
    expect(userService.updateOne).toHaveBeenCalledTimes(1);
    expect(response).toEqual({ ...mockUser, ...updateDto });
  });

  it('DELETE /me should update current user and return user with updates', async () => {
    await appController.deleteMe(mockReq);

    expect(userService.deleteOne).toHaveBeenCalledWith(mockUser);
    expect(userService.deleteOne).toHaveBeenCalledTimes(1);
  });
});
