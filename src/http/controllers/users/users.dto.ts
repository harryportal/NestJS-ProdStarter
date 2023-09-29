import { Transform } from 'class-transformer';
import { IsOptional, IsString, IsIn } from 'class-validator';
import { PasswordDto } from '../../../common';

export class ResetPasswordDto extends PasswordDto {
  @IsString()
  currentPassword: string;
}
