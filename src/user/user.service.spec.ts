import {
  ConflictException,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { EventEmitter } from 'events';
import { EVENT_EMITTER_TOKEN } from 'nest-emitter';
import { SignUpDto } from 'src/auth/dto/sign-up.dto';
import { QueryFailedError, Repository } from 'typeorm';
import { User } from './user.entity';
import { UserService } from './user.service';

const signUpDto: SignUpDto = {
  username: 'FAKE_USER',
  email: 'F@KE.COM',
  password: 'FAKE_PASSWORD',
};
const mockUser: any = {
  ...signUpDto,
  id: 1,
  save: jest.fn(),
  isActive: true,
  validatePassword: jest.fn(),
};
const mockDeletedUser = {
  ...mockUser,
  // eslint-disable-next-line @typescript-eslint/camelcase
  deleted_at: new Date(),
};

const mockUserRepository = () => ({
  findOne: jest.fn(),
  find: jest.fn(),
  update: jest.fn(),
  save: jest.fn().mockReturnValue(mockUser),
  create: jest.fn().mockReturnValue(mockUser),
  softDelete: jest.fn(),
  createQueryBuilder: jest.fn().mockReturnValue({
    select: jest.fn().mockReturnThis(),
    from: jest.fn().mockReturnThis(),
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis().mockReturnThis(),
    withDeleted: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    getOne: jest.fn(),
    getMany: jest.fn(),
  }),
});

const query = 'blah';
const parameters = [];
const driverError = {
  code: '23505',
  detail: `Key (username)=(${signUpDto.username}) already exists`,
};
const queryError = new QueryFailedError(query, parameters, driverError);

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
    userRepository = module.get<Repository<User>>(getRepositoryToken(User));
    emitter = module.get<EventEmitter>(EVENT_EMITTER_TOKEN);
  });

  it('should be defined', () => {
    expect(userService).toBeDefined();
  });

  describe('createWithPassword', () => {
    it('should return user and emit newUser event', async () => {
      emitter.emit = jest.fn();

      const result = await userService.createWithPassword(signUpDto);

      expect(result).toEqual(mockUser);
      expect(mockUser.save).toHaveBeenCalledWith(/* nothing */);
      expect(mockUser.save).toHaveBeenCalledTimes(1);

      expect(emitter.emit).toHaveBeenCalledWith('newUser', mockUser);
      expect(emitter.emit).toHaveBeenCalledTimes(1);
    });

    it('should throw ConflictException on dup username/email', async () => {
      emitter.emit = jest.fn();
      mockUser.save.mockRejectedValueOnce(queryError);

      const error = await userService
        .createWithPassword(signUpDto)
        .catch((e) => e);

      expect(error).toBeInstanceOf(ConflictException);
      expect(mockUser.save).toHaveBeenCalledWith(/* nothing */);
      expect(mockUser.save).toHaveBeenCalledTimes(1);
      expect(emitter.emit).not.toHaveBeenCalled();
    });

    it('should throw InternalServerErrorException on db error', async () => {
      mockUser.save.mockRejectedValueOnce(new Error('Test'));
      emitter.emit = jest.fn();

      const result = await userService
        .createWithPassword(signUpDto)
        .catch((e) => e);

      expect(result).toBeInstanceOf(InternalServerErrorException);
      expect(mockUser.save).toHaveBeenCalledWith(/* nothing */);
      expect(mockUser.save).toHaveBeenCalledTimes(1);
      expect(emitter.emit).not.toHaveBeenCalled();
    });
  });

  describe('findOrCreateOneByOAuth', () => {
    it('should return existing user', async () => {
      const profile = { id: 'FAKE_ID', provider: 'FAKE_PROVIDER' };
      const accessToken = 'FAKE_ACCESS_TOKEN';
      const refreshToken = 'FAKE_REFRESH_TOKEN';
      const code = 'FAKE_CODE';
      userRepository
        .createQueryBuilder()
        .where()
        .getOne.mockResolvedValueOnce(mockUser);
      emitter.emit = jest.fn();

      const result = await userService.findOrCreateOneByOAuth({
        profile,
        accessToken,
        refreshToken,
        code,
      });

      expect(
        userRepository.createQueryBuilder().where,
      ).toHaveBeenLastCalledWith(`user.${profile.provider} = :profileId`, {
        profileId: profile.id,
      });
      expect(
        userRepository.createQueryBuilder().where().getOne,
      ).toHaveBeenCalledWith(/* nothing */);
      expect(
        userRepository.createQueryBuilder().where().getOne,
      ).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockUser);
      expect(emitter.emit).not.toHaveBeenCalled();
    });

    it('should return new user', async () => {
      const profile = {
        id: 'FAKE_ID',
        provider: 'FAKE_PROVIDER',
        _json: { email: mockUser.email },
      };
      const accessToken = 'FAKE_ACCESS_TOKEN';
      const refreshToken = 'FAKE_REFRESH_TOKEN';
      const code = 'FAKE_CODE';
      emitter.emit = jest.fn();
      userRepository
        .createQueryBuilder()
        .getOne.mockResolvedValueOnce(undefined);
      userRepository.save.mockResolvedValueOnce(mockUser);

      const result = await userService.findOrCreateOneByOAuth({
        profile,
        accessToken,
        refreshToken,
        code,
      });

      expect(userRepository.createQueryBuilder().where).toHaveBeenCalledWith(
        `user.${profile.provider} = :profileId`,
        {
          profileId: profile.id,
        },
      );
      expect(
        userRepository.createQueryBuilder().where().getOne,
      ).toHaveBeenCalledWith(/* nothing */);
      expect(
        userRepository.createQueryBuilder().where().getOne,
      ).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockUser);
      expect(emitter.emit).toHaveBeenCalledWith('newUser', mockUser);
      expect(emitter.emit).toHaveBeenCalledTimes(1);
    });
  });

  describe('findAll', () => {
    it('should find all users', async () => {
      const mockUser2: any = {};
      Object.assign(mockUser2, mockUser);
      mockUser2.id = 2;
      userRepository.find.mockResolvedValueOnce([mockUser, mockUser2]);

      const result = await userService.findAll();

      expect(result).toStrictEqual([mockUser, mockUser2]);
      expect(userRepository.find).toHaveBeenCalledWith(/* nothing */);
      expect(userRepository.find).toHaveBeenCalledTimes(1);
    });
  });

  describe('findAllIncludingDeleted', () => {
    it('should find all users, including soft deleted', async () => {
      const mockUser2: any = {};
      Object.assign(mockUser2, mockUser);
      mockUser2.id = 2;
      userRepository
        .createQueryBuilder()
        .withDeleted()
        .getMany.mockResolvedValueOnce([mockUser, mockUser2, mockDeletedUser]);

      const result = await userService.findAllIncludingDeleted();

      expect(result).toStrictEqual([mockUser, mockUser2, mockDeletedUser]);
      expect(
        userRepository.createQueryBuilder().withDeleted,
      ).toHaveBeenCalledWith(/* nothing */);
      expect(
        userRepository.createQueryBuilder().withDeleted().getMany,
      ).toHaveBeenCalledWith(/* nothing */);
      expect(
        userRepository.createQueryBuilder().where().getMany,
      ).toHaveBeenCalledTimes(1);
    });
  });

  describe('findAllDeleted', () => {
    it('should find all users, including soft deleted', async () => {
      const mockUser2: any = {};
      Object.assign(mockUser2, mockUser);
      mockUser2.id = 2;
      userRepository
        .createQueryBuilder()
        .withDeleted()
        .where()
        .getMany.mockResolvedValueOnce([mockDeletedUser]);

      const result = await userService.findAllDeleted();

      expect(result).toStrictEqual([mockDeletedUser]);
      expect(
        userRepository.createQueryBuilder().withDeleted,
      ).toHaveBeenCalledWith(/* nothing */);
      expect(
        userRepository.createQueryBuilder().withDeleted().where,
      ).toHaveBeenCalledWith('deleted_at is not null');
      expect(
        userRepository.createQueryBuilder().withDeleted().getMany,
      ).toHaveBeenCalledWith(/* nothing */);
      expect(
        userRepository.createQueryBuilder().where().getMany,
      ).toHaveBeenCalledTimes(1);
    });
  });

  describe('findOneById', () => {
    it('should return user', async () => {
      userRepository.findOne.mockResolvedValueOnce(mockUser);

      const result = await userService.findOneById(mockUser.id);

      expect(userRepository.findOne).toHaveBeenCalledWith({ id: mockUser.id });
      expect(userRepository.findOne).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockUser);
    });
  });

  describe('findOneByUsername', () => {
    it('should return user', async () => {
      userRepository.findOne.mockResolvedValueOnce(mockUser);

      const result = await userService.findOneByUsername(mockUser.username);

      expect(userRepository.findOne).toHaveBeenCalledWith({
        username: mockUser.username,
      });
      expect(userRepository.findOne).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockUser);
    });
  });

  describe('findOneByEmail', () => {
    it('should return user', async () => {
      userRepository.findOne.mockResolvedValueOnce(mockUser);

      const result = await userService.findOneByEmail(mockUser.email);

      expect(userRepository.findOne).toHaveBeenCalledWith({
        email: mockUser.email,
      });
      expect(userRepository.findOne).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockUser);
    });
  });

  describe('updateOne', () => {
    it('should update user fields', async () => {
      const updateDto: any = {
        username: 'NEW_USERNAME',
        email: 'F2@KE.COM',
      };
      userRepository.update.mockResolvedValueOnce({ affected: 1 });

      const result = await userService.updateOne(mockUser, updateDto);

      expect(userRepository.update).toHaveBeenCalledWith(
        mockUser.id,
        updateDto,
      );
      expect(userRepository.update).toHaveBeenCalledTimes(1);
      expect(result).toBeUndefined();
    });

    it('when unique column property is unavailable, should throw ConflictException', async () => {
      const updateDto: any = {
        username: 'EXISTING',
        email: 'F2@KE.COM',
      };
      userRepository.update.mockRejectedValueOnce(queryError);

      const error = await userService
        .updateOne(mockUser, updateDto)
        .catch((e) => e);

      expect(error).toBeInstanceOf(ConflictException);
      expect(error).toMatchInlineSnapshot(
        `[Error: username 'FAKE_USER' already exists]`,
      );
      expect(userRepository.update).toHaveBeenCalledWith(
        mockUser.id,
        updateDto,
      );
      expect(userRepository.update).toHaveBeenCalledTimes(1);
    });

    it('when oldPassword is valid, should hash newPassword and update user', async () => {
      const updateDto: any = {
        oldPassword: 'F@KEpassword',
        newPassword: 'F2@KEpassword',
      };
      userRepository.findOne.mockResolvedValueOnce(mockUser);
      mockUser.validatePassword.mockResolvedValueOnce(true);
      userRepository.update.mockResolvedValueOnce({ affected: 1 });

      const result = await userService.updateOne(mockUser, updateDto);

      expect(userRepository.findOne).toHaveBeenCalledWith({ id: mockUser.id });
      expect(userRepository.findOne).toHaveBeenCalledTimes(1);
      expect(mockUser.validatePassword).toHaveBeenCalledTimes(1);
      expect(userRepository.update).toHaveBeenCalledWith(mockUser.id, {
        password: updateDto.newPassword,
      });
      expect(userRepository.update).toHaveBeenCalledTimes(1);
      expect(result).toBeUndefined();
    });

    it('when existing password is invalid, should throw UnauthorizedException', async () => {
      const updateDto: any = {
        oldPassword: 'F@KEpassword',
        newPassword: 'F2@KEpassword',
      };
      userRepository.findOne.mockResolvedValueOnce(mockUser);
      mockUser.validatePassword.mockResolvedValueOnce(false);

      const error = await userService
        .updateOne(mockUser, updateDto)
        .catch((e) => e);

      expect(mockUser.validatePassword).toHaveBeenCalledWith(
        updateDto.oldPassword,
      );
      expect(mockUser.validatePassword).toHaveBeenCalledTimes(1);
      expect(error).toBeInstanceOf(UnauthorizedException);
      expect(error.response.message).toMatchInlineSnapshot(
        `"Incorrect existing password."`,
      );
    });

    it('when db throws unknown error, should throw InternalServerErrorException', async () => {
      const updateDto: any = {
        username: 'EXISTING',
        email: 'F2@KE.COM',
      };
      userRepository.update.mockRejectedValueOnce(new Error('db error'));

      const error = await userService
        .updateOne(mockUser, updateDto)
        .catch((e) => e);

      expect(error).toBeInstanceOf(InternalServerErrorException);
      expect(error).toMatchInlineSnapshot(`[Error: Internal Server Error]`);
      expect(userRepository.update).toHaveBeenCalledWith(
        mockUser.id,
        updateDto,
      );
      expect(userRepository.update).toHaveBeenCalledTimes(1);
    });

    it("when update doesn't return {affected: truthy}, should throw InternalServerErrorException", async () => {
      const updateDto: any = {
        username: 'EXISTING',
        email: 'F2@KE.COM',
      };
      userRepository.update.mockResolvedValueOnce({ blah: true });

      const error = await userService
        .updateOne(mockUser, updateDto)
        .catch((e) => e);

      expect(error).toBeInstanceOf(InternalServerErrorException);
      expect(error).toMatchInlineSnapshot(`[Error: Internal Server Error]`);
      expect(userRepository.update).toHaveBeenCalledWith(
        mockUser.id,
        updateDto,
      );
      expect(userRepository.update).toHaveBeenCalledTimes(1);
    });

    it('when updateDto has no updates, return user unchanged', async () => {
      const updateDto: any = {
        username: undefined,
      };

      const result = await userService.updateOne(mockUser, updateDto);

      expect(result).toBeUndefined();
      expect(userRepository.update).not.toHaveBeenCalled();
    });
  });

  describe('delete', () => {
    it('should softDelete a user', async () => {
      userRepository.softDelete.mockResolvedValueOnce({ affected: 1 });

      const result = await userService.deleteOne(mockUser);

      expect(userRepository.softDelete).toHaveBeenCalledWith(mockUser.id);
      expect(userRepository.softDelete).toHaveBeenCalledTimes(1);
    });
  });
});
