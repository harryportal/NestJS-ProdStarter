import {
  Controller,
  Get,
  Post,
  Body,
  Inject,
  UseGuards,
  Patch,
  Put,
  Query,
} from '@nestjs/common';
import { UserService } from '../../../modules/users';
import { HttpController, SkipVerification, User } from '../../../common';
import { AddProfileDto, ResetPasswordDto, UpdateProfileDto } from './users.dto';
import { AuthGuard } from '../../../http/guards';

@Controller('user')
@UseGuards(AuthGuard)
export class UserController extends HttpController {
  @Inject() private readonly service: UserService;

  @SkipVerification()
  @Get('profile')
  async getProfile(@User('id') id: string) {
    const profile = await this.service.getProfile(id);
    return this.send(profile);
  }

  @Patch('profile')
  async updateProfile(@User('id') id: string, @Body() body: UpdateProfileDto) {
    const updatedProfile = await this.service.updateProfile(body, id);
    return this.send(updatedProfile);
  }

  @Put('password')
  async updatePassword(@User('id') id: string, @Body() body: ResetPasswordDto) {
    await this.service.updatePassword(body, id);
    return this.send();
  }
}
