import { Queue, QueueOptions, Worker, Job } from 'bullmq';
import { Inject, Injectable } from '@nestjs/common';
import { IEmailData } from '../mail';
import { env } from '../../config';
import MailService from '../mail/mail.service';
import { LoggerService, configureRedisUrl } from '../../common';

const redisConnection = configureRedisUrl(env.redis_url);

const queueOptions = {
  limiter: {
    max: 100, // maximum number of tasks the queue can take
    duration: 10000, // miliseconds to wait after reaching max limit
  },
  connection: redisConnection,
  prefix: 'EMAIL-TASK',
  backoff: {
    type: 'exponential', // Exponential backoff strategy
    delay: 1000, // Initial delay in milliseconds
  },
  defaultJobOptions: {
    attempts: 5, // default number of retries for a mail
    removeonComplete: true,
  },
} as QueueOptions;

const emailQueueName = 'email-queue';

@Injectable()
export class QueueService {
  private queue: Queue = new Queue(emailQueueName, queueOptions);
  private worker: Worker = new Worker(
    emailQueueName,
    async (emailJob: Job) => {
      this.processEmailJobTask(emailJob);
    },
    queueOptions,
  );
  @Inject() private readonly logger: LoggerService;
  @Inject() private readonly emailService: MailService;

  private async processEmailJobTask(emailJob: Job) {
    this.logger.log('Processing Email Notification Task');
    const response = await this.emailService.sendMail(emailJob.data);
    if (response) {
      this.logger.log('Proccesing Email Notification Task Completed');
    } else {
      this.logger.error('Proccesing Email Notification Task Failed');
    }
  }

  public async addEmailToQueue(emailData: IEmailData): Promise<void> {
    try {
      await this.queue.add('email_notification', emailData);
      this.logger.log(`Email to ${emailData.to} has been added to the Queue`);
    } catch (error) {
      this.logger.error(
        `Email to ${emailData.to} failed to be added to the Queue`,
      );
    }
  }
}
