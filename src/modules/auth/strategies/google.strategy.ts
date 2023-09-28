import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback, Profile } from 'passport-google-oauth20';
import { env } from '../../../config';
import { UserRepository } from '../../users';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(private readonly userRepo: UserRepository) {
    super({
      clientID: env.google_clientid,
      clientSecret: env.google_clientsecret,
      callbackURL: `${env.frontendurl}/google-signin`,
      scope: ['profile', 'email'],
    });
  }

  async validate(
    _accessToken: string,
    _refreshToken: string,
    profile: Profile,
    done: VerifyCallback,
  ): Promise<void> {
    try {
      const { email, family_name, name } = profile._json;
      const user = await this.userRepo.upsertGoogleUser({
        email,
        firstName: family_name,
        lastName: name,
        verified: true,
        googleSignOn: true,
      });
      done(null, user);
    } catch (error: any) {
      done(error, false);
    }
  }
}
