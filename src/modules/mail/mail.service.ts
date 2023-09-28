import { Injectable, Inject } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { LoggerService } from '../../common';
import { IEmailData } from './';
import { env } from '../../config';

@Injectable()
export default class MailService {
  private transporter: nodemailer.Transporter;
  @Inject() private logger: LoggerService;
  constructor() {
    this.createConnection();
  }

  private async createConnection() {
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      host: 'smtp.gmail.com',
      port: 587,
      tls: {
        rejectUnauthorized: false,
      },
      auth: {
        user: env.google_mail_sender,
        pass: env.google_app_key,
      },
    });
  }

  public sendMail = async (options: IEmailData): Promise<boolean> => {
    try {
      const info = await this.transporter.sendMail({
        from: env.google_mail_sender,
        to: options.to,
        subject: options.subject,
        text: options.text,
        html: options.html,
      });
      this.logger.log(`Mail sent successfully!!`);
      this.logger.log(
        `[MailResponse]=${info.response} [MessageID]=${info.messageId}`,
      );
      return true;
    } catch (error: any) {
      this.logger.error(`Error Sending Mail ${error}`);
      return false;
    }
  };
}
