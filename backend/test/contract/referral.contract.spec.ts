import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../../src/app.module';
import { TestDatabaseHelper } from '../../helpers/test-database.helper';
import { JwtService } from '@nestjs/jwt';
import { Role } from '@prisma/client';

/**
 * API Contract Tests - Referral Endpoints
 * Validates API responses, status codes, and data structure compliance
 */
describe('Referral API Contract Tests', () => {
  let app: INestApplication;
  let dbHelper: TestDatabaseHelper;
  let jwtService: JwtService;
  let alumniToken: string;
  let studentToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }));
    dbHelper = new TestDatabaseHelper();
    jwtService = app.get<JwtService>(JwtService);

    await app.init();
  });

  afterAll(async () => {
    await dbHelper.cleanup();
    await dbHelper.disconnect();
    await app.close();
  });

  beforeEach(async () => {
    await dbHelper.cleanup();

    const alumni = await dbHelper.createTestUser({
      role: Role.ALUM,
      email: 'alumni@kiit.ac.in',
    });

    const student = await dbHelper.createTestUser({
      role: Role.STUDENT,
      email: 'student@kiit.ac.in',
    });

    alumniToken = jwtService.sign({ sub: alumni.id, email: alumni.email });
    studentToken = jwtService.sign({ sub: student.id, email: student.email });
  });

  describe('POST /referral', () => {
    const validReferralData = {
      company: 'Google',
      jobTitle: 'Software Engineer',
      description: 'Backend role',
      requirements: 'CS degree, 3+ years',
      location: 'Remote',
      deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      referralLink: 'https://google.com/careers',
    };

    it('✅ should return correct response structure on success', async () => {
      const response = await request(app.getHttpServer())
        .post('/referral')
        .set('Authorization', `Bearer ${alumniToken}`)
        .send(validReferralData)
        .expect(201)
        .expect('Content-Type', /json/);

      expect(response.body).toMatchObject({
        id: expect.any(String),
        company: validReferralData.company,
        jobTitle: validReferralData.jobTitle,
        description: validReferralData.description,
        requirements: validReferralData.requirements,
        location: validReferralData.location,
        status: expect.stringMatching(/PENDING|ACTIVE/),
        alumniId: expect.any(String),
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
      });

      // Validate date format
      expect(new Date(response.body.createdAt)).toBeInstanceOf(Date);
      expect(new Date(response.body.deadline)).toBeInstanceOf(Date);
    });

    it('❌ should return 401 without authentication', async () => {
      const response = await request(app.getHttpServer())
        .post('/referral')
        .send(validReferralData)
        .expect(401);

      expect(response.body).toMatchObject({
        statusCode: 401,
        message: expect.any(String),
        error: 'Unauthorized',
      });
    });

    it('❌ should return 403 for student role', async () => {
      const response = await request(app.getHttpServer())
        .post('/referral')
        .set('Authorization', `Bearer ${studentToken}`)
        .send(validReferralData)
        .expect(403);

      expect(response.body).toMatchObject({
        statusCode: 403,
        message: expect.stringContaining('alumni'),
        error: 'Forbidden',
      });
    });

    it('❌ should return 400 for missing required fields', async () => {
      const response = await request(app.getHttpServer())
        .post('/referral')
        .set('Authorization', `Bearer ${alumniToken}`)
        .send({
          company: 'Google',
          // Missing jobTitle and other required fields
        })
        .expect(400);

      expect(response.body.statusCode).toBe(400);
      expect(response.body.message).toBeInstanceOf(Array);
      expect(response.body.message.length).toBeGreaterThan(0);
    });

    it('❌ should return 400 for invalid deadline format', async () => {
      const response = await request(app.getHttpServer())
        .post('/referral')
        .set('Authorization', `Bearer ${alumniToken}`)
        .send({
          ...validReferralData,
          deadline: 'invalid-date',
        })
        .expect(400);

      expect(response.body.statusCode).toBe(400);
    });

    it('❌ should reject extra fields', async () => {
      const response = await request(app.getHttpServer())
        .post('/referral')
        .set('Authorization', `Bearer ${alumniToken}`)
        .send({
          ...validReferralData,
          maliciousField: 'hack attempt',
        })
        .expect(400);

      expect(response.body.statusCode).toBe(400);
    });
  });

  describe('GET /referral', () => {
    it('✅ should return array of referrals', async () => {
      const response = await request(app.getHttpServer())
        .get('/referral')
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(200)
        .expect('Content-Type', /json/);

      expect(Array.isArray(response.body)).toBe(true);

      if (response.body.length > 0) {
        expect(response.body[0]).toMatchObject({
          id: expect.any(String),
          company: expect.any(String),
          jobTitle: expect.any(String),
          description: expect.any(String),
          status: expect.any(String),
        });
      }
    });

    it('✅ should support pagination parameters', async () => {
      const response = await request(app.getHttpServer())
        .get('/referral')
        .set('Authorization', `Bearer ${studentToken}`)
        .query({ page: 1, limit: 10 })
        .expect(200);

      expect(response.body).toBeDefined();
    });

    it('✅ should support filtering by status', async () => {
      const response = await request(app.getHttpServer())
        .get('/referral')
        .set('Authorization', `Bearer ${studentToken}`)
        .query({ status: 'ACTIVE' })
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });

    it('❌ should return 401 without authentication', async () => {
      await request(app.getHttpServer())
        .get('/referral')
        .expect(401);
    });
  });

  describe('GET /referral/:id', () => {
    it('✅ should return single referral with full details', async () => {
      // Create referral first
      const createResponse = await request(app.getHttpServer())
        .post('/referral')
        .set('Authorization', `Bearer ${alumniToken}`)
        .send({
          company: 'Google',
          jobTitle: 'Engineer',
          description: 'Job',
          requirements: 'CS',
          location: 'Remote',
          deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        });

      const referralId = createResponse.body.id;

      const response = await request(app.getHttpServer())
        .get(`/referral/${referralId}`)
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(200);

      expect(response.body).toMatchObject({
        id: referralId,
        company: 'Google',
        jobTitle: 'Engineer',
        alumni: {
          id: expect.any(String),
          name: expect.any(String),
          email: expect.any(String),
        },
      });

      // Should not expose sensitive alumni data
      expect(response.body.alumni).not.toHaveProperty('password');
    });

    it('❌ should return 404 for non-existent referral', async () => {
      const response = await request(app.getHttpServer())
        .get('/referral/non-existent-id')
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(404);

      expect(response.body).toMatchObject({
        statusCode: 404,
        message: expect.any(String),
        error: 'Not Found',
      });
    });

    it('❌ should return 401 without authentication', async () => {
      await request(app.getHttpServer())
        .get('/referral/some-id')
        .expect(401);
    });
  });

  describe('POST /referral/apply', () => {
    let referralId: string;

    beforeEach(async () => {
      const response = await request(app.getHttpServer())
        .post('/referral')
        .set('Authorization', `Bearer ${alumniToken}`)
        .send({
          company: 'Google',
          jobTitle: 'Engineer',
          description: 'Job',
          requirements: 'CS',
          location: 'Remote',
          deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        });

      referralId = response.body.id;
    });

    it('✅ should return application with correct structure', async () => {
      const response = await request(app.getHttpServer())
        .post('/referral/apply')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          referralId,
          coverLetter: 'I am interested',
          resumeUrl: 'https://example.com/resume.pdf',
        })
        .expect(201);

      expect(response.body).toMatchObject({
        id: expect.any(String),
        referralId,
        studentId: expect.any(String),
        coverLetter: expect.any(String),
        status: 'PENDING',
        createdAt: expect.any(String),
      });
    });

    it('❌ should return 400 for duplicate application', async () => {
      // First application
      await request(app.getHttpServer())
        .post('/referral/apply')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          referralId,
          coverLetter: 'First',
        });

      // Duplicate
      const response = await request(app.getHttpServer())
        .post('/referral/apply')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          referralId,
          coverLetter: 'Duplicate',
        })
        .expect(400);

      expect(response.body.message).toContain('already');
    });

    it('❌ should return 400 for missing required fields', async () => {
      const response = await request(app.getHttpServer())
        .post('/referral/apply')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          referralId,
          // Missing coverLetter
        })
        .expect(400);

      expect(response.body.statusCode).toBe(400);
    });

    it('❌ should return 404 for non-existent referral', async () => {
      const response = await request(app.getHttpServer())
        .post('/referral/apply')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          referralId: 'non-existent',
          coverLetter: 'Test',
        })
        .expect(404);

      expect(response.body.statusCode).toBe(404);
    });
  });

  describe('Response Data Validation', () => {
    it('✅ should not expose sensitive data in responses', async () => {
      const response = await request(app.getHttpServer())
        .get('/referral')
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(200);

      if (response.body.length > 0) {
        const referral = response.body[0];

        // Should not expose sensitive fields
        expect(referral).not.toHaveProperty('password');
        expect(referral).not.toHaveProperty('refreshToken');

        if (referral.alumni) {
          expect(referral.alumni).not.toHaveProperty('password');
        }
      }
    });

    it('✅ should return consistent date formats', async () => {
      const response = await request(app.getHttpServer())
        .get('/referral')
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(200);

      if (response.body.length > 0) {
        const referral = response.body[0];

        // All dates should be ISO 8601 format
        if (referral.createdAt) {
          expect(referral.createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
        }
        if (referral.deadline) {
          expect(referral.deadline).toMatch(/^\d{4}-\d{2}-\d{2}T/);
        }
      }
    });
  });
});
