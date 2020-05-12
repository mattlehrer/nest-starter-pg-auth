import { Test, TestingModule } from '@nestjs/testing';
import { EventEmitter } from 'events';
import { EVENT_EMITTER_TOKEN } from 'nest-emitter';
import { AnalyticsService } from './analytics.service';

describe('AnalyticsService', () => {
  let analyticsService: AnalyticsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AnalyticsService,
        { provide: EVENT_EMITTER_TOKEN, useValue: EventEmitter },
      ],
    }).compile();

    analyticsService = module.get<AnalyticsService>(AnalyticsService);
  });

  it('should be defined', () => {
    expect(analyticsService).toBeDefined();
  });
});
