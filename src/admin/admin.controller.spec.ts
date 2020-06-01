import { Test, TestingModule } from '@nestjs/testing';
import { Response } from 'express';
import { LoggerService } from 'src/logger/logger.service';
import { Role } from 'src/shared/interfaces/roles.enum';
import * as v8 from 'v8';
import { UserService } from '../user/user.service';
import { AdminController } from './admin.controller';

jest.mock('../user/user.service');
jest.mock('src/logger/logger.service');
const mockPipe = jest.fn();
jest.mock('v8', () => ({
  getHeapSnapshot: jest.fn(() => ({
    pipe: mockPipe,
  })),
}));
const mockWriteStream = {};
jest.mock('fs', () => ({
  createReadStream: jest.fn(() => ({
    pipe: jest.fn(),
  })),
  createWriteStream: jest.fn(() => mockWriteStream),
}));

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
      providers: [UserService, LoggerService],
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

  it('GET /admin/ops/heapdump should save a heapdump to disk and then stream it', async () => {
    const mockRes = {
      set: jest.fn(),
    };
    const spy = jest.spyOn(global.Date, 'now');

    const response = await adminController.heapdump(
      (mockRes as unknown) as Response,
    );

    expect(v8.getHeapSnapshot).toHaveBeenCalledWith(/* nothing */);
    expect(v8.getHeapSnapshot).toHaveBeenCalledTimes(1);
    expect(mockPipe).toBeCalledWith(mockWriteStream);
    expect(mockPipe).toBeCalledTimes(1);
    expect(response).toBeUndefined();
  });
});
