import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { AdminService } from '../../src/admin/admin.service';
import { PrismaService } from '../../src/prisma/prisma.service';
import { Role, AccountStatus } from '@prisma/client';

describe('AdminService - Unit Tests', () => {
  let service: AdminService;
  let prisma: {
    user: { count: jest.Mock; findMany: jest.Mock; findUnique: jest.Mock };
    verificationDocument: { count: jest.Mock };
    post: { count: jest.Mock };
    project: { count: jest.Mock };
    referral: { count: jest.Mock };
    mentorship: { count: jest.Mock };
    userSession: { count: jest.Mock };
    securityEvent: { count: jest.Mock };
  };

  const mockUserId = 'user-uuid-123';
  const mockUser = {
    id: mockUserId,
    name: 'Test User',
    email: 'test@kiit.ac.in',
    password: 'hashed',
    role: Role.STUDENT,
    accountStatus: AccountStatus.ACTIVE,
    isAccountActive: true,
    graduationYear: 2024,
    createdAt: new Date('2024-01-01'),
    lastLoginAt: new Date('2024-01-15'),
    profile: {
      id: 'profile-1',
      userId: mockUserId,
      dept: 'CSE',
      branch: 'IT',
      studentId: '12345',
      bio: null,
      location: null,
    },
    verificationDocuments: [],
    Post: [],
    projects: [],
    postedReferrals: [],
    securityEvents: [],
  };

  beforeEach(async () => {
    const mockPrismaService = {
      user: {
        count: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
      },
      verificationDocument: {
        count: jest.fn(),
      },
      post: {
        count: jest.fn(),
      },
      project: {
        count: jest.fn(),
      },
      referral: {
        count: jest.fn(),
      },
      mentorship: {
        count: jest.fn(),
      },
      userSession: {
        count: jest.fn(),
      },
      securityEvent: {
        count: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<AdminService>(AdminService);
    prisma = module.get(PrismaService) as any;

    jest.clearAllMocks();
  });

  describe('✅ Business Logic: Dashboard Statistics', () => {
    it('should return comprehensive dashboard statistics', async () => {
      prisma.user.count
        .mockResolvedValueOnce(100) // total users
        .mockResolvedValueOnce(85); // active users

      prisma.verificationDocument.count
        .mockResolvedValueOnce(15) // pending
        .mockResolvedValueOnce(5) // approved today
        .mockResolvedValueOnce(2); // rejected today

      prisma.post.count.mockResolvedValue(500);
      prisma.project.count.mockResolvedValue(75);
      prisma.referral.count.mockResolvedValue(120);
      prisma.mentorship.count.mockResolvedValue(45);

      const result = await service.getDashboardStats();

      expect(result).toEqual({
        users: {
          total: 100,
          active: 85,
          inactive: 15,
        },
        verifications: {
          pending: 15,
          approvedToday: 5,
          rejectedToday: 2,
        },
        platform: {
          posts: 500,
          projects: 75,
          referrals: 120,
          mentorships: 45,
        },
      });
    });

    it('should calculate inactive users correctly', async () => {
      prisma.user.count
        .mockResolvedValueOnce(50)
        .mockResolvedValueOnce(30);

      prisma.verificationDocument.count
        .mockResolvedValueOnce(0)
        .mockResolvedValueOnce(0)
        .mockResolvedValueOnce(0);

      prisma.post.count.mockResolvedValue(0);
      prisma.project.count.mockResolvedValue(0);
      prisma.referral.count.mockResolvedValue(0);
      prisma.mentorship.count.mockResolvedValue(0);

      const result = await service.getDashboardStats();

      expect(result.users.inactive).toBe(20); // 50 - 30
    });

    it('should handle zero counts gracefully', async () => {
      prisma.user.count
        .mockResolvedValueOnce(0)
        .mockResolvedValueOnce(0);

      prisma.verificationDocument.count
        .mockResolvedValueOnce(0)
        .mockResolvedValueOnce(0)
        .mockResolvedValueOnce(0);

      prisma.post.count.mockResolvedValue(0);
      prisma.project.count.mockResolvedValue(0);
      prisma.referral.count.mockResolvedValue(0);
      prisma.mentorship.count.mockResolvedValue(0);

      const result = await service.getDashboardStats();

      expect(result.users.total).toBe(0);
      expect(result.users.active).toBe(0);
      expect(result.platform.posts).toBe(0);
    });

    it('should filter verifications by today only', async () => {
      prisma.user.count
        .mockResolvedValueOnce(10)
        .mockResolvedValueOnce(10);

      prisma.verificationDocument.count
        .mockResolvedValueOnce(5)
        .mockResolvedValueOnce(3)
        .mockResolvedValueOnce(1);

      prisma.post.count.mockResolvedValue(0);
      prisma.project.count.mockResolvedValue(0);
      prisma.referral.count.mockResolvedValue(0);
      prisma.mentorship.count.mockResolvedValue(0);

      await service.getDashboardStats();

      // Verify approved today query
      expect(prisma.verificationDocument.count).toHaveBeenCalledWith({
        where: {
          status: 'APPROVED',
          reviewedAt: {
            gte: expect.any(Date),
          },
        },
      });

      // Verify rejected today query
      expect(prisma.verificationDocument.count).toHaveBeenCalledWith({
        where: {
          status: 'REJECTED',
          reviewedAt: {
            gte: expect.any(Date),
          },
        },
      });
    });
  });

  describe('✅ Business Logic: User Activity Report', () => {
    it('should return activity report for specified days', async () => {
      prisma.user.count.mockResolvedValue(25);
      prisma.userSession.count.mockResolvedValue(150);
      prisma.post.count.mockResolvedValue(80);
      prisma.project.count.mockResolvedValue(10);

      const result = await service.getUserActivityReport(7);

      expect(result).toEqual({
        period: 'Last 7 days',
        newUsers: 25,
        activeSessions: 150,
        newPosts: 80,
        newProjects: 10,
      });
    });

    it('should use 7 days as default period', async () => {
      prisma.user.count.mockResolvedValue(0);
      prisma.userSession.count.mockResolvedValue(0);
      prisma.post.count.mockResolvedValue(0);
      prisma.project.count.mockResolvedValue(0);

      const result = await service.getUserActivityReport();

      expect(result.period).toBe('Last 7 days');
    });

    it('should calculate correct start date for custom period', async () => {
      prisma.user.count.mockResolvedValue(0);
      prisma.userSession.count.mockResolvedValue(0);
      prisma.post.count.mockResolvedValue(0);
      prisma.project.count.mockResolvedValue(0);

      await service.getUserActivityReport(30);

      const expectedDate = new Date();
      expectedDate.setDate(expectedDate.getDate() - 30);

      expect(prisma.user.count).toHaveBeenCalledWith({
        where: {
          createdAt: {
            gte: expect.any(Date),
          },
        },
      });
    });

    it('should handle zero activity gracefully', async () => {
      prisma.user.count.mockResolvedValue(0);
      prisma.userSession.count.mockResolvedValue(0);
      prisma.post.count.mockResolvedValue(0);
      prisma.project.count.mockResolvedValue(0);

      const result = await service.getUserActivityReport(14);

      expect(result).toEqual({
        period: 'Last 14 days',
        newUsers: 0,
        activeSessions: 0,
        newPosts: 0,
        newProjects: 0,
      });
    });
  });

  describe('✅ Business Logic: Get User Details', () => {
    it('should return comprehensive user details', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser as any);

      const result = await service.getUserDetails(mockUserId);

      expect(result).toEqual(mockUser);
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: mockUserId },
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
    });

    it('should throw NotFoundException if user does not exist', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(service.getUserDetails('non-existent-id')).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.getUserDetails('non-existent-id')).rejects.toThrow(
        'User not found',
      );
    });

    it('should limit posts to 5 most recent', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser as any);

      await service.getUserDetails(mockUserId);

      expect(prisma.user.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          include: expect.objectContaining({
            Post: {
              select: { id: true, subject: true, createdAt: true },
              take: 5,
              orderBy: { createdAt: 'desc' },
            },
          }),
        }),
      );
    });

    it('should limit security events to 10 most recent', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser as any);

      await service.getUserDetails(mockUserId);

      expect(prisma.user.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          include: expect.objectContaining({
            securityEvents: {
              select: { eventType: true, createdAt: true, metadata: true },
              take: 10,
              orderBy: { createdAt: 'desc' },
            },
          }),
        }),
      );
    });
  });

  describe('✅ Business Logic: Search Users with Filters', () => {
    it('should search users by query string', async () => {
      const mockUsers = [mockUser];
      prisma.user.findMany.mockResolvedValue(mockUsers as any);
      prisma.user.count.mockResolvedValue(1);

      const result = await service.searchUsers({
        query: 'test',
      });

      expect(result.data).toEqual(mockUsers);
      expect(prisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            OR: [
              { name: { contains: 'test', mode: 'insensitive' } },
              { email: { contains: 'test', mode: 'insensitive' } },
            ],
          },
        }),
      );
    });

    it('should filter by role', async () => {
      prisma.user.findMany.mockResolvedValue([]);
      prisma.user.count.mockResolvedValue(0);

      await service.searchUsers({
        role: 'ALUMNI',
      });

      expect(prisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            role: 'ALUMNI',
          },
        }),
      );
    });

    it('should filter by account status', async () => {
      prisma.user.findMany.mockResolvedValue([]);
      prisma.user.count.mockResolvedValue(0);

      await service.searchUsers({
        accountStatus: 'BANNED',
      });

      expect(prisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            accountStatus: 'BANNED',
          },
        }),
      );
    });

    it('should filter by graduation year', async () => {
      prisma.user.findMany.mockResolvedValue([]);
      prisma.user.count.mockResolvedValue(0);

      await service.searchUsers({
        graduationYear: 2024,
      });

      expect(prisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            graduationYear: 2024,
          },
        }),
      );
    });

    it('should filter by department', async () => {
      prisma.user.findMany.mockResolvedValue([]);
      prisma.user.count.mockResolvedValue(0);

      await service.searchUsers({
        department: 'CSE',
      });

      expect(prisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            profile: {
              dept: { contains: 'CSE', mode: 'insensitive' },
            },
          },
        }),
      );
    });

    it('should support pagination with page and limit', async () => {
      prisma.user.findMany.mockResolvedValue([]);
      prisma.user.count.mockResolvedValue(100);

      const result = await service.searchUsers({
        page: 2,
        limit: 10,
      });

      expect(prisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 10, // (page - 1) * limit
          take: 10,
        }),
      );

      expect(result.pagination).toEqual({
        page: 2,
        limit: 10,
        total: 100,
        totalPages: 10,
      });
    });

    it('should use default pagination values', async () => {
      prisma.user.findMany.mockResolvedValue([]);
      prisma.user.count.mockResolvedValue(0);

      const result = await service.searchUsers({});

      expect(prisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 0,
          take: 20,
        }),
      );

      expect(result.pagination.page).toBe(1);
      expect(result.pagination.limit).toBe(20);
    });

    it('should combine multiple filters', async () => {
      prisma.user.findMany.mockResolvedValue([]);
      prisma.user.count.mockResolvedValue(0);

      await service.searchUsers({
        query: 'john',
        role: 'STUDENT',
        accountStatus: 'ACTIVE',
        graduationYear: 2024,
      });

      expect(prisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            OR: [
              { name: { contains: 'john', mode: 'insensitive' } },
              { email: { contains: 'john', mode: 'insensitive' } },
            ],
            role: 'STUDENT',
            accountStatus: 'ACTIVE',
            graduationYear: 2024,
          },
        }),
      );
    });

    it('should calculate total pages correctly', async () => {
      prisma.user.findMany.mockResolvedValue([]);
      prisma.user.count.mockResolvedValue(95);

      const result = await service.searchUsers({
        page: 1,
        limit: 20,
      });

      expect(result.pagination.totalPages).toBe(5); // Math.ceil(95 / 20)
    });
  });

  describe('✅ Business Logic: Platform Health Metrics', () => {
    it('should return comprehensive health metrics', async () => {
      prisma.user.count
        .mockResolvedValueOnce(10) // failed logins
        .mockResolvedValueOnce(3) // locked accounts
        .mockResolvedValueOnce(25); // unverified emails

      prisma.securityEvent.count.mockResolvedValue(50);

      const result = await service.getPlatformHealth();

      expect(result).toMatchObject({
        security: {
          failedLogins: 10,
          lockedAccounts: 3,
          unverifiedEmails: 25,
          recentSecurityEvents: 50,
        },
        status: 'healthy',
        timestamp: expect.any(Date),
      });
    });

    it('should count users with 3 or more failed login attempts', async () => {
      prisma.user.count
        .mockResolvedValueOnce(5)
        .mockResolvedValueOnce(0)
        .mockResolvedValueOnce(0);

      prisma.securityEvent.count.mockResolvedValue(0);

      await service.getPlatformHealth();

      expect(prisma.user.count).toHaveBeenCalledWith({
        where: {
          failedLoginAttempts: {
            gte: 3,
          },
        },
      });
    });

    it('should count accounts locked in the future', async () => {
      prisma.user.count
        .mockResolvedValueOnce(0)
        .mockResolvedValueOnce(2)
        .mockResolvedValueOnce(0);

      prisma.securityEvent.count.mockResolvedValue(0);

      await service.getPlatformHealth();

      expect(prisma.user.count).toHaveBeenCalledWith({
        where: {
          lockedUntil: {
            gt: expect.any(Date),
          },
        },
      });
    });

    it('should count security events from last 24 hours', async () => {
      prisma.user.count
        .mockResolvedValueOnce(0)
        .mockResolvedValueOnce(0)
        .mockResolvedValueOnce(0);

      prisma.securityEvent.count.mockResolvedValue(15);

      await service.getPlatformHealth();

      expect(prisma.securityEvent.count).toHaveBeenCalledWith({
        where: {
          createdAt: {
            gte: expect.any(Date),
          },
        },
      });
    });

    it('should handle zero security issues', async () => {
      prisma.user.count
        .mockResolvedValueOnce(0)
        .mockResolvedValueOnce(0)
        .mockResolvedValueOnce(0);

      prisma.securityEvent.count.mockResolvedValue(0);

      const result = await service.getPlatformHealth();

      expect(result.security).toEqual({
        failedLogins: 0,
        lockedAccounts: 0,
        unverifiedEmails: 0,
        recentSecurityEvents: 0,
      });
      expect(result.status).toBe('healthy');
    });
  });

  describe('❌ Edge Cases: Boundary Values', () => {
    it('should handle zero days in activity report', async () => {
      prisma.user.count.mockResolvedValue(0);
      prisma.userSession.count.mockResolvedValue(0);
      prisma.post.count.mockResolvedValue(0);
      prisma.project.count.mockResolvedValue(0);

      const result = await service.getUserActivityReport(0);

      expect(result.period).toBe('Last 0 days');
    });

    it('should handle very large page numbers', async () => {
      prisma.user.findMany.mockResolvedValue([]);
      prisma.user.count.mockResolvedValue(0);

      const result = await service.searchUsers({
        page: 999999,
        limit: 20,
      });

      expect(result.data).toEqual([]);
      expect(result.pagination.page).toBe(999999);
    });

    it('should handle very small limit values', async () => {
      prisma.user.findMany.mockResolvedValue([]);
      prisma.user.count.mockResolvedValue(0);

      const result = await service.searchUsers({
        page: 1,
        limit: 1,
      });

      expect(result.pagination.limit).toBe(1);
    });
  });

  describe('❌ Edge Cases: Special Characters', () => {
    it('should handle special characters in search query', async () => {
      prisma.user.findMany.mockResolvedValue([]);
      prisma.user.count.mockResolvedValue(0);

      await service.searchUsers({
        query: '<script>alert("XSS")</script>',
      });

      expect(prisma.user.findMany).toHaveBeenCalled();
    });

    it('should handle Unicode characters in department filter', async () => {
      prisma.user.findMany.mockResolvedValue([]);
      prisma.user.count.mockResolvedValue(0);

      await service.searchUsers({
        department: '你好',
      });

      expect(prisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            profile: {
              dept: { contains: '你好', mode: 'insensitive' },
            },
          },
        }),
      );
    });
  });

  describe('🔒 Security: Data Protection', () => {
    it('should not expose password in search results', async () => {
      prisma.user.findMany.mockResolvedValue([mockUser] as any);
      prisma.user.count.mockResolvedValue(1);

      await service.searchUsers({});

      expect(prisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          select: expect.not.objectContaining({
            password: true,
          }),
        }),
      );
    });

    it('should only return necessary user fields in search', async () => {
      prisma.user.findMany.mockResolvedValue([]);
      prisma.user.count.mockResolvedValue(0);

      await service.searchUsers({});

      expect(prisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
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
        }),
      );
    });
  });
});
