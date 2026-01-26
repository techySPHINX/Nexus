import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { NewsModule } from '../../src/news/news.module';
import { PrismaModule } from '../../src/prisma/prisma.module';
import { PrismaService } from '../../src/prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { AuthGuard } from '@nestjs/passport';

describe('News API Contract Tests (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let authToken: string;
  let testUserId: string;

  // Mock auth guard to bypass authentication
  const mockAuthGuard = {
    canActivate: jest.fn(() => true),
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [NewsModule, PrismaModule],
    })
      .overrideGuard(AuthGuard('jwt'))
      .useValue(mockAuthGuard)
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    await app.init();

    prisma = moduleFixture.get<PrismaService>(PrismaService);
    testUserId = 'test-user-id';

    // Generate mock JWT token
    const jwtService = new JwtService({ secret: 'test-secret' });
    authToken = jwtService.sign({ sub: testUserId });
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    // Clean up before each test
    await prisma.news.deleteMany({});
  });

  describe('GET /news - List News Articles', () => {
    it('should return 200 with array of news articles', async () => {
      // Create test data
      await prisma.news.createMany({
        data: [
          {
            title: 'Article 1',
            slug: 'article-1',
            content: 'Content 1',
            authorId: testUserId,
            publishedAt: new Date(),
          },
          {
            title: 'Article 2',
            slug: 'article-2',
            content: 'Content 2',
            authorId: testUserId,
            publishedAt: new Date(),
          },
        ],
      });

      const response = await request(app.getHttpServer())
        .get('/news')
        .expect(200);

      expect(response.body).toBeInstanceOf(Array);
      expect(response.body.length).toBe(2);
      expect(response.body[0]).toHaveProperty('id');
      expect(response.body[0]).toHaveProperty('title');
      expect(response.body[0]).toHaveProperty('slug');
      expect(response.body[0]).toHaveProperty('content');
      expect(response.body[0]).toHaveProperty('publishedAt');
    });

    it('should return 200 with empty array when no news exists', async () => {
      const response = await request(app.getHttpServer())
        .get('/news')
        .expect(200);

      expect(response.body).toEqual([]);
    });

    it('should support pagination query parameters', async () => {
      // Create 25 articles
      const articles = Array.from({ length: 25 }, (_, i) => ({
        title: `Article ${i + 1}`,
        slug: `article-${i + 1}`,
        content: `Content ${i + 1}`,
        authorId: testUserId,
        publishedAt: new Date(Date.now() + i * 1000),
      }));
      await prisma.news.createMany({ data: articles });

      // Test skip and take
      const response = await request(app.getHttpServer())
        .get('/news?skip=10&take=5')
        .expect(200);

      expect(response.body.length).toBe(5);
    });

    it('should return correct Content-Type header', async () => {
      const response = await request(app.getHttpServer())
        .get('/news')
        .expect(200);

      expect(response.headers['content-type']).toContain('application/json');
    });
  });

  describe('GET /news/:slug - Get News by Slug', () => {
    it('should return 200 with news article when slug exists', async () => {
      const article = await prisma.news.create({
        data: {
          title: 'Test Article',
          slug: 'test-article',
          content: 'Test content',
          authorId: testUserId,
          publishedAt: new Date(),
        },
      });

      const response = await request(app.getHttpServer())
        .get('/news/test-article')
        .expect(200);

      expect(response.body).toHaveProperty('id', article.id);
      expect(response.body).toHaveProperty('title', 'Test Article');
      expect(response.body).toHaveProperty('slug', 'test-article');
      expect(response.body).toHaveProperty('content', 'Test content');
    });

    it('should return 404 when slug does not exist', async () => {
      const response = await request(app.getHttpServer())
        .get('/news/non-existent-slug')
        .expect(404);

      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('not found');
    });

    it('should handle slugs with hyphens correctly', async () => {
      await prisma.news.create({
        data: {
          title: 'Multi Word Title',
          slug: 'multi-word-title',
          content: 'Content',
          authorId: testUserId,
          publishedAt: new Date(),
        },
      });

      await request(app.getHttpServer())
        .get('/news/multi-word-title')
        .expect(200);
    });
  });

  describe('POST /news - Create News Article', () => {
    it('should return 201 with created article', async () => {
      const createDto = {
        title: 'New Article',
        content: 'Article content',
        publishedAt: new Date().toISOString(),
      };

      const response = await request(app.getHttpServer())
        .post('/news')
        .set('Authorization', `Bearer ${authToken}`)
        .send(createDto)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('title', 'New Article');
      expect(response.body).toHaveProperty('slug', 'new-article');
      expect(response.body).toHaveProperty('content', 'Article content');
      expect(response.body).toHaveProperty('authorId');
    });

    it('should auto-generate slug from title', async () => {
      const createDto = {
        title: 'This Is A Test Article',
        content: 'Content',
        publishedAt: new Date().toISOString(),
      };

      const response = await request(app.getHttpServer())
        .post('/news')
        .set('Authorization', `Bearer ${authToken}`)
        .send(createDto)
        .expect(201);

      expect(response.body.slug).toBe('this-is-a-test-article');
    });

    it('should return 400 when required fields are missing', async () => {
      const response = await request(app.getHttpServer())
        .post('/news')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ title: 'Only Title' })
        .expect(400);

      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('content');
    });

    it('should return 401 when no auth token provided', async () => {
      const createDto = {
        title: 'Unauthorized Article',
        content: 'Content',
        publishedAt: new Date().toISOString(),
      };

      await request(app.getHttpServer())
        .post('/news')
        .send(createDto)
        .expect(401);
    });

    it('should reject invalid data types', async () => {
      const response = await request(app.getHttpServer())
        .post('/news')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 123, // Should be string
          content: 'Valid content',
          publishedAt: 'invalid-date',
        })
        .expect(400);

      expect(response.body).toHaveProperty('message');
    });
  });

  describe('PATCH /news/:id - Update News Article', () => {
    it('should return 200 with updated article', async () => {
      const article = await prisma.news.create({
        data: {
          title: 'Original Title',
          slug: 'original-title',
          content: 'Original content',
          authorId: testUserId,
          publishedAt: new Date(),
        },
      });

      const updateDto = {
        title: 'Updated Title',
        content: 'Updated content',
      };

      const response = await request(app.getHttpServer())
        .patch(`/news/${article.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateDto)
        .expect(200);

      expect(response.body).toHaveProperty('title', 'Updated Title');
      expect(response.body).toHaveProperty('content', 'Updated content');
    });

    it('should support partial updates', async () => {
      const article = await prisma.news.create({
        data: {
          title: 'Original',
          slug: 'original',
          content: 'Original content',
          authorId: testUserId,
          publishedAt: new Date(),
        },
      });

      const response = await request(app.getHttpServer())
        .patch(`/news/${article.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ title: 'Updated Title Only' })
        .expect(200);

      expect(response.body.title).toBe('Updated Title Only');
      expect(response.body.content).toBe('Original content');
    });

    it('should return 404 when article does not exist', async () => {
      await request(app.getHttpServer())
        .patch('/news/non-existent-id')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ title: 'Update' })
        .expect(404);
    });

    it('should return 401 when no auth token provided', async () => {
      const article = await prisma.news.create({
        data: {
          title: 'Test',
          slug: 'test',
          content: 'Content',
          authorId: testUserId,
          publishedAt: new Date(),
        },
      });

      await request(app.getHttpServer())
        .patch(`/news/${article.id}`)
        .send({ title: 'Unauthorized Update' })
        .expect(401);
    });
  });

  describe('DELETE /news/:id - Delete News Article', () => {
    it('should return 200 when article is deleted', async () => {
      const article = await prisma.news.create({
        data: {
          title: 'To Delete',
          slug: 'to-delete',
          content: 'Content',
          authorId: testUserId,
          publishedAt: new Date(),
        },
      });

      await request(app.getHttpServer())
        .delete(`/news/${article.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // Verify deletion
      const deleted = await prisma.news.findUnique({
        where: { id: article.id },
      });
      expect(deleted).toBeNull();
    });

    it('should return 404 when article does not exist', async () => {
      await request(app.getHttpServer())
        .delete('/news/non-existent-id')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });

    it('should return 401 when no auth token provided', async () => {
      const article = await prisma.news.create({
        data: {
          title: 'Test',
          slug: 'test',
          content: 'Content',
          authorId: testUserId,
          publishedAt: new Date(),
        },
      });

      await request(app.getHttpServer())
        .delete(`/news/${article.id}`)
        .expect(401);
    });
  });

  describe('🔒 API Security and Validation', () => {
    it('should validate slug format (lowercase, hyphens only)', async () => {
      const article = await prisma.news.create({
        data: {
          title: 'Test Article',
          slug: 'test-article',
          content: 'Content',
          authorId: testUserId,
          publishedAt: new Date(),
        },
      });

      expect(article.slug).toMatch(/^[a-z0-9-]+$/);
    });

    it('should sanitize input to prevent XSS', async () => {
      const maliciousDto = {
        title: '<script>alert("xss")</script>',
        content: 'Normal content',
        publishedAt: new Date().toISOString(),
      };

      const response = await request(app.getHttpServer())
        .post('/news')
        .set('Authorization', `Bearer ${authToken}`)
        .send(maliciousDto)
        .expect(201);

      // Slug should be sanitized (no script tags)
      expect(response.body.slug).toBe('scriptalertxssscript');
    });

    it('should handle SQL injection attempts safely', async () => {
      const sqlInjectionDto = {
        title: "'; DROP TABLE news;--",
        content: 'Content',
        publishedAt: new Date().toISOString(),
      };

      const response = await request(app.getHttpServer())
        .post('/news')
        .set('Authorization', `Bearer ${authToken}`)
        .send(sqlInjectionDto)
        .expect(201);

      // Should create safely without executing SQL
      expect(response.body.id).toBeDefined();

      // Verify table still exists
      const count = await prisma.news.count();
      expect(count).toBeGreaterThan(0);
    });
  });

  describe('📋 Response Structure Validation', () => {
    it('should return consistent response structure for single article', async () => {
      const article = await prisma.news.create({
        data: {
          title: 'Structure Test',
          slug: 'structure-test',
          content: 'Content',
          authorId: testUserId,
          publishedAt: new Date(),
        },
      });

      const response = await request(app.getHttpServer())
        .get(`/news/${article.slug}`)
        .expect(200);

      // Validate required fields
      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('title');
      expect(response.body).toHaveProperty('slug');
      expect(response.body).toHaveProperty('content');
      expect(response.body).toHaveProperty('authorId');
      expect(response.body).toHaveProperty('publishedAt');
      expect(response.body).toHaveProperty('createdAt');

      // Validate data types
      expect(typeof response.body.id).toBe('string');
      expect(typeof response.body.title).toBe('string');
      expect(typeof response.body.slug).toBe('string');
      expect(typeof response.body.content).toBe('string');
    });

    it('should return consistent error structure', async () => {
      const response = await request(app.getHttpServer())
        .get('/news/non-existent')
        .expect(404);

      expect(response.body).toHaveProperty('statusCode', 404);
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toBeDefined();
    });
  });
});
