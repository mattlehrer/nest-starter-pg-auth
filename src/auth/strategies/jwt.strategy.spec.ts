import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { Request } from 'express';
import { Role } from 'src/shared/interfaces/roles.enum';
import { UserService } from 'src/user/user.service';
import { extractJwtFromCookie, JwtStrategy } from './jwt.strategy';

jest.mock('@nestjs/config');
jest.mock('src/user/user.service');

const payload = {
  sub: 1,
  username: 'TestUser',
  roles: [Role.USER],
};

const mockUser: any = {
  id: payload.sub,
  username: payload.username,
  roles: payload.roles,
};

describe('Local Strategy', () => {
  let jwtStrategy: JwtStrategy;
  let configService;
  let userService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [ConfigService, UserService],
    }).compile();

    configService = module.get<ConfigService>(ConfigService);
    configService.get.mockReturnValue('secret');
    userService = module.get<UserService>(UserService);
    jwtStrategy = new JwtStrategy(configService, userService);
  });

  it('should be defined', () => {
    expect(jwtStrategy).toBeDefined();
  });

  it('validate should return user partial', async () => {
    userService.findOneById.mockResolvedValueOnce(mockUser);

    const result = await jwtStrategy.validate(payload);

    expect(result).toEqual(mockUser);
  });

  describe('extractJwtFromCookie', () => {
    it('should return jwt', () => {
      const req = {
        session: {
          jwt: 'mock.jwt',
        },
      };

      const result = extractJwtFromCookie((req as unknown) as Request);

      expect(result).toBe(req.session.jwt);
    });

    it('should return null on undefined req', () => {
      const req = undefined;

      const result = extractJwtFromCookie(req as Request);

      expect(result).toBeNull();
    });

    it('should return null on undefined session', () => {
      const req = {
        session: undefined,
      };

      const result = extractJwtFromCookie(req as Request);

      expect(result).toBeNull();
    });
  });
});
