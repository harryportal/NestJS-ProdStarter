import { validate } from '../common';
import { IsIn, IsInt, IsNotEmpty, IsNumber } from 'class-validator';
import { config } from 'dotenv';

const environment = <const>['development', 'staging', 'production', 'test'];

export class Environment {
  @IsIn(environment)
  @IsNotEmpty()
  node_env: (typeof environment)[number];

  @IsInt()
  @IsNotEmpty()
  port: number;

  @IsNotEmpty()
  database_url: string;

  @IsNotEmpty()
  redis_url: string;

  @IsNotEmpty()
  jwt_secret: string;

  @IsNumber()
  page_size: number;

  @IsNotEmpty()
  token_ttl: string;

  @IsNotEmpty()
  acesstoken_ttl: string;

  @IsNotEmpty()
  refreshtoken_ttl: string;

  @IsNotEmpty()
  frontendurl: string;

  @IsNotEmpty()
  client_secret: string;

  @IsNotEmpty()
  google_clientid: string;

  @IsNotEmpty()
  google_clientsecret: string;

  @IsNotEmpty()
  google_mail_sender: string;

  @IsNotEmpty()
  stripe_secret_key: string;

  @IsNotEmpty()
  google_app_key: string;

  @IsNotEmpty()
  stripe_signingkey: string;

  @IsNotEmpty()
  api_url: string;

  @IsNotEmpty()
  session_ttl: string;
}

config();
export const env = validate<Environment>(Environment, process.env);
