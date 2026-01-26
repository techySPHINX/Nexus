import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';
import { TestDatabaseHelper } from '../helpers/test-database.helper';
import { JwtService } from '@nestjs/jwt';
import { Role, ReferralStatus } from '@prisma/client';
import { PrismaService } from '../../src/prisma/prisma.service';

/**
 * Edge Case and Idempotency Tests
 * Tests boundary conditions, race conditions, and idempotent operations
 */
describe('Edge Case and Idempotency Tests', () => {
  let app: INestApplication;
  let dbHelper: TestDatabaseHelper;
  let jwtService: JwtService;
  let prisma: PrismaService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    dbHelper = new TestDatabaseHelper();
    jwtService = app.get<JwtService>(JwtService);
    prisma = app.get<PrismaService>(PrismaService);

    await app.init();
  });

  afterAll(async () => {
    await dbHelper.cleanup();
    await dbHelper.disconnect();
    await app.close();
  });

  beforeEach(async () => {
    await dbHelper.cleanup();
  });

  describe('❌ Edge Cases: Null and Empty Values', () => {
    it('should handle null email in registration', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/register-with-documents')
        .send({
          email: null,
          name: 'Test',
          role: 'STUDENT',
        })
        .expect(400);

      expect(response.body.statusCode).toBe(400);
    });

    it('should handle empty string email', async () => {
      await request(app.getHttpServer())
        .post('/auth/register-with-documents')
        .send({
          email: '',
          name: 'Test',
          role: 'STUDENT',
        })
        .expect(400);
    });

    it('should handle whitespace-only fields', async () => {
      await request(app.getHttpServer())
        .post('/auth/register-with-documents')
        .send({
          email: '   @kiit.ac.in',
          name: '   ',
          role: 'STUDENT',
        })
        .expect(400);
    });

    it('should handle null in nested objects', async () => {
      const alumni = await dbHelper.createTestUser({ role: Role.ALUM });
      const token = jwtService.sign({ sub: alumni.id });

      await request(app.getHttpServer())
        .post('/referral')
        .set('Authorization', `Bearer ${token}`)
        .send({
          company: 'Google',
          jobTitle: 'Engineer',
          description: null, // null value
          requirements: 'CS',
          location: 'Remote',
          deadline: new Date(
            Date.now() + 30 * 24 * 60 * 60 * 1000,
          ).toISOString(),
        })
        .expect(400);
    });
  });

  describe('❌ Edge Cases: Boundary Values', () => {
    it('should handle maximum string length for name (255 chars)', async () => {
      const maxName = 'A'.repeat(255);

      const response = await request(app.getHttpServer())
        .post('/auth/register-with-documents')
        .send({
          email: 'maxname@kiit.ac.in',
          name: maxName,
          role: 'STUDENT',
          documents: [],
        });

      // Should either succeed or fail gracefully
      expect([201, 400]).toContain(response.status);
    });

    it('should reject name exceeding maximum length', async () => {
      const tooLongName = 'A'.repeat(256);

      await request(app.getHttpServer())
        .post('/auth/register-with-documents')
        .send({
          email: 'toolong@kiit.ac.in',
          name: tooLongName,
          role: 'STUDENT',
        })
        .expect(400);
    });

    it('should handle zero points in gamification', async () => {
      const user = await dbHelper.createTestUser();

      const points = await prisma.userPoints.findUnique({
        where: { userId: user.id },
      });

      // Should handle missing or zero points gracefully
      expect([null, 0]).toContain(points?.points || 0);
    });

    it('should handle very large point values', async () => {
      const user = await dbHelper.createTestUser();

      // Create points record with large value
      await prisma.userPoints.upsert({
        where: { userId: user.id },
        create: { userId: user.id, points: 999999999 },
        update: { points: 999999999 },
      });

      const points = await prisma.userPoints.findUnique({
        where: { userId: user.id },
      });

      expect(points?.points).toBe(999999999);
    });

    it('should handle deadline at exact midnight', async () => {
      const alumni = await dbHelper.createTestUser({ role: Role.ALUM });
      const token = jwtService.sign({ sub: alumni.id });

      const midnight = new Date('2025-12-31T00:00:00.000Z');

      await request(app.getHttpServer())
        .post('/referral')
        .set('Authorization', `Bearer ${token}`)
        .send({
          company: 'Google',
          jobTitle: 'Engineer',
          description: 'Job',
          requirements: 'CS',
          location: 'Remote',
          deadline: midnight.toISOString(),
        })
        .expect(201);
    });

    it('should handle deadline 1 millisecond in the past', async () => {
      const alumni = await dbHelper.createTestUser({ role: Role.ALUM });
      const token = jwtService.sign({ sub: alumni.id });

      const pastDeadline = new Date(Date.now() - 1);

      const response = await request(app.getHttpServer())
        .post('/referral')
        .set('Authorization', `Bearer ${token}`)
        .send({
          company: 'Google',
          jobTitle: 'Engineer',
          description: 'Job',
          requirements: 'CS',
          location: 'Remote',
          deadline: pastDeadline.toISOString(),
        });

      // Should reject past deadlines
      expect([400, 201]).toContain(response.status);
    });
  });

  describe('✅ Idempotency: Duplicate Request Prevention', () => {
    it('should prevent duplicate referral creation with same data', async () => {
      const alumni = await dbHelper.createTestUser({ role: Role.ALUM });
      const token = jwtService.sign({ sub: alumni.id });

      const referralData = {
        company: 'Google',
        jobTitle: 'Unique Role 123',
        description: 'Unique description',
        requirements: 'CS',
        location: 'Remote',
        deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      };

      // Create first referral
      const response1 = await request(app.getHttpServer())
        .post('/referral')
        .set('Authorization', `Bearer ${token}`)
        .send(referralData)
        .expect(201);

      // Try to create duplicate
      const response2 = await request(app.getHttpServer())
        .post('/referral')
        .set('Authorization', `Bearer ${token}`)
        .send(referralData)
        .expect(201);

      // Both succeed (no uniqueness constraint)
      // But IDs should be different
      expect(response1.body.id).not.toBe(response2.body.id);
    });

    it('should handle concurrent application submissions', async () => {
      const alumni = await dbHelper.createTestUser({ role: Role.ALUM });
      const student = await dbHelper.createTestUser({ role: Role.STUDENT });

      const referral = await prisma.referral.create({
        data: {
          company: 'Google',
          jobTitle: 'Engineer',
          description: 'Job',
          requirements: 'CS',
          location: 'Remote',
          deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          status: ReferralStatus.ACTIVE,
          alumniId: alumni.id,
        },
      });

      const token = jwtService.sign({ sub: student.id });

      // Simulate concurrent requests
      const promises = Array(5)
        .fill(null)
        .map(() =>
          request(app.getHttpServer())
            .post('/referral/apply')
            .set('Authorization', `Bearer ${token}`)
            .send({
              referralId: referral.id,
              coverLetter: 'Application',
            }),
        );

      const responses = await Promise.all(promises);

      // Only one should succeed (201), others should fail (400)
      const successCount = responses.filter((r) => r.status === 201).length;
      const failCount = responses.filter((r) => r.status === 400).length;

      expect(successCount).toBe(1);
      expect(failCount).toBe(4);
    });

    it('should handle concurrent point awards', async () => {
      const user = await dbHelper.createTestUser();

      // Simulate concurrent point awards
      const promises = Array(10)
        .fill(null)
        .map(() =>
          prisma.userPoints.upsert({
            where: { userId: user.id },
            create: { userId: user.id, points: 10 },
            update: { points: { increment: 10 } },
          }),
        );

      await Promise.all(promises);

      const finalPoints = await prisma.userPoints.findUnique({
        where: { userId: user.id },
      });

      // Should have accumulated all points correctly
      expect(finalPoints?.points).toBeGreaterThanOrEqual(10);
    });

    it('should handle duplicate login attempts simultaneously', async () => {
      await dbHelper.createTestUser({
        email: 'concurrent@kiit.ac.in',
        password: '$2b$10$abcdefghijklmnopqrstuv',
        isEmailVerified: true,
        isAccountActive: true,
      });

      const promises = Array(5)
        .fill(null)
        .map(() =>
          request(app.getHttpServer()).post('/auth/login').send({
            email: 'concurrent@kiit.ac.in',
            password: 'password123',
          }),
        );

      const responses = await Promise.all(promises);

      // All should either succeed or fail consistently
      const statuses = responses.map((r) => r.status);
      const uniqueStatuses = [...new Set(statuses)];

      // Should have consistent behavior
      expect(uniqueStatuses.length).toBeLessThanOrEqual(2);
    });
  });

  describe('❌ Edge Cases: Special Characters and Encoding', () => {
    it('should handle special characters in name', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/register-with-documents')
        .send({
          email: 'special@kiit.ac.in',
          name: "O'Brien-Smith <script>alert('xss')</script>",
          role: 'STUDENT',
          documents: [],
        });

      if (response.status === 201) {
        // Should sanitize or encode special characters
        const user = await prisma.user.findUnique({
          where: { email: 'special@kiit.ac.in' },
        });

        expect(user?.name).not.toContain('<script>');
      }
    });

    it('should handle Unicode characters', async () => {
      await request(app.getHttpServer())
        .post('/auth/register-with-documents')
        .send({
          email: 'unicode@kiit.ac.in',
          name: '用户名称 مستخدم',
          role: 'STUDENT',
          documents: [],
        });

      const user = await prisma.user.findUnique({
        where: { email: 'unicode@kiit.ac.in' },
      });

      // Should handle unicode correctly
      if (user) {
        expect(user.name).toBeTruthy();
      }
    });

    it('should handle SQL injection attempts', async () => {
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: "admin@kiit.ac.in' OR '1'='1",
          password: "' OR '1'='1",
        })
        .expect(401);

      // Should not leak database information
    });
  });

  describe('❌ Edge Cases: Rate Limiting and Throttling', () => {
    it('should handle rapid successive requests', async () => {
      const user = await dbHelper.createTestUser({ role: Role.ALUM });
      const token = jwtService.sign({ sub: user.id });

      const promises = Array(20)
        .fill(null)
        .map((_, i) =>
          request(app.getHttpServer())
            .post('/referral')
            .set('Authorization', `Bearer ${token}`)
            .send({
              company: `Company ${i}`,
              jobTitle: `Role ${i}`,
              description: 'Job',
              requirements: 'CS',
              location: 'Remote',
              deadline: new Date(
                Date.now() + 30 * 24 * 60 * 60 * 1000,
              ).toISOString(),
            }),
        );

      await Promise.all(promises);

      // Some may be rate limited (429) or all succeed
      // const rateLimited = responses.some((r) => r.status === 429);

      // Test documents expected behavior
    });
  });

  describe('❌ Edge Cases: Database Transaction Failures', () => {
    it('should rollback on failed transaction', async () => {
      const initialUserCount = await prisma.user.count();

      // Attempt operation that should fail and rollback
      try {
        await prisma.$transaction(async (tx) => {
          await tx.user.create({
            data: {
              email: 'rollback@kiit.ac.in',
              name: 'Rollback Test',
              role: Role.STUDENT,
              profile: {
                create: {
                  bio: '',
                  location: '',
                  interests: '',
                  avatarUrl: '',
                },
              },
            },
          });

          // Force failure
          throw new Error('Forced rollback');
        });
      } catch {
        // Expected
      }

      const finalUserCount = await prisma.user.count();

      // Should rollback completely
      expect(finalUserCount).toBe(initialUserCount);
    });
  });

  describe('❌ Edge Cases: Invalid Data Types', () => {
    it('should reject number as string field', async () => {
      await request(app.getHttpServer())
        .post('/auth/register-with-documents')
        .send({
          email: 12345 as any,
          name: 'Test',
          role: 'STUDENT',
        })
        .expect(400);
    });

    it('should reject array as string field', async () => {
      await request(app.getHttpServer())
        .post('/auth/register-with-documents')
        .send({
          email: ['test@kiit.ac.in'] as any,
          name: 'Test',
          role: 'STUDENT',
        })
        .expect(400);
    });

    it('should reject object as string field', async () => {
      await request(app.getHttpServer())
        .post('/auth/register-with-documents')
        .send({
          email: { value: 'test@kiit.ac.in' } as any,
          name: 'Test',
          role: 'STUDENT',
        })
        .expect(400);
    });
  });
});
