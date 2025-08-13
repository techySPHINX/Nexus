import { Body, Controller, Get, Param, Put, UseGuards, Query } from "@nestjs/common";
import { JwtAuthGuard } from "src/auth/guards/jwt-auth.guard";
import { RolesGuard } from "src/common/guards/roles.guard";
import { UpdateProfileDto } from "./dto/update-profile.dto";
import { ProfileService } from "./profile.service";
import { FilterProfilesDto } from "./dto/filter-profiles.dto";
import { GetCurrentUser } from "src/common/decorators/get-current-user.decorator";

@Controller('profile')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  @Get('me')
  async getMe(@GetCurrentUser('sub') userId: string) {
    return this.profileService.getProfile(userId);
  }

  @Get('search')
  async searchProfiles(@Query() filterDto: FilterProfilesDto) {
    return this.profileService.getFilteredProfiles(filterDto);
  }

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
