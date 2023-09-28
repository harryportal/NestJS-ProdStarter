export interface IMailService {
  sendMail(options: IEmailData): Promise<any>;
}

export interface IEmailData {
  to: string | string[];
  subject: string;
  text?: string;
  html?: string;
}
