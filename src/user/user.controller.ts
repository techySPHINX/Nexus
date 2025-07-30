import { Controller, Get, Put, Body, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { GetUser } from '../common/decorators/get-user.decorator';
import { UserService } from './user.service';
import { UpdateUserDto } from './dto/update-user.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('me')
  getMe(@GetUser() user: any) {
    return this.userService.getUserWithProfile(user.id);
  }

  @Put('update')
  update(@GetUser() user: any, @Body() dto: UpdateUserDto) {
    return this.userService.updateUserProfile(user.id, dto);
  }
}
