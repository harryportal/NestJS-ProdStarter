import { Transform } from 'class-transformer';
import { IsEmail, MinLength, Matches, IsString } from 'class-validator';
import { PasswordDto, toLowerCase } from '../../../common';

export class ForgotPasswordDto {
  @Transform(toLowerCase)
  @IsEmail()
  email: string;
}

export class VerifyEmailDto extends ForgotPasswordDto {}

export class SignUpDto {
  @IsString()
  firstName: string;

  @IsString()
  lastName: string;

  @Transform(toLowerCase)
  @IsEmail()
  email: string;

  @MinLength(8)
  @Matches(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]+$/,
    {
      message:
        'Password must be at least 8 characters long, include uppercase and lowercase letters, at least one numeric digit, and at least one special character.',
    },
  )
  password: string;
}

export class SignInDto extends ForgotPasswordDto {
  @IsString()
  password: string;
}

export class ResetPasswordDto extends PasswordDto {
  @IsString()
  token: string;
}

export class LogInDto {
  @Transform(toLowerCase)
  @IsEmail()
  email: string;

  @IsString()
  password: string;
}
