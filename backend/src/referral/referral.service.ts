import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateReferralDto } from './dto/create-referral.dto';
import { UpdateReferralDto } from './dto/update-referral.dto';
import { CreateReferralApplicationDto } from './dto/create-referral-application.dto';
import { UpdateReferralApplicationDto } from './dto/update-referral-application.dto';
import { FilterReferralsDto } from './dto/filter-referrals.dto';
import { FilterReferralApplicationsDto } from './dto/filter-referral-applications.dto';
import { Role, ReferralStatus, ApplicationStatus } from '@prisma/client';
import {
  NotificationService,
  NotificationType,
} from 'src/notification/notification.service';

@Injectable()
export class ReferralService {
  constructor(
    private prisma: PrismaService,
    private notificationService: NotificationService,
  ) {}

  // Referral methods

  async createReferral(userId: string, dto: CreateReferralDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (user.role !== Role.ALUM) {
      throw new ForbiddenException('Only alumni can post referrals.');
    }

    return this.prisma.referral.create({
      data: {
        ...dto,
        alumniId: userId,
      },
    });
  }

  async getReferralById(referralId: string) {
    const referral = await this.prisma.referral.findUnique({
      where: { id: referralId },
      include: {
        postedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        applications: true,
      },
    });
    if (!referral) {
      throw new NotFoundException('Referral not found.');
    }
    return referral;
  }

  async getFilteredReferrals(filterDto: FilterReferralsDto) {
    const { company, jobTitle, location, status, skip, take } = filterDto;

    const where: any = {};

    if (company) {
      where.company = { contains: company, mode: 'insensitive' };
    }
    if (jobTitle) {
      where.jobTitle = { contains: jobTitle, mode: 'insensitive' };
    }
    if (location) {
      where.location = { contains: location, mode: 'insensitive' };
    }
    if (status) {
      where.status = status;
    }

    return this.prisma.referral.findMany({
      where,
      include: {
        postedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      skip: skip ? Number(skip) : undefined,
      take: take ? Number(take) : undefined,
    });
  }

  async updateReferral(
    userId: string,
    referralId: string,
    dto: UpdateReferralDto,
  ) {
    const referral = await this.prisma.referral.findUnique({
      where: { id: referralId },
    });
    if (!referral) {
      throw new NotFoundException('Referral not found.');
    }

    const user = await this.prisma.user.findUnique({ where: { id: userId } });

    if (referral.alumniId !== userId && user.role !== Role.ADMIN) {
      throw new ForbiddenException(
        'You are not authorized to update this referral.',
      );
    }

    const updatedReferral = await this.prisma.referral.update({
      where: { id: referralId },
      data: dto,
    });

    // Notify alum if referral status changes (only if updated by admin)
    if (
      dto.status &&
      dto.status !== referral.status &&
      user.role === Role.ADMIN
    ) {
      await this.notificationService.create({
        userId: referral.alumniId,
        message: `Your referral for ${referral.jobTitle} at ${referral.company} has been ${dto.status}.`,
        type: NotificationType.REFERRAL_STATUS_UPDATE,
      });
    }

    return updatedReferral;
  }

  async deleteReferral(userId: string, referralId: string) {
    const referral = await this.prisma.referral.findUnique({
      where: { id: referralId },
    });
    if (!referral) {
      throw new NotFoundException('Referral not found.');
    }

    const user = await this.prisma.user.findUnique({ where: { id: userId } });

    if (referral.alumniId !== userId && user.role !== Role.ADMIN) {
      throw new ForbiddenException(
        'You are not authorized to delete this referral.',
      );
    }

    await this.prisma.referral.delete({ where: { id: referralId } });
    return { message: 'Referral deleted successfully.' };
  }

  // Referral Application methods

  async createReferralApplication(
    userId: string,
    dto: { referralId: string; resumeUrl: string; coverLetter?: string },
  ) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (user.role !== Role.STUDENT) {
      throw new ForbiddenException('Only students can apply for referrals.');
    }

    const referral = await this.prisma.referral.findUnique({
      where: { id: dto.referralId },
      include: { postedBy: true },
    });
    if (!referral) {
      throw new NotFoundException('Referral not found.');
    }

    const existingApplication = await this.prisma.referralApplication.findFirst(
      {
        where: {
          referralId: dto.referralId,
          studentId: userId,
        },
      },
    );

    if (existingApplication) {
      throw new BadRequestException(
        'You have already applied for this referral.',
      );
    }

    const application = await this.prisma.referralApplication.create({
      data: {
        referralId: dto.referralId,
        resumeUrl: dto.resumeUrl,
        coverLetter: dto.coverLetter,
        studentId: userId,
      },
    });

    // Notify the alum who posted the referral
    await this.notificationService.create({
      userId: referral.alumniId,
      message: `${user.name} has applied for your referral: ${referral.jobTitle} at ${referral.company}.`,
      type: NotificationType.REFERRAL_APPLICATION,
    });

    return application;
  }

  async getReferralApplicationById(applicationId: string) {
    const application = await this.prisma.referralApplication.findUnique({
      where: { id: applicationId },
      include: {
        referral: true,
        student: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
    if (!application) {
      throw new NotFoundException('Referral application not found.');
    }
    return application;
  }

  async getFilteredReferralApplications(
    filterDto: FilterReferralApplicationsDto,
  ) {
    const { referralId, studentId, status, skip, take } = filterDto;

    const where: any = {};

    if (referralId) {
      where.referralId = referralId;
    }
    if (studentId) {
      where.studentId = studentId;
    }
    if (status) {
      where.status = status;
    }

    return this.prisma.referralApplication.findMany({
      where,
      include: {
        referral: true,
        student: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      skip: skip ? Number(skip) : undefined,
      take: take ? Number(take) : undefined,
    });
  }

  async updateReferralApplicationStatus(
    userId: string,
    applicationId: string,
    dto: UpdateReferralApplicationDto,
  ) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (user.role !== Role.ADMIN) {
      throw new ForbiddenException(
        'Only admins can update referral application status.',
      );
    }

    const application = await this.prisma.referralApplication.findUnique({
      where: { id: applicationId },
      include: { student: true, referral: true },
    });
    if (!application) {
      throw new NotFoundException('Referral application not found.');
    }

    const updatedApplication = await this.prisma.referralApplication.update({
      where: { id: applicationId },
      data: dto,
    });

    // Notify the student about the application status change
    if (dto.status && dto.status !== application.status) {
      await this.notificationService.create({
        userId: application.studentId,
        message: `Your application for ${application.referral.jobTitle} at ${application.referral.company} has been ${dto.status}.`,
        type: NotificationType.REFERRAL_APPLICATION_STATUS_UPDATE,
      });
    }

    return updatedApplication;
  }

  // Get user's own applications
  async getMyApplications(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found.');
    }

    return this.prisma.referralApplication.findMany({
      where: { studentId: userId },
      include: {
        referral: {
          select: {
            id: true,
            company: true,
            jobTitle: true,
            location: true,
            status: true,
          },
        },
        student: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // Get applications for a specific referral (for alumni)
  async getReferralApplications(referralId: string, alumniId: string) {
    // Verify the referral belongs to the requesting alumni
    const referral = await this.prisma.referral.findUnique({
      where: { id: referralId },
    });

    if (!referral) {
      throw new NotFoundException('Referral not found.');
    }

    if (referral.alumniId !== alumniId) {
      throw new ForbiddenException(
        'You are not authorized to view applications for this referral.',
      );
    }

    return this.prisma.referralApplication.findMany({
      where: { referralId },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
