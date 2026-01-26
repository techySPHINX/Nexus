import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/prisma/prisma.service';
import { Role } from '@prisma/client';

/**
 * Comprehensive API Contract Tests
 * Tests schema consistency, validation, pagination, and error handling
 */
describe('API Contract Tests', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let authToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    await app.init();

    prisma = app.get<PrismaService>(PrismaService);

    // Create test user and get auth token
    const authResponse = await request(app.getHttpServer())
      .post('/api/auth/signup')
      .send({
        email: 'test@kiit.ac.in',
        password: 'Test123!@#',
        name: 'Test User',
        role: Role.STUDENT,
      });

    authToken = authResponse.body.access_token;
  });

  afterAll(async () => {
    await prisma.$disconnect();
    await app.close();
  });

  describe('Response Schema Consistency', () => {
    it('should return consistent response format for successful requests', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/users/me')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    });

    it('should return consistent error format for failed requests', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/users/invalid-id')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toHaveProperty('code');
      expect(response.body.error).toHaveProperty('message');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('path');
    });
  });

  describe('Pagination Contract', () => {
    it('should support standard pagination parameters', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/posts')
        .query({ page: 1, limit: 10 })
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body).toHaveProperty('meta');
      expect(response.body.meta).toHaveProperty('page', 1);
      expect(response.body.meta).toHaveProperty('limit', 10);
      expect(response.body.meta).toHaveProperty('total');
      expect(response.body.meta).toHaveProperty('totalPages');
      expect(response.body.meta).toHaveProperty('hasNextPage');
      expect(response.body.meta).toHaveProperty('hasPreviousPage');
    });

    it('should enforce maximum limit', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/posts')
        .query({ page: 1, limit: 150 })
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);

      expect(response.body.error.message).toContain('limit');
    });

    it('should have default pagination values', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/posts')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.meta.page).toBe(1);
      expect(response.body.meta.limit).toBeGreaterThan(0);
    });
  });

  describe('Data Type Consistency', () => {
    it('should return correct data types for user fields', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/users/me')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const user = response.body.data;
      expect(typeof user.id).toBe('string');
      expect(typeof user.email).toBe('string');
      expect(typeof user.name).toBe('string');
      expect(typeof user.role).toBe('string');
      expect(typeof user.createdAt).toBe('string');
      expect(user.createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    });

    it('should return ISO 8601 timestamps', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/posts')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      if (response.body.data.length > 0) {
        const post = response.body.data[0];
        expect(post.createdAt).toMatch(
          /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/,
        );
      }
    });
  });

  describe('Validation Contract', () => {
    it('should reject invalid UUIDs', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/messages')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          receiverId: 'not-a-uuid',
          content: 'Hello',
        })
        .expect(400);

      expect(response.body.error.message).toContain('UUID');
    });

    it('should reject empty required fields', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/messages')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          receiverId: '123e4567-e89b-12d3-a456-426614174000',
          content: '',
        })
        .expect(400);

      expect(response.body.error.message).toContain('content');
    });

    it('should reject fields exceeding max length', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/messages')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          receiverId: '123e4567-e89b-12d3-a456-426614174000',
          content: 'a'.repeat(5001),
        })
        .expect(400);

      expect(response.body.error.message).toContain('5000');
    });

    it('should reject unknown fields when forbidNonWhitelisted is true', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/messages')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          receiverId: '123e4567-e89b-12d3-a456-426614174000',
          content: 'Hello',
          unknownField: 'should be rejected',
        })
        .expect(400);

      expect(response.body.error.message).toContain('unknownField');
    });
  });

  describe('Filtering and Sorting Contract', () => {
    it('should support basic filtering', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/posts')
        .query({ status: 'APPROVED' })
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      if (response.body.data.length > 0) {
        expect(response.body.data.every((p) => p.status === 'APPROVED')).toBe(
          true,
        );
      }
    });

    it('should support sorting', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/posts')
        .query({ sortBy: 'createdAt', sortOrder: 'desc' })
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      if (response.body.data.length > 1) {
        const dates = response.body.data.map((p) => new Date(p.createdAt));
        for (let i = 0; i < dates.length - 1; i++) {
          expect(dates[i].getTime()).toBeGreaterThanOrEqual(
            dates[i + 1].getTime(),
          );
        }
      }
    });
  });

  describe('Error Handling Contract', () => {
    it('should return 401 for unauthenticated requests', async () => {
      await request(app.getHttpServer()).get('/api/users/me').expect(401);
    });

    it('should return 403 for unauthorized actions', async () => {
      // Try to access admin-only endpoint
      await request(app.getHttpServer())
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(403);
    });

    it('should return 404 for non-existent resources', async () => {
      await request(app.getHttpServer())
        .get('/api/users/123e4567-e89b-12d3-a456-426614174000')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });

    it('should return 409 for duplicate entries', async () => {
      // Try to create duplicate user
      await request(app.getHttpServer())
        .post('/api/auth/signup')
        .send({
          email: 'test@kiit.ac.in', // Already exists
          password: 'Test123!@#',
          name: 'Test User',
          role: Role.STUDENT,
        })
        .expect(409);
    });
  });

  describe('Default Values Contract', () => {
    it('should apply default values correctly', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/posts')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          subject: 'Test Post',
          content: 'Test content',
        })
        .expect(201);

      expect(response.body.data.status).toBe('PENDING');
      expect(response.body.data.isUrgent).toBe(false);
      expect(response.body.data.isDeleted).toBe(false);
    });
  });
});
