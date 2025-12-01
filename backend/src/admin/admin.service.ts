import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);

  constructor(private readonly prisma: PrismaService) { }

  /**
   * Get comprehensive admin dashboard statistics
   */
  async getDashboardStats() {
    try {
      const [
        totalUsers,
        activeUsers,
        pendingVerifications,
        approvedToday,
        rejectedToday,
        totalPosts,
        totalProjects,
        totalReferrals,
        totalMentorships,
      ] = await Promise.all([
        this.prisma.user.count(),
        this.prisma.user.count({ where: { isAccountActive: true } }),
        this.prisma.verificationDocument.count({ where: { status: 'PENDING' } }),
        this.prisma.verificationDocument.count({
          where: {
            status: 'APPROVED',
            reviewedAt: {
              gte: new Date(new Date().setHours(0, 0, 0, 0)),
            },
          },
        }),
        this.prisma.verificationDocument.count({
          where: {
            status: 'REJECTED',
            reviewedAt: {
              gte: new Date(new Date().setHours(0, 0, 0, 0)),
            },
          },
        }),
        this.prisma.post.count(),
        this.prisma.project.count(),
        this.prisma.referral.count(),
        this.prisma.mentorship.count(),
      ]);

      return {
        users: {
          total: totalUsers,
          active: activeUsers,
          inactive: totalUsers - activeUsers,
        },
        verifications: {
          pending: pendingVerifications,
          approvedToday,
          rejectedToday,
        },
        platform: {
          posts: totalPosts,
          projects: totalProjects,
          referrals: totalReferrals,
          mentorships: totalMentorships,
        },
      };
    } catch (error) {
      this.logger.error('Failed to fetch dashboard stats:', error);
      throw error;
    }
  }

  /**
   * Get user activity report
   */
  async getUserActivityReport(days: number = 7) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const [newUsers, activeSessions, newPosts, newProjects] = await Promise.all([
      this.prisma.user.count({
        where: {
          createdAt: {
            gte: startDate,
          },
        },
      }),
      this.prisma.userSession.count({
        where: {
          lastActivity: {
            gte: startDate,
          },
        },
      }),
      this.prisma.post.count({
        where: {
          createdAt: {
            gte: startDate,
          },
        },
      }),
      this.prisma.project.count({
        where: {
          createdAt: {
            gte: startDate,
          },
        },
      }),
    ]);

    return {
      period: `Last ${days} days`,
      newUsers,
      activeSessions,
      newPosts,
      newProjects,
    };
  }

  /**
   * Get detailed user information for admin review
   */
  async getUserDetails(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        profile: true,
        verificationDocuments: {
          orderBy: { submittedAt: 'desc' },
        },
        Post: {
          select: { id: true, subject: true, createdAt: true },
          take: 5,
          orderBy: { createdAt: 'desc' },
        },
        projects: {
          select: { id: true, title: true, createdAt: true },
          take: 5,
          orderBy: { createdAt: 'desc' },
        },
        postedReferrals: {
          select: { id: true, jobTitle: true, createdAt: true },
          take: 5,
          orderBy: { createdAt: 'desc' },
        },
        securityEvents: {
          select: { eventType: true, createdAt: true, metadata: true },
          take: 10,
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  /**
   * Search users with advanced filters (for admin management)
   */
  async searchUsers(filters: {
    query?: string;
    role?: string;
    accountStatus?: string;
    graduationYear?: number;
    department?: string;
    page?: number;
    limit?: number;
  }) {
    const {
      query,
      role,
      accountStatus,
      graduationYear,
      department,
      page = 1,
      limit = 20,
    } = filters;

    const where: any = {};

    if (query) {
      where.OR = [
        { name: { contains: query, mode: 'insensitive' } },
        { email: { contains: query, mode: 'insensitive' } },
      ];
    }

    if (role) {
      where.role = role;
    }

    if (accountStatus) {
      where.accountStatus = accountStatus;
    }

    if (graduationYear) {
      where.graduationYear = graduationYear;
    }

    if (department) {
      where.profile = {
        dept: { contains: department, mode: 'insensitive' },
      };
    }

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          graduationYear: true,
          accountStatus: true,
          isAccountActive: true,
          createdAt: true,
          lastLoginAt: true,
          profile: {
            select: {
              dept: true,
              branch: true,
              studentId: true,
            },
          },
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      data: users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get platform health metrics
   */
  async getPlatformHealth() {
    const [
      failedLogins,
      lockedAccounts,
      unverifiedEmails,
      recentSecurityEvents,
    ] = await Promise.all([
      this.prisma.user.count({
        where: {
          failedLoginAttempts: {
            gte: 3,
          },
        },
      }),
      this.prisma.user.count({
        where: {
          lockedUntil: {
            gt: new Date(),
          },
        },
      }),
      this.prisma.user.count({
        where: {
          isEmailVerified: false,
        },
      }),
      this.prisma.securityEvent.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
          },
        },
      }),
    ]);

    return {
      security: {
        failedLogins,
        lockedAccounts,
        unverifiedEmails,
        recentSecurityEvents,
      },
      status: 'healthy', // Can be enhanced with more checks
      timestamp: new Date(),
    };
  }
}
