import {
  BadRequestException,
  Injectable,
  NotFoundException,
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
      },
    });
    if (!profile) throw new NotFoundException('Profile not found');
    return profile;
  }

  async getFilteredProfiles(filterDto: FilterProfilesDto) {
    const { name, email, roles, location, skills, skip, take } = filterDto;

    const where: any = {};

    if (name) {
      where.user = { ...where.user, name: { contains: name, mode: 'insensitive' } };
    }

    if (email) {
      where.user = { ...where.user, email: { contains: email, mode: 'insensitive' } };
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
    if (dto.avatarUrl && dto.avatarUrl.length > 512) {
      throw new BadRequestException(
        'Avatar URL must be less than 512 characters.',
      );
    }
    if (dto.avatarUrl && !/^https?:\/\//.test(dto.avatarUrl)) {
      throw new BadRequestException(
        'Avatar URL must start with http or https.',
      );
    }

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
}
