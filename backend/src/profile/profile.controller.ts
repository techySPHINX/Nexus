import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Param,
  Post, // Import Post
  Put,
  UseGuards,
  Query,
} from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ProfileService } from './profile.service';
import { FilterProfilesDto } from './dto/filter-profiles.dto';
import { GetCurrentUser } from 'src/common/decorators/get-current-user.decorator';
import { Role } from '@prisma/client';
import { EndorseSkillDto } from './dto/endorse-skill.dto'; // Import EndorseSkillDto
import { AwardBadgeDto } from './dto/award-badge.dto'; // Import AwardBadgeDto

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
  async get(@Param('userId') userId: string) {
    return this.profileService.getProfile(userId);
  }

  @Put(':userId')
  async update(
    @Param('userId') userId: string,
    @Body() dto: UpdateProfileDto,
    @GetCurrentUser() user: { sub: string; role: Role },
  ) {
    if (user.sub !== userId && user.role !== Role.ADMIN) {
      throw new ForbiddenException(
        'You are not authorized to update this profile.',
      );
    }
    return this.profileService.updateProfile(userId, dto);
  }

  @Post(':profileId/endorse')
  async endorseSkill(
    @Param('profileId') profileId: string,
    @Body() dto: EndorseSkillDto,
    @GetCurrentUser('sub') endorserId: string,
  ) {
    return this.profileService.endorseSkill(
      endorserId,
      profileId,
      dto.skillId,
    );
  }

  @Post(':userId/award-badge')
  async awardBadge(
    @Param('userId') userId: string,
    @Body() dto: AwardBadgeDto,
    @GetCurrentUser() user: { sub: string; role: Role },
  ) {
    if (user.role !== Role.ADMIN) {
      throw new ForbiddenException(
        'You are not authorized to award badges.',
      );
    }
    return this.profileService.awardBadge(userId, dto.badgeId);
  }

  @Get(':userId/badges')
  async getBadgesForUser(@Param('userId') userId: string) {
    return this.profileService.getBadgesForUser(userId);
  }
}
