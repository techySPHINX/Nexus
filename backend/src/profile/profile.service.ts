import {
  Injectable,
  NotFoundException,
  ConflictException,
  Logger,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { FilterProfilesDto } from './dto/filter-profiles.dto';
import { UpdateMemberProfileDto } from './dto/update-member-profile.dto';
import { CreateMemberFlairDto } from './dto/create-member-flair.dto';

/**
 * Service for managing user profiles, including retrieval, updates, skill endorsements, and badge awards.
 */
@Injectable()
export class ProfileService {
  private readonly logger = new Logger(ProfileService.name);
  constructor(private prisma: PrismaService) {}

  private shouldCreateInAppNotification(
    preference:
      | {
          inAppEnabled?: boolean;
          digestModeEnabled?: boolean;
          notifyOnFollow?: boolean;
          notifyOnBadgeAward?: boolean;
        }
      | null
      | undefined,
    notificationKind: 'follow' | 'badge'
  ): boolean {
    if (!preference) {
      return true;
    }

    if (preference.inAppEnabled === false) {
      return false;
    }

    if (preference.digestModeEnabled === true) {
      return false;
    }

    if (notificationKind === 'follow' && preference.notifyOnFollow === false) {
      return false;
    }

    if (
      notificationKind === 'badge' &&
      preference.notifyOnBadgeAward === false
    ) {
      return false;
    }

    return true;
  }

  private async attachSkillEndorsements<T extends { id: string }>(
    profileId: string,
    skills: T[],
  ): Promise<Array<T & { endorsements: any[] }>> {
    if (!skills.length) {
      return skills.map((skill) => ({ ...skill, endorsements: [] }));
    }

    const endorsements = await this.prisma.endorsement.findMany({
      where: {
        profileId,
        skillId: { in: skills.map((skill) => skill.id) },
      },
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
    });

    const endorsementsBySkill = new Map<string, any[]>();
    for (const endorsement of endorsements) {
      const skillEndorsements = endorsementsBySkill.get(endorsement.skillId) || [];
      skillEndorsements.push(endorsement);
      endorsementsBySkill.set(endorsement.skillId, skillEndorsements);
    }

    return skills.map((skill) => ({
      ...skill,
      endorsements: endorsementsBySkill.get(skill.id) || [],
    }));
  }

  private async ensureMemberProfile(userId: string) {
    return this.prisma.memberProfile.upsert({
      where: { userId },
      create: { userId },
      update: {},
    });
  }

  async getMyMemberSettings(userId: string) {
    await this.assertUserExists(userId);
    return this.ensureMemberProfile(userId);
  }

  async updateMyMemberSettings(userId: string, dto: UpdateMemberProfileDto) {
    await this.assertUserExists(userId);
    return this.prisma.memberProfile.upsert({
      where: { userId },
      create: { userId, ...dto },
      update: { ...dto },
    });
  }

  async getMemberExperience(targetUserId: string, viewerId?: string) {
    const [profile, user, memberSettings, activeFlair, followerStats] =
      await Promise.all([
        this.prisma.profile.findUnique({
          where: { userId: targetUserId },
          select: {
            id: true,
            bio: true,
            location: true,
            avatarUrl: true,
            dept: true,
            year: true,
            branch: true,
            course: true,
          },
        }),
        this.prisma.user.findUnique({
          where: { id: targetUserId },
          select: {
            id: true,
            name: true,
            role: true,
            _count: {
              select: {
                Post: { where: { status: 'APPROVED' } },
                projects: true,
                events: true,
              },
            },
          },
        }),
        this.prisma.memberProfile.findUnique({
          where: { userId: targetUserId },
        }),
        this.prisma.memberFlair.findFirst({
          where: { userId: targetUserId, isActive: true },
          orderBy: { updatedAt: 'desc' },
        }),
        this.prisma.communityFollow.aggregate({
          _count: { _all: true },
          where: { followedId: targetUserId },
        }),
      ]);

    if (!user || !profile) {
      throw new NotFoundException('Profile not found');
    }

    const effectiveSettings = memberSettings ?? {
      showBadges: true,
      showRecentActivity: true,
      allowFollowers: true,
      allowDirectMessage: true,
    };

    const canViewPrivate = viewerId === targetUserId;
    const showBadges = canViewPrivate || effectiveSettings.showBadges;
    const showRecentActivity =
      canViewPrivate || effectiveSettings.showRecentActivity;

    const [isFollowing, badges, posts, comments, projects] = await Promise.all([
      viewerId
        ? this.prisma.communityFollow.findUnique({
            where: {
              followerId_followedId: {
                followerId: viewerId,
                followedId: targetUserId,
              },
            },
            select: { id: true },
          })
        : null,
      showBadges
        ? this.prisma.usersOnBadges.findMany({
            where: { userId: targetUserId },
            include: { badge: true },
            orderBy: { assignedAt: 'desc' },
            take: 8,
          })
        : [],
      showRecentActivity
        ? this.prisma.post.findMany({
            where: { authorId: targetUserId, status: 'APPROVED' },
            select: {
              id: true,
              subject: true,
              createdAt: true,
            },
            orderBy: { createdAt: 'desc' },
            take: 4,
          })
        : [],
      showRecentActivity
        ? this.prisma.comment.findMany({
            where: { userId: targetUserId },
            select: {
              id: true,
              content: true,
              createdAt: true,
            },
            orderBy: { createdAt: 'desc' },
            take: 4,
          })
        : [],
      showRecentActivity
        ? this.prisma.project.findMany({
            where: { ownerId: targetUserId },
            select: {
              id: true,
              title: true,
              createdAt: true,
            },
            orderBy: { createdAt: 'desc' },
            take: 4,
          })
        : [],
    ]);

    const activities = showRecentActivity
      ? [
          ...posts.map((item) => ({
            id: item.id,
            type: 'POST',
            label: item.subject,
            createdAt: item.createdAt,
          })),
          ...comments.map((item) => ({
            id: item.id,
            type: 'COMMENT',
            label:
              item.content.length > 80
                ? `${item.content.substring(0, 80)}...`
                : item.content,
            createdAt: item.createdAt,
          })),
          ...projects.map((item) => ({
            id: item.id,
            type: 'PROJECT',
            label: item.title,
            createdAt: item.createdAt,
          })),
        ]
          .sort(
            (a, b) =>
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
          )
          .slice(0, 8)
      : [];

    return {
      user,
      profile,
      settings: effectiveSettings,
      activeFlair,
      follow: {
        isFollowing: Boolean(isFollowing),
        canFollow:
          Boolean(viewerId) &&
          viewerId !== targetUserId &&
          effectiveSettings.allowFollowers,
        followersCount: followerStats._count._all,
      },
      badges,
      recentActivity: activities,
      privacy: {
        showBadges,
        showRecentActivity,
        allowDirectMessage: effectiveSettings.allowDirectMessage,
      },
    };
  }

  async followMember(followerId: string, followedId: string) {
    if (followerId === followedId) {
      throw new BadRequestException('You cannot follow yourself');
    }

    const followedUser = await this.prisma.user.findUnique({
      where: { id: followedId },
      select: { id: true, name: true },
    });
    if (!followedUser) {
      throw new NotFoundException('User not found');
    }

    const settings = await this.prisma.memberProfile.findUnique({
      where: { userId: followedId },
      select: { allowFollowers: true },
    });
    if (settings && !settings.allowFollowers) {
      throw new ForbiddenException('This member is not accepting followers');
    }

    try {
      const follow = await this.prisma.communityFollow.create({
        data: { followerId, followedId },
      });

      const pref = await this.prisma.notificationPreference.findUnique({
        where: { userId: followedId },
        select: {
          inAppEnabled: true,
          digestModeEnabled: true,
          notifyOnFollow: true,
        },
      });

      if (this.shouldCreateInAppNotification(pref, 'follow')) {
        const follower = await this.prisma.user.findUnique({
          where: { id: followerId },
          select: { name: true },
        });
        await this.prisma.notification.create({
          data: {
            userId: followedId,
            type: 'SYSTEM',
            message: `${follower?.name || 'Someone'} started following you`,
          },
        });
      }

      return follow;
    } catch {
      throw new ConflictException('You already follow this member');
    }
  }

  async unfollowMember(followerId: string, followedId: string) {
    const result = await this.prisma.communityFollow.deleteMany({
      where: { followerId, followedId },
    });

    if (result.count === 0) {
      throw new NotFoundException('Follow relationship not found');
    }

    return { message: 'Unfollowed successfully' };
  }

  async getFollowers(userId: string, page = 1, limit = 20) {
    const safePage = Math.max(1, Number(page) || 1);
    const safeLimit = Math.min(50, Math.max(1, Number(limit) || 20));
    const skip = (safePage - 1) * safeLimit;

    const [items, total] = await Promise.all([
      this.prisma.communityFollow.findMany({
        where: { followedId: userId },
        skip,
        take: safeLimit,
        orderBy: { createdAt: 'desc' },
        include: {
          follower: {
            select: {
              id: true,
              name: true,
              role: true,
              profile: { select: { avatarUrl: true } },
            },
          },
        },
      }),
      this.prisma.communityFollow.count({ where: { followedId: userId } }),
    ]);

    return {
      items,
      pagination: {
        page: safePage,
        limit: safeLimit,
        total,
        hasMore: safePage * safeLimit < total,
      },
    };
  }

  async getFollowing(userId: string, page = 1, limit = 20) {
    const safePage = Math.max(1, Number(page) || 1);
    const safeLimit = Math.min(50, Math.max(1, Number(limit) || 20));
    const skip = (safePage - 1) * safeLimit;

    const [items, total] = await Promise.all([
      this.prisma.communityFollow.findMany({
        where: { followerId: userId },
        skip,
        take: safeLimit,
        orderBy: { createdAt: 'desc' },
        include: {
          followed: {
            select: {
              id: true,
              name: true,
              role: true,
              profile: { select: { avatarUrl: true } },
            },
          },
        },
      }),
      this.prisma.communityFollow.count({ where: { followerId: userId } }),
    ]);

    return {
      items,
      pagination: {
        page: safePage,
        limit: safeLimit,
        total,
        hasMore: safePage * safeLimit < total,
      },
    };
  }

  async createMemberFlair(userId: string, dto: CreateMemberFlairDto) {
    await this.assertUserExists(userId);

    if (dto.isActive) {
      await this.prisma.memberFlair.updateMany({
        where: { userId, isActive: true },
        data: { isActive: false },
      });
    }

    return this.prisma.memberFlair.create({
      data: {
        userId,
        label: dto.label,
        color: dto.color,
        backgroundColor: dto.backgroundColor,
        isActive: dto.isActive ?? true,
      },
    });
  }

  async listMemberFlairs(userId: string) {
    return this.prisma.memberFlair.findMany({
      where: { userId },
      orderBy: [{ isActive: 'desc' }, { updatedAt: 'desc' }],
    });
  }

  async activateMemberFlair(userId: string, flairId: string) {
    const flair = await this.prisma.memberFlair.findUnique({
      where: { id: flairId },
      select: { id: true, userId: true },
    });

    if (!flair) {
      throw new NotFoundException('Flair not found');
    }

    if (flair.userId !== userId) {
      throw new ForbiddenException('Cannot activate flair for another member');
    }

    await this.prisma.$transaction([
      this.prisma.memberFlair.updateMany({
        where: { userId, isActive: true },
        data: { isActive: false },
      }),
      this.prisma.memberFlair.update({
        where: { id: flairId },
        data: { isActive: true },
      }),
    ]);

    return { message: 'Flair activated successfully' };
  }

  async deleteMemberFlair(userId: string, flairId: string) {
    const flair = await this.prisma.memberFlair.findUnique({
      where: { id: flairId },
      select: { id: true, userId: true },
    });

    if (!flair) {
      throw new NotFoundException('Flair not found');
    }

    if (flair.userId !== userId) {
      throw new ForbiddenException('Cannot delete flair for another member');
    }

    await this.prisma.memberFlair.delete({ where: { id: flairId } });
    return { message: 'Flair deleted successfully' };
  }

  private async assertUserExists(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }
  }

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

  async getProfilePreview(userId: string, avatarUrl: boolean) {
    this.logger.log(
      `Fetching profile preview for userId: ${userId} with avatarUrl: ${avatarUrl}`,
    );
    const profile = await this.prisma.profile.findUnique({
      where: { userId },
      select: {
        avatarUrl: avatarUrl,
        bio: true,
        location: true,
        dept: true,
        year: true,
        user: {
          select: {
            id: true,
            _count: {
              select: {
                Post: {
                  where: { status: 'APPROVED' },
                },
                projects: true,
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

    const skillsWithEndorsements = await this.attachSkillEndorsements(
      profile.id,
      profile.skills,
    );

    return {
      ...profile,
      skills: skillsWithEndorsements,
    };
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

    const updatedProfile = await this.prisma.profile.update({
      where: { userId },
      data: {
        ...rest,
        updatedAt: new Date(),
        skills: skillConnections,
      },
      include: {
        skills: true,
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

    const skillsWithEndorsements = await this.attachSkillEndorsements(
      updatedProfile.id,
      updatedProfile.skills,
    );

    return {
      ...updatedProfile,
      skills: skillsWithEndorsements,
    };
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

    const result = await this.prisma.usersOnBadges.create({
      data: {
        userId,
        badgeId,
      },
    });

    const pref = await this.prisma.notificationPreference.findUnique({
      where: { userId },
      select: {
        inAppEnabled: true,
        digestModeEnabled: true,
        notifyOnBadgeAward: true,
      },
    });

    if (this.shouldCreateInAppNotification(pref, 'badge')) {
      await this.prisma.notification.create({
        data: {
          userId,
          type: 'SYSTEM',
          message: `You earned a new badge: ${badge.name}`,
        },
      });
    }

    return result;
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
