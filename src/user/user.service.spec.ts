import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { EVENT_EMITTER_TOKEN } from 'nest-emitter';
import { AuthCredentialsDto } from 'src/auth/dto/auth-credentials.dto';
import { EventEmitter } from 'typeorm/platform/PlatformTools';
import { User } from './user.entity';
import { UserRepository } from './user.repository';
import { UserService } from './user.service';

const authCredentialsDto: AuthCredentialsDto = {
  username: 'FAKE_USER',
  email: 'F@KE.COM',
  password: 'FAKE_PASSWORD',
};
const mockUser: any = {
  ...authCredentialsDto,
  id: 1,
  save: jest.fn(),
  isActive: true,
  validatePassword: jest.fn(),
};
const mockUserRepository = () => ({
  createWithPassword: jest.fn(),
  findOne: jest.fn(),
  findByProviderId: jest.fn(),
  createWithOAuth: jest.fn(),
  update: jest.fn(),
  hashNewPassword: jest.fn(),
});

describe('UserService', () => {
  let userService: UserService;
  let userRepository;
  let emitter;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        { provide: getRepositoryToken(User), useFactory: mockUserRepository },
        { provide: EVENT_EMITTER_TOKEN, useValue: EventEmitter },
      ],
    }).compile();

    userService = module.get<UserService>(UserService);
    userRepository = module.get<UserRepository>(UserRepository);
    emitter = module.get<EventEmitter>(EVENT_EMITTER_TOKEN);
  });

  it('should be defined', () => {
    expect(userService).toBeDefined();
  });

  it('createWithPassword should return user', async () => {
    userRepository.createWithPassword.mockResolvedValueOnce(mockUser);
    emitter.emit = jest.fn();

    const result = await userService.createWithPassword(authCredentialsDto);
    expect(userRepository.createWithPassword).toHaveBeenCalledWith(
      authCredentialsDto,
    );
    expect(userRepository.createWithPassword).toHaveBeenCalledTimes(1);
    expect(result).toEqual(mockUser);

    expect(emitter.emit).toHaveBeenCalledWith('newUser', mockUser);
    expect(emitter.emit).toHaveBeenCalledTimes(1);
  });

  it('findOneById should return user', async () => {
    userRepository.findOne.mockResolvedValueOnce(mockUser);

    const result = await userService.findOneById(mockUser.id);
    expect(userRepository.findOne).toHaveBeenCalledWith({ id: mockUser.id });
    expect(userRepository.findOne).toHaveBeenCalledTimes(1);
    expect(result).toEqual(mockUser);
  });

  it('findOneByUsername should return user', async () => {
    userRepository.findOne.mockResolvedValueOnce(mockUser);

    const result = await userService.findOneByUsername(mockUser.username);
    expect(userRepository.findOne).toHaveBeenCalledWith({
      username: mockUser.username,
    });
    expect(userRepository.findOne).toHaveBeenCalledTimes(1);
    expect(result).toEqual(mockUser);
  });

  it('findOneByEmail should return user', async () => {
    userRepository.findOne.mockResolvedValueOnce(mockUser);

    const result = await userService.findOneByEmail(mockUser.email);
    expect(userRepository.findOne).toHaveBeenCalledWith({
      email: mockUser.email,
    });
    expect(userRepository.findOne).toHaveBeenCalledTimes(1);
    expect(result).toEqual(mockUser);
  });

  describe('findOrCreateOneByOAuth', () => {
    it('should return existing user', async () => {
      const profile = { id: 'FAKE_ID' };
      const accessToken = 'FAKE_ACCESS_TOKEN';
      const refreshToken = 'FAKE_REFRESH_TOKEN';
      userRepository.findByProviderId.mockResolvedValueOnce(mockUser);
      emitter.emit = jest.fn();

      const result = await userService.findOrCreateOneByOAuth({
        profile,
        accessToken,
        refreshToken,
      });
      expect(userRepository.findByProviderId).toHaveBeenCalledWith(profile);
      expect(userRepository.findByProviderId).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockUser);
      expect(emitter.emit).not.toHaveBeenCalled();
    });

    it('should return new user', async () => {
      const profile = { id: 'FAKE_ID' };
      const accessToken = 'FAKE_ACCESS_TOKEN';
      const refreshToken = 'FAKE_REFRESH_TOKEN';

      userRepository.findByProviderId.mockResolvedValueOnce(undefined);
      userRepository.createWithOAuth.mockResolvedValueOnce(mockUser);
      emitter.emit = jest.fn();

      const result = await userService.findOrCreateOneByOAuth({
        profile,
        accessToken,
        refreshToken,
      });
      expect(userRepository.findByProviderId).toHaveBeenCalledWith(profile);
      expect(userRepository.findByProviderId).toHaveBeenCalledTimes(1);
      expect(userRepository.createWithOAuth).toHaveBeenCalledWith({
        profile,
        accessToken,
        refreshToken,
      });
      expect(userRepository.createWithOAuth).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockUser);

      expect(emitter.emit).toHaveBeenCalledWith('newUser', mockUser);
      expect(emitter.emit).toHaveBeenCalledTimes(1);
    });
  });

  describe('update', () => {
    it('should update user fields', async () => {
      const updateDto: any = {
        username: 'NEW_USERNAME',
        email: 'F2@KE.COM',
      };
      userRepository.update.mockResolvedValueOnce({
        ...mockUser,
        ...updateDto,
      });
      userRepository.findOne.mockResolvedValueOnce(undefined);

      const result = await userService.update(mockUser, updateDto);
      expect(mockUser.save).toHaveBeenCalledWith(/* nothing */);
      expect(mockUser.save).toHaveBeenCalledTimes(1);
      expect(result).toEqual({ ...mockUser, ...updateDto });
    });

    it('should not save to db if nothing to update', async () => {
      const updateDto: any = {
        username: mockUser.username,
        email: mockUser.email,
      };

      const result = await userService.update(mockUser, updateDto);
      expect(mockUser.save).not.toHaveBeenCalled();
      expect(result).toEqual(mockUser);
    });

    it('should throw if username is unavailable', async () => {
      const updateDto: any = {
        username: 'EXISTING',
        email: 'F2@KE.COM',
      };
      userRepository.findOne.mockResolvedValueOnce(updateDto);

      const error = await userService
        .update(mockUser, updateDto)
        .catch((e) => e);
      expect(error).toBeInstanceOf(ConflictException);
      expect(error).toMatchInlineSnapshot(`[Error: EXISTING is unavailable.]`);
      expect(userRepository.findOne).toHaveBeenCalledWith({
        username: updateDto.username,
      });
      expect(userRepository.findOne).toHaveBeenCalledTimes(1);
    });

    it('should throw if email is in use', async () => {
      const updateDto: any = {
        email: 'EXISTING@EMAIL.COM',
      };
      userRepository.findOne.mockResolvedValueOnce(updateDto);

      const error = await userService
        .update(mockUser, updateDto)
        .catch((e) => e);
      expect(error).toBeInstanceOf(ConflictException);
      expect(error).toMatchInlineSnapshot(
        `[Error: EXISTING@EMAIL.COM is in use by another user.]`,
      );
      expect(userRepository.findOne).toHaveBeenCalledWith({
        email: updateDto.email,
      });
      expect(userRepository.findOne).toHaveBeenCalledTimes(1);
    });

    it('should validate oldPassword and, if valid, and hash newPassword and save user', async () => {
      const updateDto: any = {
        oldPassword: 'F@KEpassword',
        newPassword: 'F2@KEpassword',
      };
      const newHash = {
        passwordHash: 'NEW_HASH',
        salt: 'NEW_SALT',
      };
      const updatedUser = {
        ...mockUser,
        salt: newHash.salt,
        password: newHash.passwordHash,
      };
      mockUser.validatePassword.mockResolvedValueOnce(true);
      userRepository.hashNewPassword.mockResolvedValueOnce(newHash);
      userRepository.update.mockResolvedValueOnce(updatedUser);

      const result = await userService.update(mockUser, updateDto);
      expect(mockUser.validatePassword).toHaveBeenCalledWith(
        updateDto.oldPassword,
      );
      expect(mockUser.validatePassword).toHaveBeenCalledTimes(1);
      expect(userRepository.hashNewPassword).toHaveBeenCalledWith(
        updateDto.newPassword,
      );
      expect(userRepository.hashNewPassword).toHaveBeenCalledTimes(1);
      expect(mockUser.save).toHaveBeenCalledWith(/* nothing */);
      expect(mockUser.save).toHaveBeenCalledTimes(1);
      expect(result).toEqual(updatedUser);
    });

    it('should validate oldPassword and throw on invalid existing password', async () => {
      const updateDto: any = {
        oldPassword: 'F@KEpassword',
        newPassword: 'F2@KEpassword',
      };
      mockUser.validatePassword.mockResolvedValueOnce(false);

      const error = await userService
        .update(mockUser, updateDto)
        .catch((e) => e);
      expect(mockUser.validatePassword).toHaveBeenCalledWith(
        updateDto.oldPassword,
      );
      expect(mockUser.validatePassword).toHaveBeenCalledTimes(1);
      expect(error).toBeInstanceOf(UnauthorizedException);
      expect(error).toMatchInlineSnapshot(
        `[Error: Incorrect existing password.]`,
      );
    });
  });
});
