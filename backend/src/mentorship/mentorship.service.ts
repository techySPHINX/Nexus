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
import { CreateMentorshipListingDto } from './dto/create-mentorship-listing.dto';
import { UpdateMentorshipListingDto } from './dto/update-mentorship-listing.dto';
import { ApplyToMentorshipListingDto } from './dto/apply-to-mentorship-listing.dto';
import { CreateGoalDto } from './dto/create-goal.dto';
import { UpdateGoalDto } from './dto/update-goal.dto';
import { UpdateMentorshipProgressDto } from './dto/update-mentorship-progress.dto';
import { CreateMeetingDto } from './dto/create-meeting.dto';
import { UpdateMeetingDto } from './dto/update-meeting.dto';
import { CreateAgreementDto } from './dto/create-agreement.dto';
import { UpdateAgreementDto } from './dto/update-agreement.dto';

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
    const { name, skills, interests, location, availability, communicationChannels } = searchMentorDto;
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

    if (location) {
      where.user = {
        ...where.user,
        profile: {
          ...where.user?.profile,
          location: {
            contains: location,
            mode: 'insensitive',
          },
        },
      };
    }

    if (availability) {
      where.availability = {
        contains: availability,
        mode: 'insensitive',
      };
    }

    if (communicationChannels) {
      where.communicationChannels = {
        hasSome: communicationChannels,
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

  async createFeedback(authorId: string, createFeedbackDto: CreateFeedbackDto) {
    return this.prisma.feedback.create({
      data: {
        authorId,
        ...createFeedbackDto,
      },
    });
  }

  async getFeedbackForMentor(mentorId: string) {
    return this.prisma.feedback.findMany({
      where: { 
        receiverId: mentorId,
        feedbackFor: 'MENTOR',
       },
      include: { author: true },
    });
  }

  async getFeedbackForMentee(menteeId: string) {
    return this.prisma.feedback.findMany({
      where: { 
        receiverId: menteeId,
        feedbackFor: 'MENTEE',
       },
      include: { author: true },
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

  async createMentorshipListing(
    mentorId: string,
    createMentorshipListingDto: CreateMentorshipListingDto,
  ) {
    return this.prisma.mentorshipListing.create({
      data: {
        mentorId,
        ...createMentorshipListingDto,
      },
    });
  }

  async getMentorshipListings() {
    return this.prisma.mentorshipListing.findMany({
      include: { mentor: true },
    });
  }

  async getMentorshipListing(listingId: string) {
    return this.prisma.mentorshipListing.findUnique({
      where: { id: listingId },
      include: { mentor: true, applications: { include: { mentee: true } } },
    });
  }

  async updateMentorshipListing(
    listingId: string,
    updateMentorshipListingDto: UpdateMentorshipListingDto,
  ) {
    return this.prisma.mentorshipListing.update({
      where: { id: listingId },
      data: updateMentorshipListingDto,
    });
  }

  async deleteMentorshipListing(listingId: string) {
    return this.prisma.mentorshipListing.delete({
      where: { id: listingId },
    });
  }

  async applyToMentorshipListing(
    menteeId: string,
    listingId: string,
    applyToMentorshipListingDto: ApplyToMentorshipListingDto,
  ) {
    const application = await this.prisma.mentorshipApplication.create({
      data: {
        menteeId,
        listingId,
        ...applyToMentorshipListingDto,
      },
    });

    const listing = await this.prisma.mentorshipListing.findUnique({
      where: { id: listingId },
    });

    await this.notificationService.create({
      userId: listing.mentorId,
      message: `You have a new application for your mentorship listing "${listing.title}".`,
      type: 'MENTORSHIP_APPLICATION',
    });

    return application;
  }

  async getMentorshipApplications(listingId: string) {
    return this.prisma.mentorshipApplication.findMany({
      where: { listingId },
      include: { mentee: true },
    });
  }

  async acceptMentorshipApplication(applicationId: string) {
    const application = await this.prisma.mentorshipApplication.update({
      where: { id: applicationId },
      data: { status: 'ACCEPTED' },
    });

    await this.notificationService.create({
      userId: application.menteeId,
      message: `Your application for a mentorship listing has been accepted.`,
      type: 'MENTORSHIP_APPLICATION_UPDATE',
    });

    return application;
  }

  async rejectMentorshipApplication(applicationId: string) {
    const application = await this.prisma.mentorshipApplication.update({
      where: { id: applicationId },
      data: { status: 'REJECTED' },
    });

    await this.notificationService.create({
      userId: application.menteeId,
      message: `Your application for a mentorship listing has been rejected.`,
      type: 'MENTORSHIP_APPLICATION_UPDATE',
    });

    return application;
  }

  async createGoal(createGoalDto: CreateGoalDto) {
    return this.prisma.goal.create({
      data: createGoalDto,
    });
  }

  async getGoals(mentorshipId: string) {
    return this.prisma.goal.findMany({
      where: { mentorshipId },
    });
  }

  async getGoal(goalId: string) {
    return this.prisma.goal.findUnique({
      where: { id: goalId },
    });
  }

  async updateGoal(goalId: string, updateGoalDto: UpdateGoalDto) {
    return this.prisma.goal.update({
      where: { id: goalId },
      data: updateGoalDto,
    });
  }

  async deleteGoal(goalId: string) {
    return this.prisma.goal.delete({
      where: { id: goalId },
    });
  }

  async updateMentorshipProgress(
    mentorshipId: string,
    updateMentorshipProgressDto: UpdateMentorshipProgressDto,
  ) {
    return this.prisma.mentorship.update({
      where: { id: mentorshipId },
      data: { progress: updateMentorshipProgressDto.progress },
    });
  }

  async createMeeting(createMeetingDto: CreateMeetingDto) {
    const meeting = await this.prisma.meeting.create({
      data: createMeetingDto,
    });

    const mentorship = await this.prisma.mentorship.findUnique({
      where: { id: meeting.mentorshipId },
    });

    await this.notificationService.create({
      userId: mentorship.mentorId,
      message: `A new meeting has been scheduled for your mentorship.`,
      type: 'MEETING_SCHEDULED',
    });

    await this.notificationService.create({
      userId: mentorship.menteeId,
      message: `A new meeting has been scheduled for your mentorship.`,
      type: 'MEETING_SCHEDULED',
    });

    return meeting;
  }

  async getMeetings(mentorshipId: string) {
    return this.prisma.meeting.findMany({
      where: { mentorshipId },
    });
  }

  async getMeeting(meetingId: string) {
    return this.prisma.meeting.findUnique({
      where: { id: meetingId },
    });
  }

  async updateMeeting(meetingId: string, updateMeetingDto: UpdateMeetingDto) {
    return this.prisma.meeting.update({
      where: { id: meetingId },
      data: updateMeetingDto,
    });
  }

  async deleteMeeting(meetingId: string) {
    return this.prisma.meeting.delete({
      where: { id: meetingId },
    });
  }

  async createAgreement(createAgreementDto: CreateAgreementDto) {
    const agreement = await this.prisma.mentorshipAgreement.create({
      data: createAgreementDto,
    });

    const mentorship = await this.prisma.mentorship.findUnique({
      where: { id: agreement.mentorshipId },
    });

    await this.notificationService.create({
      userId: mentorship.mentorId,
      message: `A new agreement has been created for your mentorship.`,
      type: 'AGREEMENT_CREATED',
    });

    await this.notificationService.create({
      userId: mentorship.menteeId,
      message: `A new agreement has been created for your mentorship.`,
      type: 'AGREEMENT_CREATED',
    });

    return agreement;
  }

  async getAgreement(mentorshipId: string) {
    return this.prisma.mentorshipAgreement.findUnique({
      where: { mentorshipId },
    });
  }

  async updateAgreement(agreementId: string, updateAgreementDto: UpdateAgreementDto) {
    const agreement = await this.prisma.mentorshipAgreement.update({
      where: { id: agreementId },
      data: updateAgreementDto,
    });

    const mentorship = await this.prisma.mentorship.findUnique({
      where: { id: agreement.mentorshipId },
    });

    await this.notificationService.create({
      userId: mentorship.mentorId,
      message: `The agreement for your mentorship has been updated.`,
      type: 'AGREEMENT_UPDATED',
    });

    await this.notificationService.create({
      userId: mentorship.menteeId,
      message: `The agreement for your mentorship has been updated.`,
      type: 'AGREEMENT_UPDATED',
    });

    return agreement;
  }
}
