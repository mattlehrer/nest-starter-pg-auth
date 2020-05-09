import { Test, TestingModule } from '@nestjs/testing';
import { EventEmitter } from 'events';
import { EVENT_EMITTER_TOKEN } from 'nest-emitter';
import { UserRepository } from './user.repository';
import { UserService } from './user.service';

const mockUserRepository = () => ({
  signUp: jest.fn(),
  validateUserPassword: jest.fn(),
});

describe('UserService', () => {
  let userService: UserService;
  // let userRepository: UserRepository;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        { provide: UserRepository, useFactory: mockUserRepository },
        { provide: EVENT_EMITTER_TOKEN, useValue: EventEmitter },
      ],
    }).compile();

    userService = module.get<UserService>(UserService);
    // userRepository = module.get<UserRepository>(UserRepository);
  });

  it('should be defined', () => {
    expect(userService).toBeDefined();
  });
});
