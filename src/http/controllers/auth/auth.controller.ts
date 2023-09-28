import {
  Body,
  Get,
  Controller,
  Post,
  Query,
  UseGuards,
  Inject,
  Res,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import { AuthService } from '../../../modules/auth';
import {
  ResetPasswordDto,
  SignInDto,
  SignUpDto,
  VerifyEmailDto,
} from './auth.dto';
import { HttpController, SkipVerification, User } from '../../../common';
import { GoogleOuathGuard, AuthGuard } from '../../guards';
import { User as _User } from '@prisma/client';

@Controller('auth')
export class AuthController extends HttpController {
  @Inject() private readonly service: AuthService;

  @Post('signup')
  async signUp(@Body() body: SignUpDto) {
    await this.service.signUp(body);
    return this.message('A verification link has been sent to your mail!');
  }

  @HttpCode(HttpStatus.OK)
  @Post('signin')
  async signIn(@Body() body: SignInDto) {
    const data = await this.service.signIn(body);
    return this.send(data);
  }

  @Get('google/authenticate-user')
  @UseGuards(GoogleOuathGuard)
  async googleAuth() {}

  @Get('google/sign-in')
  @UseGuards(GoogleOuathGuard)
  async googleSignOn(@User() user: _User) {
    const data = await this.service.googleSignOn(user);
    return this.send(data);
  }

  @Get('verify-with-email')
  async getVerificationwithEmail(@Body() body: VerifyEmailDto) {
    await this.service.getVerificationMail(body.email);
    return this.message('A verification link has been sent to your mail');
  }

  @Get('verification')
  @UseGuards(AuthGuard)
  @SkipVerification()
  async getVerficiationMail(@User('email') email: string) {
    await this.service.getVerificationMail(email);
    return this.message('A verification link has been sent to your mail');
  }

  @Get('verify-email')
  async verifyEmail(@Query('token') token: string, @Res() res: Response) {
    const redirectLink = await this.service.verifyEmail(token);
    res.redirect(redirectLink);
  }

  @Get('access-token')
  async getAccessToken(@Query('token') token: string) {
    const accessToken = await this.service.getAccessToken(token);
    return this.send({ accessToken });
  }

  @Post('logout')
  @UseGuards(AuthGuard)
  @SkipVerification()
  @HttpCode(HttpStatus.OK)
  async logout(@Query('token') token: string) {
    await this.service.logOut(token);
    return this.send();
  }

  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  async forgotPassword(@Body() body: VerifyEmailDto) {
    await this.service.forgotPassword(body.email);
    return this.message('A password reset link has been sent to your mail');
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  async resetPassword(@Body() body: ResetPasswordDto) {
    await this.service.resetPassword(body);
    return this.message('Your password has been successfully reset!');
  }
}
