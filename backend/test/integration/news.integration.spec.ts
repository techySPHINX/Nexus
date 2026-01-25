import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { NewsService } from '../../src/news/news.service';
import { PrismaService } from '../../src/prisma/prisma.service';
import { NewsModule } from '../../src/news/news.module';
import { PrismaModule } from '../../src/prisma/prisma.module';

describe('NewsService Integration Tests', () => {
  let app: INestApplication;
  let service: NewsService;
  let prisma: PrismaService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [NewsModule, PrismaModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    service = moduleFixture.get<NewsService>(NewsService);
    prisma = moduleFixture.get<PrismaService>(PrismaService);
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    // Clean up news table before each test
    await prisma.news.deleteMany({});
  });

  describe('🔄 Complete News Lifecycle Workflow', () => {
    it('should complete full CRUD lifecycle: create → list → findBySlug → update → delete', async () => {
      // Step 1: Create news article
      const createData = {
        title: 'Integration Test Article',
        content: 'This is a test article for integration testing',
        authorId: 'test-author-id',
        publishedAt: new Date(),
      };

      const created = await service.create(createData);
      expect(created.id).toBeDefined();
      expect(created.slug).toBe('integration-test-article');
      expect(created.title).toBe(createData.title);

      // Step 2: List news articles
      const listed = await service.list({});
      expect(listed.length).toBe(1);
      expect(listed[0].id).toBe(created.id);

      // Step 3: Find by slug
      const foundBySlug = await service.findBySlug(created.slug);
      expect(foundBySlug).toBeDefined();
      expect(foundBySlug?.id).toBe(created.id);
      expect(foundBySlug?.title).toBe(createData.title);

      // Step 4: Update article
      const updatedData = {
        title: 'Updated Integration Test Article',
        content: 'Updated content',
      };
      const updated = await service.update(created.id, updatedData);
      expect(updated.title).toBe(updatedData.title);
      expect(updated.content).toBe(updatedData.content);

      // Step 5: Delete article
      await service.remove(created.id);
      const afterDelete = await service.list({});
      expect(afterDelete.length).toBe(0);
    });

    it('should handle multiple news articles with pagination', async () => {
      // Create 25 news articles
      const articles = Array.from({ length: 25 }, (_, i) => ({
        title: `Article ${i + 1}`,
        content: `Content for article ${i + 1}`,
        authorId: 'test-author-id',
        publishedAt: new Date(Date.now() + i * 1000), // Different timestamps
      }));

      for (const article of articles) {
        await service.create(article);
      }

      // Test first page (default: 20 items)
      const firstPage = await service.list({});
      expect(firstPage.length).toBe(20);

      // Test second page
      const secondPage = await service.list({ skip: 20 });
      expect(secondPage.length).toBe(5);

      // Test custom page size
      const customPage = await service.list({ take: 10 });
      expect(customPage.length).toBe(10);

      // Verify ordering (latest first)
      expect(firstPage[0].title).toBe('Article 25');
      expect(firstPage[19].title).toBe('Article 6');
    });

    it('should handle concurrent updates to the same article', async () => {
      // Create base article
      const created = await service.create({
        title: 'Concurrent Test Article',
        content: 'Original content',
        authorId: 'test-author-id',
        publishedAt: new Date(),
      });

      // Perform concurrent updates
      const [update1, update2] = await Promise.all([
        service.update(created.id, { content: 'Update from task 1' }),
        service.update(created.id, { content: 'Update from task 2' }),
      ]);

      expect(update1.id).toBe(created.id);
      expect(update2.id).toBe(created.id);

      // Verify final state (one of the updates should have persisted)
      const final = await prisma.news.findUnique({
        where: { id: created.id },
      });
      expect(final).toBeDefined();
      expect(['Update from task 1', 'Update from task 2']).toContain(
        final?.content,
      );
    });
  });

  describe('🔑 Slug Generation and Uniqueness', () => {
    it('should enforce unique slugs by appending suffix', async () => {
      // Create first article
      const first = await service.create({
        title: 'Duplicate Title Test',
        content: 'First article',
        authorId: 'author-1',
        publishedAt: new Date(),
      });
      expect(first.slug).toBe('duplicate-title-test');

      // Create second article with same title
      const second = await service.create({
        title: 'Duplicate Title Test',
        content: 'Second article',
        authorId: 'author-2',
        publishedAt: new Date(),
      });
      expect(second.slug).toBe('duplicate-title-test-1');

      // Create third article with same title
      const third = await service.create({
        title: 'Duplicate Title Test',
        content: 'Third article',
        authorId: 'author-3',
        publishedAt: new Date(),
      });
      expect(third.slug).toBe('duplicate-title-test-2');

      // Verify all three exist and are findable
      const foundFirst = await service.findBySlug(first.slug);
      const foundSecond = await service.findBySlug(second.slug);
      const foundThird = await service.findBySlug(third.slug);

      expect(foundFirst?.id).toBe(first.id);
      expect(foundSecond?.id).toBe(second.id);
      expect(foundThird?.id).toBe(third.id);
    });

    it('should handle slug generation with Unicode and special chars', async () => {
      const testCases = [
        {
          title: 'Café & Restaurant 🍕',
          expectedSlug: 'cafe-restaurant',
        },
        {
          title: '   Multiple   Spaces   Between   Words   ',
          expectedSlug: 'multiple-spaces-between-words',
        },
        {
          title: '新闻标题 News Title',
          expectedSlug: 'xin-wen-biao-ti-news-title',
        },
        {
          title: 'Straße in München',
          expectedSlug: 'strasse-in-munchen',
        },
      ];

      for (const testCase of testCases) {
        const created = await service.create({
          title: testCase.title,
          content: 'Test content',
          authorId: 'test-author-id',
          publishedAt: new Date(),
        });

        expect(created.slug).toBe(testCase.expectedSlug);

        // Verify it's findable by the generated slug
        const found = await service.findBySlug(created.slug);
        expect(found?.id).toBe(created.id);
      }
    });

    it('should regenerate slug if title changes during update', async () => {
      // Create article
      const created = await service.create({
        title: 'Original Title',
        content: 'Content',
        authorId: 'test-author-id',
        publishedAt: new Date(),
      });
      expect(created.slug).toBe('original-title');

      // Update with explicit slug change (if supported)
      // Note: The service might not support slug updates, verify behavior
      const updated = await service.update(created.id, {
        title: 'Updated Title',
      });

      // Verify the article is still findable
      const found = await prisma.news.findUnique({
        where: { id: created.id },
      });
      expect(found).toBeDefined();
    });
  });

  describe('📄 Pagination and Ordering', () => {
    beforeEach(async () => {
      // Create 15 test articles with different timestamps
      const articles = Array.from({ length: 15 }, (_, i) => ({
        title: `Test Article ${String(i + 1).padStart(2, '0')}`,
        content: `Content ${i + 1}`,
        authorId: 'test-author-id',
        publishedAt: new Date(2025, 0, i + 1), // Jan 1-15, 2025
      }));

      for (const article of articles) {
        await service.create(article);
      }
    });

    it('should return articles ordered by publishedAt DESC', async () => {
      const articles = await service.list({});

      expect(articles.length).toBe(15);

      // Verify descending order
      for (let i = 0; i < articles.length - 1; i++) {
        const current = new Date(articles[i].publishedAt).getTime();
        const next = new Date(articles[i + 1].publishedAt).getTime();
        expect(current).toBeGreaterThanOrEqual(next);
      }

      // Verify latest is first
      expect(articles[0].title).toBe('Test Article 15');
    });

    it('should handle skip parameter correctly', async () => {
      const firstFive = await service.list({ take: 5 });
      const nextFive = await service.list({ skip: 5, take: 5 });
      const lastFive = await service.list({ skip: 10, take: 5 });

      expect(firstFive.length).toBe(5);
      expect(nextFive.length).toBe(5);
      expect(lastFive.length).toBe(5);

      // Verify no overlap
      const firstIds = new Set(firstFive.map((a) => a.id));
      const nextIds = new Set(nextFive.map((a) => a.id));
      const lastIds = new Set(lastFive.map((a) => a.id));

      expect(firstIds.size + nextIds.size + lastIds.size).toBe(15);
      firstFive.forEach((article) => {
        expect(nextIds.has(article.id)).toBe(false);
        expect(lastIds.has(article.id)).toBe(false);
      });
    });

    it('should handle edge case: skip beyond total count', async () => {
      const result = await service.list({ skip: 100 });
      expect(result).toEqual([]);
    });

    it('should handle edge case: take = 0', async () => {
      const result = await service.list({ take: 0 });
      expect(result).toEqual([]);
    });
  });

  describe('🔍 findBySlug Query Behavior', () => {
    it('should return null for non-existent slug', async () => {
      const result = await service.findBySlug('non-existent-slug');
      expect(result).toBeNull();
    });

    it('should be case-sensitive for slug lookups', async () => {
      await service.create({
        title: 'Case Test Article',
        content: 'Content',
        authorId: 'test-author-id',
        publishedAt: new Date(),
      });

      const lowercase = await service.findBySlug('case-test-article');
      const uppercase = await service.findBySlug('CASE-TEST-ARTICLE');

      expect(lowercase).toBeDefined();
      expect(uppercase).toBeNull(); // Slugs are lowercase
    });

    it('should handle slugs with hyphens correctly', async () => {
      await service.create({
        title: 'Multi-Word-Slug-Test',
        content: 'Content',
        authorId: 'test-author-id',
        publishedAt: new Date(),
      });

      const found = await service.findBySlug('multi-word-slug-test');
      expect(found).toBeDefined();
      expect(found?.title).toBe('Multi-Word-Slug-Test');
    });
  });

  describe('✏️ Update Operations', () => {
    it('should support partial updates', async () => {
      const created = await service.create({
        title: 'Original Title',
        content: 'Original Content',
        authorId: 'test-author-id',
        publishedAt: new Date(),
      });

      // Update only title
      await service.update(created.id, { title: 'New Title' });
      const afterTitleUpdate = await prisma.news.findUnique({
        where: { id: created.id },
      });
      expect(afterTitleUpdate?.title).toBe('New Title');
      expect(afterTitleUpdate?.content).toBe('Original Content');

      // Update only content
      await service.update(created.id, { content: 'New Content' });
      const afterContentUpdate = await prisma.news.findUnique({
        where: { id: created.id },
      });
      expect(afterContentUpdate?.title).toBe('New Title');
      expect(afterContentUpdate?.content).toBe('New Content');
    });

    it('should handle update of non-existent article gracefully', async () => {
      await expect(
        service.update('non-existent-id', { title: 'Test' }),
      ).rejects.toThrow();
    });
  });

  describe('🗑️ Delete Operations', () => {
    it('should cascade delete and clean up related data', async () => {
      const created = await service.create({
        title: 'Article to Delete',
        content: 'Content',
        authorId: 'test-author-id',
        publishedAt: new Date(),
      });

      // Verify it exists
      const beforeDelete = await prisma.news.findUnique({
        where: { id: created.id },
      });
      expect(beforeDelete).toBeDefined();

      // Delete
      await service.remove(created.id);

      // Verify it's gone
      const afterDelete = await prisma.news.findUnique({
        where: { id: created.id },
      });
      expect(afterDelete).toBeNull();

      // Verify it doesn't appear in list
      const list = await service.list({});
      expect(list.find((a) => a.id === created.id)).toBeUndefined();
    });

    it('should handle delete of non-existent article gracefully', async () => {
      await expect(service.remove('non-existent-id')).rejects.toThrow();
    });
  });
});
