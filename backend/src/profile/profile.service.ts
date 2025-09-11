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
    const profile = await this.prisma.profile.findUnique({
      where: { userId: userId },
      include: {
        skills: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            bannerUrl: true,
            createdAt: true,
            description: true,
            // iconUrl: true, // profiel.avatarUrl is same??
            // Subcommunities owned
            ownedSubCommunities: {
              select: {
                id: true,
                name: true,
                description: true,
                type: true,
                createdAt: true,
                iconUrl: true,
                status: true,
              },
            },
            // Subcommunity memberships
            subCommunityMemberships: {
              select: {
                role: true,
                subCommunity: {
                  select: {
                    id: true,
                    name: true,
                    description: true,
                    type: true,
                    iconUrl: true,
                    status: true,
                  },
                },
              },
            },
            // Comments
            Comment: {
              select: {
                id: true,
                content: true,
                postId: true,
                createdAt: true,
                post: {
                  select: {
                    subject: true,
                  },
                },
              },
              orderBy: {
                createdAt: 'desc',
              },
              take: 10, // Limit to recent comments
            },
            // Posts
            Post: {
              select: {
                id: true,
                subject: true,
                type: true,
                createdAt: true,
                subCommunity: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
                Comment: {
                  select: {
                    id: true,
                  },
                },
                Vote: {
                  select: {
                    type: true,
                  },
                },
              },
              where: { status: 'APPROVED' },
              orderBy: {
                createdAt: 'desc',
              },
              take: 10, // Limit to recent posts
            },
            // Badges
            // badges: {
            //   select: {
            //     assignedAt: true,
            //     badge: {
            //       select: {
            //         id: true,
            //         name: true,
            //         icon: true,
            //       },
            //     },
            //   },
            //   orderBy: {
            //     assignedAt: 'desc',
            //   },
            // },
            // Projects
            projects: {
              select: {
                id: true,
                title: true,
                description: true,
                githubUrl: true,
                websiteUrl: true,
                imageUrl: true,
                videoUrl: true,
                tags: true,
                status: true,
                seeking: true,
                skills: true,
                createdAt: true,
                supporters: {
                  select: {
                    user: {
                      select: {
                        id: true,
                        name: true,
                      },
                    },
                  },
                },
                followers: {
                  select: {
                    user: {
                      select: {
                        id: true,
                        name: true,
                      },
                    },
                  },
                },
              },
              orderBy: {
                createdAt: 'desc',
              },
            },
            // Startups
            startups: {
              select: {
                id: true,
                name: true,
                description: true,
                imageUrl: true,
                websiteUrl: true,
                status: true,
                fundingGoal: true,
                fundingRaised: true,
                monetizationModel: true,
                createdAt: true,
              },
              orderBy: {
                createdAt: 'desc',
              },
            },
            // User points
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
            // Referrals posted
            postedReferrals: {
              select: {
                id: true,
                company: true,
                jobTitle: true,
                description: true,
                requirements: true,
                location: true,
                status: true,
                createdAt: true,
                updatedAt: true,
                applications: {
                  select: {
                    id: true,
                    status: true,
                    createdAt: true,
                    student: {
                      select: {
                        id: true,
                        name: true,
                      },
                    },
                  },
                },
              },
              orderBy: {
                createdAt: 'desc',
              },
            },
            // Project updates
            projectUpdates: {
              select: {
                id: true,
                title: true,
                content: true,
                createdAt: true,
                project: {
                  select: {
                    id: true,
                    title: true,
                  },
                },
              },
              orderBy: {
                createdAt: 'desc',
              },
              take: 10, // Limit to recent updates
            },
            // Events created
            events: {
              select: {
                id: true,
                title: true,
                description: true,
                imageUrl: true,
                registrationLink: true,
                date: true,
                status: true,
                category: true,
                tags: true,
                location: true,
                createdAt: true,
                updatedAt: true,
              },
              orderBy: {
                createdAt: 'desc',
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
        endorsements: {
          include: {
            skill: true,
            endorser: {
              select: {
                id: true,
                name: true,
                email: true,
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
