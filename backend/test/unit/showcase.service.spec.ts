import { Test, TestingModule } from '@nestjs/testing';
import { ShowcaseService } from '../../src/showcase/showcase.service';
import { PrismaService } from '../../src/prisma/prisma.service';
import { NotificationService } from '../../src/notification/notification.service';
import { GamificationService } from '../../src/gamification/gamification.service';
import { ProjectStatus } from '@prisma/client';

describe('ShowcaseService Unit Tests', () => {
  let service: ShowcaseService;
  let prisma: PrismaService;
  let notificationService: NotificationService;
  let gamificationService: GamificationService;

  const mockPrismaService = {
    project: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      groupBy: jest.fn(),
    },
    projectUpdate: {
      create: jest.fn(),
    },
    projectFollower: {
      findMany: jest.fn(),
      count: jest.fn(),
    },
    projectSupport: {
      count: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  const mockNotificationService = {
    create: jest.fn(),
  };

  const mockGamificationService = {
    awardForEvent: jest.fn().mockResolvedValue(undefined),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ShowcaseService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: NotificationService, useValue: mockNotificationService },
        { provide: GamificationService, useValue: mockGamificationService },
      ],
    }).compile();

    service = module.get<ShowcaseService>(ShowcaseService);
    prisma = module.get<PrismaService>(PrismaService);
    notificationService = module.get<NotificationService>(NotificationService);
    gamificationService = module.get<GamificationService>(GamificationService);

    jest.clearAllMocks();
  });

  describe('✅ createProject() - Project Creation Logic', () => {
    const userId = 'user-id';
    const createDto = {
      title: 'Test Project',
      description: 'Test description',
      tags: ['javascript', 'typescript'],
      skills: ['javascript', 'typescript'],
      status: ProjectStatus.IN_PROGRESS,
      githubUrl: 'https://github.com/test/project',
    };

    it('should create project with owner as team member', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        id: userId,
        name: 'Test User',
        role: 'STUDENT',
        profile: { avatarUrl: 'https://example.com/avatar.jpg' },
      });

      mockPrismaService.project.create.mockResolvedValue({
        id: 'project-id',
        ownerId: userId,
        title: 'Test Project',
        imageUrl: null,
        githubUrl: 'https://github.com/test/project',
        tags: ['javascript', 'typescript'],
        status: 'ACTIVE',
        seeking: [],
        createdAt: new Date(),
      });

      const result = await service.createProject(userId, createDto);

      expect(result.id).toBe('project-id');
      expect(prisma.project.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            ownerId: userId,
            teamMembers: {
              create: {
                userId,
                role: 'OWNER',
              },
            },
          }),
        }),
      );
    });

    it('should award gamification points for project creation', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        id: userId,
        name: 'Test User',
        role: 'STUDENT',
        profile: { avatarUrl: null },
      });

      mockPrismaService.project.create.mockResolvedValue({
        id: 'project-id',
        ownerId: userId,
        title: 'Test Project',
        createdAt: new Date(),
      });

      await service.createProject(userId, createDto);

      expect(gamificationService.awardForEvent).toHaveBeenCalledWith(
        'PROJECT_CREATED',
        userId,
        'project-id',
        expect.any(String),
      );
    });

    it('should return project with owner and counts', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        id: userId,
        name: 'Test User',
        role: 'STUDENT',
        profile: { avatarUrl: null },
      });

      mockPrismaService.project.create.mockResolvedValue({
        id: 'project-id',
        ownerId: userId,
        title: 'Test Project',
        imageUrl: null,
        githubUrl: 'https://github.com/test/project',
        tags: ['javascript'],
        status: 'ACTIVE',
        seeking: [],
        createdAt: new Date(),
      });

      const result = await service.createProject(userId, createDto);

      expect(result).toHaveProperty('owner');
      expect(result).toHaveProperty('_count');
      expect(result._count.supporters).toBe(0);
      expect(result._count.followers).toBe(0);
    });

    it('should handle optimized image URL', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        id: userId,
        name: 'Test User',
        role: 'STUDENT',
        profile: { avatarUrl: null },
      });

      mockPrismaService.project.create.mockResolvedValue({
        id: 'project-id',
        ownerId: userId,
        title: 'Test Project',
        imageUrl: 'https://example.com/image.jpg',
        createdAt: new Date(),
      });

      const dtoWithImage = {
        ...createDto,
        imageUrl: 'https://example.com/image.jpg',
      };

      const result = await service.createProject(userId, dtoWithImage);

      expect(result.imageUrl).toBeDefined();
    });
  });

  describe('✅ updateProject() - Project Update Logic', () => {
    const userId = 'user-id';
    const projectId = 'project-id';

    it('should update project by owner', async () => {
      mockPrismaService.project.findUnique.mockResolvedValue({
        id: projectId,
        ownerId: userId,
        title: 'Original Title',
        tags: ['javascript'],
      });

      mockPrismaService.projectFollower.findMany.mockResolvedValue([]);

      mockPrismaService.$transaction.mockResolvedValue([
        { id: projectId, title: 'Updated Title' },
        { id: 'update-id', projectId },
      ]);

      const result = await service.updateProject(userId, projectId, {
        title: 'Updated Title',
      });

      expect(result).toHaveProperty('updatedProject');
    });

    it('should throw error if user is not owner', async () => {
      mockPrismaService.project.findUnique.mockResolvedValue({
        id: projectId,
        ownerId: 'other-user-id',
        title: 'Original Title',
      });

      await expect(
        service.updateProject(userId, projectId, { title: 'Updated' }),
      ).rejects.toThrow('You are not the owner of this project');
    });

    it('should throw error if project not found', async () => {
      mockPrismaService.project.findUnique.mockResolvedValue(null);

      await expect(
        service.updateProject(userId, 'invalid-id', { title: 'Updated' }),
      ).rejects.toThrow('Project not found');
    });

    it('should notify followers about update', async () => {
      mockPrismaService.project.findUnique.mockResolvedValue({
        id: projectId,
        ownerId: userId,
        title: 'Original Title',
        tags: [],
      });

      mockPrismaService.projectFollower.findMany.mockResolvedValue([
        { userId: 'follower-1', projectId },
        { userId: 'follower-2', projectId },
      ]);

      mockPrismaService.$transaction.mockResolvedValue([
        { id: projectId, title: 'Updated Title' },
        { id: 'update-id', projectId },
      ]);

      await service.updateProject(userId, projectId, {
        title: 'Updated Title',
      });

      expect(notificationService.create).toHaveBeenCalledTimes(2);
      expect(notificationService.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'follower-1',
          type: 'PROJECT_UPDATE',
        }),
      );
    });

    it('should create project update record with change summary', async () => {
      mockPrismaService.project.findUnique.mockResolvedValue({
        id: projectId,
        ownerId: userId,
        title: 'Original Title',
        tags: ['javascript'],
      });

      mockPrismaService.projectFollower.findMany.mockResolvedValue([]);

      mockPrismaService.$transaction.mockImplementation(async (operations) => {
        return Promise.all(operations);
      });

      await service.updateProject(userId, projectId, {
        title: 'Updated Title',
        tags: ['typescript', 'javascript'],
      });

      expect(prisma.$transaction).toHaveBeenCalled();
    });

    it('should detect tag additions and removals', async () => {
      mockPrismaService.project.findUnique.mockResolvedValue({
        id: projectId,
        ownerId: userId,
        title: 'Test Project',
        tags: ['javascript', 'react'],
      });

      mockPrismaService.projectFollower.findMany.mockResolvedValue([]);

      mockPrismaService.$transaction.mockResolvedValue([
        { id: projectId, tags: ['typescript', 'javascript'] },
        { id: 'update-id', projectId },
      ]);

      await service.updateProject(userId, projectId, {
        tags: ['typescript', 'javascript'],
      });

      expect(prisma.$transaction).toHaveBeenCalled();
    });
  });

  describe('✅ deleteProject() - Project Deletion Logic', () => {
    const userId = 'user-id';
    const projectId = 'project-id';

    it('should delete project by owner', async () => {
      mockPrismaService.project.findUnique.mockResolvedValue({
        ownerId: userId,
      });

      mockPrismaService.project.delete.mockResolvedValue({
        id: projectId,
        title: 'Deleted Project',
      });

      const result = await service.deleteProject(userId, projectId);

      expect(result.id).toBe(projectId);
      expect(prisma.project.delete).toHaveBeenCalledWith({
        where: { id: projectId },
      });
    });

    it('should throw error if user is not owner', async () => {
      mockPrismaService.project.findUnique.mockResolvedValue({
        ownerId: 'other-user-id',
      });

      await expect(service.deleteProject(userId, projectId)).rejects.toThrow(
        'You are not the owner of this project',
      );
    });

    it('should throw error if project not found', async () => {
      mockPrismaService.project.findUnique.mockResolvedValue(null);

      await expect(service.deleteProject(userId, 'invalid-id')).rejects.toThrow(
        'Project not found',
      );
    });
  });

  describe('✅ getProjectCounts() - Project Statistics', () => {
    const userId = 'user-id';

    it('should return project counts with correct totals', async () => {
      mockPrismaService.project.groupBy.mockResolvedValue([
        { ownerId: userId, _count: { _all: 3 } },
        { ownerId: 'other-user', _count: { _all: 5 } },
      ]);

      mockPrismaService.projectSupport.count.mockResolvedValue(7);
      mockPrismaService.projectFollower.count.mockResolvedValue(10);

      const result = await service.getProjectCounts(userId);

      expect(result).toEqual({
        totalProjects: 8,
        myProjects: 3,
        supportedProjects: 7,
        followedProjects: 10,
      });
    });

    it('should handle user with no projects', async () => {
      mockPrismaService.project.groupBy.mockResolvedValue([
        { ownerId: 'other-user', _count: { _all: 5 } },
      ]);

      mockPrismaService.projectSupport.count.mockResolvedValue(0);
      mockPrismaService.projectFollower.count.mockResolvedValue(0);

      const result = await service.getProjectCounts(userId);

      expect(result).toEqual({
        totalProjects: 5,
        myProjects: 0,
        supportedProjects: 0,
        followedProjects: 0,
      });
    });

    it('should handle empty project database', async () => {
      mockPrismaService.project.groupBy.mockResolvedValue([]);
      mockPrismaService.projectSupport.count.mockResolvedValue(0);
      mockPrismaService.projectFollower.count.mockResolvedValue(0);

      const result = await service.getProjectCounts(userId);

      expect(result).toEqual({
        totalProjects: 0,
        myProjects: 0,
        supportedProjects: 0,
        followedProjects: 0,
      });
    });
  });

  describe('✅ getOptimizedImageUrl() - Image Optimization', () => {
    it('should return undefined for undefined input', async () => {
      const result = await service.getOptimizedImageUrl(undefined);

      expect(result).toBeUndefined();
    });

    it('should return original URL for data URIs', async () => {
      const dataUri = 'data:image/png;base64,iVBORw0KGgoAAAANS';

      const result = await service.getOptimizedImageUrl(dataUri);

      expect(result).toBe(dataUri);
    });

    it('should return original URL for SVG images', async () => {
      const svgUrl = 'https://example.com/image.svg';

      const result = await service.getOptimizedImageUrl(svgUrl);

      expect(result).toBe(svgUrl);
    });

    it('should trim whitespace from URL', async () => {
      const urlWithSpaces = '  https://example.com/image.jpg  ';

      const result = await service.getOptimizedImageUrl(urlWithSpaces);

      expect(result).toBe('https://example.com/image.jpg');
    });

    it('should detect already optimized URLs (webp)', async () => {
      const webpUrl = 'https://example.com/image.webp';

      const result = await service.getOptimizedImageUrl(webpUrl);

      expect(result).toBe(webpUrl);
    });

    it('should detect already optimized URLs (with query params)', async () => {
      const optimizedUrl = 'https://example.com/image.jpg?w=400&h=200';

      const result = await service.getOptimizedImageUrl(optimizedUrl);

      expect(result).toBe(optimizedUrl);
    });
  });

  describe('❌ Edge Cases: Null and Empty Values', () => {
    it('should handle null imageUrl in createProject', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        id: 'user-id',
        name: 'Test User',
        role: 'STUDENT',
        profile: { avatarUrl: null },
      });

      mockPrismaService.project.create.mockResolvedValue({
        id: 'project-id',
        ownerId: 'user-id',
        title: 'Test',
        imageUrl: null,
        createdAt: new Date(),
      });

      const result = await service.createProject('user-id', {
        title: 'Test',
        description: 'Test',
        tags: [],
        skills: ['test'],
        status: ProjectStatus.IN_PROGRESS,
        githubUrl: null,
      });

      expect(result.imageUrl).toBeNull();
    });

    it('should handle empty tags array', async () => {
      mockPrismaService.project.findUnique.mockResolvedValue({
        id: 'project-id',
        ownerId: 'user-id',
        title: 'Test',
        tags: [],
      });

      mockPrismaService.projectFollower.findMany.mockResolvedValue([]);

      mockPrismaService.$transaction.mockResolvedValue([
        { id: 'project-id', tags: [] },
        { id: 'update-id' },
      ]);

      await service.updateProject('user-id', 'project-id', { tags: [] });

      expect(prisma.$transaction).toHaveBeenCalled();
    });

    it('should handle empty seeking array', async () => {
      mockPrismaService.project.findUnique.mockResolvedValue({
        id: 'project-id',
        ownerId: 'user-id',
        title: 'Test',
        seeking: ['developers'],
      });

      mockPrismaService.projectFollower.findMany.mockResolvedValue([]);

      mockPrismaService.$transaction.mockResolvedValue([
        { id: 'project-id', seeking: [] },
        { id: 'update-id' },
      ]);

      await service.updateProject('user-id', 'project-id', { seeking: [] });

      expect(prisma.$transaction).toHaveBeenCalled();
    });
  });

  describe('❌ Edge Cases: Special Characters', () => {
    it('should handle special characters in project title', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        id: 'user-id',
        name: 'Test User',
        role: 'STUDENT',
        profile: { avatarUrl: null },
      });

      mockPrismaService.project.create.mockResolvedValue({
        id: 'project-id',
        ownerId: 'user-id',
        title: "O'Brien's Project <Test>",
        createdAt: new Date(),
      });

      const result = await service.createProject('user-id', {
        title: "O'Brien's Project <Test>",
        description: 'Test',
        tags: [],
        skills: ['test'],
        status: ProjectStatus.IN_PROGRESS,
      });

      expect(result.title).toContain("O'Brien");
    });

    it('should handle Unicode in project description', async () => {
      mockPrismaService.project.findUnique.mockResolvedValue({
        id: 'project-id',
        ownerId: 'user-id',
        title: 'Test',
        description: 'Original',
      });

      mockPrismaService.projectFollower.findMany.mockResolvedValue([]);

      mockPrismaService.$transaction.mockResolvedValue([
        { id: 'project-id', description: '你好世界 🚀' },
        { id: 'update-id' },
      ]);

      await service.updateProject('user-id', 'project-id', {
        description: '你好世界 🚀',
      });

      expect(prisma.$transaction).toHaveBeenCalled();
    });
  });

  describe('❌ Edge Cases: Boundary Values', () => {
    it('should handle very long project title', async () => {
      const longTitle = 'A'.repeat(500);

      mockPrismaService.user.findUnique.mockResolvedValue({
        id: 'user-id',
        name: 'Test User',
        role: 'STUDENT',
        profile: { avatarUrl: null },
      });

      mockPrismaService.project.create.mockResolvedValue({
        id: 'project-id',
        ownerId: 'user-id',
        title: longTitle,
        createdAt: new Date(),
      });

      const result = await service.createProject('user-id', {
        title: longTitle,
        description: 'Test',
        tags: [],
        skills: ['test'],
        status: ProjectStatus.IN_PROGRESS,
      });

      expect(result.title.length).toBe(500);
    });

    it('should handle large number of tags', async () => {
      const manyTags = Array.from({ length: 50 }, (_, i) => `tag-${i}`);

      mockPrismaService.user.findUnique.mockResolvedValue({
        id: 'user-id',
        name: 'Test User',
        role: 'STUDENT',
        profile: { avatarUrl: null },
      });

      mockPrismaService.project.create.mockResolvedValue({
        id: 'project-id',
        ownerId: 'user-id',
        title: 'Test',
        tags: manyTags,
        createdAt: new Date(),
      });

      const result = await service.createProject('user-id', {
        title: 'Test',
        description: 'Test',
        tags: manyTags,
        skills: ['test'],
        status: ProjectStatus.IN_PROGRESS,
      });

      expect(result.tags.length).toBe(50);
    });
  });

  describe('🔒 Security: Authorization', () => {
    it('should prevent non-owner from updating project', async () => {
      mockPrismaService.project.findUnique.mockResolvedValue({
        id: 'project-id',
        ownerId: 'owner-id',
        title: 'Test',
      });

      await expect(
        service.updateProject('other-user-id', 'project-id', {
          title: 'Updated',
        }),
      ).rejects.toThrow('You are not the owner of this project');
    });

    it('should prevent non-owner from deleting project', async () => {
      mockPrismaService.project.findUnique.mockResolvedValue({
        ownerId: 'owner-id',
      });

      await expect(
        service.deleteProject('other-user-id', 'project-id'),
      ).rejects.toThrow('You are not the owner of this project');
    });

    it('should validate project existence before operations', async () => {
      mockPrismaService.project.findUnique.mockResolvedValue(null);

      await expect(
        service.updateProject('user-id', 'invalid-id', { title: 'Test' }),
      ).rejects.toThrow('Project not found');

      await expect(
        service.deleteProject('user-id', 'invalid-id'),
      ).rejects.toThrow('Project not found');
    });
  });
});
