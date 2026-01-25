import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../../src/app.module';
import { PrismaService } from '../../../src/prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { TestDatabaseHelper } from '../../helpers/test-database.helper';
import { Role, ReferralStatus } from '@prisma/client';

/**
 * Integration Tests for Referral Workflow
 * Tests complete referral lifecycle from creation to application and status updates
 */
describe('Referral Integration Tests - Complete Workflows', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let jwtService: JwtService;
  let dbHelper: TestDatabaseHelper;

  let alumniUser: any;
  let studentUser: any;
  let alumniToken: string;
  let studentToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }));

    prisma = app.get<PrismaService>(PrismaService);
    jwtService = app.get<JwtService>(JwtService);
    dbHelper = new TestDatabaseHelper();

    await app.init();
  });

  afterAll(async () => {
    await dbHelper.cleanup();
    await dbHelper.disconnect();
    await app.close();
  });

  beforeEach(async () => {
    await dbHelper.cleanup();

    // Create test users
    alumniUser = await dbHelper.createTestUser({
      email: 'alumni@kiit.ac.in',
      name: 'Test Alumni',
      role: Role.ALUM,
      isEmailVerified: true,
      isAccountActive: true,
    });

    studentUser = await dbHelper.createTestUser({
      email: 'student@kiit.ac.in',
      name: 'Test Student',
      role: Role.STUDENT,
      isEmailVerified: true,
      isAccountActive: true,
    });

    alumniToken = jwtService.sign({ sub: alumniUser.id, email: alumniUser.email });
    studentToken = jwtService.sign({ sub: studentUser.id, email: studentUser.email });
  });

  describe('✅ Complete Referral Creation Workflow', () => {
    it('should create referral, award points, and notify students', async () => {
      const referralData = {
        company: 'Google',
        jobTitle: 'Software Engineer',
        description: 'Backend role in Cloud team',
        requirements: '3+ years experience with Go and Kubernetes',
        location: 'Remote',
        deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        referralLink: 'https://google.com/careers/apply/123',
      };

      const response = await request(app.getHttpServer())
        .post('/referral')
        .set('Authorization', `Bearer ${alumniToken}`)
        .send(referralData)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.company).toBe(referralData.company);
      expect(response.body.status).toBe(ReferralStatus.PENDING);

      // Verify referral in database
      const referral = await prisma.referral.findUnique({
        where: { id: response.body.id },
      });

      expect(referral).toBeDefined();
      expect(referral?.alumniId).toBe(alumniUser.id);

      // Verify gamification points awarded
      const userPoints = await prisma.userPoints.findUnique({
        where: { userId: alumniUser.id },
      });

      expect(userPoints?.points).toBeGreaterThanOrEqual(50);
    });

    it('should reject referral creation from student', async () => {
      const referralData = {
        company: 'Microsoft',
        jobTitle: 'Intern',
        description: 'Summer internship',
        requirements: 'CS student',
        location: 'Redmond',
        deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      };

      await request(app.getHttpServer())
        .post('/referral')
        .set('Authorization', `Bearer ${studentToken}`)
        .send(referralData)
        .expect(403);
    });

    it('should reject referral without deadline', async () => {
      const referralData = {
        company: 'Amazon',
        jobTitle: 'Developer',
        description: 'Full-stack role',
        requirements: 'React and Node',
        location: 'Seattle',
      };

      const response = await request(app.getHttpServer())
        .post('/referral')
        .set('Authorization', `Bearer ${alumniToken}`)
        .send(referralData)
        .expect(400);

      expect(response.body.message).toContain('deadline');
    });
  });

  describe('✅ Complete Application Workflow', () => {
    let referral: any;

    beforeEach(async () => {
      // Create active referral
      referral = await prisma.referral.create({
        data: {
          company: 'Google',
          jobTitle: 'Engineer',
          description: 'Job',
          requirements: 'CS',
          location: 'Remote',
          deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          status: ReferralStatus.ACTIVE,
          alumniId: alumniUser.id,
        },
      });
    });

    it('should complete application submission workflow', async () => {
      const applicationData = {
        referralId: referral.id,
        coverLetter: 'I am very interested in this position...',
        resumeUrl: 'https://example.com/resume.pdf',
      };

      const response = await request(app.getHttpServer())
        .post('/referral/apply')
        .set('Authorization', `Bearer ${studentToken}`)
        .send(applicationData)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.status).toBe('PENDING');

      // Verify notification sent to alumni
      const notifications = await prisma.notification.findMany({
        where: { userId: alumniUser.id },
      });

      expect(notifications.length).toBeGreaterThan(0);
      expect(notifications[0].type).toBe('REFERRAL_APPLICATION');
    });

    it('should prevent duplicate applications', async () => {
      // First application
      await prisma.referralApplication.create({
        data: {
          referralId: referral.id,
          studentId: studentUser.id,
          coverLetter: 'First application',
          status: 'PENDING',
        },
      });

      // Second application (duplicate)
      const response = await request(app.getHttpServer())
        .post('/referral/apply')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          referralId: referral.id,
          coverLetter: 'Duplicate application',
        })
        .expect(400);

      expect(response.body.message).toContain('already applied');
    });

    it('should reject application to closed referral', async () => {
      // Close referral
      await prisma.referral.update({
        where: { id: referral.id },
        data: { status: ReferralStatus.CLOSED },
      });

      await request(app.getHttpServer())
        .post('/referral/apply')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          referralId: referral.id,
          coverLetter: 'Late application',
        })
        .expect(400);
    });

    it('should reject application to expired referral', async () => {
      // Set deadline to past
      await prisma.referral.update({
        where: { id: referral.id },
        data: { deadline: new Date(Date.now() - 24 * 60 * 60 * 1000) },
      });

      await request(app.getHttpServer())
        .post('/referral/apply')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          referralId: referral.id,
          coverLetter: 'Too late',
        })
        .expect(400);
    });
  });

  describe('✅ Application Status Update Workflow', () => {
    let referral: any;
    let application: any;

    beforeEach(async () => {
      referral = await prisma.referral.create({
        data: {
          company: 'Google',
          jobTitle: 'Engineer',
          description: 'Job',
          requirements: 'CS',
          location: 'Remote',
          deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          status: ReferralStatus.ACTIVE,
          alumniId: alumniUser.id,
        },
      });

      application = await prisma.referralApplication.create({
        data: {
          referralId: referral.id,
          studentId: studentUser.id,
          coverLetter: 'Application',
          status: 'PENDING',
        },
      });
    });

    it('should update application to ACCEPTED and notify student', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/referral/application/${application.id}`)
        .set('Authorization', `Bearer ${alumniToken}`)
        .send({ status: 'ACCEPTED' })
        .expect(200);

      expect(response.body.status).toBe('ACCEPTED');

      // Verify notification
      const notifications = await prisma.notification.findMany({
        where: { userId: studentUser.id },
      });

      expect(notifications.length).toBeGreaterThan(0);
      const acceptedNotification = notifications.find(
        (n) => n.message.includes('accepted'),
      );
      expect(acceptedNotification).toBeDefined();
    });

    it('should update application to REJECTED', async () => {
      await request(app.getHttpServer())
        .patch(`/referral/application/${application.id}`)
        .set('Authorization', `Bearer ${alumniToken}`)
        .send({ status: 'REJECTED' })
        .expect(200);

      const updated = await prisma.referralApplication.findUnique({
        where: { id: application.id },
      });

      expect(updated?.status).toBe('REJECTED');
    });

    it('should prevent student from updating own application', async () => {
      await request(app.getHttpServer())
        .patch(`/referral/application/${application.id}`)
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ status: 'ACCEPTED' })
        .expect(403);
    });
  });

  describe('❌ Idempotency Tests', () => {
    it('should handle concurrent application submissions', async () => {
      const referral = await prisma.referral.create({
        data: {
          company: 'Google',
          jobTitle: 'Engineer',
          description: 'Job',
          requirements: 'CS',
          location: 'Remote',
          deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          status: ReferralStatus.ACTIVE,
          alumniId: alumniUser.id,
        },
      });

      // Simulate concurrent requests
      const promises = Array(5).fill(null).map(() =>
        request(app.getHttpServer())
          .post('/referral/apply')
          .set('Authorization', `Bearer ${studentToken}`)
          .send({
            referralId: referral.id,
            coverLetter: 'Concurrent application',
          })
      );

      const responses = await Promise.all(promises);

      // Only one should succeed
      const successfulResponses = responses.filter((r) => r.status === 201);
      const failedResponses = responses.filter((r) => r.status === 400);

      expect(successfulResponses.length).toBe(1);
      expect(failedResponses.length).toBe(4);
    });
  });

  describe('✅ Referral Listing and Filtering', () => {
    beforeEach(async () => {
      // Create multiple referrals
      await prisma.referral.createMany({
        data: [
          {
            company: 'Google',
            jobTitle: 'SWE',
            description: 'Backend',
            requirements: 'CS',
            location: 'Remote',
            deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            status: ReferralStatus.ACTIVE,
            alumniId: alumniUser.id,
          },
          {
            company: 'Microsoft',
            jobTitle: 'PM',
            description: 'Product',
            requirements: 'MBA',
            location: 'Seattle',
            deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            status: ReferralStatus.ACTIVE,
            alumniId: alumniUser.id,
          },
          {
            company: 'Amazon',
            jobTitle: 'Developer',
            description: 'Full-stack',
            requirements: 'Web',
            location: 'Austin',
            deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            status: ReferralStatus.CLOSED,
            alumniId: alumniUser.id,
          },
        ],
      });
    });

    it('should list active referrals only', async () => {
      const response = await request(app.getHttpServer())
        .get('/referral')
        .set('Authorization', `Bearer ${studentToken}`)
        .query({ status: 'ACTIVE' })
        .expect(200);

      expect(response.body.length).toBe(2);
      expect(response.body.every((r: any) => r.status === 'ACTIVE')).toBe(true);
    });

    it('should filter referrals by company', async () => {
      const response = await request(app.getHttpServer())
        .get('/referral')
        .set('Authorization', `Bearer ${studentToken}`)
        .query({ company: 'Google' })
        .expect(200);

      expect(response.body.length).toBeGreaterThanOrEqual(1);
      expect(response.body[0].company).toBe('Google');
    });
  });
});
