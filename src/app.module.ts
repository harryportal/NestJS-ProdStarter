import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { QueueService } from './modules/queue/';
import * as c from './http/controllers';
import { APP_FILTER } from '@nestjs/core';
import { AllExceptionsFilter } from './http/middlewares/exception_filter';
import { JwtModule } from '@nestjs/jwt';
import IORedis from 'ioredis';
import { env, PrismaService } from './config';
import { UserRepository, UserService } from './modules/users';
import { AuthService } from './modules/auth';
import MailService from './modules/mail/mail.service';
import { StripeProvider } from './providers';
import { LoggerMiddleware } from './http/middlewares';
import { LoggerService, RedisStore, configureRedisUrl } from './common';
import { GoogleStrategy } from './modules/auth/strategies/google.strategy';


const logger = new LoggerService();
const redisConnection = configureRedisUrl(env.redis_url);

@Module({
  imports: [
    JwtModule.register({
      global: true,
      secret: env.jwt_secret,
    }),
  ],
  providers: [
    UserRepository,
    UserService,
    AuthService,
    QueueService,
    MailService,
    StripeProvider,
    GoogleStrategy,
    LoggerService,
    PrismaService,
    {
      provide: RedisStore,
      useFactory: () => {
        const redis = new IORedis(redisConnection);
        redis.on('error', (err: string) => logger.error(err));
        return new RedisStore(redis);
      },
    },
    { provide: APP_FILTER, useClass: AllExceptionsFilter },
  ],
  controllers: Object.values(c),
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware).forRoutes('*');
  }
}
