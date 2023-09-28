import { createLogger, transports, format, addColors, Logger } from 'winston';
import { Injectable } from '@nestjs/common';
const { combine, timestamp, json, colorize, printf } = format;

const myLevels = {
  levels: {
    error: 0,
    warn: 1,
    info: 2,
    http: 3,
    debug: 4,
  },
  colors: {
    error: 'red',
    warn: 'yellow',
    info: 'green',
    http: 'magenta',
    debug: 'white',
  },
};

@Injectable()
export class LoggerService {
  private readonly logger: Logger;

  constructor() {
    addColors(myLevels.colors);

    this.logger = createLogger({
      level: this.level(),
      levels: myLevels.levels,
      format: combine(
        json(),
        timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        colorize({ all: true }),
        printf((info) => `${info.timestamp} ${info.level}: ${info.message}`),
      ),
      transports: [
        new transports.File({ filename: 'logs/all.log' }),
        new transports.File({ filename: 'logs/errors.log', level: 'error' }),
      ],
      exceptionHandlers: [
        new transports.File({
          level: 'error',
          filename: 'logs/exceptions.log',
        }),
      ],
      rejectionHandlers: [
        new transports.File({
          level: 'error',
          filename: 'logs/exceptions.log',
        }),
      ],
    });

    const console_format = format.combine(format.colorize(), format.simple());
    this.logger.add(
      new transports.Console({
        level: 'info',
        format: console_format,
      }),
    );
    this.logger.exceptions.handle(
      new transports.Console({ format: console_format }),
    );
    this.logger.rejections.handle(
      new transports.Console({ format: console_format }),
    );
  }

  private level(): string {
    const env = process.env.NODE_ENV || 'development';
    return env === 'development' ? 'debug' : 'warn';
  }

  log(message: string) {
    this.logger.info(message);
  }

  error(message: string): void {
    this.logger.error(message);
  }

  warn(message: string): void {
    this.logger.warn(message);
  }

  http(message: string): void {
    this.logger.http(message);
  }

  debug(message: string): void {
    this.logger.debug(message);
  }
}
