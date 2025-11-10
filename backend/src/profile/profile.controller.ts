import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Param,
  Post,
  Put,
  Delete,
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
import { EndorseSkillDto } from './dto/endorse-skill.dto';
import { AwardBadgeDto } from './dto/award-badge.dto';
import { RemoveEndorsementDto } from './dto/remove-endorsement.dto';

/**
 * Controller for handling profile-related requests.
 * Protected by JWT authentication and role-based access control.
 */
@Controller('profile')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  @Get('me-completion-stats')
  async getMyProfileCompletionStats(@GetCurrentUser('userId') userId: string) {
    return this.profileService.getProfileCompletionStats(userId);
  }

  /**
   * Retrieves the profile of the currently authenticated user.
   * @param userId - The ID of the current user (extracted from JWT).
   * @returns A promise that resolves to the user's profile.
   */
  @Get('me')
  async getMe(@GetCurrentUser('userId') userId: string) {
    return this.profileService.getProfile(userId);
  }

  /**
   * Searches for profiles based on provided filters.
   * @param filterDto - DTO containing filters for profile search.
   * @returns A promise that resolves to an array of filtered profiles.
   */
  @Get('search')
  async searchProfiles(@Query() filterDto: FilterProfilesDto) {
    return this.profileService.getFilteredProfiles(filterDto);
  }

  /**
   * Retrieves a specific user profile by user ID.
   * @param userId - The ID of the user whose profile is to be retrieved.
   * @returns A promise that resolves to the user's profile.
   */
  @Get(':userId')
  async get(@Param('userId') userId: string) {
    return this.profileService.getProfile(userId);
  }

  /**
   * Updates a user's profile.
   * Only the profile owner or an ADMIN can update a profile.
   * @param userId - The ID of the user whose profile is to be updated.
   * @param dto - The data to update the profile with.
   * @param user - The current authenticated user's information.
   * @returns A promise that resolves to the updated profile.
   * @throws {ForbiddenException} If the user is not authorized to update the profile.
   */
  @Put(':userId')
  async update(
    @Param('userId') userId: string,
    @Body() dto: UpdateProfileDto,
    @GetCurrentUser() user: { userId: string },
  ) {
    if (user.userId !== userId) {
      throw new ForbiddenException(
        'You are not authorized to update this profile.',
      );
    }
    return this.profileService.updateProfile(userId, dto);
  }

  /**
   * Endorses a skill for a specific profile.
   * @param profileId - The ID of the profile whose skill is to be endorsed.
   * @param dto - DTO containing the skill ID to endorse.
   * @param endorserId - The ID of the user performing the endorsement.
   * @returns A promise that resolves to the updated profile with endorsed skill.
   */
  @Post(':profileId/endorse')
  async endorseSkill(
    @Param('profileId') profileId: string,
    @Body() dto: EndorseSkillDto,
    @GetCurrentUser('userId') endorserId: string,
  ) {
    return this.profileService.endorseSkill(endorserId, profileId, dto.skillId);
  }

  /**
   * Removes an endorsement for a specific skill.
   * @param dto - DTO containing the endorsement ID to remove.
   * @param endorserId - The ID of the user who made the endorsement.
   * @returns A promise that resolves when the endorsement is removed.
   */
  @Delete('endorsement')
  async removeEndorsement(
    @Body() dto: RemoveEndorsementDto,
    @GetCurrentUser('userId') endorserId: string,
  ) {
    return this.profileService.removeEndorsement(endorserId, dto.endorsementId);
  }

  /**
   * Awards a badge to a user.
   * Only ADMIN users can award badges.
   * @param userId - The ID of the user to award the badge to.
   * @param dto - DTO containing the badge ID to award.
   * @param user - The current authenticated user's information.
   * @returns A promise that resolves to the updated user profile with the awarded badge.
   * @throws {ForbiddenException} If the user is not authorized to award badges.
   */
  @Post(':userId/award-badge')
  async awardBadge(
    @Param('userId') userId: string,
    @Body() dto: AwardBadgeDto,
    @GetCurrentUser() user: { userId: string; role: Role },
  ) {
    if (user.role !== Role.ADMIN) {
      throw new ForbiddenException('You are not authorized to award badges.');
    }
    return this.profileService.awardBadge(userId, dto.badgeId);
  }

  /**
   * Retrieves all badges for a specific user.
   * @param userId - The ID of the user to retrieve badges for.
   * @returns A promise that resolves to an array of badges for the user.
   */
  @Get(':userId/badges')
  async getBadgesForUser(@Param('userId') userId: string) {
    return this.profileService.getBadgesForUser(userId);
  }

  /**
   * Retrieves all skills available in table for user to choose from.
   * @returns A promise that resolves to an array of all skills.
   */
  @Get('skills/all')
  async getAllSkills() {
    return this.profileService.getAllSkills();
  }

  /**
   * Retrieves all badges available in table for admin to choose from.
   * @returns A promise that resolves to an array of all badges.
   */
  @Get('badges/all')
  async getAllBadges() {
    return this.profileService.getAllBadges();
  }
}
