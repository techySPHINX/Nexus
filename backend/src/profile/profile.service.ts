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

  async getProfileCompletionStats(userId: string) {
    const profile = await this.prisma.profile.findUnique({
      where: { userId: userId },
      select: {
        avatarUrl: true,
        bio: true,
        location: true,
        interests: true,
        branch: true,
        year: true,
        course: true,
        dept: true,
        _count: {
          select: {
            skills: true,
          },
        },
      },
    });

    if (!profile) throw new NotFoundException('Profile not found');

    const isFilled = (value: unknown) => {
      if (value === null || value === undefined) return false;
      if (typeof value !== 'string') return true;
      return value.trim().length > 0;
    };

    const avatarFilled = isFilled(profile.avatarUrl);
    const bioFilled = isFilled(profile.bio);
    const locationFilled = isFilled(profile.location);
    const branchFilled = isFilled(profile.branch);
    const yearFilled = isFilled(profile.year);
    const deptFilled = isFilled(profile.dept);
    const skillsCount = profile._count?.skills ?? 0;
    const skillsFilled = skillsCount > 4;

    const countCsvItems = (val?: string | null) => {
      if (!val || typeof val !== 'string') return 0;
      return val
        .split(',')
        .map((s) => s.trim())
        .filter((s) => s.length > 0).length;
    };

    const interestsCount = countCsvItems(profile.interests);
    const courseCount = countCsvItems(profile.course);
    const interestsFilled = interestsCount > 4;
    const courseFilled = courseCount > 4;

    const fieldChecks = [
      avatarFilled,
      bioFilled,
      locationFilled,
      branchFilled,
      yearFilled,
      deptFilled,
      skillsFilled,
      interestsFilled,
      courseFilled,
    ];

    const totalFields = fieldChecks.length;
    const filledFields = fieldChecks.filter(Boolean).length;
    const completionPercentage =
      totalFields === 0 ? 100 : Math.round((filledFields / totalFields) * 100);

    if (completionPercentage === 100) {
      return {
      completionPercentage,
      };
    }

    return {
      details: {
      avatar: avatarFilled,
      bio: bioFilled,
      location: locationFilled,
      branch: branchFilled,
      year: yearFilled,
      dept: deptFilled,
      skillsCount,
      interestsCount,
      courseCount,
      },
    };
    
  }

  /**
   * Retrieves a user's profile by their user ID.
   * Includes associated skills, user details, and endorsements.
   * @param userId - The ID of the user whose profile is to be retrieved.
   * @returns A promise that resolves to the user's profile.
   * @throws {NotFoundException} If the profile is not found.
   */
  async getProfile(userId: string) {
    const profile = await this.prisma.profile.findUnique({
      where: { userId: userId },
      include: {
        skills: {
          include: {
            endorsements: {
              include: {
                endorser: {
                  select: {
                    id: true,
                    name: true,
                    role: true,
                    profile: {
                      select: {
                        avatarUrl: true,
                      },
                    },
                  },
                },
              },
              orderBy: {
                createdAt: 'desc',
              },
            },
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            bannerUrl: true,
            createdAt: true,
            description: true,
            userPoints: {
              select: {
                points: true,
                transactions: {
                  select: {
                    points: true,
                    type: true,
                    entityId: true,
                    createdAt: true,
                  },
                  orderBy: {
                    createdAt: 'desc',
                  },
                  take: 10, // Limit to recent transactions
                },
              },
            },
            _count: {
              select: {
                Post: { where: { status: 'APPROVED' } },
                Comment: { where: { parentId: null } },
                projects: true,
                startups: true,
                postedReferrals: true,
                events: true,
                ownedSubCommunities: { where: { status: 'ACTIVE' } },
                subCommunityMemberships: true,
              },
            },
          },
        },
      },
    });

    if (!profile) throw new NotFoundException('Profile not found');
    return profile;
  }

  /**
   * Retrieves a list of profiles based on various filters.
   * @param filterDto - DTO containing criteria for filtering profiles (e.g., name, email, roles, location, skills).
   * @returns A promise that resolves to an array of filtered profiles.
   */
  async getFilteredProfiles(filterDto: FilterProfilesDto) {
    const {
      name,
      email,
      roles,
      location,
      skills,
      skip,
      take,
      dept,
      year,
      branch,
      course,
    } = filterDto;

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

    if (dept) {
      where.dept = { contains: dept, mode: 'insensitive' };
    }

    if (year) {
      where.year = { contains: year, mode: 'insensitive' };
    }

    if (branch) {
      where.branch = { contains: branch, mode: 'insensitive' };
    }

    if (course) {
      where.course = { contains: course, mode: 'insensitive' };
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
            subCommunityMemberships: {
              select: {
                subCommunity: {
                  select: {
                    id: true,
                    name: true,
                    description: true,
                  },
                },
              },
            },
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
        skills: {
          include: {
            endorsements: {
              include: {
                endorser: {
                  select: {
                    id: true,
                    name: true,
                    role: true,
                    profile: {
                      select: {
                        avatarUrl: true,
                      },
                    },
                  },
                },
              },
              orderBy: {
                createdAt: 'desc',
              },
            },
          },
        },
        endorsements: {
          include: {
            skill: {
              select: {
                id: true,
                name: true,
              },
            },
            endorser: {
              select: {
                id: true,
                name: true,
                email: true,
                role: true,
                profile: {
                  select: {
                    avatarUrl: true,
                  },
                },
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
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
   * Removes an endorsement for a specific skill.
   * @param endorserId - The ID of the user who made the endorsement.
   * @param endorsementId - The ID of the endorsement to remove.
   * @returns A promise that resolves when the endorsement is removed.
   * @throws {NotFoundException} If the endorsement is not found.
   * @throws {ForbiddenException} If the user is not the endorser.
   */
  async removeEndorsement(endorserId: string, endorsementId: string) {
    const endorsement = await this.prisma.endorsement.findUnique({
      where: { id: endorsementId },
    });

    if (!endorsement) {
      throw new NotFoundException('Endorsement not found');
    }

    if (endorsement.endorserId !== endorserId) {
      throw new ConflictException('You can only remove your own endorsements.');
    }

    return this.prisma.endorsement.delete({
      where: { id: endorsementId },
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

  /**
   * Retrieves all skills available in the system.
   * @returns A promise that resolves to an array of all skills.
   */
  async getAllSkills() {
    return this.prisma.skill.findMany({
      orderBy: { name: 'asc' },
    });
  }

  /**
   * Retrieves all badges available in the system.
   * @returns A promise that resolves to an array of all badges.
   */
  async getAllBadges() {
    return this.prisma.badge.findMany({
      orderBy: { name: 'asc' },
    });
  }
}
