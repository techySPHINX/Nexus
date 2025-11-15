import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Role, ReferralStatus } from '@prisma/client';
import { CreateReferralDto } from './dto/create-referral.dto';
import { UpdateReferralDto } from './dto/update-referral.dto';
import { UpdateReferralApplicationDto } from './dto/update-referral-application.dto';
import { FilterReferralsDto } from './dto/filter-referrals.dto';
import { FilterReferralApplicationsDto } from './dto/filter-referral-applications.dto';
import { NotificationService, NotificationType } from 'src/notification/notification.service';
import { EmailService } from 'src/email/email.service';
import { ReferralGateway } from './referral.gateway';

/**
 * Service for managing job referrals and referral applications.
 * Handles creation, retrieval, updates, and deletion of referrals and applications.
 */
@Injectable()
export class ReferralService {
  constructor(
    private prisma: PrismaService,
    private notificationService: NotificationService,
    private emailService: EmailService,
    private gateway: ReferralGateway,
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
    if (!user) {
      throw new NotFoundException('User not found.');
    }
    if (user.role !== Role.ALUM) {
      throw new ForbiddenException('Only alumni can post referrals.');
    }

    // Only allow the new fields if present in dto
    const {
      company,
      jobTitle,
      description,
      requirements,
      location,
      deadline,
      referralLink,
    } = dto;

    // deadline is required in schema
    if (!deadline) {
      throw new BadRequestException('Deadline is required for a referral.');
    }
    
    const referral = await this.prisma.referral.create({
      data: {
        company,
        jobTitle,
        description,
        requirements,
        location,
        deadline: new Date(deadline),
        referralLink,
        alumniId: userId,
        status: ReferralStatus.PENDING, // New referrals start as PENDING
      },
      include: {
        postedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    // Notify all admins about the new referral pending approval
    const admins = await this.prisma.user.findMany({
      where: { role: Role.ADMIN },
      select: { id: true },
    });

    for (const admin of admins) {
      await this.notificationService.create({
        userId: admin.id,
        message: `New referral pending approval: ${referral.jobTitle} at ${referral.company} by ${referral.postedBy.name}`,
        type: NotificationType.REFERRAL_STATUS_UPDATE,
      });
    }

    // Broadcast and email notifications
    this.gateway.emitReferralCreated({ id: referral.id, status: referral.status });
    try {
      const adminEmails = await this.prisma.user.findMany({
        where: { role: Role.ADMIN },
        select: { email: true, name: true },
      });
      for (const a of adminEmails) {
        if (a.email) {
          await this.emailService.sendReferralSubmittedToAdmin(
            a.email,
            a.name || 'Admin',
            referral.company,
            referral.jobTitle,
            referral.postedBy.name || 'Alumni',
          );
        }
      }
    } catch {
      // non-blocking
    }

    return referral;
  }

  /**
   * Retrieves a single job referral by its ID.
   * Includes information about the poster and applications.
   * @param referralId - The ID of the referral to retrieve.
   * @returns A promise that resolves to the referral object.
   * @throws {NotFoundException} If the referral is not found.
   */
  async getReferralById(referralId: string, userId?: string, userRole?: Role) {
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
        applications: {
          select: {
            id: true,
          },
        },
      },
    });
    if (!referral) {
      throw new NotFoundException('Referral not found.');
    }

    // Enforce status filtering: non-admins can only access APPROVED referrals or their own
    if (userRole !== Role.ADMIN) {
      const isOwnReferral = userId && referral.alumniId === userId;
      if (referral.status !== ReferralStatus.APPROVED && !isOwnReferral) {
        throw new ForbiddenException('You can only view approved referrals.');
      }
    }

    return referral;
  }

