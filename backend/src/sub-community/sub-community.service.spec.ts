import { Test, TestingModule } from '@nestjs/testing';
import { SubCommunityService } from './sub-community.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotFoundException } from '@nestjs/common';

describe('SubCommunityService - findSubCommunityByType', () => {
  let service: SubCommunityService;
  let prisma: PrismaService;

  const mockSubCommunity = {
    id: 'sc-1',
    name: 'Test Community',
    description: 'A test community',
    isPrivate: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    ownerId: 'user-1',
    typeId: 'type-1',
    owner: { id: 'user-1', name: 'Owner', role: 'ALUM' },
    type: { id: 'type-1', name: 'TECH' },
    _count: { members: 5, posts: 10 },
    members: [],
  };

  const mockPrivateCommunity = {
    ...mockSubCommunity,
    id: 'sc-2',
    name: 'Private Community',
    isPrivate: true,
    _count: { members: 3, posts: 2 },
  };

  const mockPopularCommunity = {
    ...mockSubCommunity,
    id: 'sc-3',
    name: 'Popular Community',
    _count: { members: 50, posts: 100 },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SubCommunityService,
        {
          provide: PrismaService,
          useValue: {
            user: {
              findUnique: jest.fn(),
            },
            subCommunity: {
              findMany: jest.fn(),
              count: jest.fn(),
              findUnique: jest.fn(),
              create: jest.fn(),
              update: jest.fn(),
              delete: jest.fn(),
            },
            subCommunityMember: {
              create: jest.fn(),
              findFirst: jest.fn(),
              findMany: jest.fn(),
              delete: jest.fn(),
              update: jest.fn(),
            },
            subCommunityType: {
              findUnique: jest.fn(),
              create: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<SubCommunityService>(SubCommunityService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('basic type filtering', () => {
    it('should return all sub-communities when type is ALL', async () => {
      const mockData = [mockSubCommunity];
      (prisma.subCommunity.findMany as jest.Mock).mockResolvedValue(mockData);
      (prisma.subCommunity.count as jest.Mock).mockResolvedValue(1);

      const result = await service.findSubCommunityByType('ALL', {});

      expect(result.data).toHaveLength(1);
      expect(result.pagination.total).toBe(1);

      // Verify the where clause does NOT include a type filter
      const findManyCall = (prisma.subCommunity.findMany as jest.Mock).mock
        .calls[0][0];
      const conditions = findManyCall.where.AND;
      // When type is ALL and no other filters, AND should be empty or where should be {}
      expect(conditions === undefined || conditions.length === 0).toBeTruthy();
    });

    it('should filter by specific type when type is not ALL', async () => {
      const mockData = [mockSubCommunity];
      (prisma.subCommunity.findMany as jest.Mock).mockResolvedValue(mockData);
      (prisma.subCommunity.count as jest.Mock).mockResolvedValue(1);

      const result = await service.findSubCommunityByType('TECH', {});

      expect(result.data).toHaveLength(1);

      const findManyCall = (prisma.subCommunity.findMany as jest.Mock).mock
        .calls[0][0];
      expect(findManyCall.where.AND).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            type: { is: { name: 'TECH' } },
          }),
        ]),
      );
    });

    it('should be case-insensitive for type parameter', async () => {
      (prisma.subCommunity.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.subCommunity.count as jest.Mock).mockResolvedValue(0);

      await service.findSubCommunityByType('tech', {});

      const findManyCall = (prisma.subCommunity.findMany as jest.Mock).mock
        .calls[0][0];
      expect(findManyCall.where.AND).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            type: { is: { name: 'TECH' } },
          }),
        ]),
      );
    });
  });

  describe('privacy filter', () => {
    it('should filter by public communities when privacy=public', async () => {
      (prisma.subCommunity.findMany as jest.Mock).mockResolvedValue([
        mockSubCommunity,
      ]);
      (prisma.subCommunity.count as jest.Mock).mockResolvedValue(1);

      const result = await service.findSubCommunityByType('ALL', {
        privacy: 'public',
      });

      expect(result.data).toHaveLength(1);
      const findManyCall = (prisma.subCommunity.findMany as jest.Mock).mock
        .calls[0][0];
      expect(findManyCall.where.AND).toEqual(
        expect.arrayContaining([expect.objectContaining({ isPrivate: false })]),
      );
    });

    it('should filter by private communities when privacy=private', async () => {
      (prisma.subCommunity.findMany as jest.Mock).mockResolvedValue([
        mockPrivateCommunity,
      ]);
      (prisma.subCommunity.count as jest.Mock).mockResolvedValue(1);

      await service.findSubCommunityByType('ALL', { privacy: 'private' });

      const findManyCall = (prisma.subCommunity.findMany as jest.Mock).mock
        .calls[0][0];
      expect(findManyCall.where.AND).toEqual(
        expect.arrayContaining([expect.objectContaining({ isPrivate: true })]),
      );
    });

    it('should not filter by privacy when privacy=all', async () => {
      (prisma.subCommunity.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.subCommunity.count as jest.Mock).mockResolvedValue(0);

      await service.findSubCommunityByType('ALL', { privacy: 'all' });

      const findManyCall = (prisma.subCommunity.findMany as jest.Mock).mock
        .calls[0][0];
      // Should either be {} or have no isPrivate condition
      const conditions = findManyCall.where.AND;
      if (conditions) {
        const privacyConditions = conditions.filter(
          (c: Record<string, unknown>) => 'isPrivate' in c,
        );
        expect(privacyConditions).toHaveLength(0);
      }
    });
  });

  describe('membership filter', () => {
    it('should filter for joined communities when membership=joined', async () => {
      const userId = 'user-1';
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: userId,
        name: 'Test User',
      });
      (prisma.subCommunity.findMany as jest.Mock).mockResolvedValue([
        mockSubCommunity,
      ]);
      (prisma.subCommunity.count as jest.Mock).mockResolvedValue(1);

      await service.findSubCommunityByType('ALL', {
        membership: 'joined',
        userId,
      });

      const findManyCall = (prisma.subCommunity.findMany as jest.Mock).mock
        .calls[0][0];
      expect(findManyCall.where.AND).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            members: { some: { userId } },
          }),
        ]),
      );
    });

    it('should not filter membership when membership=all', async () => {
      (prisma.subCommunity.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.subCommunity.count as jest.Mock).mockResolvedValue(0);

      await service.findSubCommunityByType('ALL', { membership: 'all' });

      const findManyCall = (prisma.subCommunity.findMany as jest.Mock).mock
        .calls[0][0];
      const conditions = findManyCall.where.AND;
      if (conditions) {
        const memberConditions = conditions.filter(
          (c: Record<string, unknown>) =>
            'members' in c &&
            (c.members as Record<string, unknown>).some &&
            (
              (c.members as Record<string, Record<string, unknown>>)
                .some as Record<string, unknown>
            ).userId,
        );
        expect(memberConditions).toHaveLength(0);
      }
    });
  });

  describe('sort order', () => {
    it('should sort by updatedAt desc when sort=recent', async () => {
      (prisma.subCommunity.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.subCommunity.count as jest.Mock).mockResolvedValue(0);

      await service.findSubCommunityByType('ALL', { sort: 'recent' });

      const findManyCall = (prisma.subCommunity.findMany as jest.Mock).mock
        .calls[0][0];
      expect(findManyCall.orderBy).toEqual({ updatedAt: 'desc' });
    });

    it('should sort by members count desc when sort=popular', async () => {
      (prisma.subCommunity.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.subCommunity.count as jest.Mock).mockResolvedValue(0);

      await service.findSubCommunityByType('ALL', { sort: 'popular' });

      const findManyCall = (prisma.subCommunity.findMany as jest.Mock).mock
        .calls[0][0];
      expect(findManyCall.orderBy).toEqual({ members: { _count: 'desc' } });
    });

    it('should sort by posts count desc when sort=active', async () => {
      (prisma.subCommunity.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.subCommunity.count as jest.Mock).mockResolvedValue(0);

      await service.findSubCommunityByType('ALL', { sort: 'active' });

      const findManyCall = (prisma.subCommunity.findMany as jest.Mock).mock
        .calls[0][0];
      expect(findManyCall.orderBy).toEqual({ posts: { _count: 'desc' } });
    });

    it('should default to updatedAt desc when no sort specified', async () => {
      (prisma.subCommunity.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.subCommunity.count as jest.Mock).mockResolvedValue(0);

      await service.findSubCommunityByType('ALL', {});

      const findManyCall = (prisma.subCommunity.findMany as jest.Mock).mock
        .calls[0][0];
      expect(findManyCall.orderBy).toEqual({ updatedAt: 'desc' });
    });
  });

  describe('minMembers filter', () => {
    it('should filter communities with at least N members', async () => {
      const communities = [
        { ...mockSubCommunity, _count: { members: 2, posts: 5 } },
        { ...mockPopularCommunity, _count: { members: 50, posts: 100 } },
      ];
      (prisma.subCommunity.findMany as jest.Mock).mockResolvedValue(
        communities,
      );
      (prisma.subCommunity.count as jest.Mock).mockResolvedValue(2);

      const result = await service.findSubCommunityByType('ALL', {
        minMembers: 10,
      });

      // Only the popular community should remain after filtering
      expect(result.data).toHaveLength(1);
      expect(result.data[0].id).toBe('sc-3');
      expect(result.pagination.total).toBe(1);
    });

    it('should not filter when minMembers is 0', async () => {
      const communities = [mockSubCommunity];
      (prisma.subCommunity.findMany as jest.Mock).mockResolvedValue(
        communities,
      );
      (prisma.subCommunity.count as jest.Mock).mockResolvedValue(1);

      const result = await service.findSubCommunityByType('ALL', {
        minMembers: 0,
      });

      expect(result.data).toHaveLength(1);
    });
  });

  describe('text search (q)', () => {
    it('should search by name and description when q is provided', async () => {
      (prisma.subCommunity.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.subCommunity.count as jest.Mock).mockResolvedValue(0);

      await service.findSubCommunityByType('ALL', { q: 'test' });

      const findManyCall = (prisma.subCommunity.findMany as jest.Mock).mock
        .calls[0][0];
      expect(findManyCall.where.AND).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            OR: [
              { name: { contains: 'test', mode: 'insensitive' } },
              { description: { contains: 'test', mode: 'insensitive' } },
            ],
          }),
        ]),
      );
    });
  });

  describe('pagination', () => {
    it('should return correct pagination metadata', async () => {
      (prisma.subCommunity.findMany as jest.Mock).mockResolvedValue([
        mockSubCommunity,
      ]);
      (prisma.subCommunity.count as jest.Mock).mockResolvedValue(25);

      const result = await service.findSubCommunityByType('ALL', {
        page: 1,
        limit: 10,
      });

      expect(result.pagination).toEqual({
        page: 1,
        limit: 10,
        total: 25,
        totalPages: 3,
        hasNext: true,
        hasPrev: false,
      });
    });

    it('should set hasPrev to true on page 2', async () => {
      (prisma.subCommunity.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.subCommunity.count as jest.Mock).mockResolvedValue(25);

      const result = await service.findSubCommunityByType('ALL', {
        page: 2,
        limit: 10,
      });

      expect(result.pagination.hasPrev).toBe(true);
    });

    it('should use default page=1 and limit=20', async () => {
      (prisma.subCommunity.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.subCommunity.count as jest.Mock).mockResolvedValue(0);

      const result = await service.findSubCommunityByType('ALL', {});

      expect(result.pagination.page).toBe(1);
      expect(result.pagination.limit).toBe(20);
    });
  });

  describe('combined filters', () => {
    it('should combine type + privacy + sort filters', async () => {
      (prisma.subCommunity.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.subCommunity.count as jest.Mock).mockResolvedValue(0);

      await service.findSubCommunityByType('TECH', {
        privacy: 'public',
        sort: 'popular',
      });

      const findManyCall = (prisma.subCommunity.findMany as jest.Mock).mock
        .calls[0][0];
      expect(findManyCall.where.AND).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ type: { is: { name: 'TECH' } } }),
          expect.objectContaining({ isPrivate: false }),
        ]),
      );
      expect(findManyCall.orderBy).toEqual({ members: { _count: 'desc' } });
    });

    it('should combine membership + search + sort', async () => {
      const userId = 'user-1';
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: userId,
        name: 'Test User',
      });
      (prisma.subCommunity.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.subCommunity.count as jest.Mock).mockResolvedValue(0);

      await service.findSubCommunityByType('ALL', {
        membership: 'joined',
        q: 'dev',
        sort: 'active',
        userId,
      });

      const findManyCall = (prisma.subCommunity.findMany as jest.Mock).mock
        .calls[0][0];
      expect(findManyCall.where.AND).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            members: { some: { userId } },
          }),
          expect.objectContaining({
            OR: [
              { name: { contains: 'dev', mode: 'insensitive' } },
              { description: { contains: 'dev', mode: 'insensitive' } },
            ],
          }),
        ]),
      );
      expect(findManyCall.orderBy).toEqual({ posts: { _count: 'desc' } });
    });
  });

  describe('error handling', () => {
    it('should throw NotFoundException when userId is provided but user not found', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(
        service.findSubCommunityByType('ALL', { userId: 'nonexistent' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('backward compatibility', () => {
    it('should work with no options (all defaults)', async () => {
      (prisma.subCommunity.findMany as jest.Mock).mockResolvedValue([
        mockSubCommunity,
      ]);
      (prisma.subCommunity.count as jest.Mock).mockResolvedValue(1);

      const result = await service.findSubCommunityByType('ALL', {});

      expect(result.data).toHaveLength(1);
      expect(result.pagination.page).toBe(1);
      expect(result.pagination.limit).toBe(20);
    });

    it('should include member data when userId is provided', async () => {
      const userId = 'user-1';
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: userId,
        name: 'Test User',
      });
      (prisma.subCommunity.findMany as jest.Mock).mockResolvedValue([
        mockSubCommunity,
      ]);
      (prisma.subCommunity.count as jest.Mock).mockResolvedValue(1);

      await service.findSubCommunityByType('ALL', { userId });

      const findManyCall = (prisma.subCommunity.findMany as jest.Mock).mock
        .calls[0][0];
      expect(findManyCall.include.members).toEqual({
        where: { userId },
        select: { userId: true, role: true },
      });
    });

    it('should not include member filter when no userId', async () => {
      (prisma.subCommunity.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.subCommunity.count as jest.Mock).mockResolvedValue(0);

      await service.findSubCommunityByType('ALL', {});

      const findManyCall = (prisma.subCommunity.findMany as jest.Mock).mock
        .calls[0][0];
      expect(findManyCall.include.members).toBeUndefined();
    });
  });
});
