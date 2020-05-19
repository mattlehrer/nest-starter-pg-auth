import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { Role } from 'src/shared/interfaces/roles.enum';
import { JwtStrategy } from './jwt.strategy';

jest.mock('@nestjs/config');

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

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [ConfigService],
    }).compile();

    configService = module.get<ConfigService>(ConfigService);
    configService.get.mockReturnValue('secret');
    jwtStrategy = new JwtStrategy(configService);
  });

  it('should be defined', () => {
    expect(jwtStrategy).toBeDefined();
  });

  it('validate should return user partial', async () => {
    const result = await jwtStrategy.validate(payload);

    expect(result).toEqual(mockUser);
  });
});
