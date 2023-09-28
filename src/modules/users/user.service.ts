import {
  Inject,
  Injectable,
  InternalServerErrorException,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import {
  IAddProfile,
  IResetPassword,
  IUpdateProfile,
  UserRepository,
} from './';
import * as bcrypt from 'bcrypt';
import { RedisStore } from '../../common';

@Injectable()
export class UserService {
  @Inject() private readonly repository: UserRepository;
  @Inject() private readonly cache: RedisStore;

  /**
   * Get and return the user with profile details
   * @param id - user's id
   * @returns the user profile with password excluded
   */
  async getProfile(id: string) {
    const userProfile = await this.repository.getUser({ id });
    return userProfile;
  }

  /**
   * Update the profile for a user
   * @param data - profile data
   * @param id - user's id
   */
  async updateProfile(data: IUpdateProfile, id: string) {
    const { firstName, lastName } = data;
    return await this.repository.updateUser({ id }, { firstName, lastName });
  }

  /**
   * Confirms if the password user provided is correct and update it to the new password
   * @param data - old and new password
   * @param id
   */
  async updatePassword(data: IResetPassword, id: string) {
    const user = await this.repository.getUser({ id });
    if (user.googleSignOn) {
      throw new UnauthorizedException(
        "You can't update your password, \nAccount was created using Google SignOn",
      );
    }
    const equalPassword = await bcrypt.compare(
      data.currentPassword,
      user.password,
    );
    if (!equalPassword) {
      throw new UnauthorizedException('Incorrect Current Password');
    }
    const hashedPassword = await bcrypt.hash(data.password, 10);
    await this.repository.updateUser({ id }, { password: hashedPassword });
  }
}
