import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as sgMail from '@sendgrid/mail';
import { LoggerService } from 'src/logger/logger.service';

@Injectable()
export class EmailService {
  constructor(
    private readonly configService: ConfigService,
    private readonly logger: LoggerService,
  ) {
    const apiKey = configService.get('email.sendGridApiKey');
    sgMail.setApiKey(apiKey);
  }

  async send(message: sgMail.MailDataRequired): Promise<void> {
    try {
      const response = await sgMail.send(message);
      this.logger.log({ response });
    } catch (error) {
      this.logger.error(error);
    }
  }
}
