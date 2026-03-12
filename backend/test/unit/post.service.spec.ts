import { Test, TestingModule } from '@nestjs/testing';
import { PostService } from '../../src/post/post.service';
import { PrismaService } from '../../src/prisma/prisma.service';
import { GamificationService } from '../../src/gamification/gamification.service';
import {
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PostStatus, Role } from '@prisma/client';

describe('PostService - Unit Tests', () => {
  let service: PostService;
  // let prismaService: PrismaService;
  // let gamificationService: GamificationService;

  let mockPrismaService: any;
  let gamificationService: any;

  const baseMockPrismaService = {
    user: {
      findUnique: jest.fn(),
    },
    post: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    subCommunityMember: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
    },
    comment: {
      deleteMany: jest.fn(),
    },
    vote: {
      deleteMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    mockPrismaService = JSON.parse(JSON.stringify(baseMockPrismaService));
    // Re-assign jest.fn() after JSON parse
    mockPrismaService.user.findUnique = jest.fn();
    mockPrismaService.post.create = jest.fn();
    mockPrismaService.post.findUnique = jest.fn();
    mockPrismaService.post.findMany = jest.fn();
    mockPrismaService.post.update = jest.fn();
    mockPrismaService.post.delete = jest.fn();
    mockPrismaService.post.count = jest.fn();
    mockPrismaService.subCommunityMember.findFirst = jest.fn();
    mockPrismaService.subCommunityMember.findMany = jest.fn();
    mockPrismaService.comment.deleteMany = jest.fn();
    mockPrismaService.vote.deleteMany = jest.fn();

    gamificationService = { awardPoints: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PostService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: GamificationService,
          useValue: gamificationService,
        },
      ],
    }).compile();

    service = module.get<PostService>(PostService);

    jest.clearAllMocks();
  });

  describe('✅ create() - Post Creation Logic', () => {
    const userId = 'user-123';
    const validDto = {
      subject: 'Test Post Subject',
      content: 'This is a test post content',
      type: 'UPDATE',
    };

    it('should create a post with PENDING status for all users', async () => {
      const mockUser = { id: userId, role: Role.STUDENT };
      const mockPost = {
        id: 'post-123',
        ...validDto,
        authorId: userId,
        status: PostStatus.PENDING,
      };

      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      mockPrismaService.post.create.mockResolvedValue(mockPost);

      const result = await service.create(userId, validDto);

      expect(result.status).toBe(PostStatus.PENDING);
      expect(mockPrismaService.post.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: PostStatus.PENDING,
          }),
        }),
      );
    });

    it('should trim subject and content before creating post', async () => {
      const dtoWithWhitespace = {
        subject: '  Test Subject  ',
        content: '  Test content with spaces  ',
      };

      mockPrismaService.user.findUnique.mockResolvedValue({ id: userId });
      mockPrismaService.post.create.mockResolvedValue({});

      await service.create(userId, dtoWithWhitespace);

      expect(mockPrismaService.post.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            subject: 'Test Subject',
            content: 'Test content with spaces',
          }),
        }),
      );
    });

    it('should throw NotFoundException if user does not exist', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(service.create(userId, validDto)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.create(userId, validDto)).rejects.toThrow(
        'User not found',
      );
    });

    it('should throw BadRequestException if content is empty', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({ id: userId });

      await expect(
        service.create(userId, { ...validDto, content: '' }),
      ).rejects.toThrow(BadRequestException);

      await expect(
        service.create(userId, { ...validDto, content: '   ' }),
      ).rejects.toThrow('Post content cannot be empty');
    });

    it('should throw BadRequestException if content exceeds 2000 characters', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({ id: userId });

      const longContent = 'a'.repeat(2001);

      await expect(
        service.create(userId, { ...validDto, content: longContent }),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.create(userId, { ...validDto, content: longContent }),
      ).rejects.toThrow('Post content too long (max 2000 characters)');
    });

    it('should throw BadRequestException if subject is empty', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({ id: userId });

      await expect(
        service.create(userId, { ...validDto, subject: '' }),
      ).rejects.toThrow(BadRequestException);

      await expect(
        service.create(userId, { ...validDto, subject: '   ' }),
      ).rejects.toThrow('Post subject cannot be empty');
    });

    it('should throw BadRequestException if subject exceeds 200 characters', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({ id: userId });

      const longSubject = 'a'.repeat(201);

      await expect(
        service.create(userId, { ...validDto, subject: longSubject }),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.create(userId, { ...validDto, subject: longSubject }),
      ).rejects.toThrow('Post subject too long (max 200 characters)');
    });

    it('should check sub-community membership when subCommunityId provided', async () => {
      const dtoWithCommunity = {
        ...validDto,
        subCommunityId: 'community-123',
      };

      mockPrismaService.user.findUnique.mockResolvedValue({ id: userId });
      mockPrismaService.subCommunityMember.findFirst.mockResolvedValue({
        userId,
        subCommunityId: 'community-123',
      });
      mockPrismaService.post.create.mockResolvedValue({});

      await service.create(userId, dtoWithCommunity);

      expect(
        mockPrismaService.subCommunityMember.findFirst,
      ).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            userId,
            subCommunityId: 'community-123',
          },
        }),
      );
    });

    it('should throw ForbiddenException if user is not a sub-community member', async () => {
      const dtoWithCommunity = {
        ...validDto,
        subCommunityId: 'community-123',
      };

      mockPrismaService.user.findUnique.mockResolvedValue({ id: userId });
      mockPrismaService.subCommunityMember.findFirst.mockResolvedValue(null);

      await expect(service.create(userId, dtoWithCommunity)).rejects.toThrow(
        ForbiddenException,
      );
      await expect(service.create(userId, dtoWithCommunity)).rejects.toThrow(
        'You must be a member of the sub-community to post in it.',
      );
    });

    it('should include imageUrl if provided', async () => {
      const dtoWithImage = {
        ...validDto,
        imageUrl: 'https://example.com/image.jpg',
      };

      mockPrismaService.user.findUnique.mockResolvedValue({ id: userId });
      mockPrismaService.post.create.mockResolvedValue({});

      await service.create(userId, dtoWithImage);

      expect(mockPrismaService.post.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            imageUrl: 'https://example.com/image.jpg',
          }),
        }),
      );
    });

    it('should default type to UPDATE if not provided', async () => {
      const dtoWithoutType = {
        subject: 'Test',
        content: 'Test content',
      };

      mockPrismaService.user.findUnique.mockResolvedValue({ id: userId });
      mockPrismaService.post.create.mockResolvedValue({});

      await service.create(userId, dtoWithoutType);

      expect(mockPrismaService.post.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            type: 'UPDATE',
          }),
        }),
      );
    });
  });

  describe('✅ getRecentPosts() - Post Retrieval with Pagination', () => {
    const userId = 'user-123';

    it('should retrieve recent posts with correct pagination', async () => {
      const mockPosts = [
        { id: 'post-1', content: 'Post 1', Vote: [] },
        { id: 'post-2', content: 'Post 2', Vote: [] },
      ];

      mockPrismaService.user.findUnique.mockResolvedValue({ id: userId });
      mockPrismaService.post.findMany.mockResolvedValue(mockPosts);
      mockPrismaService.post.count.mockResolvedValue(10);

      const result = await service.getRecentPosts(userId, 1, 6);

      expect(result.posts).toHaveLength(2);
      expect(result.pagination).toEqual({
        page: 1,
        limit: 6,
        total: 10,
        totalPages: 2,
        hasNext: true,
        hasPrev: false,
      });
    });

    it('should exclude user own posts', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({ id: userId });
      mockPrismaService.post.findMany.mockResolvedValue([]);
      mockPrismaService.post.count.mockResolvedValue(0);

      await service.getRecentPosts(userId, 1, 6);

      expect(mockPrismaService.post.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            authorId: { not: userId },
          }),
        }),
      );
    });

    it('should only return APPROVED posts', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({ id: userId });
      mockPrismaService.post.findMany.mockResolvedValue([]);
      mockPrismaService.post.count.mockResolvedValue(0);

      await service.getRecentPosts(userId, 1, 6);

      expect(mockPrismaService.post.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: PostStatus.APPROVED,
          }),
        }),
      );
    });

    it('should throw NotFoundException if user does not exist', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(service.getRecentPosts(userId, 1, 6)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw BadRequestException for invalid pagination', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({ id: userId });

      await expect(service.getRecentPosts(userId, -1, 6)).rejects.toThrow(
        BadRequestException,
      );

      await expect(service.getRecentPosts(userId, 1, 0)).rejects.toThrow(
        BadRequestException,
      );

      await expect(service.getRecentPosts(userId, 1, 51)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should include vote status for each post', async () => {
      const mockPosts = [
        { id: 'post-1', content: 'Post 1', Vote: [{ type: 'UPVOTE' }] },
        { id: 'post-2', content: 'Post 2', Vote: [] },
      ];

      mockPrismaService.user.findUnique.mockResolvedValue({ id: userId });
      mockPrismaService.post.findMany.mockResolvedValue(mockPosts);
      mockPrismaService.post.count.mockResolvedValue(2);

      const result = await service.getRecentPosts(userId, 1, 6);

      expect(result.posts[0].hasVoted).toBe(true);
      expect(result.posts[1].hasVoted).toBe(false);
      expect(result.posts[0]).not.toHaveProperty('Vote');
    });
  });

  describe('❌ Edge Cases: Null and Empty Values', () => {
    const userId = 'user-123';

    it('should handle null imageUrl gracefully', async () => {
      const dto = {
        subject: 'Test',
        content: 'Test content',
        imageUrl: null,
      };

      mockPrismaService.user.findUnique.mockResolvedValue({ id: userId });
      mockPrismaService.post.create.mockResolvedValue({});

      await service.create(userId, dto as any);

      expect(mockPrismaService.post.create).toHaveBeenCalled();
    });

    it('should handle undefined type by defaulting to UPDATE', async () => {
      const dto = {
        subject: 'Test',
        content: 'Test content',
        type: undefined,
      };

      mockPrismaService.user.findUnique.mockResolvedValue({ id: userId });
      mockPrismaService.post.create.mockResolvedValue({});

      await service.create(userId, dto);

      expect(mockPrismaService.post.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            type: 'UPDATE',
          }),
        }),
      );
    });

    it('should coerce string pagination params to numbers', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({ id: userId });
      mockPrismaService.post.findMany.mockResolvedValue([]);
      mockPrismaService.post.count.mockResolvedValue(0);

      const result = await service.getRecentPosts(
        userId,
        '2' as any,
        '10' as any,
      );

      expect(result.pagination.page).toBe(2);
      expect(result.pagination.limit).toBe(10);
    });
  });

  describe('❌ Edge Cases: Special Characters and Unicode', () => {
    const userId = 'user-123';

    it('should handle special characters in content', async () => {
      const dto = {
        subject: 'Test <script>alert("xss")</script>',
        content: "Content with special chars: !@#$%^&*()_+ O'Brien",
      };

      mockPrismaService.user.findUnique.mockResolvedValue({ id: userId });
      mockPrismaService.post.create.mockResolvedValue({});

      await service.create(userId, dto);

      expect(mockPrismaService.post.create).toHaveBeenCalled();
    });

    it('should handle Unicode characters (emoji, Chinese, Arabic)', async () => {
      const dto = {
        subject: 'Test 你好 مرحبا 🎉',
        content: 'Content with emoji: 😀 👍 ❤️ and Unicode: 你好世界',
      };

      mockPrismaService.user.findUnique.mockResolvedValue({ id: userId });
      mockPrismaService.post.create.mockResolvedValue({});

      await service.create(userId, dto);

      expect(mockPrismaService.post.create).toHaveBeenCalled();
    });
  });

  describe('❌ Edge Cases: Boundary Values', () => {
    const userId = 'user-123';

    it('should accept content with exactly 2000 characters', async () => {
      const content = 'a'.repeat(2000);
      const dto = {
        subject: 'Test',
        content,
      };

      mockPrismaService.user.findUnique.mockResolvedValue({ id: userId });
      mockPrismaService.post.create.mockResolvedValue({});

      await service.create(userId, dto);

      expect(mockPrismaService.post.create).toHaveBeenCalled();
    });

    it('should accept subject with exactly 200 characters', async () => {
      const subject = 'a'.repeat(200);
      const dto = {
        subject,
        content: 'Test content',
      };

      mockPrismaService.user.findUnique.mockResolvedValue({ id: userId });
      mockPrismaService.post.create.mockResolvedValue({});

      await service.create(userId, dto);

      expect(mockPrismaService.post.create).toHaveBeenCalled();
    });

    it('should handle page number 1 correctly (first page)', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({ id: userId });
      mockPrismaService.post.findMany.mockResolvedValue([]);
      mockPrismaService.post.count.mockResolvedValue(0);

      const result = await service.getRecentPosts(userId, 1, 6);

      expect(result.pagination.page).toBe(1);
      expect(result.pagination.hasPrev).toBe(false);
    });

    it('should handle very large page numbers', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({ id: userId });
      mockPrismaService.post.findMany.mockResolvedValue([]);
      mockPrismaService.post.count.mockResolvedValue(10);

      const result = await service.getRecentPosts(userId, 999, 6);

      expect(result.posts).toHaveLength(0);
      expect(result.pagination.hasNext).toBe(false);
    });
  });

  describe('🔒 Security: Authorization and Data Validation', () => {
    const userId = 'user-123';

    it('should enforce user existence before creating post', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(
        service.create(userId, {
          subject: 'Test',
          content: 'Test content',
        }),
      ).rejects.toThrow(NotFoundException);

      expect(mockPrismaService.post.create).not.toHaveBeenCalled();
    });

    it('should enforce sub-community membership', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({ id: userId });
      mockPrismaService.subCommunityMember.findFirst.mockResolvedValue(null);

      await expect(
        service.create(userId, {
          subject: 'Test',
          content: 'Test content',
          subCommunityId: 'community-123',
        }),
      ).rejects.toThrow(ForbiddenException);

      expect(mockPrismaService.post.create).not.toHaveBeenCalled();
    });

    it('should validate content length to prevent DoS', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({ id: userId });

      const hugeContent = 'a'.repeat(100000);

      await expect(
        service.create(userId, {
          subject: 'Test',
          content: hugeContent,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should validate pagination limits to prevent resource exhaustion', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({ id: userId });

      await expect(service.getRecentPosts(userId, 1, 1000)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('✅ getMyCommunitiesFeed() - Aggregated Community Feed', () => {
    const userId = 'user-123';

    it('should return empty feed when user has no community memberships', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({ id: userId });
      mockPrismaService.subCommunityMember.findMany.mockResolvedValue([]);

      const result = await service.getMyCommunitiesFeed(userId, 1, 10);

      expect(result.posts).toEqual([]);
      expect(result.pagination.total).toBe(0);
      expect(result.pagination.totalPages).toBe(0);
      expect(mockPrismaService.post.findMany).not.toHaveBeenCalled();
    });

    it('should return paginated approved posts from joined communities', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({ id: userId });
      mockPrismaService.subCommunityMember.findMany.mockResolvedValue([
        { subCommunityId: 'community-1' },
        { subCommunityId: 'community-2' },
      ]);
      mockPrismaService.post.findMany.mockResolvedValue([
        { id: 'post-1', subCommunityId: 'community-1' },
      ]);
      mockPrismaService.post.count.mockResolvedValue(1);

      const result = await service.getMyCommunitiesFeed(userId, 1, 10);

      expect(mockPrismaService.post.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: PostStatus.APPROVED,
            subCommunityId: { in: ['community-1', 'community-2'] },
          }),
          orderBy: { createdAt: 'desc' },
          skip: 0,
          take: 10,
        }),
      );
      expect(result.posts).toHaveLength(1);
      expect(result.pagination.total).toBe(1);
    });

    it('should throw NotFoundException when user does not exist', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(service.getMyCommunitiesFeed(userId)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw BadRequestException for invalid pagination', async () => {
      await expect(service.getMyCommunitiesFeed(userId, 0, 10)).rejects.toThrow(
        BadRequestException,
      );
      await expect(
        service.getMyCommunitiesFeed(userId, 1, 100),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
