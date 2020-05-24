import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import * as sgMail from '@sendgrid/mail';
import { LoggerService } from 'src/logger/logger.service';
import { EmailService } from './email.service';

const mockError = new Error('Test');
jest.mock('@sendgrid/mail', () => ({
  setApiKey: jest.fn(),
  send: jest.fn(async (msg) =>
    msg ? Promise.resolve(true) : Promise.reject(mockError),
  ),
}));

jest.mock('@nestjs/config');
const mockKey = 'MOCK KEY';
const mockConfigService = () => ({
  get: jest.fn().mockReturnValueOnce(mockKey),
});

jest.mock('src/logger/logger.service');
const mockLogger = () => ({
  log: jest.fn(),
  error: jest.fn(),
  setContext: jest.fn(),
});

describe('EmailService', () => {
  let emailService: EmailService;
  let configService;
  let logger;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmailService,
        {
          provide: ConfigService,
          useFactory: mockConfigService,
        },
        { provide: LoggerService, useFactory: mockLogger },
      ],
    }).compile();

    emailService = module.get<EmailService>(EmailService);
    configService = module.get<ConfigService>(ConfigService);
    logger = module.get<LoggerService>(LoggerService);
  });

  it('should be defined', () => {
    expect(emailService).toBeDefined();
  });

  it('should call sgMail.setApiKey with API key from Config', () => {
    const setApiKey = jest.spyOn(sgMail, 'setApiKey');

    expect(configService.get).toHaveBeenCalledTimes(1);
    expect(setApiKey).toHaveBeenCalledWith(mockKey);
    expect(setApiKey).toHaveBeenCalledTimes(1);
  });

  describe('send', () => {
    it(`should just log message when NODE_ENV === 'development'`, async () => {
      const mockMsg = {
        to: 'to@test.com',
        from: 'from@test.com',
        subject: 'Subject',
        text: 'test text',
        html: '<strong>test</strong>',
      };
      configService.get
        .mockReturnValueOnce('development')
        .mockReturnValueOnce(false);

      await emailService.send(mockMsg);

      expect(configService.get).toHaveBeenNthCalledWith(2, 'env');
      expect(configService.get).toHaveBeenNthCalledWith(
        3,
        'email.shouldSendInDev',
      );
      expect(configService.get).toHaveBeenCalledTimes(3);
      expect(sgMail.send).not.toHaveBeenCalled();
    });

    it('should call sgMail.send with message param', async () => {
      const mockMsg = {
        to: 'to@test.com',
        from: 'from@test.com',
        subject: 'Subject',
        text: 'test text',
        html: '<strong>test</strong>',
      };
      configService.get.mockReturnValueOnce('production');

      await emailService.send(mockMsg);

      expect(configService.get).toHaveBeenNthCalledWith(2, 'env');
      expect(configService.get).toHaveBeenCalledTimes(2);
      expect(sgMail.send).toHaveBeenCalledWith(mockMsg);
      expect(sgMail.send).toHaveBeenCalledTimes(1);
    });

    it('should handle error from sgMail.send', async () => {
      const badMsg = undefined;
      configService.get.mockReturnValueOnce('production');

      await emailService.send(badMsg);

      expect(configService.get).toHaveBeenCalledTimes(2);
      expect(sgMail.send).toHaveBeenCalledWith(badMsg);
      expect(sgMail.send).toHaveBeenCalledTimes(1);
      expect(logger.error).toHaveBeenCalledWith(mockError);
      expect(logger.error).toHaveBeenCalledTimes(1);
    });
  });
});
