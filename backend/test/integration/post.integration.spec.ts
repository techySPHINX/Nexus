import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/prisma/prisma.service';
import { TestDatabaseHelper } from '../helpers/test-database.helper';
import { JwtService } from '@nestjs/jwt';
import { Role, PostStatus } from '@prisma/client';

describe('Post Integration Tests', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let dbHelper: TestDatabaseHelper;
  let jwtService: JwtService;

  let studentUser: any;
  let alumniUser: any;
  let adminUser: any;
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
      role: Role.ALUM,
    });

    adminUser = await dbHelper.createTestUser({
      email: 'admin@kiit.ac.in',
      name: 'Test Admin',
      role: Role.ADMIN,
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

  describe('✅ Complete Post Creation Workflow', () => {
    it('should create post with PENDING status', async () => {
      const response = await request(app.getHttpServer())
        .post('/posts')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          subject: 'Test Post',
          content: 'This is a test post content',
          type: 'UPDATE',
        })
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('subject', 'Test Post');
      expect(response.body).toHaveProperty('status', PostStatus.PENDING);
      expect(response.body).toHaveProperty('authorId', studentUser.id);

      // Verify database
      const post = await prisma.post.findUnique({
        where: { id: response.body.id },
      });

      expect(post?.status).toBe(PostStatus.PENDING);
    });

    it('should trim subject and content before saving', async () => {
      const response = await request(app.getHttpServer())
        .post('/posts')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          subject: '  Test Subject  ',
          content: '  Test Content  ',
        })
        .expect(201);

      expect(response.body.subject).toBe('Test Subject');
      expect(response.body.content).toBe('Test Content');
    });

    it('should reject empty content', async () => {
      await request(app.getHttpServer())
        .post('/posts')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          subject: 'Test',
          content: '',
        })
        .expect(400);
    });

    it('should reject content over 2000 characters', async () => {
      const longContent = 'a'.repeat(2001);

      await request(app.getHttpServer())
        .post('/posts')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          subject: 'Test',
          content: longContent,
        })
        .expect(400);
    });

    it('should reject empty subject', async () => {
      await request(app.getHttpServer())
        .post('/posts')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          subject: '',
          content: 'Test content',
        })
        .expect(400);
    });

    it('should reject subject over 200 characters', async () => {
      const longSubject = 'a'.repeat(201);

      await request(app.getHttpServer())
        .post('/posts')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          subject: longSubject,
          content: 'Test content',
        })
        .expect(400);
    });

    it('should require authentication', async () => {
      await request(app.getHttpServer())
        .post('/posts')
        .send({
          subject: 'Test',
          content: 'Test content',
        })
        .expect(401);
    });
  });

  describe('✅ Complete Post Retrieval Workflow', () => {
    beforeEach(async () => {
      // Create and approve a post
      await prisma.post.create({
        data: {
          subject: 'Approved Post',
          content: 'This is approved',
          authorId: alumniUser.id,
          type: 'UPDATE',
          status: PostStatus.APPROVED,
        },
      });
    });

    it('should retrieve recent posts with pagination', async () => {
      const response = await request(app.getHttpServer())
        .get('/posts/recent?page=1&limit=6')
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('posts');
      expect(response.body).toHaveProperty('pagination');
      expect(response.body.pagination).toHaveProperty('page', 1);
      expect(response.body.pagination).toHaveProperty('limit', 6);
    });

    it('should only return APPROVED posts', async () => {
      // Create a pending post
      await prisma.post.create({
        data: {
          subject: 'Pending Post',
          content: 'This is pending',
          authorId: alumniUser.id,
          type: 'UPDATE',
          status: PostStatus.PENDING,
        },
      });

      const response = await request(app.getHttpServer())
        .get('/posts/recent')
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(200);

      // Should only include approved posts
      response.body.posts.forEach((post: any) => {
        expect(post).not.toHaveProperty('status', PostStatus.PENDING);
      });
    });

    it('should exclude user own posts', async () => {
      // Create post by student
      await prisma.post.create({
        data: {
          subject: 'My Post',
          content: 'My own post',
          authorId: studentUser.id,
          type: 'UPDATE',
          status: PostStatus.APPROVED,
        },
      });

      const response = await request(app.getHttpServer())
        .get('/posts/recent')
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(200);

      // Should not include own posts
      const ownPost = response.body.posts.find(
        (post: any) => post.authorId === studentUser.id,
      );
      expect(ownPost).toBeUndefined();
    });

    it('should include vote status for each post', async () => {
      const response = await request(app.getHttpServer())
        .get('/posts/recent')
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(200);

      if (response.body.posts.length > 0) {
        expect(response.body.posts[0]).toHaveProperty('hasVoted');
      }
    });

    it('should handle pagination correctly', async () => {
      // Create multiple posts
      for (let i = 0; i < 10; i++) {
        await prisma.post.create({
          data: {
            subject: `Post ${i}`,
            content: `Content ${i}`,
            authorId: alumniUser.id,
            type: 'UPDATE',
            status: PostStatus.APPROVED,
          },
        });
      }

      const page1 = await request(app.getHttpServer())
        .get('/posts/recent?page=1&limit=5')
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(200);

      expect(page1.body.posts.length).toBeLessThanOrEqual(5);
      expect(page1.body.pagination.hasNext).toBe(true);
      expect(page1.body.pagination.hasPrev).toBe(false);

      const page2 = await request(app.getHttpServer())
        .get('/posts/recent?page=2&limit=5')
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(200);

      expect(page2.body.pagination.hasPrev).toBe(true);
    });

    it('should require authentication', async () => {
      await request(app.getHttpServer()).get('/posts/recent').expect(401);
    });
  });

  describe('✅ Complete Feed Generation Workflow', () => {
    beforeEach(async () => {
      // Create posts from different users
      await prisma.post.create({
        data: {
          subject: 'Feed Post 1',
          content: 'Content from alumni',
          authorId: alumniUser.id,
          type: 'UPDATE',
          status: PostStatus.APPROVED,
        },
      });

      await prisma.post.create({
        data: {
          subject: 'Feed Post 2',
          content: 'Another post',
          authorId: adminUser.id,
          type: 'UPDATE',
          status: PostStatus.APPROVED,
        },
      });
    });

    it('should retrieve personalized feed', async () => {
      const response = await request(app.getHttpServer())
        .get('/posts/feed')
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('posts');
      expect(response.body).toHaveProperty('pagination');
      expect(response.body.posts).toBeInstanceOf(Array);
    });

    it('should exclude own posts from feed', async () => {
      await prisma.post.create({
        data: {
          subject: 'My Post',
          content: 'My own post',
          authorId: studentUser.id,
          type: 'UPDATE',
          status: PostStatus.APPROVED,
        },
      });

      const response = await request(app.getHttpServer())
        .get('/posts/feed')
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(200);

      const ownPost = response.body.posts.find(
        (post: any) => post.author.id === studentUser.id,
      );
      expect(ownPost).toBeUndefined();
    });

    it('should support pagination', async () => {
      const response = await request(app.getHttpServer())
        .get('/posts/feed?page=1&limit=5')
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(200);

      expect(response.body.pagination.page).toBe(1);
      expect(response.body.pagination.limit).toBe(5);
    });

    it('should require authentication', async () => {
      await request(app.getHttpServer()).get('/posts/feed').expect(401);
    });
  });

  describe('❌ Edge Cases: Invalid Input', () => {
    it('should reject invalid pagination (negative page)', async () => {
      await request(app.getHttpServer())
        .get('/posts/recent?page=-1')
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(400);
    });

    it('should reject invalid pagination (zero limit)', async () => {
      await request(app.getHttpServer())
        .get('/posts/recent?limit=0')
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(400);
    });

    it('should reject invalid pagination (limit > 50)', async () => {
      await request(app.getHttpServer())
        .get('/posts/recent?limit=51')
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(400);
    });

    it('should handle non-integer pagination gracefully', async () => {
      await request(app.getHttpServer())
        .get('/posts/recent?page=abc&limit=xyz')
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(400);
    });
  });

  describe('❌ Edge Cases: Special Characters', () => {
    it('should handle special characters in subject', async () => {
      await request(app.getHttpServer())
        .post('/posts')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          subject: "Test <script>alert('xss')</script>",
          content: 'Test content',
        })
        .expect(201);
    });

    it('should handle Unicode in content', async () => {
      const response = await request(app.getHttpServer())
        .post('/posts')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          subject: 'Test 你好',
          content: 'Content with emoji: 😀 👍 and Unicode: 你好世界',
        })
        .expect(201);

      expect(response.body.content).toContain('😀');
      expect(response.body.content).toContain('你好世界');
    });

    it('should handle SQL-like content safely', async () => {
      const response = await request(app.getHttpServer())
        .post('/posts')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          subject: "Test'; DROP TABLE posts;--",
          content: "Content with SQL: SELECT * FROM users WHERE '1'='1'",
        })
        .expect(201);

      // Should create post without SQL injection
      expect(response.body.id).toBeDefined();

      // Verify posts table still exists
      const count = await prisma.post.count();
      expect(count).toBeGreaterThanOrEqual(1);
    });
  });

  describe('❌ Edge Cases: Boundary Values', () => {
    it('should accept exactly 2000 character content', async () => {
      const content = 'a'.repeat(2000);

      const response = await request(app.getHttpServer())
        .post('/posts')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          subject: 'Test',
          content,
        })
        .expect(201);

      expect(response.body.content.length).toBe(2000);
    });

    it('should accept exactly 200 character subject', async () => {
      const subject = 'a'.repeat(200);

      const response = await request(app.getHttpServer())
        .post('/posts')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          subject,
          content: 'Test content',
        })
        .expect(201);

      expect(response.body.subject.length).toBe(200);
    });

    it('should handle very large page number', async () => {
      const response = await request(app.getHttpServer())
        .get('/posts/recent?page=9999')
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(200);

      expect(response.body.posts).toEqual([]);
      expect(response.body.pagination.hasNext).toBe(false);
    });
  });

  describe('🔒 Security: Authorization', () => {
    it('should require authentication for post creation', async () => {
      await request(app.getHttpServer())
        .post('/posts')
        .send({
          subject: 'Test',
          content: 'Test content',
        })
        .expect(401);
    });

    it('should require authentication for feed retrieval', async () => {
      await request(app.getHttpServer()).get('/posts/feed').expect(401);
    });

    it('should require authentication for recent posts', async () => {
      await request(app.getHttpServer()).get('/posts/recent').expect(401);
    });
  });

  describe('✅ Complete Post Lifecycle Journey', () => {
    it('should complete full post workflow', async () => {
      // 1. Create a post
      const createResponse = await request(app.getHttpServer())
        .post('/posts')
        .set('Authorization', `Bearer ${alumniToken}`)
        .send({
          subject: 'Journey Post',
          content: 'This is a full lifecycle test',
          type: 'UPDATE',
        })
        .expect(201);

      expect(createResponse.body.status).toBe(PostStatus.PENDING);
      const postId = createResponse.body.id;

      // 2. Approve the post (as admin)
      await prisma.post.update({
        where: { id: postId },
        data: { status: PostStatus.APPROVED },
      });

      // 3. Verify it appears in recent posts
      const recentResponse = await request(app.getHttpServer())
        .get('/posts/recent')
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(200);

      const foundPost = recentResponse.body.posts.find(
        (p: any) => p.id === postId,
      );
      expect(foundPost).toBeDefined();

      // 4. Verify it appears in personalized feed
      const feedResponse = await request(app.getHttpServer())
        .get('/posts/feed')
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(200);

      const feedPost = feedResponse.body.posts.find((p: any) => p.id === postId);
      expect(feedPost).toBeDefined();

      // 5. Verify database consistency
      const dbPost = await prisma.post.findUnique({
        where: { id: postId },
      });

      expect(dbPost?.status).toBe(PostStatus.APPROVED);
      expect(dbPost?.subject).toBe('Journey Post');
    });
  });
});
