import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
  Inject,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { RedisStore } from '../../common';
import { env } from '../../config';
import { Session } from '../../modules/auth';

@Injectable()
export class AuthGuard implements CanActivate {
  @Inject() private readonly jwtService: JwtService;
  @Inject() private readonly cache: RedisStore;
  @Inject() private readonly reflector: Reflector;

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const setPublic = this.reflector.get<boolean>(
      'setPublic',
      context.getHandler(),
    );
    if (setPublic) return true;

    const request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromHeader(request);
    if (!token) {
      throw new UnauthorizedException(
        'Please provide your authorization Details',
      );
    }
    try {
      const { session_id } = await this.jwtService.verifyAsync(token, {
        secret: env.jwt_secret,
      });
      const accessKey = `access-${session_id}`;
      const accessToken = await this.cache.get<string>(accessKey);

      if (accessToken !== token) {
        throw new UnauthorizedException(
          'We could not verify your authorization details',
        );
      }
      const session = await this.cache.get<Session>(session_id);
      const skipVerification = this.reflector.get<boolean>(
        'skipVerification',
        context.getHandler(),
      );
      request['user'] = session;
      if (skipVerification) {
        return true;
      } else if (!session.verified) {
        throw new ForbiddenException(
          'Please verify your email address to proceed',
        );
      }
      return true;
    } catch (err: any) {
      if (err instanceof ForbiddenException) {
        throw err;
      }
      throw new UnauthorizedException(
        'We could not verify your authorization details',
      );
    }
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
