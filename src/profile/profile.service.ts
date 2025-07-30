import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Injectable()
export class ProfileService {
  constructor(private readonly prisma: PrismaService) {}

  async getProfile(userId: string) {
    const profile = await this.prisma.profile.findUnique({
      where: { userId },
      include: { skills: true },
    });

    if (!profile) throw new NotFoundException('Profile not found');

    return profile;
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    return this.prisma.profile.update({
      where: { userId },
      data: {
        bio: dto.bio,
        avatarUrl: dto.avatarUrl,
        skills: {
          deleteMany: {},
          create: dto.skills?.map((name) => ({ name })) || [],
        },
      },
      include: { skills: true },
    });
  }
}
