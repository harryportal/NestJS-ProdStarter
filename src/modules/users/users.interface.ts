import { User, Profile } from '@prisma/client';

export interface UserwithProfile extends Partial<User> {
  profile?: Profile;
}

export interface IUpdateProfile {
  firstName: string;
  lastName: string;
  birthday: string;
}

export interface IAddProfile {
  birthday: string;
  giftingOccasions?: string[];
  purpose?: string;
  location: string;
}

export interface IResetPassword {
  currentPassword: string;
  password: string;
  confirmPassword: string;
}
