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
    this.logger.setContext(EmailService.name);
    const apiKey = configService.get('email.sendGridApiKey');
    sgMail.setApiKey(apiKey);
  }

  async send(message: sgMail.MailDataRequired): Promise<void> {
    try {
      const response = await sgMail.send(message);
      delete message.text;
      delete message.html;
      this.logger.log(`
        sent message:
          ${JSON.stringify(message, null, 2)}\n
        response:
          ${JSON.stringify(response, null, 2)}
      `);
    } catch (error) {
      this.logger.error(error);
    }
  }
}
