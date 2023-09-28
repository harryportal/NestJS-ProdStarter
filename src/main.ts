import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, Logger } from '@nestjs/common';
import helmet from 'helmet';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { env } from './config';
import { NotFoundExceptionFilter } from './http/middlewares';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    abortOnError: false,
    cors: true,
    rawBody: true,
  });
  app.use(helmet());
  app.setGlobalPrefix('/api/v1');
  app.useGlobalFilters(new NotFoundExceptionFilter());
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      stopAtFirstError: false,
      skipMissingProperties: false,
    }),
  );
  await app
    .listen(env.port)
    .then(() => Logger.log(`app running on ${env.port}, DashAi🚀`));
}
bootstrap();
