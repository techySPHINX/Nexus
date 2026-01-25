import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/prisma/prisma.service';
import { TestDatabaseHelper } from '../helpers/test-database.helper';
import { JwtService } from '@nestjs/jwt';
import { Role } from '@prisma/client';

/**
 * Admin API Contract Tests
 * Validates that the Admin API endpoints return responses with correct structure,
 * status codes, and data types for administrative operations.
 */
describe('Admin API Contract Tests', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let dbHelper: TestDatabaseHelper;
  let jwtService: JwtService;

  let adminUser: any;
  let studentUser: any;
  let adminToken: string;
  let studentToken: string;

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

    adminUser = await dbHelper.createTestUser({
      email: 'admin@kiit.ac.in',
      name: 'Test Admin',
      role: Role.ADMIN,
    });

    studentUser = await dbHelper.createTestUser({
      email: 'student@kiit.ac.in',
      name: 'Test Student',
      role: Role.STUDENT,
    });

    adminToken = jwtService.sign({
      sub: adminUser.id,
      email: adminUser.email,
      userId: adminUser.id,
    });

    studentToken = jwtService.sign({
      sub: studentUser.id,
      email: studentUser.email,
      userId: studentUser.id,
    });
  });

  afterAll(async () => {
    await dbHelper.cleanup();
    await app.close();
  });

  describe('✅ GET /admin/dashboard/stats - Dashboard Statistics', () => {
    it('should return 200 with statistics object', async () => {
      const response = await request(app.getHttpServer())
        .get('/admin/dashboard/stats')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toBeInstanceOf(Object);
    });

    it('should return statistics with correct structure', async () => {
      const response = await request(app.getHttpServer())
        .get('/admin/dashboard/stats')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      // Users section
      expect(response.body).toHaveProperty('users');
      expect(response.body.users).toHaveProperty('total');
      expect(response.body.users).toHaveProperty('active');
      expect(response.body.users).toHaveProperty('inactive');
      expect(typeof response.body.users.total).toBe('number');
      expect(typeof response.body.users.active).toBe('number');
      expect(typeof response.body.users.inactive).toBe('number');

      // Verifications section
      expect(response.body).toHaveProperty('verifications');
      expect(response.body.verifications).toHaveProperty('pending');
      expect(response.body.verifications).toHaveProperty('approvedToday');
      expect(response.body.verifications).toHaveProperty('rejectedToday');

      // Platform metrics section
      expect(response.body).toHaveProperty('platformMetrics');
    });

    it('should return 403 for non-admin users', async () => {
      await request(app.getHttpServer())
        .get('/admin/dashboard/stats')
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(403);
    });

    it('should return 401 without authentication', async () => {
      await request(app.getHttpServer())
        .get('/admin/dashboard/stats')
        .expect(401);
    });
  });

  describe('✅ GET /admin/users/activity-report - User Activity Report', () => {
    it('should return 200 with activity report', async () => {
      const response = await request(app.getHttpServer())
        .get('/admin/users/activity-report')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toBeInstanceOf(Object);
    });

    it('should return activity report with correct structure', async () => {
      const response = await request(app.getHttpServer())
        .get('/admin/users/activity-report')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('period');
      expect(response.body.period).toHaveProperty('days');
      expect(response.body.period).toHaveProperty('from');
      expect(response.body.period).toHaveProperty('to');
      expect(response.body).toHaveProperty('totalUsers');
      expect(response.body).toHaveProperty('activeUsers');
      expect(response.body).toHaveProperty('newUsers');
      expect(response.body).toHaveProperty('usersByRole');

      expect(typeof response.body.period.days).toBe('number');
      expect(typeof response.body.totalUsers).toBe('number');
      expect(typeof response.body.activeUsers).toBe('number');
      expect(typeof response.body.newUsers).toBe('number');
    });

    it('should accept days query parameter', async () => {
      const response = await request(app.getHttpServer())
        .get('/admin/users/activity-report?days=30')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.period.days).toBe(30);
    });

    it('should return timestamps in ISO 8601 format', async () => {
      const response = await request(app.getHttpServer())
        .get('/admin/users/activity-report')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.period.from).toMatch(/^\d{4}-\d{2}-\d{2}T/);
      expect(response.body.period.to).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    });

    it('should return 403 for non-admin users', async () => {
      await request(app.getHttpServer())
        .get('/admin/users/activity-report')
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(403);
    });

    it('should return 401 without authentication', async () => {
      await request(app.getHttpServer())
        .get('/admin/users/activity-report')
        .expect(401);
    });
  });

  describe('✅ GET /admin/users/:id/details - User Details', () => {
    beforeEach(async () => {
      // Create some posts for the user
      await prisma.post.create({
        data: {
          authorId: studentUser.id,
          subject: 'Test Subject',
          content: 'Test post',
          type: 'TEXT',
        },
      });
    });

    it('should return 200 with user details', async () => {
      const response = await request(app.getHttpServer())
        .get(`/admin/users/${studentUser.id}/details`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toBeInstanceOf(Object);
    });

    it('should return user details with correct structure', async () => {
      const response = await request(app.getHttpServer())
        .get(`/admin/users/${studentUser.id}/details`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const user = response.body;
      expect(user).toHaveProperty('id', studentUser.id);
      expect(user).toHaveProperty('email');
      expect(user).toHaveProperty('name');
      expect(user).toHaveProperty('role');
      expect(user).toHaveProperty('accountStatus');
      expect(user).toHaveProperty('profile');
      expect(user).toHaveProperty('posts');
      expect(user).toHaveProperty('projects');
      expect(user).toHaveProperty('referrals');
      expect(user).toHaveProperty('securityEvents');

      expect(user.posts).toBeInstanceOf(Array);
      expect(user.projects).toBeInstanceOf(Array);
      expect(user.referrals).toBeInstanceOf(Array);
      expect(user.securityEvents).toBeInstanceOf(Array);

      expect(user).not.toHaveProperty('password');
    });

    it('should limit posts to last 5', async () => {
      const response = await request(app.getHttpServer())
        .get(`/admin/users/${studentUser.id}/details`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.posts.length).toBeLessThanOrEqual(5);
    });

    it('should return 404 for non-existent user', async () => {
      await request(app.getHttpServer())
        .get('/admin/users/00000000-0000-0000-0000-000000000000/details')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });

    it('should return 403 for non-admin users', async () => {
      await request(app.getHttpServer())
        .get(`/admin/users/${studentUser.id}/details`)
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(403);
    });

    it('should return 401 without authentication', async () => {
      await request(app.getHttpServer())
        .get(`/admin/users/${studentUser.id}/details`)
        .expect(401);
    });

    it('should not expose password', async () => {
      const response = await request(app.getHttpServer())
        .get(`/admin/users/${studentUser.id}/details`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).not.toHaveProperty('password');
    });
  });

  describe('✅ GET /admin/users/search - Advanced User Search', () => {
    beforeEach(async () => {
      await dbHelper.createTestUser({
        email: 'john.doe@kiit.ac.in',
        name: 'John Doe',
        role: Role.STUDENT,
      });

      await dbHelper.createTestUser({
        email: 'jane.smith@kiit.ac.in',
        name: 'Jane Smith',
        role: Role.ALUM,
      });
    });

    it('should return 200 with paginated results', async () => {
      const response = await request(app.getHttpServer())
        .get('/admin/users/search')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toBeInstanceOf(Object);
      expect(response.body).toHaveProperty('users');
      expect(response.body).toHaveProperty('pagination');
    });

    it('should return search results with correct structure', async () => {
      const response = await request(app.getHttpServer())
        .get('/admin/users/search')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.users).toBeInstanceOf(Array);

      if (response.body.users.length > 0) {
        const user = response.body.users[0];
        expect(user).toHaveProperty('id');
        expect(user).toHaveProperty('email');
        expect(user).toHaveProperty('name');
        expect(user).toHaveProperty('role');
      }
    });

    it('should return pagination metadata', async () => {
      const response = await request(app.getHttpServer())
        .get('/admin/users/search')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const pagination = response.body.pagination;
      expect(pagination).toHaveProperty('page');
      expect(pagination).toHaveProperty('limit');
      expect(pagination).toHaveProperty('total');
      expect(pagination).toHaveProperty('totalPages');

      expect(typeof pagination.page).toBe('number');
      expect(typeof pagination.limit).toBe('number');
      expect(typeof pagination.total).toBe('number');
      expect(typeof pagination.totalPages).toBe('number');
    });

    it('should accept search query parameter', async () => {
      const response = await request(app.getHttpServer())
        .get('/admin/users/search?query=john')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.users).toBeInstanceOf(Array);
    });

    it('should accept role filter parameter', async () => {
      const response = await request(app.getHttpServer())
        .get('/admin/users/search?role=STUDENT')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.users).toBeInstanceOf(Array);
    });

    it('should accept accountStatus filter parameter', async () => {
      const response = await request(app.getHttpServer())
        .get('/admin/users/search?accountStatus=ACTIVE')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.users).toBeInstanceOf(Array);
    });

    it('should accept pagination parameters', async () => {
      const response = await request(app.getHttpServer())
        .get('/admin/users/search?page=1&limit=5')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.pagination.page).toBe(1);
      expect(response.body.pagination.limit).toBe(5);
      expect(response.body.users.length).toBeLessThanOrEqual(5);
    });

    it('should return 400 for invalid role', async () => {
      await request(app.getHttpServer())
        .get('/admin/users/search?role=INVALID_ROLE')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(400);
    });

    it('should return 400 for invalid accountStatus', async () => {
      await request(app.getHttpServer())
        .get('/admin/users/search?accountStatus=INVALID_STATUS')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(400);
    });

    it('should return 403 for non-admin users', async () => {
      await request(app.getHttpServer())
        .get('/admin/users/search')
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(403);
    });

    it('should return 401 without authentication', async () => {
      await request(app.getHttpServer())
        .get('/admin/users/search')
        .expect(401);
    });

    it('should not expose passwords in search results', async () => {
      const response = await request(app.getHttpServer())
        .get('/admin/users/search')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      response.body.users.forEach((user: any) => {
        expect(user).not.toHaveProperty('password');
      });
    });
  });

  describe('✅ GET /admin/platform/health - Platform Health Metrics', () => {
    beforeEach(async () => {
      // Create security events
      await prisma.securityEvent.create({
        data: {
          userId: studentUser.id,
          eventType: 'LOGIN_FAILED',
          ipAddress: '192.168.1.1',
          metadata: {},
        },
      });

      // Create locked account
      await prisma.user.update({
        where: { id: studentUser.id },
        data: {
          lockedUntil: new Date(Date.now() + 60000),
        },
      });
    });

    it('should return 200 with health metrics', async () => {
      const response = await request(app.getHttpServer())
        .get('/admin/platform/health')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toBeInstanceOf(Object);
    });

    it('should return health metrics with correct structure', async () => {
      const response = await request(app.getHttpServer())
        .get('/admin/platform/health')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('failedLogins');
      expect(response.body).toHaveProperty('lockedAccounts');
      expect(response.body).toHaveProperty('unverifiedEmails');
      expect(response.body).toHaveProperty('recentSecurityEvents');
      expect(response.body).toHaveProperty('timestamp');

      expect(typeof response.body.failedLogins).toBe('number');
      expect(typeof response.body.lockedAccounts).toBe('number');
      expect(typeof response.body.unverifiedEmails).toBe('number');
      expect(typeof response.body.recentSecurityEvents).toBe('number');
    });

    it('should return timestamp in ISO 8601 format', async () => {
      const response = await request(app.getHttpServer())
        .get('/admin/platform/health')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    });

    it('should return 403 for non-admin users', async () => {
      await request(app.getHttpServer())
        .get('/admin/platform/health')
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(403);
    });

    it('should return 401 without authentication', async () => {
      await request(app.getHttpServer())
        .get('/admin/platform/health')
        .expect(401);
    });
  });

  describe('❌ Error Response Format', () => {
    it('should return consistent error format for 400', async () => {
      const response = await request(app.getHttpServer())
        .get('/admin/users/search?role=INVALID_ROLE')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(400);

      expect(response.body).toHaveProperty('statusCode', 400);
      expect(response.body).toHaveProperty('message');
    });

    it('should return consistent error format for 401', async () => {
      const response = await request(app.getHttpServer())
        .get('/admin/dashboard/stats')
        .expect(401);

      expect(response.body).toHaveProperty('statusCode', 401);
      expect(response.body).toHaveProperty('message');
    });

    it('should return consistent error format for 403', async () => {
      const response = await request(app.getHttpServer())
        .get('/admin/dashboard/stats')
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(403);

      expect(response.body).toHaveProperty('statusCode', 403);
      expect(response.body).toHaveProperty('message');
    });

    it('should return consistent error format for 404', async () => {
      const response = await request(app.getHttpServer())
        .get('/admin/users/00000000-0000-0000-0000-000000000000/details')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);

      expect(response.body).toHaveProperty('statusCode', 404);
      expect(response.body).toHaveProperty('message');
    });
  });

  describe('🔒 Security: Role-Based Access Control', () => {
    it('should enforce admin role for all admin endpoints', async () => {
      const endpoints = [
        '/admin/dashboard/stats',
        '/admin/users/activity-report',
        `/admin/users/${studentUser.id}/details`,
        '/admin/users/search',
        '/admin/platform/health',
      ];

      for (const endpoint of endpoints) {
        await request(app.getHttpServer())
          .get(endpoint)
          .set('Authorization', `Bearer ${studentToken}`)
          .expect(403);
      }
    });

    it('should require authentication for all admin endpoints', async () => {
      const endpoints = [
        '/admin/dashboard/stats',
        '/admin/users/activity-report',
        `/admin/users/${studentUser.id}/details`,
        '/admin/users/search',
        '/admin/platform/health',
      ];

      for (const endpoint of endpoints) {
        await request(app.getHttpServer()).get(endpoint).expect(401);
      }
    });
  });

  describe('🔒 Security: Sensitive Data Protection', () => {
    it('should never expose password in user details', async () => {
      const response = await request(app.getHttpServer())
        .get(`/admin/users/${studentUser.id}/details`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).not.toHaveProperty('password');
      expect(JSON.stringify(response.body)).not.toContain('$2');
    });

    it('should never expose password in search results', async () => {
      const response = await request(app.getHttpServer())
        .get('/admin/users/search')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      response.body.users.forEach((user: any) => {
        expect(user).not.toHaveProperty('password');
      });
    });
  });

  describe('📋 Response Metadata', () => {
    it('should include timestamps in ISO 8601 format', async () => {
      const response = await request(app.getHttpServer())
        .get('/admin/users/activity-report')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.period.from).toMatch(/^\d{4}-\d{2}-\d{2}T/);
      expect(response.body.period.to).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    });

    it('should return Content-Type: application/json', async () => {
      const response = await request(app.getHttpServer())
        .get('/admin/dashboard/stats')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.headers['content-type']).toMatch(/application\/json/);
    });
  });

  describe('📊 Numeric Data Validation', () => {
    it('should return non-negative numbers for counts', async () => {
      const response = await request(app.getHttpServer())
        .get('/admin/dashboard/stats')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.users.total).toBeGreaterThanOrEqual(0);
      expect(response.body.users.active).toBeGreaterThanOrEqual(0);
      expect(response.body.users.inactive).toBeGreaterThanOrEqual(0);
    });

    it('should return valid pagination numbers', async () => {
      const response = await request(app.getHttpServer())
        .get('/admin/users/search?page=1&limit=10')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.pagination.page).toBeGreaterThanOrEqual(1);
      expect(response.body.pagination.limit).toBeGreaterThanOrEqual(1);
      expect(response.body.pagination.total).toBeGreaterThanOrEqual(0);
      expect(response.body.pagination.totalPages).toBeGreaterThanOrEqual(0);
    });
  });
});
