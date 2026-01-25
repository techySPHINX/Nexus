import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/prisma/prisma.service';
import { TestDatabaseHelper } from '../helpers/test-database.helper';
import { JwtService } from '@nestjs/jwt';
import { Role, PostStatus } from '@prisma/client';

describe('Post Contract Tests - API Validation', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let dbHelper: TestDatabaseHelper;
  let jwtService: JwtService;

  let studentUser: any;
  let alumniUser: any;
  let studentToken: string;
  let alumniToken: string;

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
    jwtService = app.get<JwtService>(JwtService);
    dbHelper = new TestDatabaseHelper();
  });

  beforeEach(async () => {
    await dbHelper.cleanup();

    studentUser = await dbHelper.createTestUser({
      email: 'student@kiit.ac.in',
      name: 'Test Student',
      role: Role.STUDENT,
    });

    alumniUser = await dbHelper.createTestUser({
      email: 'alumni@kiit.ac.in',
      name: 'Test Alumni',
      role: Role.ALUMNI,
    });

    studentToken = jwtService.sign({
      sub: studentUser.id,
      email: studentUser.email,
      userId: studentUser.id,
    });

    alumniToken = jwtService.sign({
      sub: alumniUser.id,
      email: alumniUser.email,
      userId: alumniUser.id,
    });
  });

  afterAll(async () => {
    await dbHelper.cleanup();
    await app.close();
  });

  describe('✅ POST /posts - Create Post Response Contract', () => {
    it('should return 201 with complete post object', async () => {
      const response = await request(app.getHttpServer())
        .post('/posts')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          subject: 'Contract Test Post',
          content: 'Testing response contract',
          type: 'UPDATE',
        })
        .expect(201)
        .expect('Content-Type', /json/);

      // Validate response structure
      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('subject', 'Contract Test Post');
      expect(response.body).toHaveProperty(
        'content',
        'Testing response contract',
      );
      expect(response.body).toHaveProperty('type', 'UPDATE');
      expect(response.body).toHaveProperty('status', PostStatus.PENDING);
      expect(response.body).toHaveProperty('authorId', studentUser.id);
      expect(response.body).toHaveProperty('createdAt');
      expect(response.body).toHaveProperty('updatedAt');

      // Validate data types
      expect(typeof response.body.id).toBe('string');
      expect(typeof response.body.subject).toBe('string');
      expect(typeof response.body.content).toBe('string');
      expect(typeof response.body.authorId).toBe('string');
      expect(typeof response.body.createdAt).toBe('string');
      expect(typeof response.body.updatedAt).toBe('string');
    });

    it('should return 400 for invalid request body', async () => {
      const response = await request(app.getHttpServer())
        .post('/posts')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          // Missing required fields
          type: 'UPDATE',
        })
        .expect(400)
        .expect('Content-Type', /json/);

      expect(response.body).toHaveProperty('statusCode', 400);
      expect(response.body).toHaveProperty('message');
      expect(Array.isArray(response.body.message)).toBe(true);
    });

    it('should return 401 for missing authentication', async () => {
      const response = await request(app.getHttpServer())
        .post('/posts')
        .send({
          subject: 'Test',
          content: 'Test content',
        })
        .expect(401)
        .expect('Content-Type', /json/);

      expect(response.body).toHaveProperty('statusCode', 401);
      expect(response.body).toHaveProperty('message');
    });

    it('should validate subject max length (200 chars)', async () => {
      const response = await request(app.getHttpServer())
        .post('/posts')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          subject: 'a'.repeat(201),
          content: 'Test content',
        })
        .expect(400);

      expect(response.body).toHaveProperty('statusCode', 400);
      expect(response.body.message).toEqual(
        expect.arrayContaining([
          expect.stringMatching(/subject.*must be shorter/i),
        ]),
      );
    });

    it('should validate content max length (2000 chars)', async () => {
      const response = await request(app.getHttpServer())
        .post('/posts')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          subject: 'Test',
          content: 'a'.repeat(2001),
        })
        .expect(400);

      expect(response.body).toHaveProperty('statusCode', 400);
      expect(response.body.message).toEqual(
        expect.arrayContaining([
          expect.stringMatching(/content.*must be shorter/i),
        ]),
      );
    });

    it('should validate empty content', async () => {
      const response = await request(app.getHttpServer())
        .post('/posts')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          subject: 'Test',
          content: '',
        })
        .expect(400);

      expect(response.body).toHaveProperty('statusCode', 400);
      expect(response.body.message).toEqual(
        expect.arrayContaining([
          expect.stringMatching(/content.*should not be empty/i),
        ]),
      );
    });

    it('should validate empty subject', async () => {
      const response = await request(app.getHttpServer())
        .post('/posts')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          subject: '',
          content: 'Test content',
        })
        .expect(400);

      expect(response.body).toHaveProperty('statusCode', 400);
      expect(response.body.message).toEqual(
        expect.arrayContaining([
          expect.stringMatching(/subject.*should not be empty/i),
        ]),
      );
    });
  });

  describe('✅ GET /posts/recent - Recent Posts Response Contract', () => {
    beforeEach(async () => {
      // Create approved posts
      await prisma.post.create({
        data: {
          subject: 'Approved Post 1',
          content: 'Content 1',
          authorId: alumniUser.id,
          type: 'UPDATE',
          status: PostStatus.APPROVED,
        },
      });

      await prisma.post.create({
        data: {
          subject: 'Approved Post 2',
          content: 'Content 2',
          authorId: alumniUser.id,
          type: 'UPDATE',
          status: PostStatus.APPROVED,
        },
      });
    });

    it('should return 200 with posts array and pagination object', async () => {
      const response = await request(app.getHttpServer())
        .get('/posts/recent?page=1&limit=6')
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(200)
        .expect('Content-Type', /json/);

      // Validate top-level structure
      expect(response.body).toHaveProperty('posts');
      expect(response.body).toHaveProperty('pagination');
      expect(Array.isArray(response.body.posts)).toBe(true);

      // Validate pagination object
      expect(response.body.pagination).toHaveProperty('page', 1);
      expect(response.body.pagination).toHaveProperty('limit', 6);
      expect(response.body.pagination).toHaveProperty('totalPages');
      expect(response.body.pagination).toHaveProperty('hasNext');
      expect(response.body.pagination).toHaveProperty('hasPrev');

      // Validate data types
      expect(typeof response.body.pagination.page).toBe('number');
      expect(typeof response.body.pagination.limit).toBe('number');
      expect(typeof response.body.pagination.totalPages).toBe('number');
      expect(typeof response.body.pagination.hasNext).toBe('boolean');
      expect(typeof response.body.pagination.hasPrev).toBe('boolean');
    });

    it('should return 200 with each post having correct structure', async () => {
      const response = await request(app.getHttpServer())
        .get('/posts/recent')
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(200);

      if (response.body.posts.length > 0) {
        const post = response.body.posts[0];

        // Required fields
        expect(post).toHaveProperty('id');
        expect(post).toHaveProperty('subject');
        expect(post).toHaveProperty('content');
        expect(post).toHaveProperty('authorId');
        expect(post).toHaveProperty('type');
        expect(post).toHaveProperty('createdAt');
        expect(post).toHaveProperty('updatedAt');

        // Vote status fields
        expect(post).toHaveProperty('hasVoted');
        expect(typeof post.hasVoted).toBe('boolean');

        // Data types
        expect(typeof post.id).toBe('string');
        expect(typeof post.subject).toBe('string');
        expect(typeof post.content).toBe('string');
        expect(typeof post.authorId).toBe('string');
      }
    });

    it('should return 400 for invalid pagination parameters', async () => {
      const response = await request(app.getHttpServer())
        .get('/posts/recent?page=-1&limit=0')
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(400);

      expect(response.body).toHaveProperty('statusCode', 400);
      expect(response.body).toHaveProperty('message');
    });

    it('should return 401 for missing authentication', async () => {
      await request(app.getHttpServer()).get('/posts/recent').expect(401);
    });
  });

  describe('✅ GET /posts/feed - Personalized Feed Response Contract', () => {
    beforeEach(async () => {
      await prisma.post.create({
        data: {
          subject: 'Feed Post',
          content: 'Feed content',
          authorId: alumniUser.id,
          type: 'UPDATE',
          status: PostStatus.APPROVED,
        },
      });
    });

    it('should return 200 with posts array and pagination object', async () => {
      const response = await request(app.getHttpServer())
        .get('/posts/feed?page=1&limit=6')
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(200)
        .expect('Content-Type', /json/);

      // Validate structure
      expect(response.body).toHaveProperty('posts');
      expect(response.body).toHaveProperty('pagination');
      expect(Array.isArray(response.body.posts)).toBe(true);

      // Validate pagination
      expect(response.body.pagination).toHaveProperty('page', 1);
      expect(response.body.pagination).toHaveProperty('limit', 6);
      expect(response.body.pagination).toHaveProperty('totalPages');
      expect(response.body.pagination).toHaveProperty('hasNext');
      expect(response.body.pagination).toHaveProperty('hasPrev');
    });

    it('should return 200 with each post having author details', async () => {
      const response = await request(app.getHttpServer())
        .get('/posts/feed')
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(200);

      if (response.body.posts.length > 0) {
        const post = response.body.posts[0];

        expect(post).toHaveProperty('author');
        expect(post.author).toHaveProperty('id');
        expect(post.author).toHaveProperty('name');
        expect(post.author).toHaveProperty('email');
      }
    });

    it('should support optional subCommunityId filter', async () => {
      const response = await request(app.getHttpServer())
        .get('/posts/feed?subCommunityId=test-community-id')
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('posts');
      expect(response.body).toHaveProperty('pagination');
    });

    it('should return 401 for missing authentication', async () => {
      await request(app.getHttpServer()).get('/posts/feed').expect(401);
    });
  });

  describe('✅ GET /posts/:id - Single Post Response Contract', () => {
    let post: any;

    beforeEach(async () => {
      post = await prisma.post.create({
        data: {
          subject: 'Test Post',
          content: 'Test content',
          authorId: alumniUser.id,
          type: 'UPDATE',
          status: PostStatus.APPROVED,
        },
      });
    });

    it('should return 200 with complete post details', async () => {
      const response = await request(app.getHttpServer())
        .get(`/posts/${post.id}`)
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(200)
        .expect('Content-Type', /json/);

      // Validate structure
      expect(response.body).toHaveProperty('id', post.id);
      expect(response.body).toHaveProperty('subject', 'Test Post');
      expect(response.body).toHaveProperty('content', 'Test content');
      expect(response.body).toHaveProperty('authorId', alumniUser.id);
      expect(response.body).toHaveProperty('type', 'UPDATE');
      expect(response.body).toHaveProperty('status', PostStatus.APPROVED);
      expect(response.body).toHaveProperty('createdAt');
      expect(response.body).toHaveProperty('updatedAt');
    });

    it('should return 404 for non-existent post', async () => {
      const response = await request(app.getHttpServer())
        .get('/posts/non-existent-id')
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(404)
        .expect('Content-Type', /json/);

      expect(response.body).toHaveProperty('statusCode', 404);
      expect(response.body).toHaveProperty('message');
    });

    it('should return 401 for missing authentication', async () => {
      await request(app.getHttpServer())
        .get(`/posts/${post.id}`)
        .expect(401);
    });
  });

  describe('✅ PATCH /posts/:id - Update Post Response Contract', () => {
    let post: any;

    beforeEach(async () => {
      post = await prisma.post.create({
        data: {
          subject: 'Original Subject',
          content: 'Original content',
          authorId: studentUser.id,
          type: 'UPDATE',
          status: PostStatus.PENDING,
        },
      });
    });

    it('should return 200 with updated post object', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/posts/${post.id}`)
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          subject: 'Updated Subject',
          content: 'Updated content',
        })
        .expect(200)
        .expect('Content-Type', /json/);

      // Validate updated fields
      expect(response.body).toHaveProperty('id', post.id);
      expect(response.body).toHaveProperty('subject', 'Updated Subject');
      expect(response.body).toHaveProperty('content', 'Updated content');
      expect(response.body).toHaveProperty('updatedAt');

      // updatedAt should be different from createdAt
      expect(response.body.updatedAt).not.toBe(response.body.createdAt);
    });

    it('should return 403 for unauthorized user', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/posts/${post.id}`)
        .set('Authorization', `Bearer ${alumniToken}`) // Different user
        .send({
          subject: 'Updated Subject',
        })
        .expect(403)
        .expect('Content-Type', /json/);

      expect(response.body).toHaveProperty('statusCode', 403);
      expect(response.body).toHaveProperty('message');
    });

    it('should return 404 for non-existent post', async () => {
      await request(app.getHttpServer())
        .patch('/posts/non-existent-id')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          subject: 'Updated Subject',
        })
        .expect(404);
    });

    it('should return 400 for invalid update data', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/posts/${post.id}`)
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          subject: '', // Empty subject
          content: 'Updated content',
        })
        .expect(400);

      expect(response.body).toHaveProperty('statusCode', 400);
      expect(response.body).toHaveProperty('message');
    });

    it('should return 401 for missing authentication', async () => {
      await request(app.getHttpServer())
        .patch(`/posts/${post.id}`)
        .send({
          subject: 'Updated',
        })
        .expect(401);
    });
  });

  describe('✅ DELETE /posts/:id - Delete Post Response Contract', () => {
    let post: any;

    beforeEach(async () => {
      post = await prisma.post.create({
        data: {
          subject: 'To Delete',
          content: 'Delete this post',
          authorId: studentUser.id,
          type: 'UPDATE',
          status: PostStatus.PENDING,
        },
      });
    });

    it('should return 200 with success message', async () => {
      const response = await request(app.getHttpServer())
        .delete(`/posts/${post.id}`)
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(200)
        .expect('Content-Type', /json/);

      expect(response.body).toHaveProperty('message');
      expect(typeof response.body.message).toBe('string');

      // Verify deletion
      const deleted = await prisma.post.findUnique({
        where: { id: post.id },
      });
      expect(deleted).toBeNull();
    });

    it('should return 403 for unauthorized user', async () => {
      const response = await request(app.getHttpServer())
        .delete(`/posts/${post.id}`)
        .set('Authorization', `Bearer ${alumniToken}`) // Different user
        .expect(403);

      expect(response.body).toHaveProperty('statusCode', 403);
    });

    it('should return 404 for non-existent post', async () => {
      await request(app.getHttpServer())
        .delete('/posts/non-existent-id')
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(404);
    });

    it('should return 401 for missing authentication', async () => {
      await request(app.getHttpServer())
        .delete(`/posts/${post.id}`)
        .expect(401);
    });
  });

  describe('🔒 Security: HTTP Headers and Content-Type', () => {
    it('should always return application/json content-type', async () => {
      await request(app.getHttpServer())
        .get('/posts/recent')
        .set('Authorization', `Bearer ${studentToken}`)
        .expect('Content-Type', /json/);
    });

    it('should handle OPTIONS preflight for CORS', async () => {
      await request(app.getHttpServer())
        .options('/posts')
        .expect((res) => {
          // Should not error on OPTIONS
          expect([200, 204]).toContain(res.status);
        });
    });

    it('should reject invalid JSON in request body', async () => {
      const response = await request(app.getHttpServer())
        .post('/posts')
        .set('Authorization', `Bearer ${studentToken}`)
        .set('Content-Type', 'application/json')
        .send('invalid json')
        .expect(400);

      expect(response.body).toHaveProperty('statusCode', 400);
    });
  });

  describe('❌ Edge Cases: Content-Type and Error Handling', () => {
    it('should return consistent error structure', async () => {
      const response = await request(app.getHttpServer())
        .post('/posts')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          subject: '', // Invalid
          content: 'Test',
        })
        .expect(400);

      // Standard NestJS error structure
      expect(response.body).toHaveProperty('statusCode');
      expect(response.body).toHaveProperty('message');
      expect(typeof response.body.statusCode).toBe('number');
    });

    it('should handle malformed Authorization header', async () => {
      await request(app.getHttpServer())
        .get('/posts/recent')
        .set('Authorization', 'InvalidToken')
        .expect(401);
    });

    it('should handle expired JWT token', async () => {
      const expiredToken = jwtService.sign(
        {
          sub: studentUser.id,
          email: studentUser.email,
          userId: studentUser.id,
        },
        { expiresIn: '-1h' }, // Expired
      );

      await request(app.getHttpServer())
        .get('/posts/recent')
        .set('Authorization', `Bearer ${expiredToken}`)
        .expect(401);
    });
  });
});
