import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { hash } from 'bcryptjs';

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.user.findMany({
      include: { profile: { include: { skills: true } } },
    });
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: { profile: { include: { skills: true } } },
    });

    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async update(id: string, dto: UpdateUserDto) {
    const { name, password, bio, location, interests, skills } = dto;

    const data: any = { name };
    if (password) data.password = await hash(password, 10);

    const user = await this.prisma.user.update({
      where: { id },
      data,
    });

    const profile = await this.prisma.profile.upsert({
      where: { userId: id },
      create: {
        userId: id,
        bio,
        location,
        interests,
        skills: {
          set: [],
          connectOrCreate: skills.map((name) => ({
            where: { name },
            create: { name },
          })),
        },
      },
      update: {
        bio,
        location,
        interests,
        skills: {
          set: [],
          connectOrCreate: skills.map((name) => ({
            where: { name },
            create: { name },
          })),
        },
      },
      include: { skills: true },
    });

    return { ...user, profile };
  }

  async remove(id: string) {
    await this.prisma.profile.deleteMany({ where: { userId: id } });
    return this.prisma.user.delete({ where: { id } });
  }
}
