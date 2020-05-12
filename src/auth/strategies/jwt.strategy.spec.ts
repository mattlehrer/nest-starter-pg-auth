import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from 'src/user/user.service';
import { JwtStrategy } from './jwt.strategy';

jest.mock('src/user/user.service');
jest.mock('@nestjs/config');

const payload = {
  sub: 1,
  username: 'TestUser',
};

const mockUser: any = {
  id: 1,
  username: payload.username,
};

describe('Local Strategy', () => {
  let jwtStrategy: JwtStrategy;
  let userService;
  let configService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [UserService, ConfigService],
    }).compile();

    userService = module.get<UserService>(UserService);
    configService = module.get<ConfigService>(ConfigService);
    configService.get.mockReturnValue('secret');
    jwtStrategy = new JwtStrategy(userService, configService);
  });

  it('should be defined', () => {
    expect(jwtStrategy).toBeDefined();
  });

  it('validate should call userService.findOneById and return user with valid creds', async () => {
    userService.findOneById.mockResolvedValueOnce(mockUser);
    const result = await jwtStrategy.validate(payload);

    expect(userService.findOneById).toHaveBeenCalledWith(payload.sub);
    expect(userService.findOneById).toHaveBeenCalledTimes(1);
    expect(result).toEqual(mockUser);
  });

  it('validate should call userService.findOneById and throw UnauthorizedException with no user found', async () => {
    userService.findOneById.mockResolvedValueOnce(undefined);
    const error = await jwtStrategy.validate(payload).catch((e) => e);
    expect(userService.findOneById).toHaveBeenCalledWith(payload.sub);
    expect(userService.findOneById).toHaveBeenCalledTimes(1);
    expect(error).toEqual(new UnauthorizedException());
  });

  it('validate should call userService.findOneById and throw UnauthorizedException with different username found', async () => {
    userService.findOneById.mockResolvedValueOnce({ username: 'OTHER_USER' });
    const error = await jwtStrategy.validate(payload).catch((e) => e);
    expect(userService.findOneById).toHaveBeenCalledWith(payload.sub);
    expect(userService.findOneById).toHaveBeenCalledTimes(1);
    expect(error).toEqual(new UnauthorizedException());
  });
});
