import {
  Injectable,
  Inject,
  UnauthorizedException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { hash, compare } from 'bcrypt';
import { Prisma, User } from '@prisma/client';
import { UserRepository } from '../users';
import {
  AuthKeys,
  ISignInResponse,
  ResetPasswordInput,
  Session,
  SignInInput,
  SignUpInput,
  jwtPayload,
} from './';
import { env } from '../../config';
import { QueueService } from '../queue';
import {
  completeprofileTemplate,
  createresetTemplate,
} from '../mail/templates';
import { RedisStore } from '../../common';

@Injectable()
export class AuthService {
  @Inject() private readonly jwtService: JwtService;
  @Inject() private readonly userRepository: UserRepository;
  @Inject() private readonly queueService: QueueService;
  @Inject() private readonly cache: RedisStore;

  /**
   * verifies the token and sends the user payload if valid
   * @param token - jwt token
   * @returns - the verified user payload
   */
  private verifyJwt(token: string): jwtPayload {
    try {
      const verifiedPayload = this.jwtService.verify(token);
      if (!verifiedPayload) {
        throw new UnauthorizedException('Invalid or Expired Token!');
      }
      return verifiedPayload;
    } catch (err: any) {
      throw new UnauthorizedException('Invalid or Expired Token!');
    }
  }

  /**
   * Initiates and send a verification mail to the user's email address
   * @param user
   */
  private async InitiateMailVerification(user: User): Promise<void> {
    const token = await this.createVerificationToken(user.id);
    const verifyEmailUrl = `${env.api_url}/auth/verify-email?token=${token}`;
    const mailtemplate = completeprofileTemplate(verifyEmailUrl, user.lastName);
    await this.queueService.addEmailToQueue({
      to: user.email,
      subject: 'Verify Your Email Address',
      html: mailtemplate,
    });
  }

  /**
   * Creates the reset password url from the client's reset url and reset password token
   * Create the mail template with the user name and reset link
   * Add the email task to the background worker
   * @param token - resetpassword jwt token
   * @param email
   * @param name
   */
  private async sendResetPasswordmail(
    token: string,
    email: string,
    name: string,
  ): Promise<void> {
    const addPasswordUrl = `${env.frontendurl}/forgot-password?token=${token}`;
    const mailtemplate = createresetTemplate(name, addPasswordUrl);
    await this.queueService.addEmailToQueue({
      to: email,
      subject: 'Reset Your Password',
      html: mailtemplate,
    });
  }

  /**
   * Verifies that a user with the email provided doesn't already exist.
   * Hash the password and create the user with the email and hashed password.
   * Creates a jwt token with the user email in the payload, attach it to the user and call the
   * send verification mail function
   * @param email
   * @param password
   */
  public async signUp(data: SignUpInput): Promise<void> {
    const { email, firstName, lastName, password } = data;
    const hashedPassword = await hash(password, 10);
    try {
      const user = await this.userRepository.createUser({
        email,
        password: hashedPassword,
        lastName,
        firstName,
      });
      await this.initiateSession(user);
      await this.InitiateMailVerification(user);
    } catch (err: any) {
      if (err instanceof Prisma.PrismaClientKnownRequestError) {
        throw new ConflictException(
          'Email Already Exists. Please use another email Adress',
        );
      }
      throw err;
    }
  }

  private async initiateSession(
    user: User,
    verified = false,
  ): Promise<Session> {
    const session: Session = {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      verified
    };
    await this.cache.set(user.id, session, env.session_ttl);
    return session;
  }

  /**
   * Verifies that the token is still valid.
   * Fetch the user to check that the token is currently associated the with user
   * ( it won't if the user has requested for a new verification link after the current one was requested ).
   * If valid, delete the verification token from the user and mark the user verified
   * @param verificationToken - jwt verification token
   */
  public async verifyEmail(verificationToken: string): Promise<string> {
    const unverifiedUrl = `${env.frontendurl}/verify`;
    const verifiedUrl = `${env.frontendurl}/verified`;
    try {
      const { id: userId } = this.jwtService.verify(verificationToken);
      if (!userId) {
        return unverifiedUrl;
      }
      const session = await this.cache.get<Session>(userId);
      if (session.verified) {
        return verifiedUrl;
      }
      const verifyTokenkey = this.getTokenKey('verify', userId);
      const token = await this.cache.get<string>(verifyTokenkey);

      if (token !== verificationToken) {
        return unverifiedUrl;
      }
      await this.cache.delete(verifyTokenkey);
      session.verified = true;
      await this.cache.set(userId, session, env.session_ttl);
      await this.userRepository.updateUser({ id: userId }, { verified: true });
      return `${env.frontendurl}/verified`;
    } catch (err: any) {
      return verifiedUrl;
    }
  }

  /**
   * Verifies that a user with email exists.
   * Compares the passowrd with user's hashed password.
   * Create and returns access, refresh tokens and the user onboarding status
   * @param data -- {email and password}
   * @returns access and refresh tokens
   */
  async signIn(data: SignInInput): Promise<ISignInResponse> {
    const user = await this.userRepository.getUser({ email: data.email });
    if (!user) {
      throw new UnauthorizedException('Invalid Login Credentials');
    }
    if (user.googleSignOn) {
      throw new UnauthorizedException(
        'This account was created using Google SignOn,\n Please sign in with Google',
      );
    }
    const checkPassword = await compare(data.password, user.password);
    if (!checkPassword) {
      throw new UnauthorizedException('Invalid Login Credentials');
    }
    const { refreshToken, accessToken } = await this.generateToken(user.id);
    let session = await this.cache.get<Session>(user.id);
    if (!session) {
      session = await this.initiateSession(user);
    }
    return { accessToken, refreshToken, user: session };
  }

  /**
   * Generates the access Token and refresh token from the user object
   * Add the Refresh Token to the database and attach to the user
   * @param user
   * @returns
   */
  private async generateToken(
    user_id: string,
  ): Promise<Partial<ISignInResponse>> {
    const accessToken = await this.createAcessToken(user_id);
    const refreshToken = await this.createRefreshToken(user_id);
    return { refreshToken, accessToken };
  }

  public async googleSignOn(user: User): Promise<ISignInResponse> {
    const { accessToken, refreshToken } = await this.generateToken(user.id);
    let session = await this.cache.get<Session>(user.id);
    if (!session || !session.verified) {
      session = await this.initiateSession(user, true);
    }
    return { accessToken, refreshToken, user: session };
  }

  /**
   * Initiates the email verification process if the user exists and is not already verified
   * @param email
   */
  public async getVerificationMail(email: string) {
    const user = await this.userRepository.getUser({ email });
    if (!user) {
      throw new BadRequestException(
        'Email does not exist, Please sign up on dash to get started',
      );
    }
    if (!user.verified) {
      await this.InitiateMailVerification(user);
    }
  }

  /**
   * Compares the passwords and proceed if matched.
   * Verifies that the jwt token is valid and is a reset token
   * @param token - token passed to the frontend url from the verification email.
   * @param password
   * @param confirmPassword
   */
  public async resetPassword(data: ResetPasswordInput): Promise<void> {
    const { token, password } = data;
    const { id } = this.verifyJwt(token);
    const resetTokenKey = this.getTokenKey('reset', id);
    const resetToken = await this.cache.get<string>(resetTokenKey);
    if (resetToken !== token) {
      throw new UnauthorizedException('Invalid or Expired Token');
    }
    await this.cache.delete(resetToken);
    const hashedPassword = await hash(password, 10);
    await this.userRepository.updateUser({ id }, { password: hashedPassword });
  }

  /**
   * Verifies the jwt refresh token.
   * Verifies that the token exists in db and has not expired.
   * If valid, fetch the user from the db and creates the access token.
   * @param refreshToken
   * @returns a new access Token
   */
  public async getAccessToken(refreshToken: string): Promise<string> {
    const { id } = this.verifyJwt(refreshToken);
    const refreshTokenKey = this.getTokenKey('refresh', id);
    const token = await this.cache.get<string>(refreshTokenKey);
    if (token !== refreshToken) {
      throw new UnauthorizedException('Invalid or Expired Token');
    }
    const acessToken = this.createAcessToken(id);
    return acessToken;
  }

  /**
   * Verifies the jwt refresh token, checks that is a refresh token and
   * invalidates the refresh token by deleting it from the database
   * @param refreshToken
   */
  public async logOut(refreshToken: string) {
    const { id } = this.verifyJwt(refreshToken);
    const refreshTokenKey = this.getTokenKey('refresh', id);
    const token = await this.cache.get<string>(refreshTokenKey);
    if (token != refreshToken) {
      throw new UnauthorizedException('Invalid or Expired Token');
    }
    const accessTokenKey = this.getTokenKey('access', id);
    await this.cache.delete(refreshTokenKey);
    await this.cache.delete(accessTokenKey);
  }

  /**
   * Verifies that a user with the email address exists.
   * If true, verifies that the user email has been verified.
   * Delete the user's current verification token, create a new verification token and
   * call the send reset mail method
   * @param email
   */
  public async forgotPassword(email: string) {
    const user = await this.userRepository.getUser({ email });
    if (!user) {
      throw new BadRequestException(
        'Email does not exist, Please sign up on dash to get started',
      );
    }
    if (user.googleSignOn) {
      throw new BadRequestException(
        "You can't update your password, \nAccount was created using Google SignOn",
      );
    }
    const userToken = await this.createResetToken(user.id);
    await this.sendResetPasswordmail(userToken, email, user.lastName);
  }

  /**
   * Creates the jwt token for protected endpoints
   * @param user
   * @returns the signed jwt token
   */
  private async createAcessToken(session_id: string) {
    const ttl = env.acesstoken_ttl;
    const token = this.jwtService.sign({ session_id }, { expiresIn: ttl });
    const key = this.getTokenKey('access', session_id);
    await this.cache.set(key, token, ttl);
    return token;
  }

  private getTokenKey(authType: AuthKeys, user_id: string) {
    return `${authType}-${user_id}`;
  }

  private async createRefreshToken(user_id: string) {
    const ttl = env.refreshtoken_ttl;
    const token = this.jwtService.sign({ id: user_id }, { expiresIn: ttl });
    const key = this.getTokenKey('refresh', user_id);
    await this.cache.set(key, token, ttl);
    return token;
  }

  private async createResetToken(user_id: string) {
    const ttl = env.token_ttl;
    const token = this.jwtService.sign({ id: user_id }, { expiresIn: ttl });
    const key = this.getTokenKey('reset', user_id);
    await this.cache.set(key, token, ttl);
    return token;
  }

  private async createVerificationToken(user_id: string) {
    const ttl = env.token_ttl;
    const token = this.jwtService.sign({ id: user_id }, { expiresIn: ttl });
    const key = this.getTokenKey('verify', user_id);
    await this.cache.set(key, token, ttl);
    return token;
  }
}
