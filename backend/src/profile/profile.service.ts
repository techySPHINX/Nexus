import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { FilterProfilesDto } from './dto/filter-profiles.dto';

@Injectable()
export class ProfileService {
  constructor(private prisma: PrismaService) {}

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
    if (!profile) throw new NotFoundException('Profile not found');
    return profile;
  }

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
