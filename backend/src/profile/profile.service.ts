import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Injectable()
export class ProfileService {
    constructor(private prisma: PrismaService) { }

    async getProfile(userId: string) {
        const profile = await this.prisma.profile.findUnique({
            where: { userId: userId },
            include: {
                skills: true,
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true
                    }
                }
            }
        });
        if (!profile) throw new NotFoundException('Profile not found');
        return profile;
    }

    async updateProfile(userId: string, dto: UpdateProfileDto) {

        // Avatar URL validations
        if (dto.avatarUrl && dto.avatarUrl.length > 512) {
            throw new BadRequestException('Avatar URL must be less than 512 characters.');
        }
        if (dto.avatarUrl && !/^https?:\/\//.test(dto.avatarUrl)) {
            throw new BadRequestException('Avatar URL must start with http or https.');
        }

        const profile = await this.prisma.profile.findUnique({ where: { userId } });
        if (!profile) throw new NotFoundException('Profile not found');

        const { skills, ...rest } = dto;

        let skillConnections = undefined;

        if (skills && skills.length > 0) {
            
            // Ensure skills exist in DB (create if not)
            const skillRecords = await Promise.all(
                skills.map(async (name) => {
                    return this.prisma.skill.upsert({
                        where: { name },
                        update: {}, // nothing to update if it exists
                        create: { name },
                    });
                })
            );

            // Prepare connection objects
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