import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { hash } from 'bcryptjs';

/**
 * Service for handling user-related operations.
 */
@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  /**
   * Retrieves all users with their profiles and skills.
   * @returns A promise that resolves to an array of all users.
   */
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

  /**
   * Searches for users by name or email.
   * @param query - The search query string.
   * @returns A promise that resolves to an array of matching users.
   */
  async searchUsers(query: string) {
    if (!query || query.trim().length < 2) {
      return [];
    }

    const searchTerm = query.trim().toLowerCase();

    return this.prisma.user.findMany({
      where: {
        OR: [
          {
            name: {
              contains: searchTerm,
              mode: 'insensitive',
            },
          },
          {
            email: {
              contains: searchTerm,
              mode: 'insensitive',
            },
          },
        ],
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        profile: {
          select: {
            bio: true,
            location: true,
            avatarUrl: true,
          },
        },
      },
      take: 20, // Limit results to 20 users
    });
  }

  /**
   * Retrieves a specific user by their ID, including their profile and skills.
   * @param id - The ID of the user to retrieve.
   * @returns A promise that resolves to the user object.
   * @throws {NotFoundException} If the user is not found.
   */
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

  /**
   * Updates a user's information, including their profile and skills.
   * @param id - The ID of the user to update.
   * @param dto - The data to update the user with.
   * @returns A promise that resolves to the updated user object.
   * @throws {NotFoundException} If the user is not found.
   * @throws {BadRequestException} If the password is less than 6 characters long.
   */
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

  /**
   * Deletes a user and their associated profile.
   * @param id - The ID of the user to delete.
   * @returns A promise that resolves when the user has been deleted.
   * @throws {NotFoundException} If the user is not found.
   */
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
