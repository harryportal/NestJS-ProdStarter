import { Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import { LoggerService } from '../../common';

const sensitiveDetails = ['token', 'code', 'password', 'confirmPassword'];

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  constructor(private readonly logger: LoggerService) {}

  use(req: Request, res: Response, next: NextFunction): void {
    const { ip, method, originalUrl } = req;
    const userAgent = req.get('user-agent') || '';

    ['send', 'json'].forEach((m) => {
      const method = res[m];
      res[m] = function (body?: any) {
        res.locals.body =
          body instanceof Buffer ? JSON.parse(body.toString()) : body;
        return method.call(this, body);
      };
    });

    res.on('finish', () => {
      const duration = res.getHeader('X-Response-Time');
      const { statusCode } = res;
      const contentLength = res.get('content-length');
      const hasPrivateDetails =
        this.check(req.body) || this.check(req.query) || this.check(req.params);
      if (hasPrivateDetails) {
        req.body = this.removeSensitiveFields(req.body);
        res.locals.body = {};
      }
      this.logger.log(
        JSON.stringify({
          'status-code': statusCode,
          method,
          'original-url': originalUrl,
          ip,
          'user-agent': userAgent,
          'content-length': contentLength,
          'request-body': req.body,
          response: res.locals.body,
          duration,
          timestamp: new Date(),
        }),
      );
    });

    next();
  }

  private check(data: any) {
    return sensitiveDetails.some((field) => data[field] !== undefined);
  }

  private removeSensitiveFields(data: any) {
    sensitiveDetails.forEach((field) => delete data[field]);
    return data;
  }
}
