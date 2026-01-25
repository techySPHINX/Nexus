import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/prisma/prisma.service';
import { TestDatabaseHelper } from '../helpers/test-database.helper';
import { JwtService } from '@nestjs/jwt';
import { Role, AccountStatus } from '@prisma/client';

describe('Admin Integration Tests', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let dbHelper: TestDatabaseHelper;
  let jwtService: JwtService;

  let adminUser: any;
  let studentUser: any;
  let alumniUser: any;
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

    alumniUser = await dbHelper.createTestUser({
      email: 'alumni@kiit.ac.in',
      name: 'Test Alumni',
      role: Role.ALUM,
      accountStatus: AccountStatus.ACTIVE,
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

  describe('✅ Dashboard Statistics Workflow', () => {
    it('should retrieve complete dashboard statistics', async () => {
      const response = await request(app.getHttpServer())
        .get('/admin/dashboard/stats')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('users');
      expect(response.body.users).toHaveProperty('total');
      expect(response.body.users).toHaveProperty('active');
      expect(response.body.users).toHaveProperty('inactive');
      expect(response.body).toHaveProperty('verifications');
      expect(response.body).toHaveProperty('platformMetrics');
      expect(response.body.users.total).toBeGreaterThanOrEqual(3);
    });

    it('should calculate active vs inactive users correctly', async () => {
      // Create an inactive user
      await dbHelper.createTestUser({
        email: 'inactive@kiit.ac.in',
        name: 'Inactive User',
        role: Role.STUDENT,
        accountStatus: AccountStatus.SUSPENDED,
      });

      const response = await request(app.getHttpServer())
        .get('/admin/dashboard/stats')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.users.inactive).toBeGreaterThanOrEqual(1);
      expect(response.body.users.active).toBe(
        response.body.users.total - response.body.users.inactive,
      );
    });

    it('should count pending verifications', async () => {
      // Create verification request
      await prisma.verificationDocument.create({
        data: {
          userId: studentUser.id,
          documentType: 'STUDENT_ID',
          documentUrl: 'https://example.com/doc1.pdf',
          status: 'PENDING',
        },
      });

      const response = await request(app.getHttpServer())
        .get('/admin/dashboard/stats')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.verifications.pending).toBeGreaterThanOrEqual(1);
    });

    it('should deny non-admin access to dashboard', async () => {
      await request(app.getHttpServer())
        .get('/admin/dashboard/stats')
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(403);
    });

    it('should require authentication for dashboard access', async () => {
      await request(app.getHttpServer())
        .get('/admin/dashboard/stats')
        .expect(401);
    });
  });

  describe('✅ User Activity Report Workflow', () => {
    it('should retrieve user activity report with default period', async () => {
      const response = await request(app.getHttpServer())
        .get('/admin/users/activity-report')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('period');
      expect(response.body).toHaveProperty('totalUsers');
      expect(response.body).toHaveProperty('activeUsers');
      expect(response.body).toHaveProperty('newUsers');
      expect(response.body.period).toHaveProperty('days', 7);
    });

    it('should retrieve user activity report with custom period', async () => {
      const response = await request(app.getHttpServer())
        .get('/admin/users/activity-report?days=30')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.period.days).toBe(30);
    });

    it('should include users by role breakdown', async () => {
      const response = await request(app.getHttpServer())
        .get('/admin/users/activity-report')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('usersByRole');
      expect(response.body.usersByRole).toHaveProperty('STUDENT');
      expect(response.body.usersByRole).toHaveProperty('ALUMNI');
      expect(response.body.usersByRole).toHaveProperty('ADMIN');
    });

    it('should deny non-admin access', async () => {
      await request(app.getHttpServer())
        .get('/admin/users/activity-report')
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(403);
    });
  });

  describe('✅ User Details Retrieval Workflow', () => {
    beforeEach(async () => {
      // Create some posts for the user
      await prisma.post.create({
        data: {
          authorId: studentUser.id,
          subject: 'Test Post',
          content: 'Test post content',
          type: 'TEXT',
        },
      });

      // Create showcase project
      await prisma.project.create({
        data: {
          ownerId: studentUser.id,
          title: 'Test Project',
          description: 'Project description',
        },
      });
    });

    it('should retrieve comprehensive user details', async () => {
      const response = await request(app.getHttpServer())
        .get(`/admin/users/${studentUser.id}/details`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('id', studentUser.id);
      expect(response.body).toHaveProperty('name');
      expect(response.body).toHaveProperty('email');
      expect(response.body).toHaveProperty('role');
      expect(response.body).toHaveProperty('profile');
      expect(response.body).toHaveProperty('posts');
      expect(response.body).toHaveProperty('projects');
      expect(response.body).not.toHaveProperty('password');
    });

    it('should include recent posts in user details', async () => {
      const response = await request(app.getHttpServer())
        .get(`/admin/users/${studentUser.id}/details`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.posts).toBeInstanceOf(Array);
      expect(response.body.posts.length).toBeGreaterThan(0);
      expect(response.body.posts[0]).toHaveProperty('content');
    });

    it('should return 404 for non-existent user', async () => {
      await request(app.getHttpServer())
        .get('/admin/users/00000000-0000-0000-0000-000000000000/details')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });

    it('should deny non-admin access', async () => {
      await request(app.getHttpServer())
        .get(`/admin/users/${studentUser.id}/details`)
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(403);
    });
  });

  describe('✅ Advanced User Search Workflow', () => {
    beforeEach(async () => {
      // Create additional users with varied attributes
      await dbHelper.createTestUser({
        email: 'john.smith@kiit.ac.in',
        name: 'John Smith',
        role: Role.STUDENT,
        accountStatus: AccountStatus.ACTIVE,
      });

      await dbHelper.createTestUser({
        email: 'jane.doe@kiit.ac.in',
        name: 'Jane Doe',
        role: Role.ALUM,
        accountStatus: AccountStatus.SUSPENDED,
      });
    });

    it('should search users by query string', async () => {
      const response = await request(app.getHttpServer())
        .get('/admin/users/search?query=john')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('users');
      expect(response.body).toHaveProperty('pagination');
      expect(response.body.users).toBeInstanceOf(Array);
      expect(response.body.users.some((u: any) => u.name.includes('John'))).toBe(true);
    });

    it('should filter users by role', async () => {
      const response = await request(app.getHttpServer())
        .get('/admin/users/search?role=STUDENT')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.users).toBeInstanceOf(Array);
      response.body.users.forEach((user: any) => {
        expect(user.role).toBe('STUDENT');
      });
    });

    it('should filter users by account status', async () => {
      const response = await request(app.getHttpServer())
        .get('/admin/users/search?accountStatus=SUSPENDED')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.users).toBeInstanceOf(Array);
      response.body.users.forEach((user: any) => {
        expect(user.accountStatus).toBe('SUSPENDED');
      });
    });

    it('should support pagination', async () => {
      const response = await request(app.getHttpServer())
        .get('/admin/users/search?page=1&limit=2')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.pagination).toHaveProperty('page', 1);
      expect(response.body.pagination).toHaveProperty('limit', 2);
      expect(response.body.pagination).toHaveProperty('total');
      expect(response.body.pagination).toHaveProperty('totalPages');
      expect(response.body.users.length).toBeLessThanOrEqual(2);
    });

    it('should combine query and filters', async () => {
      const response = await request(app.getHttpServer())
        .get('/admin/users/search?query=jane&role=ALUMNI')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.users).toBeInstanceOf(Array);
      response.body.users.forEach((user: any) => {
        expect(user.role).toBe('ALUMNI');
      });
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

    it('should deny non-admin access', async () => {
      await request(app.getHttpServer())
        .get('/admin/users/search')
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(403);
    });
  });

  describe('✅ Platform Health Metrics Workflow', () => {
    beforeEach(async () => {
      // Create security events
      await prisma.securityEvent.create({
        data: {
          userId: studentUser.id,
          eventType: 'LOGIN_FAILED',
          ipAddress: '192.168.1.1',
          metadata: { reason: 'Invalid password' },
        },
      });

      // Create locked account
      await prisma.user.update({
        where: { id: alumniUser.id },
        data: {
          lockedUntil: new Date(Date.now() + 60000), // 1 minute in future
        },
      });
    });

    it('should retrieve platform health metrics', async () => {
      const response = await request(app.getHttpServer())
        .get('/admin/platform/health')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('failedLogins');
      expect(response.body).toHaveProperty('lockedAccounts');
      expect(response.body).toHaveProperty('recentSecurityEvents');
      expect(response.body).toHaveProperty('timestamp');
    });

    it('should count failed login attempts', async () => {
      const response = await request(app.getHttpServer())
        .get('/admin/platform/health')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.failedLogins).toBeGreaterThanOrEqual(1);
    });

    it('should count currently locked accounts', async () => {
      const response = await request(app.getHttpServer())
        .get('/admin/platform/health')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.lockedAccounts).toBeGreaterThanOrEqual(1);
    });

    it('should include recent security events (last 24 hours)', async () => {
      const response = await request(app.getHttpServer())
        .get('/admin/platform/health')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.recentSecurityEvents).toBeGreaterThanOrEqual(1);
    });

    it('should deny non-admin access', async () => {
      await request(app.getHttpServer())
        .get('/admin/platform/health')
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(403);
    });
  });

  describe('❌ Edge Cases: Invalid Input Validation', () => {
    it('should handle invalid UUID in user details', async () => {
      await request(app.getHttpServer())
        .get('/admin/users/invalid-uuid/details')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });

    it('should handle negative page number', async () => {
      const response = await request(app.getHttpServer())
        .get('/admin/users/search?page=-1')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.pagination.page).toBeGreaterThanOrEqual(1);
    });

    it('should handle zero limit', async () => {
      const response = await request(app.getHttpServer())
        .get('/admin/users/search?limit=0')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.users.length).toBeGreaterThanOrEqual(0);
    });

    it('should handle invalid role filter', async () => {
      await request(app.getHttpServer())
        .get('/admin/users/search?role=INVALID_ROLE')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(400);
    });

    it('should handle invalid account status filter', async () => {
      await request(app.getHttpServer())
        .get('/admin/users/search?accountStatus=INVALID_STATUS')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(400);
    });
  });

  describe('❌ Edge Cases: Boundary Values', () => {
    it('should handle activity report with 0 days', async () => {
      const response = await request(app.getHttpServer())
        .get('/admin/users/activity-report?days=0')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.period.days).toBe(0);
      expect(response.body.newUsers).toBe(0);
    });

    it('should handle activity report with very large days', async () => {
      const response = await request(app.getHttpServer())
        .get('/admin/users/activity-report?days=36500') // 100 years
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.period.days).toBe(36500);
    });

    it('should handle search with very large page number', async () => {
      const response = await request(app.getHttpServer())
        .get('/admin/users/search?page=999999')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.users).toEqual([]);
    });

    it('should handle search with very large limit', async () => {
      const response = await request(app.getHttpServer())
        .get('/admin/users/search?limit=10000')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.users).toBeInstanceOf(Array);
    });
  });

  describe('❌ Edge Cases: Special Characters', () => {
    it('should handle special characters in search query', async () => {
      const response = await request(app.getHttpServer())
        .get('/admin/users/search?query=' + encodeURIComponent("O'Brien"))
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('users');
    });

    it('should handle Unicode characters in search', async () => {
      const response = await request(app.getHttpServer())
        .get('/admin/users/search?query=' + encodeURIComponent('你好'))
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('users');
    });

    it('should handle SQL injection attempts in search', async () => {
      const response = await request(app.getHttpServer())
        .get(
          '/admin/users/search?query=' +
          encodeURIComponent("' OR '1'='1' --"),
        )
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.users).toBeInstanceOf(Array);
    });
  });

  describe('🔒 Security: Authorization Enforcement', () => {
    it('should require JWT for all admin endpoints', async () => {
      await request(app.getHttpServer())
        .get('/admin/dashboard/stats')
        .expect(401);

      await request(app.getHttpServer())
        .get('/admin/users/activity-report')
        .expect(401);

      await request(app.getHttpServer())
        .get(`/admin/users/${studentUser.id}/details`)
        .expect(401);

      await request(app.getHttpServer())
        .get('/admin/users/search')
        .expect(401);

      await request(app.getHttpServer())
        .get('/admin/platform/health')
        .expect(401);
    });

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

    it('should not expose passwords in any response', async () => {
      const detailsResponse = await request(app.getHttpServer())
        .get(`/admin/users/${studentUser.id}/details`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(detailsResponse.body).not.toHaveProperty('password');

      const searchResponse = await request(app.getHttpServer())
        .get('/admin/users/search')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      searchResponse.body.users.forEach((user: any) => {
        expect(user).not.toHaveProperty('password');
      });
    });
  });

  describe('✅ Complete Admin Management Lifecycle', () => {
    it('should execute full admin workflow', async () => {
      // 1. Check dashboard stats
      const statsResponse = await request(app.getHttpServer())
        .get('/admin/dashboard/stats')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(statsResponse.body.users.total).toBeGreaterThan(0);

      // 2. Get activity report
      const activityResponse = await request(app.getHttpServer())
        .get('/admin/users/activity-report?days=7')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(activityResponse.body.totalUsers).toBeGreaterThan(0);

      // 3. Search for specific user
      const searchResponse = await request(app.getHttpServer())
        .get('/admin/users/search?query=student')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(searchResponse.body.users.length).toBeGreaterThan(0);

      // 4. Get detailed user information
      const detailsResponse = await request(app.getHttpServer())
        .get(`/admin/users/${studentUser.id}/details`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(detailsResponse.body.id).toBe(studentUser.id);

      // 5. Check platform health
      const healthResponse = await request(app.getHttpServer())
        .get('/admin/platform/health')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(healthResponse.body).toHaveProperty('timestamp');

      // 6. Filter users by role
      const roleFilterResponse = await request(app.getHttpServer())
        .get('/admin/users/search?role=STUDENT')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      roleFilterResponse.body.users.forEach((user: any) => {
        expect(user.role).toBe('STUDENT');
      });
    });
  });
});
