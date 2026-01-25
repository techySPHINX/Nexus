import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/prisma/prisma.service';
import { TestDatabaseHelper } from '../helpers/test-database.helper';
import { JwtService } from '@nestjs/jwt';
import { Role } from '@prisma/client';

/**
 * User API Contract Tests
 * Validates that the User API endpoints return responses with correct structure,
 * status codes, and data types regardless of the specific values.
 */
describe('User API Contract Tests', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let dbHelper: TestDatabaseHelper;
  let jwtService: JwtService;

  let studentUser: any;
  let adminUser: any;
  let studentToken: string;
  let adminToken: string;

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

    adminToken = jwtService.sign({
      sub: adminUser.id,
      email: adminUser.email,
      userId: adminUser.id,
    });
  });

  afterAll(async () => {
    await dbHelper.cleanup();
    await app.close();
  });

  describe('✅ GET /users - List All Users', () => {
    it('should return 200 with array of users', async () => {
      const response = await request(app.getHttpServer())
        .get('/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toBeInstanceOf(Array);
    });

    it('should return users with correct structure', async () => {
      const response = await request(app.getHttpServer())
        .get('/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      if (response.body.length > 0) {
        const user = response.body[0];
        expect(user).toHaveProperty('id');
        expect(user).toHaveProperty('email');
        expect(user).toHaveProperty('name');
        expect(user).toHaveProperty('role');
        expect(typeof user.id).toBe('string');
        expect(typeof user.email).toBe('string');
        expect(typeof user.name).toBe('string');
        expect(typeof user.role).toBe('string');
      }
    });

    it('should return 403 for non-admin users', async () => {
      await request(app.getHttpServer())
        .get('/users')
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(403);
    });

    it('should return 401 without authentication', async () => {
      await request(app.getHttpServer()).get('/users').expect(401);
    });

    it('should not expose passwords', async () => {
      const response = await request(app.getHttpServer())
        .get('/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      response.body.forEach((user: any) => {
        expect(user).not.toHaveProperty('password');
      });
    });
  });

  describe('✅ GET /users/:id - Get User by ID', () => {
    it('should return 200 with user object', async () => {
      const response = await request(app.getHttpServer())
        .get(`/users/${studentUser.id}`)
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(200);

      expect(response.body).toBeInstanceOf(Object);
      expect(response.body).toHaveProperty('id', studentUser.id);
    });

    it('should return user with complete structure', async () => {
      const response = await request(app.getHttpServer())
        .get(`/users/${studentUser.id}`)
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(200);

      const user = response.body;
      expect(user).toHaveProperty('id');
      expect(user).toHaveProperty('email');
      expect(user).toHaveProperty('name');
      expect(user).toHaveProperty('role');
      expect(user).toHaveProperty('accountStatus');
      expect(user).toHaveProperty('isEmailVerified');
      expect(user).toHaveProperty('createdAt');
      expect(user).toHaveProperty('updatedAt');
      expect(user).toHaveProperty('profile');
      expect(user).not.toHaveProperty('password');
    });

    it('should return timestamps in ISO 8601 format', async () => {
      const response = await request(app.getHttpServer())
        .get(`/users/${studentUser.id}`)
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(200);

      expect(response.body.createdAt).toMatch(
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/,
      );
      expect(response.body.updatedAt).toMatch(
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/,
      );
    });

    it('should return 404 for non-existent user', async () => {
      await request(app.getHttpServer())
        .get('/users/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(404);
    });

    it('should return 401 without authentication', async () => {
      await request(app.getHttpServer())
        .get(`/users/${studentUser.id}`)
        .expect(401);
    });
  });

  describe('✅ PATCH /users/:id - Update User', () => {
    it('should return 200 with updated user object', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/users/${studentUser.id}`)
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ name: 'Updated Name' })
        .expect(200);

      expect(response.body).toBeInstanceOf(Object);
      expect(response.body).toHaveProperty('id', studentUser.id);
      expect(response.body).toHaveProperty('name', 'Updated Name');
    });

    it('should accept optional fields in request body', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/users/${studentUser.id}`)
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          name: 'New Name',
          bio: 'New bio',
          location: 'New location',
          interests: 'New interests',
          skills: ['Skill1', 'Skill2'],
        })
        .expect(200);

      expect(response.body.name).toBe('New Name');
      expect(response.body.profile).toHaveProperty('bio', 'New bio');
      expect(response.body.profile).toHaveProperty('location', 'New location');
    });

    it('should return 400 for invalid password (less than 6 characters)', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/users/${studentUser.id}`)
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ password: '12345' })
        .expect(400);

      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('statusCode', 400);
    });

    it('should return 400 for invalid data types', async () => {
      await request(app.getHttpServer())
        .patch(`/users/${studentUser.id}`)
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ name: 12345 })
        .expect(400);
    });

    it('should return 404 for non-existent user', async () => {
      await request(app.getHttpServer())
        .patch('/users/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ name: 'Test' })
        .expect(404);
    });

    it('should return 401 without authentication', async () => {
      await request(app.getHttpServer())
        .patch(`/users/${studentUser.id}`)
        .send({ name: 'Test' })
        .expect(401);
    });

    it('should not expose password in response', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/users/${studentUser.id}`)
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ password: 'newpassword123' })
        .expect(200);

      expect(response.body).not.toHaveProperty('password');
    });
  });

  describe('✅ GET /users/search - Search Users', () => {
    beforeEach(async () => {
      await dbHelper.createTestUser({
        email: 'john.doe@kiit.ac.in',
        name: 'John Doe',
        role: Role.STUDENT,
      });
    });

    it('should return 200 with array of users', async () => {
      const response = await request(app.getHttpServer())
        .get('/users/search?q=john')
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(200);

      expect(response.body).toBeInstanceOf(Array);
    });

    it('should return users with correct structure', async () => {
      const response = await request(app.getHttpServer())
        .get('/users/search?q=john')
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(200);

      if (response.body.length > 0) {
        const user = response.body[0];
        expect(user).toHaveProperty('id');
        expect(user).toHaveProperty('email');
        expect(user).toHaveProperty('name');
        expect(user).toHaveProperty('role');
      }
    });

    it('should return empty array for queries less than 2 characters', async () => {
      const response = await request(app.getHttpServer())
        .get('/users/search?q=a')
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(200);

      expect(response.body).toEqual([]);
    });

    it('should limit results to 20 users', async () => {
      const response = await request(app.getHttpServer())
        .get('/users/search?q=test')
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(200);

      expect(response.body.length).toBeLessThanOrEqual(20);
    });

    it('should return 401 without authentication', async () => {
      await request(app.getHttpServer())
        .get('/users/search?q=john')
        .expect(401);
    });

    it('should not expose passwords in search results', async () => {
      const response = await request(app.getHttpServer())
        .get('/users/search?q=test')
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(200);

      response.body.forEach((user: any) => {
        expect(user).not.toHaveProperty('password');
      });
    });
  });

  describe('✅ DELETE /users/:id - Delete User', () => {
    it('should return 200 with success message', async () => {
      const response = await request(app.getHttpServer())
        .delete(`/users/${studentUser.id}`)
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(200);

      expect(response.body).toBeInstanceOf(Object);
      expect(response.body).toHaveProperty('message');
    });

    it('should return 404 for non-existent user', async () => {
      await request(app.getHttpServer())
        .delete('/users/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(404);
    });

    it('should return 401 without authentication', async () => {
      await request(app.getHttpServer())
        .delete(`/users/${studentUser.id}`)
        .expect(401);
    });
  });

  describe('✅ POST /users/fcm/register - Register FCM Token', () => {
    it('should return 201 with updated user', async () => {
      const response = await request(app.getHttpServer())
        .post('/users/fcm/register')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ deviceToken: 'fcm-token-123' })
        .expect(201);

      expect(response.body).toBeInstanceOf(Object);
      expect(response.body).toHaveProperty('fcmDeviceToken', 'fcm-token-123');
    });

    it('should return 400 for missing deviceToken', async () => {
      const response = await request(app.getHttpServer())
        .post('/users/fcm/register')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({})
        .expect(400);

      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('statusCode', 400);
    });

    it('should return 401 without authentication', async () => {
      await request(app.getHttpServer())
        .post('/users/fcm/register')
        .send({ deviceToken: 'token' })
        .expect(401);
    });
  });

  describe('✅ POST /users/fcm/unregister - Unregister FCM Token', () => {
    beforeEach(async () => {
      await prisma.user.update({
        where: { id: studentUser.id },
        data: { fcmDeviceToken: 'existing-token' },
      });
    });

    it('should return 201 with null fcmDeviceToken', async () => {
      const response = await request(app.getHttpServer())
        .post('/users/fcm/unregister')
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(201);

      expect(response.body).toBeInstanceOf(Object);
      expect(response.body.fcmDeviceToken).toBeNull();
    });

    it('should return 401 without authentication', async () => {
      await request(app.getHttpServer())
        .post('/users/fcm/unregister')
        .expect(401);
    });
  });

  describe('❌ Error Response Format', () => {
    it('should return consistent error format for 400', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/users/${studentUser.id}`)
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ password: '123' })
        .expect(400);

      expect(response.body).toHaveProperty('statusCode');
      expect(response.body).toHaveProperty('message');
      expect(response.body.statusCode).toBe(400);
    });

    it('should return consistent error format for 401', async () => {
      const response = await request(app.getHttpServer())
        .get(`/users/${studentUser.id}`)
        .expect(401);

      expect(response.body).toHaveProperty('statusCode', 401);
      expect(response.body).toHaveProperty('message');
    });

    it('should return consistent error format for 403', async () => {
      const response = await request(app.getHttpServer())
        .get('/users')
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(403);

      expect(response.body).toHaveProperty('statusCode', 403);
      expect(response.body).toHaveProperty('message');
    });

    it('should return consistent error format for 404', async () => {
      const response = await request(app.getHttpServer())
        .get('/users/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(404);

      expect(response.body).toHaveProperty('statusCode', 404);
      expect(response.body).toHaveProperty('message');
    });
  });

  describe('🔒 Security: Sensitive Data Protection', () => {
    it('should never expose password in GET response', async () => {
      const response = await request(app.getHttpServer())
        .get(`/users/${studentUser.id}`)
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(200);

      expect(response.body).not.toHaveProperty('password');
      expect(JSON.stringify(response.body)).not.toContain('$2');
    });

    it('should never expose password in PATCH response', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/users/${studentUser.id}`)
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ name: 'Test' })
        .expect(200);

      expect(response.body).not.toHaveProperty('password');
    });

    it('should never expose password in search results', async () => {
      const response = await request(app.getHttpServer())
        .get('/users/search?q=test')
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(200);

      response.body.forEach((user: any) => {
        expect(user).not.toHaveProperty('password');
      });
    });
  });

  describe('📋 Response Metadata', () => {
    it('should include timestamps in ISO 8601 format', async () => {
      const response = await request(app.getHttpServer())
        .get(`/users/${studentUser.id}`)
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(200);

      expect(response.body.createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
      expect(response.body.updatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    });

    it('should return Content-Type: application/json', async () => {
      const response = await request(app.getHttpServer())
        .get(`/users/${studentUser.id}`)
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(200);

      expect(response.headers['content-type']).toMatch(/application\/json/);
    });
  });
});
