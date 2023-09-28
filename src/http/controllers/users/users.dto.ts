import { Transform } from 'class-transformer';
import { IsOptional, IsString, IsIn } from 'class-validator';
import { PasswordDto } from '../../../common';

export class UpdateProfileDto {
  @IsString()
  @IsOptional()
  firstName: string;

  @IsString()
  @IsOptional()
  lastName: string;

  @Transform(({ value }) => {
    const [day, month, year] = value.split('-').map(Number);
    const date = new Date(year + 2000, month - 1, day);
    return date.toISOString();
  })
  @IsString()
  @IsOptional()
  birthday: string;
}

export class ResetPasswordDto extends PasswordDto {
  @IsString()
  currentPassword: string;
}

export class AddProfileDto {
  @Transform(({ value }) => {
    const date = new Date(value);
    return date.toISOString();
  })
  @IsString()
  //@Matches(/^\d{2}\-(0[1-9]|1[012])\-(0[1-9]|[12][0-9]|3[01])$/, { message: 'Birthday must be in the format YYYY-MM-DD' })
  birthday: string;

  @IsOptional()
  @IsIn(['Birthday', 'Christmas', 'Funeral', 'Eid', 'Wedding', 'Anniversary'], {
    each: true,
  })
  giftingOccasions: string[];

  @IsOptional()
  @IsString()
  purpose: string;

  @IsString()
  location: string;
}
