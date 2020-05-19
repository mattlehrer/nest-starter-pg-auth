import { Test, TestingModule } from '@nestjs/testing';
import * as classTransformer from 'class-transformer';
import { EventEmitter } from 'events';
import { EVENT_EMITTER_TOKEN } from 'nest-emitter';
import { AnalyticsService } from './analytics.service';

describe('AnalyticsService', () => {
  let analyticsService: AnalyticsService;
  let emitter;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AnalyticsService,
        { provide: EVENT_EMITTER_TOKEN, useClass: EventEmitter },
      ],
    }).compile();

    analyticsService = module.get<AnalyticsService>(AnalyticsService);
    emitter = module.get<EventEmitter>(EVENT_EMITTER_TOKEN);
  });

  it('should be defined', () => {
    expect(analyticsService).toBeDefined();
  });

  it('should implement OnModuleInit', () => {
    expect(analyticsService.onModuleInit).toBeDefined();
  });

  it('should handle newUser events', () => {
    emitter.on = jest.fn();

    analyticsService.onModuleInit();

    expect(emitter.on).toHaveBeenCalledWith('newUser', expect.any(Function));
  });

  it('onNewUser should handle newUser events', (done) => {
    const mockUser = {
      username: 'MOCK',
      password: 'PASS',
    };
    jest.spyOn(classTransformer, 'classToPlain');
    analyticsService.onModuleInit();

    emitter.emit('newUser', mockUser);

    setTimeout(() => {
      expect(classTransformer.classToPlain).toHaveBeenCalledWith(mockUser);
      done();
    }, 100);
  });
});
