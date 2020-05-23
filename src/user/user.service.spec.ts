import {
  ConflictException,
  GoneException,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { EventEmitter } from 'events';
import { EVENT_EMITTER_TOKEN } from 'nest-emitter';
import { SignUpDto } from 'src/auth/dto/sign-up.dto';
import { EmailService } from 'src/email/email.service';
import { LoggerService } from 'src/logger/logger.service';
import { QueryFailedError, Repository } from 'typeorm';
import normalizeEmail from 'validator/lib/normalizeEmail';
import { EmailToken } from './email-token.entity';
import { User } from './user.entity';
import { UserService } from './user.service';

jest.mock('src/logger/logger.service');
jest.mock('src/email/email.service');
jest.mock('@nestjs/config');

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

const mockEmailService = () => ({
  send: jest.fn(),
});

const now = new Date();
const mockToken = {
  id: 32,
  user: mockUser,
  code: 'MOCK CODE',
  created_at: new Date(now.setHours(now.getHours() - 1)),
  save: jest.fn(async () => Promise.resolve(this)),
  remove: jest.fn(),
  isStillValid: jest.fn(),
};

jest.mock('./email-token.entity', () => ({
  EmailToken: jest.fn().mockImplementation(() => mockToken),
}));

const mockEmailTokenRepo = () => ({
  findOne: jest.fn(),
  save: jest.fn().mockReturnValue(mockToken),
  create: jest.fn().mockReturnValue(mockToken),
});

describe('UserService', () => {
  let userService: UserService;
  let userRepository;
  let emitter;
  let emailService;
  let emailTokenRepo;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        { provide: getRepositoryToken(User), useFactory: mockUserRepository },
        { provide: EVENT_EMITTER_TOKEN, useValue: EventEmitter },
        LoggerService,
        { provide: EmailService, useFactory: mockEmailService },
        ConfigService,
        {
          provide: getRepositoryToken(EmailToken),
          useFactory: mockEmailTokenRepo,
        },
      ],
    }).compile();

    userService = module.get<UserService>(UserService);
    userRepository = module.get<Repository<User>>(getRepositoryToken(User));
    emitter = module.get<EventEmitter>(EVENT_EMITTER_TOKEN);
    emailService = module.get<EmailService>(EmailService);
    emailTokenRepo = module.get<Repository<EmailToken>>(
      getRepositoryToken(EmailToken),
    );
  });

  it('should be defined', () => {
    expect(userService).toBeDefined();
  });

  describe('createWithPassword', () => {
    it('should return user, create email verification token, and emit newUser event', async () => {
      emitter.emit = jest.fn();
      emailService.send.mockResolvedValueOnce(true);

      const result = await userService.createWithPassword(signUpDto);

      expect(result).toEqual(mockUser);
      expect(mockUser.save).toHaveBeenCalledWith(/* nothing */);
      expect(mockUser.save).toHaveBeenCalledTimes(1);
      expect(mockToken.save).toHaveBeenCalledWith(/* nothing */);
      expect(mockToken.save).toHaveBeenCalledTimes(1);

      expect(emailService.send).toHaveBeenCalledTimes(1);
      expect(emitter.emit).toHaveBeenCalledWith('newUser', mockUser);
      expect(emitter.emit).toHaveBeenCalledTimes(1);
    });

    it('should throw ConflictException on dup username/email', async () => {
      emitter.emit = jest.fn();
      const query = 'blah';
      const parameters = [];
      const driverError = {
        code: '23505',
        detail: `Key ("normalizedUsername")=(${signUpDto.username}) already exists`,
      };
      const queryError = new QueryFailedError(query, parameters, driverError);
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
        normalizedUsername: mockUser.username.toLowerCase(),
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
        normalizedEmail: normalizeEmail(mockUser.email) as string,
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
      const updatedUser = {
        ...mockUser,
        ...updateDto,
      };
      userRepository.findOne.mockResolvedValueOnce(mockUser);
      mockUser.save.mockResolvedValueOnce(updatedUser);

      const result = await userService.updateOne(mockUser, updateDto);

      expect(userRepository.findOne).toHaveBeenCalledWith({ id: mockUser.id });
      expect(userRepository.findOne).toHaveBeenCalledTimes(1);
      expect(mockUser.save).toHaveBeenCalledWith(/* nothing */);
      expect(mockUser.save).toHaveBeenCalledTimes(1);
      expect(result).toBeUndefined();
    });

    it('when unique column property is unavailable, should throw ConflictException', async () => {
      const updateDto: any = {
        username: 'EXISTING',
        email: 'F2@KE.COM',
      };
      const query = 'blah';
      const parameters = [];
      const driverError = {
        code: '23505',
        detail: `Key ("normalizedUsername")=(${updateDto.username}) already exists`,
      };
      const queryError = new QueryFailedError(query, parameters, driverError);
      userRepository.findOne.mockResolvedValueOnce(mockUser);
      mockUser.save.mockRejectedValueOnce(queryError);

      const error = await userService
        .updateOne(mockUser, updateDto)
        .catch((e) => e);

      expect(error).toBeInstanceOf(ConflictException);
      expect(error).toMatchInlineSnapshot(
        `[Error: Username 'EXISTING' already exists]`,
      );
      expect(userRepository.findOne).toHaveBeenCalledWith({ id: mockUser.id });
      expect(userRepository.findOne).toHaveBeenCalledTimes(1);
      expect(mockUser.save).toHaveBeenCalledWith(/* nothing */);
      expect(mockUser.save).toHaveBeenCalledTimes(1);
    });

    it('when oldPassword is valid, should hash newPassword and update user', async () => {
      const updateDto: any = {
        oldPassword: 'F@KEpassword',
        newPassword: 'F2@KEpassword',
      };
      const updatedUser = {
        ...mockUser,
        password: updateDto.newPassword,
      };
      userRepository.findOne.mockResolvedValueOnce(mockUser);
      mockUser.validatePassword.mockResolvedValueOnce(true);
      mockUser.save.mockResolvedValueOnce(updatedUser);

      const result = await userService.updateOne(mockUser, updateDto);

      expect(userRepository.findOne).toHaveBeenCalledWith({ id: mockUser.id });
      expect(userRepository.findOne).toHaveBeenCalledTimes(1);
      expect(mockUser.validatePassword).toHaveBeenCalledTimes(1);
      expect(mockUser.save).toHaveBeenCalledWith(/* nothing */);
      expect(mockUser.save).toHaveBeenCalledTimes(1);
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

      expect(userRepository.findOne).toHaveBeenCalledWith({ id: mockUser.id });
      expect(userRepository.findOne).toHaveBeenCalledTimes(1);
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
      userRepository.findOne.mockResolvedValueOnce(mockUser);
      mockUser.save.mockRejectedValueOnce(new Error('db error'));

      const error = await userService
        .updateOne(mockUser, updateDto)
        .catch((e) => e);

      expect(userRepository.findOne).toHaveBeenCalledWith({ id: mockUser.id });
      expect(userRepository.findOne).toHaveBeenCalledTimes(1);
      expect(error).toBeInstanceOf(InternalServerErrorException);
      expect(error).toMatchInlineSnapshot(`[Error: Internal Server Error]`);
      expect(mockUser.save).toHaveBeenCalledWith(/* nothing */);
      expect(mockUser.save).toHaveBeenCalledTimes(1);
    });

    it('when updateDto has no updates, return user unchanged', async () => {
      const updateDto: any = {
        username: undefined,
      };
      userRepository.findOne.mockResolvedValueOnce(mockUser);

      const result = await userService.updateOne(mockUser, updateDto);

      expect(userRepository.findOne).toHaveBeenCalledWith({ id: mockUser.id });
      expect(userRepository.findOne).toHaveBeenCalledTimes(1);
      expect(result).toBeUndefined();
      expect(mockUser.save).not.toHaveBeenCalled();
    });
  });

  describe('delete', () => {
    it('should softDelete a user', async () => {
      userRepository.softDelete.mockResolvedValueOnce({ affected: 1 });

      const result = await userService.deleteOne(mockUser);

      expect(userRepository.softDelete).toHaveBeenCalledWith(mockUser.id);
      expect(userRepository.softDelete).toHaveBeenCalledTimes(1);
      expect(result).toBeUndefined();
    });

    it("when db doesn't soft delete, should throw InternalServerErrorException", async () => {
      userRepository.softDelete.mockResolvedValueOnce({ affected: 0 });

      const error = await userService.deleteOne(mockUser).catch((e) => e);

      expect(userRepository.softDelete).toHaveBeenCalledWith(mockUser.id);
      expect(userRepository.softDelete).toHaveBeenCalledTimes(1);
      expect(error).toBeInstanceOf(InternalServerErrorException);
    });
  });

  describe('sendEmailVerification', () => {
    it('should throw InternalServerErrorException on error', async () => {
      emailService.send.mockRejectedValueOnce(new Error('mock mail error'));

      const error = await userService
        .sendEmailVerification(mockUser)
        .catch((e) => e);

      expect(emailService.send).toHaveBeenCalledTimes(1);
      expect(error).toBeInstanceOf(InternalServerErrorException);
    });
  });

  describe('verifyEmailToken', () => {
    it('should find token in repo and return true', async () => {
      emailTokenRepo.findOne.mockResolvedValueOnce(mockToken);
      mockToken.isStillValid.mockReturnValueOnce(true);

      const result = await userService.verifyEmailToken(mockToken.code);

      expect(result).toEqual(true);
      expect(mockToken.remove).toHaveBeenCalledWith(/* nothing */);
      expect(mockToken.remove).toHaveBeenCalledTimes(1);
      expect(emailTokenRepo.findOne).toHaveBeenCalledWith({
        code: mockToken.code,
      });
      expect(emailTokenRepo.findOne).toHaveBeenCalledTimes(1);
    });

    it('should throw 410 (gone) if expired token found', async () => {
      mockToken.isStillValid.mockReturnValueOnce(false);
      emailTokenRepo.findOne.mockResolvedValueOnce(mockToken);

      const error = await userService
        .verifyEmailToken(mockToken.code)
        .catch((e) => e);

      expect(error).toBeInstanceOf(GoneException);
      expect(mockToken.remove).toHaveBeenCalledWith(/* nothing */);
      expect(mockToken.remove).toHaveBeenCalledTimes(1);
      expect(emailTokenRepo.findOne).toHaveBeenCalledWith({
        code: mockToken.code,
      });
      expect(emailTokenRepo.findOne).toHaveBeenCalledTimes(1);
    });

    it('should throw 404 if no token found', async () => {
      emailTokenRepo.findOne.mockResolvedValueOnce(undefined);

      const error = await userService
        .verifyEmailToken(mockToken.code)
        .catch((e) => e);

      expect(error).toBeInstanceOf(NotFoundException);
      expect(emailTokenRepo.findOne).toHaveBeenCalledWith({
        code: mockToken.code,
      });
      expect(emailTokenRepo.findOne).toHaveBeenCalledTimes(1);
    });
  });
});
