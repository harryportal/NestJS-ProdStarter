import {
  INestApplication,
  ValidationPipe,
  NestApplicationOptions,
} from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';

/**
 * Initializes application with required configurations
 * @param app
 */
export function initializeApp(moduleRef: TestingModule): INestApplication<any> {
  const app = moduleRef.createNestApplication(<NestApplicationOptions>{
    abortOnError: false,
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      skipMissingProperties: false,
    }),
  );
  return app;
}