  /**
   * Retrieves a list of job referrals based on various filters.
   * @param filterDto - DTO containing criteria for filtering referrals (e.g., company, job title, location, status).
   * @returns A promise that resolves to an array of filtered referrals.
   */
  async getFilteredReferrals(filterDto: FilterReferralsDto, userId?: string, userRole?: Role) {
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
<<<<<<< HEAD

    const isAdmin = userRole === Role.ADMIN;

    if (!isAdmin) {
      // Always enforce visibility for non-admins
      // - Only APPROVED referrals, unless the requester is the creator
      // - If a non-admin explicitly requests a non-APPROVED status, restrict to their own referrals only
      const visibilityOr: any[] = [{ status: ReferralStatus.APPROVED }];
      if (userId) visibilityOr.push({ alumniId: userId });

      if (status) {
        if (status === ReferralStatus.APPROVED) {
          // Respect explicit APPROVED filter; still allow own approved items via OR
          where.AND = [
            { OR: visibilityOr },
            { status: ReferralStatus.APPROVED },
          ];
        } else {
          // Non-admin asking for non-approved -> only allow their own items of that status
          if (userId) {
            where.AND = [
              { alumniId: userId },
              { status },
            ];
          } else {
            // Unauthenticated/non-owner cannot view non-approved, force APPROVED instead
            where.status = ReferralStatus.APPROVED;
          }
        }
      } else {
        // No status provided -> show APPROVED or own (any status)
        where.OR = visibilityOr;
      }

      // Exclude expired (past-deadline) referrals for non-admins by default
      where.deadline = { gt: new Date() };
    } else {
      // Admins can use any status filter and see expired
      if (status) {
        where.status = status;
      }
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
        applications: {
          select: {
            id: true,
          },
        },
      },
      skip: skip ? Number(skip) : undefined,
      take: take ? Number(take) : undefined,
      orderBy: { createdAt: 'desc' },
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
    if (!user) {
      throw new NotFoundException('User not found.');
    }

    if (referral.alumniId !== userId && user.role !== Role.ADMIN) {
      throw new ForbiddenException(
        'You are not authorized to update this referral.',
      );
    }

    // Only allow the new fields if present in dto
    const {
      company,
      jobTitle,
      description,
      requirements,
      location,
      deadline,
      referralLink,
      status,
    } = dto;

    const updateData: any = {};
    if (company !== undefined) updateData.company = company;
    if (jobTitle !== undefined) updateData.jobTitle = jobTitle;
    if (description !== undefined) updateData.description = description;
    if (requirements !== undefined) updateData.requirements = requirements;
    if (location !== undefined) updateData.location = location;
    if (deadline !== undefined)
      updateData.deadline = deadline ? new Date(deadline) : undefined;
    if (referralLink !== undefined) updateData.referralLink = referralLink;
    if (status !== undefined) updateData.status = status;

    const oldStatus = referral.status;
    
    // Only allow admins to change status
    if (dto.status && dto.status !== referral.status && user.role !== Role.ADMIN) {
      throw new ForbiddenException('Only admins can change referral status.');
    }
    
    const updatedReferral = await this.prisma.referral.update({
      where: { id: referralId },
      data: updateData,
      include: {
        postedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    // Notify the alum if the referral status changed (only if changed by admin)
    if (dto.status && dto.status !== oldStatus && user.role === Role.ADMIN) {
      const statusMessage = dto.status === ReferralStatus.APPROVED 
        ? 'approved' 
        : dto.status === ReferralStatus.REJECTED 
          ? 'rejected' 
          : dto.status.toLowerCase();
      
      await this.notificationService.create({
        userId: referral.alumniId,
        message: `Your referral for ${referral.jobTitle} at ${referral.company} has been ${statusMessage}.`,
        type: NotificationType.REFERRAL_STATUS_UPDATE,
      });

      // Email alumnus about status change
      try {
        const alum = await this.prisma.user.findUnique({ where: { id: referral.alumniId } });
        if (alum?.email) {
          await this.emailService.sendReferralStatusEmail(
            alum.email,
            alum.name || 'Alumni',
            referral.jobTitle,
            referral.company,
            updatedReferral.status,
          );
        }
  } catch {}
    }

    // Broadcast update
    this.gateway.emitReferralUpdated({ id: updatedReferral.id, status: updatedReferral.status });

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
    if (!user) {
      throw new NotFoundException('User not found.');
    }

    if (referral.alumniId !== userId && user.role !== Role.ADMIN) {
      throw new ForbiddenException(
        'You are not authorized to delete this referral.',
      );
    }

    await this.prisma.referral.delete({ where: { id: referralId } });
    this.gateway.emitReferralDeleted({ id: referralId });
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
    dto: { referralId: string; resumeUrl: string; coverLetter?: string; applicantId?: string },
  ) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found.');
    }
    
    // Allow both STUDENT and ALUM to apply
    if (user.role !== Role.STUDENT && user.role !== Role.ALUM) {
      throw new ForbiddenException('Only students or alumni can apply for referrals.');
    }

    const referral = await this.prisma.referral.findUnique({
      where: { id: dto.referralId },
      include: { postedBy: true },
    });
    if (!referral) {
      throw new NotFoundException('Referral not found.');
    }

    // Only allow applications to APPROVED referrals
    if (referral.status !== ReferralStatus.APPROVED) {
      throw new BadRequestException('You can only apply to approved referrals.');
    }

    // Use applicantId from dto (for future extensibility), but default to userId
    const applicantId = dto.applicantId || userId;

    // Check if already applied
    const existingApplication = await this.prisma.referralApplication.findFirst({
      where: {
        referralId: dto.referralId,
        applicantId: applicantId,
      },
    });

    if (existingApplication) {
      throw new BadRequestException('You have already applied for this referral.');
    }

    const application = await this.prisma.referralApplication.create({
      data: {
        referralId: dto.referralId,
        resumeUrl: dto.resumeUrl,
        coverLetter: dto.coverLetter,
        applicantId: applicantId,
      },
    });

    // Notify the alum who posted the referral
    await this.notificationService.create({
      userId: referral.alumniId,
      message: `${user.name} has applied for your referral: ${referral.jobTitle} at ${referral.company}.`,
      type: NotificationType.REFERRAL_APPLICATION,
    });

    // Email the alum
    try {
      const alum = await this.prisma.user.findUnique({ where: { id: referral.alumniId } });
      if (alum?.email) {
        await this.emailService.sendApplicationSubmittedToAlum(
          alum.email,
          alum.name || 'Alumni',
          user.name || 'Applicant',
          referral.jobTitle,
          referral.company,
        );
      }
  } catch {}

    // Broadcast
    this.gateway.emitApplicationCreated({ id: application.id, referralId: application.referralId });

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
        applicant: {
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
    const { referralId, applicantId, status, skip, take } = filterDto;

    const where: any = {};

    if (referralId) {
      where.referralId = referralId;
    }
    if (applicantId) {
      where.applicantId = applicantId;
    }
    if (status) {
      where.status = status;
    }

    return this.prisma.referralApplication.findMany({
      where,
      include: {
        referral: true,
        applicant: {
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
    if (!user) {
      throw new NotFoundException('User not found.');
    }

    const application = await this.prisma.referralApplication.findUnique({
      where: { id: applicationId },
      include: { applicant: true, referral: true },
    });
    if (!application) {
      throw new NotFoundException('Referral application not found.');
    }

    // Permit ADMINs or the ALUM who posted the referral to update status
    const isAdmin = user.role === Role.ADMIN;
    const isReferralOwner = application.referral.alumniId === userId;
    if (!isAdmin && !isReferralOwner) {
      throw new ForbiddenException(
        'You are not authorized to update this application status.',
      );
    }

    const updatedApplication = await this.prisma.referralApplication.update({
      where: { id: applicationId },
      data: dto,
    });

    // Notify the applicant about the application status change
    if (dto.status && dto.status !== application.status) {
      await this.notificationService.create({
        userId: application.applicantId,
        message: `Your application for ${application.referral.jobTitle} at ${application.referral.company} has been ${dto.status}.`,
        type: NotificationType.REFERRAL_APPLICATION_STATUS_UPDATE,
      });

      // Email applicant
      try {
        const applicant = await this.prisma.user.findUnique({ where: { id: application.applicantId } });
        if (applicant?.email) {
          await this.emailService.sendApplicationStatusEmail(
            applicant.email,
            applicant.name || 'Applicant',
            application.referral.jobTitle,
            application.referral.company,
            dto.status,
          );
        }
  } catch {}
    }

    // Broadcast
    this.gateway.emitApplicationUpdated({ id: updatedApplication.id, status: updatedApplication.status });

    return updatedApplication;
  }

  // Get user's own applications
  async getMyApplications(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found.');
    }

    return this.prisma.referralApplication.findMany({
      where: { applicantId: userId },
      include: {
        referral: {
          select: {
            id: true,
            jobTitle: true,
            company: true,
            location: true,
            status: true,
            postedBy: {
              select: {
                name: true,
                email: true,
              },
            },
          },
        },
        applicant: {
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
        applicant: {
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

  // Analytics for admin dashboard
  async getAnalytics() {
    const [totalReferrals, byStatus, totalApps, appsByStatus] = await Promise.all([
      this.prisma.referral.count(),
      this.prisma.referral.groupBy({ by: ['status'], _count: { _all: true } }),
      this.prisma.referralApplication.count(),
      this.prisma.referralApplication.groupBy({ by: ['status'], _count: { _all: true } }),
    ]);

    const statusCounts = Object.fromEntries(
      byStatus.map((row) => [row.status, row._count._all]),
    );
    const appStatusCounts = Object.fromEntries(
      appsByStatus.map((row) => [row.status, row._count._all]),
    );

    return {
      totals: { referrals: totalReferrals, applications: totalApps },
      referralsByStatus: statusCounts,
      applicationsByStatus: appStatusCounts,
    };
  }
}
