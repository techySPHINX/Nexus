import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMentorSettingsDto } from './dto/create-mentor-settings.dto';
import { UpdateMentorSettingsDto } from './dto/update-mentor-settings.dto';
import { CreateMentorshipRequestDto } from './dto/create-mentorship-request.dto';
import { UpdateMentorshipRequestDto } from './dto/update-mentorship-request.dto';
import { Role } from '@prisma/client';
import { SearchMentorDto } from './dto/search-mentor.dto';
import { CreateFeedbackDto } from './dto/create-feedback.dto';
import { NotificationService } from '../notification/notification.service';

@Injectable()
export class MentorshipService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationService: NotificationService,
  ) {}

  async createMentorSettings(
    userId: string,
    createMentorSettingsDto: CreateMentorSettingsDto,
  ) {
    await this.prisma.user.update({
      where: { id: userId },
      data: { role: Role.MENTOR },
    });

    return this.prisma.mentorSettings.create({
      data: {
        userId,
        ...createMentorSettingsDto,
      },
    });
  }

  async updateMentorSettings(
    userId: string,
    updateMentorSettingsDto: UpdateMentorSettingsDto,
  ) {
    return this.prisma.mentorSettings.update({
      where: { userId },
      data: updateMentorSettingsDto,
    });
  }

  async getMentorSettings(userId: string) {
    return this.prisma.mentorSettings.findUnique({
      where: { userId },
    });
  }

  async createMentorshipRequest(
    menteeId: string,
    createMentorshipRequestDto: CreateMentorshipRequestDto,
  ) {
    const request = await this.prisma.mentorshipRequest.create({
      data: {
        menteeId,
        ...createMentorshipRequestDto,
      },
    });

    await this.notificationService.create({
      userId: request.mentorId,
      message: `You have a new mentorship request from a mentee.`,
      type: 'MENTORSHIP_REQUEST',
    });

    return request;
  }

  async updateMentorshipRequest(
    mentorId: string,
    requestId: string,
    updateMentorshipRequestDto: UpdateMentorshipRequestDto,
  ) {
    const request = await this.prisma.mentorshipRequest.findUnique({
      where: { id: requestId },
    });

    if (!request || request.mentorId !== mentorId) {
      throw new Error('Request not found or you are not the mentor');
    }

    if (updateMentorshipRequestDto.status === 'ACCEPTED') {
      await this.prisma.mentorship.create({
        data: {
          mentorId: request.mentorId,
          menteeId: request.menteeId,
        },
      });
    }

    const updatedRequest = await this.prisma.mentorshipRequest.update({
      where: { id: requestId },
      data: { status: updateMentorshipRequestDto.status },
    });

    await this.notificationService.create({
      userId: request.menteeId,
      message: `Your mentorship request has been ${updatedRequest.status.toLowerCase()}.`,
      type: 'MENTORSHIP_REQUEST_UPDATE',
    });

    return updatedRequest;
  }

  async getMentorshipRequestsForMentor(mentorId: string) {
    return this.prisma.mentorshipRequest.findMany({
      where: { mentorId },
      include: { mentee: true },
    });
  }

  async getMentorshipRequestsForMentee(menteeId: string) {
    return this.prisma.mentorshipRequest.findMany({
      where: { menteeId },
      include: { mentor: true },
    });
  }

  async getMentorshipsForMentor(mentorId: string) {
    return this.prisma.mentorship.findMany({
      where: { mentorId },
      include: { mentee: true },
    });
  }

  async getMentorshipsForMentee(menteeId: string) {
    return this.prisma.mentorship.findMany({
      where: { menteeId },
      include: { mentor: true },
    });
  }

  async searchMentors(searchMentorDto: SearchMentorDto) {
    const { name, skills, interests } = searchMentorDto;
    const where: any = {};

    if (name) {
      where.user = {
        name: {
          contains: name,
          mode: 'insensitive',
        },
      };
    }

    if (skills) {
      where.skills = {
        hasSome: skills,
      };
    }

    if (interests) {
      where.user = {
        ...where.user,
        profile: {
          interests: {
            contains: interests.join(', '),
            mode: 'insensitive',
          },
        },
      };
    }

    return this.prisma.mentorSettings.findMany({
      where,
      include: {
        user: {
          include: {
            profile: true,
          },
        },
      },
    });
  }

  async createFeedback(menteeId: string, createFeedbackDto: CreateFeedbackDto) {
    return this.prisma.feedback.create({
      data: {
        menteeId,
        ...createFeedbackDto,
      },
    });
  }

  async getFeedbackForMentor(mentorId: string) {
    return this.prisma.feedback.findMany({
      where: { mentorId },
      include: { mentee: true },
    });
  }

  async getMentorSuggestions(menteeId: string) {
    const menteeProfile = await this.prisma.profile.findUnique({
      where: { userId: menteeId },
      include: { skills: true },
    });

    if (!menteeProfile) {
      return [];
    }

    const menteeSkills = menteeProfile.skills.map((skill) => skill.name);

    const mentors = await this.prisma.mentorSettings.findMany({
      where: { isAvailable: true },
      include: {
        user: { include: { profile: { include: { skills: true } } } },
      },
    });

    const suggestions = mentors.map((mentor) => {
      const mentorSkills = mentor.user.profile.skills.map(
        (skill) => skill.name,
      );
      const commonSkills = mentorSkills.filter((skill) =>
        menteeSkills.includes(skill),
      );
      const score = commonSkills.length;

      return { mentor, score };
    });

    return suggestions.sort((a, b) => b.score - a.score);
  }
}
