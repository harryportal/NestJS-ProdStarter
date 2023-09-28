import { UserwithProfile } from '../users';

export interface jwtPayload {
  id: string;
  email: string;
  type: string;
}

export interface PasswordInput {
  password: string;
  confirmPassword: string;
}

export interface ISignInResponse {
  accessToken: string;
  refreshToken: string;
  user: Session;
}

interface BaseInput {
  email: string;
}

export interface ForgotPasswordInput extends BaseInput {
  email: string;
}

export type VerifyEmailInput = BaseInput;

export interface SignUpInput extends BaseInput {
  firstName: string;
  lastName: string;
  password: string;
}

export interface SignInInput extends BaseInput {
  password: string;
}

export interface ResetPasswordInput extends PasswordInput {
  token: string;
}

export interface LogInInput extends BaseInput {
  password: string;
}

export interface Session {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  verified: boolean;
}

export type AuthKeys = 'refresh' | 'verify' | 'reset' | 'access';
