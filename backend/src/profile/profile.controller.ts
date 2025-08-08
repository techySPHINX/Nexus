import { Body, Controller, Get, Param, Put, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "src/auth/guards/jwt-auth.guard";
import { RolesGuard } from "src/common/guards/roles.guard";
import { UpdateProfileDto } from "./dto/update-profile.dto";
import { ProfileService } from "./profile.service";

@Controller('profile')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  @Get(':userId')
  async get(
    @Param('userId') userId: string
){
    return this.profileService.getProfile(userId);
  }

  @Put(':userId')
  async update(
    @Param('userId') userId: string,
    @Body() dto: UpdateProfileDto
  ) {
    return this.profileService.updateProfile(userId, dto);
  }
}