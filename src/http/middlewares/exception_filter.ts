import {
  Catch,
  ExceptionFilter,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  NotFoundException,
} from '@nestjs/common';
import { LoggerService } from '../../common';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  constructor(private readonly logger: LoggerService) {}

  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const error = exception.message || 'Internal Server Error';
    if (error == 'Internal Server Error') {
      this.logger.error(`[${request.method}] ${request.url}, ${exception}`);
      return response
        .status(status)
        .json({ message: 'Something went wrong', statusCode: status });
    }
    this.logger.error(`[${request.method}] ${request.url}, ${exception.stack}`);
    response.status(status).json(exception.response);
  }
}

@Catch(NotFoundException)
export class NotFoundExceptionFilter implements ExceptionFilter {
  catch(_exception: NotFoundException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();

    response.status(HttpStatus.NOT_FOUND).send("Whoops! Route doesn't exist.");
  }
}
