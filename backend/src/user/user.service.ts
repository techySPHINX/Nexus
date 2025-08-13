import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { hash } from 'bcryptjs';

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.user.findMany({
      include: {
        profile: {
          include: {
            skills: true,
          },
        },
      },
    });
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        profile: {
          include: {
            skills: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async update(id: string, dto: UpdateUserDto) {
    // Check if user exists
    const existingUser = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!existingUser) {
      throw new NotFoundException('User not found');
    }

    const { name, password, bio, location, interests, skills } = dto;

    // Prepare user update data
    const userUpdateData: any = {};
    if (name) userUpdateData.name = name;
    if (password) {
      if (password.length < 6) {
        throw new BadRequestException(
          'Password must be at least 6 characters long',
        );
      }
      userUpdateData.password = await hash(password, 10);
    }

    // Update user
    const updatedUser = await this.prisma.user.update({
      where: { id },
      data: userUpdateData,
    });

    // Handle skills
    let skillConnections: { id: string }[] = [];
    if (skills && skills.length > 0) {
      const skillPromises = skills.map(async (skillName) => {
        let skill = await this.prisma.skill.findFirst({
          where: { name: skillName },
        });

        if (!skill) {
          skill = await this.prisma.skill.create({
            data: { name: skillName },
          });
        }

        return skill;
      });
      const createdSkills = await Promise.all(skillPromises);
      skillConnections = createdSkills.map((skill) => ({ id: skill.id }));
    }

    // Update or create profile
    const profile = await this.prisma.profile.upsert({
      where: { userId: id },
      create: {
        userId: id,
        bio,
        location,
        interests,
        skills: {
          connect: skillConnections,
        },
      },
      update: {
        bio,
        location,
        interests,
        skills: {
          set: skillConnections,
        },
      },
      include: {
        skills: true,
      },
    });

    return {
      ...updatedUser,
      profile,
    };
  }

  async remove(id: string) {
    // Check if user exists
    const existingUser = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!existingUser) {
      throw new NotFoundException('User not found');
    }

    // Delete profile first (due to foreign key constraint)
    await this.prisma.profile.deleteMany({
      where: { userId: id },
    });

    // Delete user
    return this.prisma.user.delete({
      where: { id },
    });
  }
}
