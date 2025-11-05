import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { WinstonLoggerService } from '../logger/winston-logger.service';
import { AuditLogService, AuditAction } from './audit-log.service';

export interface UserDataExport {
  user: any;
  profile: any;
  posts: any[];
  comments: any[];
  connections: any[];
  messages: any[];
  projects: any[];
  referrals: any[];
  mentorships: any[];
  documents: any[];
  notifications: any[];
  securityEvents: any[];
  exportedAt: string;
}

/**
 * Service for GDPR compliance features
 */
@Injectable()
export class GdprService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: WinstonLoggerService,
    private readonly auditLog: AuditLogService,
  ) { }

  /**
   * Export all user data (GDPR Right to Data Portability)
   */
  async exportUserData(
    userId: string,
    ipAddress: string,
  ): Promise<UserDataExport> {
    try {
      this.logger.log(`Exporting data for user ${userId}`, 'GdprService');

      // Log the data export request
      await this.auditLog.logDataPrivacy(
        AuditAction.DATA_EXPORT_REQUESTED,
        userId,
        ipAddress,
      );

      // Fetch all user data
      const [
        user,
        profile,
        posts,
        comments,
        connections,
        sentMessages,
        receivedMessages,
        projects,
        referralApplications,
        postedReferrals,
        mentorshipsAsMentor,
        mentorshipsAsMentee,
        documents,
        notifications,
        securityEvents,
      ] = await Promise.all([
        this.prisma.user.findUnique({
          where: { id: userId },
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
            description: true,
            iconUrl: true,
            bannerUrl: true,
            isEmailVerified: true,
            isAccountActive: true,
            accountStatus: true,
            createdAt: true,
            lastLoginAt: true,
          },
        }),
        this.prisma.profile.findUnique({
          where: { userId },
          include: { skills: true, endorsements: true },
        }),
        this.prisma.post.findMany({
          where: { authorId: userId },
          include: { Comment: true, Vote: true },
        }),
        this.prisma.comment.findMany({
          where: { userId },
        }),
        this.prisma.connection.findMany({
          where: {
            OR: [{ requesterId: userId }, { recipientId: userId }],
          },
        }),
        this.prisma.message.findMany({
          where: { senderId: userId },
        }),
        this.prisma.message.findMany({
          where: { receiverId: userId },
        }),
        this.prisma.project.findMany({
          where: { ownerId: userId },
          include: { teamMembers: true, updates: true },
        }),
        this.prisma.referralApplication.findMany({
          where: { applicantId: userId },
        }),
        this.prisma.referral.findMany({
          where: { alumniId: userId },
        }),
        this.prisma.mentorship.findMany({
          where: { mentorId: userId },
          include: { goals: true, meetings: true },
        }),
        this.prisma.mentorship.findMany({
          where: { menteeId: userId },
          include: { goals: true, meetings: true },
        }),
        this.prisma.verificationDocument.findMany({
          where: { userId },
        }),
        this.prisma.notification.findMany({
          where: { userId },
        }),
        this.prisma.securityEvent.findMany({
          where: { userId },
          orderBy: { createdAt: 'desc' },
          take: 100, // Limit to last 100 events
        }),
      ]);

      const exportData: UserDataExport = {
        user,
        profile,
        posts,
        comments,
        connections,
        messages: [...sentMessages, ...receivedMessages],
        projects,
        referrals: [...referralApplications, ...postedReferrals],
        mentorships: [...mentorshipsAsMentor, ...mentorshipsAsMentee],
        documents,
        notifications,
        securityEvents,
        exportedAt: new Date().toISOString(),
      };

      // Log successful export
      await this.auditLog.logDataPrivacy(
        AuditAction.DATA_EXPORTED,
        userId,
        ipAddress,
        { recordCount: this.countRecords(exportData) },
      );

      this.logger.log(
        `Data export completed for user ${userId}`,
        'GdprService',
      );

      return exportData;
    } catch (error) {
      this.logger.error(
        `Failed to export data for user ${userId}: ${error.message}`,
        error.stack,
        'GdprService',
      );
      throw error;
    }
  }

  /**
   * Delete all user data (GDPR Right to Erasure)
   */
  async deleteUserData(
    userId: string,
    ipAddress: string,
    reason?: string,
  ): Promise<{ message: string; deletedRecords: number }> {
    try {
      this.logger.warn(`Deleting data for user ${userId}`, 'GdprService');

      // Log the deletion request
      await this.auditLog.logDataPrivacy(
        AuditAction.DATA_DELETION_REQUESTED,
        userId,
        ipAddress,
        { reason },
      );

      let deletedRecords = 0;

      // Delete in correct order to respect foreign key constraints
      await this.prisma.$transaction(async (tx) => {
        // Delete user-related data
        deletedRecords += (await tx.vote.deleteMany({ where: { userId } }))
          .count;
        deletedRecords += (await tx.comment.deleteMany({ where: { userId } }))
          .count;
        deletedRecords += (
          await tx.post.deleteMany({ where: { authorId: userId } })
        ).count;

        deletedRecords += (
          await tx.notification.deleteMany({ where: { userId } })
        ).count;
        deletedRecords += (
          await tx.message.deleteMany({
            where: { OR: [{ senderId: userId }, { receiverId: userId }] },
          })
        ).count;

        deletedRecords += (
          await tx.connection.deleteMany({
            where: { OR: [{ requesterId: userId }, { recipientId: userId }] },
          })
        ).count;

        deletedRecords += (
          await tx.referralApplication.deleteMany({
            where: { applicantId: userId },
          })
        ).count;
        deletedRecords += (
          await tx.referral.deleteMany({ where: { alumniId: userId } })
        ).count;

        deletedRecords += (
          await tx.projectTeamMember.deleteMany({
            where: { userId },
          })
        ).count;
        deletedRecords += (
          await tx.projectComment.deleteMany({ where: { userId } })
        ).count;
        deletedRecords += (
          await tx.projectSupport.deleteMany({ where: { userId } })
        ).count;
        deletedRecords += (
          await tx.projectFollower.deleteMany({ where: { userId } })
        ).count;
        deletedRecords += (
          await tx.projectUpdate.deleteMany({ where: { authorId: userId } })
        ).count;
        deletedRecords += (
          await tx.project.deleteMany({ where: { ownerId: userId } })
        ).count;

        deletedRecords += (
          await tx.mentorship.deleteMany({
            where: { OR: [{ mentorId: userId }, { menteeId: userId }] },
          })
        ).count;
        deletedRecords += (
          await tx.mentorshipRequest.deleteMany({
            where: { OR: [{ mentorId: userId }, { menteeId: userId }] },
          })
        ).count;
        deletedRecords += (
          await tx.mentorshipApplication.deleteMany({
            where: { menteeId: userId },
          })
        ).count;
        deletedRecords += (
          await tx.mentorshipListing.deleteMany({
            where: { mentorId: userId },
          })
        ).count;
        deletedRecords += (
          await tx.mentorSettings.deleteMany({ where: { userId } })
        ).count;

        deletedRecords += (
          await tx.verificationDocument.deleteMany({
            where: { userId },
          })
        ).count;
        deletedRecords += (
          await tx.securityEvent.deleteMany({ where: { userId } })
        ).count;
        deletedRecords += (
          await tx.userSession.deleteMany({ where: { userId } })
        ).count;
        deletedRecords += (
          await tx.refreshToken.deleteMany({ where: { userId } })
        ).count;

        deletedRecords += (
          await tx.endorsement.deleteMany({
            where: { endorserId: userId },
          })
        ).count;
        deletedRecords += (
          await tx.usersOnBadges.deleteMany({ where: { userId } })
        ).count;
        deletedRecords += (
          await tx.userPoints.deleteMany({ where: { userId } })
        ).count;

        deletedRecords += (await tx.file.deleteMany({ where: { userId } }))
          .count;
        deletedRecords += (
          await tx.feedback.deleteMany({
            where: { OR: [{ authorId: userId }, { receiverId: userId }] },
          })
        ).count;

        deletedRecords += (
          await tx.event.deleteMany({ where: { authorId: userId } })
        ).count;
        deletedRecords += (
          await tx.subCommunityMember.deleteMany({
            where: { userId },
          })
        ).count;
        deletedRecords += (
          await tx.joinRequest.deleteMany({ where: { userId } })
        ).count;

        // Delete profile and user last
        await tx.profile.deleteMany({ where: { userId } });
        await tx.user.delete({ where: { id: userId } });
        deletedRecords += 2;
      });

      // Log successful deletion
      await this.auditLog.log({
        action: AuditAction.DATA_DELETED,
        userId: 'system', // User no longer exists
        targetUserId: userId,
        ipAddress,
        status: 'success',
        changes: { deletedRecords, reason },
      });

      this.logger.warn(
        `User data deleted: ${userId} (${deletedRecords} records)`,
        'GdprService',
      );

      return {
        message: 'All user data has been permanently deleted',
        deletedRecords,
      };
    } catch (error) {
      this.logger.error(
        `Failed to delete data for user ${userId}: ${error.message}`,
        error.stack,
        'GdprService',
      );
      throw error;
    }
  }

  /**
   * Anonymize user data (alternative to deletion)
   */
  async anonymizeUserData(userId: string, ipAddress: string): Promise<void> {
    try {
      await this.prisma.user.update({
        where: { id: userId },
        data: {
          email: `deleted_${userId}@anonymized.local`,
          name: 'Deleted User',
          password: null,
          description: null,
          iconUrl: null,
          bannerUrl: null,
          isAccountActive: false,
          accountStatus: 'SUSPENDED',
        },
      });

      await this.prisma.profile.update({
        where: { userId },
        data: {
          bio: null,
          location: null,
          interests: null,
          avatarUrl: null,
        },
      });

      await this.auditLog.logDataPrivacy(
        AuditAction.DATA_DELETED,
        userId,
        ipAddress,
        { method: 'anonymization' },
      );

      this.logger.log(`User data anonymized: ${userId}`, 'GdprService');
    } catch (error) {
      this.logger.error(
        `Failed to anonymize data for user ${userId}: ${error.message}`,
        error.stack,
        'GdprService',
      );
      throw error;
    }
  }

  private countRecords(exportData: UserDataExport): number {
    return (
      (exportData.user ? 1 : 0) +
      (exportData.profile ? 1 : 0) +
      exportData.posts.length +
      exportData.comments.length +
      exportData.connections.length +
      exportData.messages.length +
      exportData.projects.length +
      exportData.referrals.length +
      exportData.mentorships.length +
      exportData.documents.length +
      exportData.notifications.length +
      exportData.securityEvents.length
    );
  }
}
