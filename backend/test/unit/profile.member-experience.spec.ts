import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException } from '@nestjs/common';
import { ProfileService } from '../../src/profile/profile.service';
import { PrismaService } from '../../src/prisma/prisma.service';

describe('ProfileService - Member Experience and Privacy', () => {
  let service: ProfileService;

  const mockPrismaService = {
    profile: {
      findUnique: jest.fn(),
    },
    endorsement: {
      findMany: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
    },
    memberProfile: {
      findUnique: jest.fn(),
    },
    memberFlair: {
      findFirst: jest.fn(),
    },
    communityFollow: {
      aggregate: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    usersOnBadges: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    badge: {
      findUnique: jest.fn(),
    },
    post: {
      findMany: jest.fn(),
    },
    comment: {
      findMany: jest.fn(),
    },
    project: {
      findMany: jest.fn(),
    },
    notificationPreference: {
      findUnique: jest.fn(),
    },
    notification: {
      create: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProfileService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<ProfileService>(ProfileService);
    jest.clearAllMocks();
  });

  it('scopes skill endorsements to the requested profile only', async () => {
    mockPrismaService.profile.findUnique.mockResolvedValue({
      id: 'profile-1',
      userId: 'user-1',
      skills: [
        { id: 'skill-1', name: 'TypeScript' },
        { id: 'skill-2', name: 'NestJS' },
      ],
      user: {
        id: 'user-1',
        name: 'User One',
        email: 'u1@example.com',
        role: 'STUDENT',
      },
    });

    mockPrismaService.endorsement.findMany.mockResolvedValue([
      {
        id: 'endorsement-1',
        profileId: 'profile-1',
        skillId: 'skill-1',
        endorser: { id: 'e1', name: 'Endorser 1', role: 'ALUM', profile: null },
      },
    ]);

    const result = await service.getProfile('user-1');

    expect(mockPrismaService.endorsement.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          profileId: 'profile-1',
          skillId: { in: ['skill-1', 'skill-2'] },
        }),
      }),
    );

    const tsSkill = result.skills.find((skill) => skill.id === 'skill-1');
    const nestSkill = result.skills.find((skill) => skill.id === 'skill-2');

    expect(tsSkill?.endorsements).toHaveLength(1);
    expect(nestSkill?.endorsements).toHaveLength(0);
  });

  it('hides badges and recent activity when member privacy disables them', async () => {
    mockPrismaService.profile.findUnique.mockResolvedValue({
      id: 'profile-2',
      bio: 'Test bio',
      location: 'Test city',
      avatarUrl: null,
      dept: null,
      year: null,
      branch: null,
      course: null,
    });

    mockPrismaService.user.findUnique.mockResolvedValue({
      id: 'user-2',
      name: 'User Two',
      role: 'STUDENT',
      _count: { Post: 0, projects: 0, events: 0 },
    });

    mockPrismaService.memberProfile.findUnique.mockResolvedValue({
      userId: 'user-2',
      showBadges: false,
      showRecentActivity: false,
      allowFollowers: true,
      allowDirectMessage: true,
    });

    mockPrismaService.memberFlair.findFirst.mockResolvedValue(null);
    mockPrismaService.communityFollow.aggregate.mockResolvedValue({
      _count: { _all: 0 },
    });
    mockPrismaService.communityFollow.findUnique.mockResolvedValue(null);

    const result = await service.getMemberExperience('user-2', 'viewer-1');

    expect(result.badges).toEqual([]);
    expect(result.recentActivity).toEqual([]);
    expect(result.privacy.showBadges).toBe(false);
    expect(result.privacy.showRecentActivity).toBe(false);

    expect(mockPrismaService.usersOnBadges.findMany).not.toHaveBeenCalled();
    expect(mockPrismaService.post.findMany).not.toHaveBeenCalled();
    expect(mockPrismaService.comment.findMany).not.toHaveBeenCalled();
    expect(mockPrismaService.project.findMany).not.toHaveBeenCalled();
  });

  it('blocks follow when target member disables followers', async () => {
    mockPrismaService.user.findUnique.mockResolvedValue({
      id: 'target-user',
      name: 'Target User',
    });

    mockPrismaService.memberProfile.findUnique.mockResolvedValue({
      allowFollowers: false,
    });

    await expect(
      service.followMember('follower-user', 'target-user'),
    ).rejects.toThrow(ForbiddenException);
  });

  it('creates follow notification when digest mode is off and follow notifications are enabled', async () => {
    mockPrismaService.user.findUnique
      .mockResolvedValueOnce({ id: 'target-user', name: 'Target User' })
      .mockResolvedValueOnce({ name: 'Follower User' });

    mockPrismaService.memberProfile.findUnique.mockResolvedValue({
      allowFollowers: true,
    });

    mockPrismaService.communityFollow.create.mockResolvedValue({
      followerId: 'follower-user',
      followedId: 'target-user',
    });

    mockPrismaService.notificationPreference.findUnique.mockResolvedValue({
      inAppEnabled: true,
      digestModeEnabled: false,
      notifyOnFollow: true,
    });

    await service.followMember('follower-user', 'target-user');

    expect(mockPrismaService.notification.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          userId: 'target-user',
        }),
      }),
    );
  });

  it('does not create follow notification when digest mode is enabled', async () => {
    mockPrismaService.user.findUnique.mockResolvedValue({
      id: 'target-user',
      name: 'Target User',
    });

    mockPrismaService.memberProfile.findUnique.mockResolvedValue({
      allowFollowers: true,
    });

    mockPrismaService.communityFollow.create.mockResolvedValue({
      followerId: 'follower-user',
      followedId: 'target-user',
    });

    mockPrismaService.notificationPreference.findUnique.mockResolvedValue({
      inAppEnabled: true,
      digestModeEnabled: true,
      notifyOnFollow: true,
    });

    await service.followMember('follower-user', 'target-user');

    expect(mockPrismaService.notification.create).not.toHaveBeenCalled();
  });

  it('creates badge notification when digest mode is off and badge notifications are enabled', async () => {
    mockPrismaService.user.findUnique.mockResolvedValue({
      id: 'target-user',
      name: 'Target User',
    });

    mockPrismaService.badge.findUnique.mockResolvedValue({
      id: 'badge-1',
      name: 'Top Contributor',
    });

    mockPrismaService.usersOnBadges.findUnique.mockResolvedValue(null);
    mockPrismaService.usersOnBadges.create.mockResolvedValue({
      userId: 'target-user',
      badgeId: 'badge-1',
    });

    mockPrismaService.notificationPreference.findUnique.mockResolvedValue({
      inAppEnabled: true,
      digestModeEnabled: false,
      notifyOnBadgeAward: true,
    });

    await service.awardBadge('target-user', 'badge-1');

    expect(mockPrismaService.notification.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          userId: 'target-user',
        }),
      }),
    );
  });

  it('does not create badge notification when digest mode is enabled', async () => {
    mockPrismaService.user.findUnique.mockResolvedValue({
      id: 'target-user',
      name: 'Target User',
    });

    mockPrismaService.badge.findUnique.mockResolvedValue({
      id: 'badge-1',
      name: 'Top Contributor',
    });

    mockPrismaService.usersOnBadges.findUnique.mockResolvedValue(null);
    mockPrismaService.usersOnBadges.create.mockResolvedValue({
      userId: 'target-user',
      badgeId: 'badge-1',
    });

    mockPrismaService.notificationPreference.findUnique.mockResolvedValue({
      inAppEnabled: true,
      digestModeEnabled: true,
      notifyOnBadgeAward: true,
    });

    await service.awardBadge('target-user', 'badge-1');

    expect(mockPrismaService.notification.create).not.toHaveBeenCalled();
  });
});
