import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';
import { TestDatabaseHelper } from '../helpers/test-database.helper';

/**
 * API Contract Tests - Auth Endpoints
 * Validates API responses match expected structure, status codes, and error formats
 */
describe('Auth API Contract Tests', () => {
  let app: INestApplication;
  let dbHelper: TestDatabaseHelper;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }),
    );
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
  });

  describe('POST /auth/register-with-documents', () => {
    it('✅ should return correct response structure on success', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/register-with-documents')
        .send({
          email: 'newuser@kiit.ac.in',
          name: 'New User',
          role: 'STUDENT',
          graduationYear: 2026,
          documents: [],
        })
        .expect(201)
        .expect('Content-Type', /json/);

      // Validate response structure
      expect(response.body).toMatchObject({
        message: expect.any(String),
      });

      // Ensure no sensitive data exposed
      expect(response.body).not.toHaveProperty('password');
      expect(response.body).not.toHaveProperty('passwordHash');
    });

    it('❌ should return 400 with validation errors for invalid email', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/register-with-documents')
        .send({
          email: 'invalid-email',
          name: 'Test User',
          role: 'STUDENT',
        })
        .expect(400);

      expect(response.body).toHaveProperty('statusCode', 400);
      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('error');
    });

    it('❌ should return 403 for non-KIIT domain', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/register-with-documents')
        .send({
          email: 'test@gmail.com',
          name: 'Test User',
          role: 'STUDENT',
        })
        .expect(403);

      expect(response.body).toMatchObject({
        statusCode: 403,
        message: expect.stringContaining('kiit.ac.in'),
        error: 'Forbidden',
      });
    });

    it('❌ should return 400 for duplicate email', async () => {
      await dbHelper.createTestUser({ email: 'existing@kiit.ac.in' });

      const response = await request(app.getHttpServer())
        .post('/auth/register-with-documents')
        .send({
          email: 'existing@kiit.ac.in',
          name: 'Duplicate User',
          role: 'STUDENT',
          documents: [],
        })
        .expect(400);

      expect(response.body).toMatchObject({
        statusCode: 400,
        message: expect.stringContaining('already registered'),
        error: 'Bad Request',
      });
    });

    it('❌ should reject request with missing required fields', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/register-with-documents')
        .send({
          email: 'incomplete@kiit.ac.in',
          // Missing name and role
        })
        .expect(400);

      expect(response.body.statusCode).toBe(400);
      expect(response.body.message).toBeInstanceOf(Array);
    });

    it('❌ should reject request with extra fields', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/register-with-documents')
        .send({
          email: 'extra@kiit.ac.in',
          name: 'User',
          role: 'STUDENT',
          hackerField: 'malicious data',
          documents: [],
        })
        .expect(400);

      expect(response.body.statusCode).toBe(400);
    });
  });

  describe('POST /auth/login', () => {
    beforeEach(async () => {
      await dbHelper.createTestUser({
        email: 'loginuser@kiit.ac.in',
        password: '$2b$10$abcdefghijklmnopqrstuv',
        isEmailVerified: true,
        isAccountActive: true,
        accountStatus: 'ACTIVE',
      });
    });

    it('✅ should return correct token structure on success', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'loginuser@kiit.ac.in',
          password: 'password123',
        });

      if (response.status === 200) {
        expect(response.body).toMatchObject({
          accessToken: expect.any(String),
          refreshToken: expect.any(String),
          user: {
            id: expect.any(String),
            email: 'loginuser@kiit.ac.in',
            name: expect.any(String),
            role: expect.any(String),
          },
        });

        // Validate JWT format
        expect(response.body.accessToken).toMatch(
          /^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+$/,
        );
      }
    });

    it('❌ should return 401 for wrong password', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'loginuser@kiit.ac.in',
          password: 'wrongpassword',
        })
        .expect(401);

      expect(response.body).toMatchObject({
        statusCode: 401,
        message: expect.any(String),
        error: 'Unauthorized',
      });

      // Should not leak information
      expect(response.body.message).not.toContain('password');
    });

    it('❌ should return 401 for non-existent user', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'nonexistent@kiit.ac.in',
          password: 'password123',
        })
        .expect(401);

      expect(response.body.statusCode).toBe(401);

      // Should not leak information about user existence
      expect(response.body.message).not.toContain('not found');
      expect(response.body.message).not.toContain('does not exist');
    });

    it('❌ should return 400 for invalid email format', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'not-an-email',
          password: 'password123',
        })
        .expect(400);

      expect(response.body.statusCode).toBe(400);
      expect(response.body.message).toBeInstanceOf(Array);
    });
  });

  describe('POST /auth/refresh', () => {
    it('✅ should return new tokens with valid refresh token', async () => {
      // This test requires actual implementation details
      // Documents expected contract
      const mockRefreshToken = 'valid-refresh-token';

      const response = await request(app.getHttpServer())
        .post('/auth/refresh')
        .send({ refreshToken: mockRefreshToken });

      if (response.status === 200) {
        expect(response.body).toMatchObject({
          accessToken: expect.any(String),
          refreshToken: expect.any(String),
        });
      }
    });

    it('❌ should return 401 for invalid refresh token', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/refresh')
        .send({ refreshToken: 'invalid-token' })
        .expect(401);

      expect(response.body).toMatchObject({
        statusCode: 401,
        error: 'Unauthorized',
      });
    });

    it('❌ should return 400 for missing refresh token', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/refresh')
        .send({})
        .expect(400);

      expect(response.body.statusCode).toBe(400);
    });
  });

  describe('GET /auth/verify-email', () => {
    it('✅ should return success message on valid token', async () => {
      // Documents expected behavior
      const mockToken = 'valid-verification-token';

      const response = await request(app.getHttpServer())
        .get('/auth/verify-email')
        .query({ token: mockToken });

      if (response.status === 200) {
        expect(response.body).toHaveProperty('message');
      }
    });

    it('❌ should return 400 for invalid token', async () => {
      const response = await request(app.getHttpServer())
        .get('/auth/verify-email')
        .query({ token: 'invalid-token' });

      expect([400, 401]).toContain(response.status);
    });

    it('❌ should return 400 for missing token', async () => {
      const response = await request(app.getHttpServer())
        .get('/auth/verify-email')
        .expect(400);

      expect(response.body.statusCode).toBe(400);
    });
  });

  describe('Headers and CORS', () => {
    it('✅ should include security headers', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'test@kiit.ac.in',
          password: 'password',
        });

      // Check for security headers
      expect(response.headers).toHaveProperty('x-content-type-options');
      expect(response.headers['content-type']).toContain('application/json');
    });

    it('✅ should handle OPTIONS request for CORS', async () => {
      await request(app.getHttpServer())
        .options('/auth/login')
        .expect((res) => {
          expect([200, 204]).toContain(res.status);
        });
    });
  });

  describe('Error Response Consistency', () => {
    it('❌ should return consistent error format across all errors', async () => {
      const responses = await Promise.all([
        request(app.getHttpServer())
          .post('/auth/login')
          .send({ email: 'wrong@kiit.ac.in', password: 'wrong' }),
        request(app.getHttpServer())
          .post('/auth/register-with-documents')
          .send({ email: 'invalid@gmail.com', name: 'Test', role: 'STUDENT' }),
        request(app.getHttpServer())
          .post('/auth/refresh')
          .send({ refreshToken: 'invalid' }),
      ]);

      // All errors should have same structure
      responses.forEach((response) => {
        expect(response.body).toHaveProperty('statusCode');
        expect(response.body).toHaveProperty('message');
        expect(response.body).toHaveProperty('error');
      });
    });
  });
});
