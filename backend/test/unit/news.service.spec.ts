import { Test, TestingModule } from '@nestjs/testing';
import { NewsService } from '../../src/news/news.service';
import { PrismaService } from '../../src/prisma/prisma.service';


describe('NewsService Unit Tests', () => {
  let service: NewsService;
  let prisma: PrismaService;

  const mockPrismaService = {
    news: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NewsService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<NewsService>(NewsService);
    prisma = module.get<PrismaService>(PrismaService);

    jest.clearAllMocks();
  });

  describe('✅ list() - News List Retrieval', () => {
    it('should return news list with default pagination', async () => {
      const mockNews = [
        { id: 'news-1', title: 'News 1', publishedAt: new Date() },
        { id: 'news-2', title: 'News 2', publishedAt: new Date() },
      ];

      mockPrismaService.news.findMany.mockResolvedValue(mockNews);

      const result = await service.list();

      expect(result).toEqual(mockNews);
      expect(prisma.news.findMany).toHaveBeenCalledWith({
        orderBy: { publishedAt: 'desc' },
        skip: 0,
        take: 20,
      });
    });

    it('should apply custom skip and take parameters', async () => {
      mockPrismaService.news.findMany.mockResolvedValue([]);

      await service.list({ skip: 10, take: 5 });

      expect(prisma.news.findMany).toHaveBeenCalledWith({
        orderBy: { publishedAt: 'desc' },
        skip: 10,
        take: 5,
      });
    });

    it('should order by publishedAt descending', async () => {
      mockPrismaService.news.findMany.mockResolvedValue([]);

      await service.list();

      expect(prisma.news.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { publishedAt: 'desc' },
        }),
      );
    });

    it('should handle empty results', async () => {
      mockPrismaService.news.findMany.mockResolvedValue([]);

      const result = await service.list();

      expect(result).toEqual([]);
    });
  });

  describe('✅ findBySlug() - News Retrieval by Slug', () => {
    it('should find news by slug', async () => {
      const mockNews = {
        id: 'news-1',
        slug: 'test-news-article',
        title: 'Test News Article',
      };

      mockPrismaService.news.findUnique.mockResolvedValue(mockNews);

      const result = await service.findBySlug('test-news-article');

      expect(result).toEqual(mockNews);
      expect(prisma.news.findUnique).toHaveBeenCalledWith({
        where: { slug: 'test-news-article' },
      });
    });

    it('should return null if news not found', async () => {
      mockPrismaService.news.findUnique.mockResolvedValue(null);

      const result = await service.findBySlug('non-existent-slug');

      expect(result).toBeNull();
    });
  });

  describe('✅ create() - News Creation with Slug Generation', () => {
    it('should create news with auto-generated slug', async () => {
      mockPrismaService.news.findUnique.mockResolvedValue(null);

      const createData = {
        title: 'New Article Title',
        content: 'Article content',
      };

      mockPrismaService.news.create.mockResolvedValue({
        id: 'news-1',
        slug: 'new-article-title',
        ...createData,
      });

      const result = await service.create(createData);

      expect(result.slug).toBe('new-article-title');
      expect(prisma.news.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          slug: 'new-article-title',
          title: 'New Article Title',
        }),
      });
    });

    it('should generate unique slug when duplicate exists', async () => {
      mockPrismaService.news.findUnique
        .mockResolvedValueOnce({ slug: 'test-article' })
        .mockResolvedValueOnce(null);

      const createData = {
        title: 'Test Article',
        content: 'Content',
      };

      mockPrismaService.news.create.mockResolvedValue({
        id: 'news-1',
        slug: 'test-article-1',
        ...createData,
      });

      await service.create(createData);

      expect(prisma.news.findUnique).toHaveBeenCalledTimes(2);
    });

    it('should normalize Unicode characters in slug', async () => {
      mockPrismaService.news.findUnique.mockResolvedValue(null);

      const createData = {
        title: 'Café São Paulo 你好',
        content: 'Content',
      };

      mockPrismaService.news.create.mockResolvedValue({
        id: 'news-1',
        slug: 'cafe-sao-paulo',
        ...createData,
      });

      await service.create(createData);

      expect(prisma.news.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          slug: expect.stringMatching(/^[a-z0-9-]+$/),
        }),
      });
    });

    it('should replace spaces with hyphens in slug', async () => {
      mockPrismaService.news.findUnique.mockResolvedValue(null);

      const createData = {
        title: 'Multi Word Title',
        content: 'Content',
      };

      mockPrismaService.news.create.mockResolvedValue({
        id: 'news-1',
        slug: 'multi-word-title',
        ...createData,
      });

      await service.create(createData);

      expect(prisma.news.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          slug: 'multi-word-title',
        }),
      });
    });

    it('should remove special characters from slug', async () => {
      mockPrismaService.news.findUnique.mockResolvedValue(null);

      const createData = {
        title: 'Title with @#$%^ special chars!',
        content: 'Content',
      };

      mockPrismaService.news.create.mockResolvedValue({
        id: 'news-1',
        slug: 'title-with-special-chars',
        ...createData,
      });

      await service.create(createData);

      expect(prisma.news.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          slug: expect.not.stringMatching(/[@#$%^!]/),
        }),
      });
    });

    it('should collapse multiple hyphens in slug', async () => {
      mockPrismaService.news.findUnique.mockResolvedValue(null);

      const createData = {
        title: 'Title   with   multiple   spaces',
        content: 'Content',
      };

      mockPrismaService.news.create.mockResolvedValue({
        id: 'news-1',
        slug: 'title-with-multiple-spaces',
        ...createData,
      });

      await service.create(createData);

      expect(prisma.news.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          slug: expect.not.stringMatching(/--/),
        }),
      });
    });

    it('should trim leading and trailing hyphens', async () => {
      mockPrismaService.news.findUnique.mockResolvedValue(null);

      const createData = {
        title: '---Title---',
        content: 'Content',
      };

      mockPrismaService.news.create.mockResolvedValue({
        id: 'news-1',
        slug: 'title',
        ...createData,
      });

      await service.create(createData);

      expect(prisma.news.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          slug: 'title',
        }),
      });
    });
  });

  describe('✅ update() - News Update Logic', () => {
    it('should update news by ID', async () => {
      const updateData = {
        title: 'Updated Title',
        content: 'Updated Content',
      };

      mockPrismaService.news.update.mockResolvedValue({
        id: 'news-1',
        ...updateData,
      });

      const result = await service.update('news-1', updateData);

      expect(result.title).toBe('Updated Title');
      expect(prisma.news.update).toHaveBeenCalledWith({
        where: { id: 'news-1' },
        data: updateData,
      });
    });

    it('should allow partial updates', async () => {
      const updateData = {
        content: 'Only content updated',
      };

      mockPrismaService.news.update.mockResolvedValue({
        id: 'news-1',
        title: 'Original Title',
        ...updateData,
      });

      await service.update('news-1', updateData);

      expect(prisma.news.update).toHaveBeenCalledWith({
        where: { id: 'news-1' },
        data: updateData,
      });
    });
  });

  describe('✅ remove() - News Deletion Logic', () => {
    it('should delete news by ID', async () => {
      mockPrismaService.news.delete.mockResolvedValue({
        id: 'news-1',
        title: 'Deleted News',
      });

      const result = await service.remove('news-1');

      expect(result.id).toBe('news-1');
      expect(prisma.news.delete).toHaveBeenCalledWith({
        where: { id: 'news-1' },
      });
    });
  });

  describe('❌ Edge Cases: Null and Empty Values', () => {
    it('should handle empty title for slug generation', async () => {
      mockPrismaService.news.create.mockResolvedValue({
        id: 'news-1',
        title: '',
        slug: undefined,
      });

      await service.create({ title: '', content: 'Content' });

      expect(prisma.news.create).toHaveBeenCalled();
    });

    it('should handle null in findBySlug', async () => {
      mockPrismaService.news.findUnique.mockResolvedValue(null);

      const result = await service.findBySlug('non-existent');

      expect(result).toBeNull();
    });

    it('should handle empty list results', async () => {
      mockPrismaService.news.findMany.mockResolvedValue([]);

      const result = await service.list();

      expect(result).toEqual([]);
      expect(result.length).toBe(0);
    });
  });

  describe('❌ Edge Cases: Special Characters and Unicode', () => {
    it('should handle emojis in title slugification', async () => {
      mockPrismaService.news.findUnique.mockResolvedValue(null);

      const createData = {
        title: 'Breaking News 🔥 🚀 🎉',
        content: 'Content',
      };

      mockPrismaService.news.create.mockResolvedValue({
        id: 'news-1',
        slug: 'breaking-news',
        ...createData,
      });

      await service.create(createData);

      expect(prisma.news.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          slug: expect.stringMatching(/^[a-z0-9-]+$/),
        }),
      });
    });

    it('should handle Chinese characters in title', async () => {
      mockPrismaService.news.findUnique.mockResolvedValue(null);

      const createData = {
        title: '新闻标题 News Title',
        content: 'Content',
      };

      mockPrismaService.news.create.mockResolvedValue({
        id: 'news-1',
        slug: 'news-title',
        ...createData,
      });

      await service.create(createData);

      expect(prisma.news.create).toHaveBeenCalled();
    });

    it('should handle Arabic characters in title', async () => {
      mockPrismaService.news.findUnique.mockResolvedValue(null);

      const createData = {
        title: 'عنوان الأخبار News Title',
        content: 'Content',
      };

      mockPrismaService.news.create.mockResolvedValue({
        id: 'news-1',
        slug: 'news-title',
        ...createData,
      });

      await service.create(createData);

      expect(prisma.news.create).toHaveBeenCalled();
    });
  });

  describe('❌ Edge Cases: Boundary Values', () => {
    it('should handle very long title (200+ chars)', async () => {
      mockPrismaService.news.findUnique.mockResolvedValue(null);

      const longTitle = 'A'.repeat(250);

      mockPrismaService.news.create.mockResolvedValue({
        id: 'news-1',
        slug: 'a'.repeat(250),
        title: longTitle,
      });

      await service.create({ title: longTitle, content: 'Content' });

      expect(prisma.news.create).toHaveBeenCalled();
    });

    it('should handle pagination with large skip value', async () => {
      mockPrismaService.news.findMany.mockResolvedValue([]);

      await service.list({ skip: 10000, take: 20 });

      expect(prisma.news.findMany).toHaveBeenCalledWith({
        orderBy: { publishedAt: 'desc' },
        skip: 10000,
        take: 20,
      });
    });

    it('should handle pagination with zero take', async () => {
      mockPrismaService.news.findMany.mockResolvedValue([]);

      await service.list({ skip: 0, take: 0 });

      expect(prisma.news.findMany).toHaveBeenCalledWith({
        orderBy: { publishedAt: 'desc' },
        skip: 0,
        take: 0,
      });
    });
  });

  describe('🔒 Security: Data Validation', () => {
    it('should sanitize slug to prevent path traversal', async () => {
      mockPrismaService.news.findUnique.mockResolvedValue(null);

      const createData = {
        title: '../../../etc/passwd',
        content: 'Content',
      };

      mockPrismaService.news.create.mockResolvedValue({
        id: 'news-1',
        slug: 'etcpasswd',
        ...createData,
      });

      await service.create(createData);

      expect(prisma.news.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          slug: expect.not.stringMatching(/\.\./),
        }),
      });
    });

    it('should sanitize slug to prevent XSS attempts', async () => {
      mockPrismaService.news.findUnique.mockResolvedValue(null);

      const createData = {
        title: '<script>alert("xss")</script>',
        content: 'Content',
      };

      mockPrismaService.news.create.mockResolvedValue({
        id: 'news-1',
        slug: 'scriptalertxssscript',
        ...createData,
      });

      await service.create(createData);

      expect(prisma.news.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          slug: expect.not.stringMatching(/<|>/),
        }),
      });
    });

    it('should sanitize slug to prevent SQL injection patterns', async () => {
      mockPrismaService.news.findUnique.mockResolvedValue(null);

      const createData = {
        title: "'; DROP TABLE news;--",
        content: 'Content',
      };

      mockPrismaService.news.create.mockResolvedValue({
        id: 'news-1',
        slug: 'drop-table-news',
        ...createData,
      });

      await service.create(createData);

      expect(prisma.news.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          slug: expect.not.stringMatching(/;|'/),
        }),
      });
    });
  });
});
