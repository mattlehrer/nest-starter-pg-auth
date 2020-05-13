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
};
const mockUserRepository = () => ({
  createWithPassword: jest.fn(),
  findOne: jest.fn(),
  findByProviderId: jest.fn(),
  createWithOAuth: jest.fn(),
  update: jest.fn(),
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

  it('findOrCreateOneByOAuth should return existing user', async () => {
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

  it('findOrCreateOneByOAuth should return new user', async () => {
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

  it('update should update user', async () => {
    const updateDto: any = {
      email: 'F2@KE.COM',
    };
    userRepository.update.mockResolvedValueOnce({ ...mockUser, ...updateDto });
    userRepository.findOne.mockResolvedValueOnce(undefined);
    const result = await userService.update(mockUser, updateDto);

    expect(mockUser.save).toHaveBeenCalledWith(/* nothing */);
    expect(mockUser.save).toHaveBeenCalledTimes(1);
    expect(result).toEqual({ ...mockUser, ...updateDto });
  });
});
