import {
  Injectable,
  createParamDecorator,
  ExecutionContext,
  SetMetadata,
  BadRequestException,
} from '@nestjs/common';
import {
  Matches,
  MinLength,
  ValidationArguments,
  ValidationOptions,
  registerDecorator,
  isUUID,
} from 'class-validator';
import { Request } from 'express';

/**
 * A generic controller to make the controllers response uniform accross the codebase
 */
@Injectable()
export class HttpController {
  protected send(data?: any) {
    return { success: true, data };
  }
  protected message(message: string, data?: any) {
    return { success: true, message, data };
  }
}

export const toLowerCase = ({ value }) => (<string>value).toLowerCase();

/**
 * A reusable password dto for reset password and create user dto
 */
export class PasswordDto {
  @MinLength(8)
  @Matches(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]+$/,
    {
      message:
        'Password must be at least 8 characters long, include uppercase and lowercase letters, at least one numeric digit, and at least one special character.',
    },
  )
  password: string;

  @MatchesWith('password', {
    message: 'The password and confirmPassword fields do not match',
  })
  confirmPassword: string;
}

/**
 * A custom decorator to check if two fields on a dto matches
 * @param property
 * @param validationOptions
 * @returns
 */
export function MatchesWith(
  property: string,
  validationOptions?: ValidationOptions,
) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isLongerThan',
      target: object.constructor,
      propertyName: propertyName,
      constraints: [property],
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          const [relatedPropertyName] = args.constraints;
          const relatedValue = (args.object as any)[relatedPropertyName];
          return value === relatedValue;
        },
      },
    });
  };
}

/**
 * A custom decorator to access the user field of the request object directly
 */
export const User = createParamDecorator(
  (data: string, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<Request>();
    const user = request.user;
    return data ? user[data] : user;
  },
);

/**
 * A custom decorator to accept parameters of only the UUID type
 */
export const UUIDParam = createParamDecorator(
  (data: string, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<Request>();
    const param = request.params[data];
    if (!isUUID(param)) {
      throw new BadRequestException('Validation failed (uuid is expected)');
    }
    return param;
  },
);

// A custom decorator to authenticate users if they're not verified
export const SkipVerification = () => SetMetadata('skipVerification', true);

// A custom decorator to make a route public even if an Auth guard is applied to the controller
export const SetPublic = () => SetMetadata('setPublic', true);
