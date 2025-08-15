import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { FilterProfilesDto } from './dto/filter-profiles.dto';

/**
 * Service for managing user profiles, including retrieval, updates, skill endorsements, and badge awards.
 */
@Injectable()
export class ProfileService {
  constructor(private prisma: PrismaService) {}

  /**
   * Retrieves a user's profile by their user ID.
   * Includes associated skills, user details, and endorsements.
   * @param userId - The ID of the user whose profile is to be retrieved.
   * @returns A promise that resolves to the user's profile.
   * @throws {NotFoundException} If the profile is not found.
   */
  async getProfile(userId: string) {
    console.log(`Fetching profile for userId: ${userId}`);
    const profile = await this.prisma.profile.findUnique({
      where: { userId: userId },
      include: {
        skills: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        endorsements: {
          include: {
            skill: true,
            endorser: true,
          },
        },
      },
    });
    console.log('Found profile:', profile); // Add this logging
    if (!profile) throw new NotFoundException('Profile not found');
    return profile;
  }

  /**
   * Retrieves a list of profiles based on various filters.
   * @param filterDto - DTO containing criteria for filtering profiles (e.g., name, email, roles, location, skills).
   * @returns A promise that resolves to an array of filtered profiles.
   */
  async getFilteredProfiles(filterDto: FilterProfilesDto) {
    const { name, email, roles, location, skills, skip, take } = filterDto;

    const where: any = {};

    if (name) {
      where.user = {
        ...where.user,
        name: { contains: name, mode: 'insensitive' },
      };
    }

    if (email) {
      where.user = {
        ...where.user,
        email: { contains: email, mode: 'insensitive' },
      };
    }

    if (roles && roles.length > 0) {
      where.user = { ...where.user, role: { in: roles } };
    }

    if (location) {
      where.location = { contains: location, mode: 'insensitive' };
    }

    if (skills && skills.length > 0) {
      where.skills = {
        some: {
          name: { in: skills, mode: 'insensitive' },
        },
      };
    }

    const profiles = await this.prisma.profile.findMany({
      where,
      include: {
        skills: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
      skip,
      take,
    });

    return profiles;
  }

  /**
   * Updates a user's profile information.
   * Creates or updates skills associated with the profile.
   * @param userId - The ID of the user whose profile is to be updated.
   * @param dto - The data to update the profile with.
   * @returns A promise that resolves to the updated profile.
   * @throws {NotFoundException} If the profile is not found.
   */
  async updateProfile(userId: string, dto: UpdateProfileDto) {
    const profile = await this.prisma.profile.findUnique({ where: { userId } });
    if (!profile) throw new NotFoundException('Profile not found');

    const { skills, ...rest } = dto;

    let skillConnections = undefined;

    if (skills && skills.length > 0) {
      const skillRecords = await Promise.all(
        skills.map(async (name) => {
          return this.prisma.skill.upsert({
            where: { name },
            update: {}, // nothing to update if it exists
            create: { name },
          });
        }),
      );

      skillConnections = {
        set: skillRecords.map((skill) => ({ id: skill.id })),
      };
    }

    return this.prisma.profile.update({
      where: { userId },
      data: {
        ...rest,
        updatedAt: new Date(),
        skills: skillConnections,
      },
      include: {
        skills: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
  }

  /**
   * Endorses a specific skill for a user's profile.
   * @param endorserId - The ID of the user performing the endorsement.
   * @param profileId - The ID of the profile whose skill is being endorsed.
   * @param skillId - The ID of the skill to endorse.
   * @returns A promise that resolves to the created endorsement record.
   * @throws {NotFoundException} If the profile or skill is not found.
   * @throws {ConflictException} If the endorser has already endorsed this skill for this user.
   */
  async endorseSkill(endorserId: string, profileId: string, skillId: string) {
    const profile = await this.prisma.profile.findUnique({
      where: { id: profileId },
    });
    if (!profile) throw new NotFoundException('Profile not found');

    const skill = await this.prisma.skill.findUnique({
      where: { id: skillId },
    });
    if (!skill) throw new NotFoundException('Skill not found');

    const existingEndorsement = await this.prisma.endorsement.findUnique({
      where: {
        profileId_skillId_endorserId: {
          profileId,
          skillId,
          endorserId,
        },
      },
    });

    if (existingEndorsement) {
      throw new ConflictException(
        'You have already endorsed this skill for this user.',
      );
    }

    return this.prisma.endorsement.create({
      data: {
        profileId,
        skillId,
        endorserId,
      },
    });
  }

  /**
   * Awards a badge to a specific user.
   * @param userId - The ID of the user to award the badge to.
   * @param badgeId - The ID of the badge to award.
   * @returns A promise that resolves to the created user-badge association record.
   * @throws {NotFoundException} If the user or badge is not found.
   * @throws {ConflictException} If the user already has this badge.
   */
  async awardBadge(userId: string, badgeId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const badge = await this.prisma.badge.findUnique({
      where: { id: badgeId },
    });
    if (!badge) throw new NotFoundException('Badge not found');

    const existingBadge = await this.prisma.usersOnBadges.findUnique({
      where: {
        userId_badgeId: {
          userId,
          badgeId,
        },
      },
    });

    if (existingBadge) {
      throw new ConflictException('User already has this badge.');
    }

    return this.prisma.usersOnBadges.create({
      data: {
        userId,
        badgeId,
      },
    });
  }

  /**
   * Retrieves all badges awarded to a specific user.
   * @param userId - The ID of the user to retrieve badges for.
   * @returns A promise that resolves to an array of badge associations for the user.
   * @throws {NotFoundException} If the user is not found.
   */
  async getBadgesForUser(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    return this.prisma.usersOnBadges.findMany({
      where: { userId },
      include: {
        badge: true,
      },
    });
  }
}
