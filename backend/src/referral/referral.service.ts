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

/**
 * Service for managing job referrals and referral applications.
 * Handles creation, retrieval, updates, and deletion of referrals and applications.
 */
@Injectable()
export class ReferralService {
  constructor(
    private prisma: PrismaService,
    private notificationService: NotificationService,
  ) {}

  // Referral methods

  /**
   * Creates a new job referral.
   * Only users with the ALUM role can create referrals.
   * @param userId - The ID of the user creating the referral.
   * @param dto - The data for creating the referral.
   * @returns A promise that resolves to the created referral.
   * @throws {ForbiddenException} If the user is not an ALUM.
   */
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

  /**
   * Retrieves a single job referral by its ID.
   * Includes information about the poster and applications.
   * @param referralId - The ID of the referral to retrieve.
   * @returns A promise that resolves to the referral object.
   * @throws {NotFoundException} If the referral is not found.
   */
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

  /**
   * Retrieves a list of job referrals based on various filters.
   * @param filterDto - DTO containing criteria for filtering referrals (e.g., company, job title, location, status).
   * @returns A promise that resolves to an array of filtered referrals.
   */
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

  /**
   * Updates an existing job referral.
   * Only the creator of the referral or an ADMIN can update it.
   * Notifies the alum if the referral status changes due to an admin update.
   * @param userId - The ID of the user attempting to update the referral.
   * @param referralId - The ID of the referral to update.
   * @param dto - The data to update the referral with.
   * @returns A promise that resolves to the updated referral.
   * @throws {NotFoundException} If the referral is not found.
   * @throws {ForbiddenException} If the user is not authorized to update the referral.
   */
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

  /**
   * Deletes a job referral.
   * Only the creator of the referral or an ADMIN can delete it.
   * @param userId - The ID of the user attempting to delete the referral.
   * @param referralId - The ID of the referral to delete.
   * @returns A promise that resolves to a success message.
   * @throws {NotFoundException} If the referral is not found.
   * @throws {ForbiddenException} If the user is not authorized to delete the referral.
   */
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

  /**
   * Creates a new referral application for a job referral.
   * Only users with the STUDENT role can apply for referrals.
   * @param userId - The ID of the student applying.
   * @param dto - Data for the referral application, including referral ID, resume URL, and optional cover letter.
   * @returns A promise that resolves to the created referral application.
   * @throws {ForbiddenException} If the user is not a STUDENT.
   * @throws {NotFoundException} If the referral is not found.
   * @throws {BadRequestException} If the student has already applied for this referral.
   */
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

  /**
   * Retrieves a single referral application by its ID.
   * Includes associated referral and student details.
   * @param applicationId - The ID of the referral application to retrieve.
   * @returns A promise that resolves to the referral application object.
   * @throws {NotFoundException} If the referral application is not found.
   */
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

  /**
   * Retrieves a list of referral applications based on various filters.
   * @param filterDto - DTO containing criteria for filtering applications (e.g., referral ID, student ID, status).
   * @returns A promise that resolves to an array of filtered referral applications.
   */
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

  /**
   * Updates the status of a referral application.
   * Only users with the ADMIN role can update application statuses.
   * Notifies the student if their application status changes.
   * @param userId - The ID of the user attempting to update the status.
   * @param applicationId - The ID of the referral application to update.
   * @param dto - The data to update the application status with.
   * @returns A promise that resolves to the updated referral application.
   * @throws {ForbiddenException} If the user is not an ADMIN.
   * @throws {NotFoundException} If the referral application is not found.
   */
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
