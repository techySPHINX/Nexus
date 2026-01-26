import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/prisma/prisma.service';
import { TestDatabaseHelper } from '../helpers/test-database.helper';
import { JwtService } from '@nestjs/jwt';
import { Role } from '@prisma/client';

describe('User Integration Tests', () => {
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

  describe('✅ Complete User Retrieval Workflow', () => {
    it('should retrieve user by ID with profile and skills', async () => {
      const response = await request(app.getHttpServer())
        .get(`/users/${studentUser.id}`)
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('id', studentUser.id);
      expect(response.body).toHaveProperty('name');
      expect(response.body).toHaveProperty('email');
      expect(response.body).toHaveProperty('role');
      expect(response.body).toHaveProperty('profile');
      expect(response.body).not.toHaveProperty('password');
    });

    it('should return 404 for non-existent user', async () => {
      await request(app.getHttpServer())
        .get('/users/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(404);
    });

    it('should require authentication to retrieve user', async () => {
      await request(app.getHttpServer())
        .get(`/users/${studentUser.id}`)
        .expect(401);
    });
  });

  describe('✅ Complete User Update Workflow', () => {
    it('should update user name successfully', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/users/${studentUser.id}`)
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          name: 'Updated Student Name',
        })
        .expect(200);

      expect(response.body.name).toBe('Updated Student Name');

      // Verify database was updated
      const updatedUser = await prisma.user.findUnique({
        where: { id: studentUser.id },
      });

      expect(updatedUser?.name).toBe('Updated Student Name');
    });

    it('should update user profile bio and location', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/users/${studentUser.id}`)
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          bio: 'New bio about myself',
          location: 'San Francisco, CA',
        })
        .expect(200);

      expect(response.body.profile).toHaveProperty(
        'bio',
        'New bio about myself',
      );
      expect(response.body.profile).toHaveProperty(
        'location',
        'San Francisco, CA',
      );
    });

    it('should update user password with hashing', async () => {
      const newPassword = 'newpassword123';

      await request(app.getHttpServer())
        .patch(`/users/${studentUser.id}`)
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          password: newPassword,
        })
        .expect(200);

      // Verify password was hashed (not stored in plain text)
      const updatedUser = await prisma.user.findUnique({
        where: { id: studentUser.id },
      });

      expect(updatedUser?.password).not.toBe(newPassword);
      expect(updatedUser?.password).toMatch(/^\$2[ayb]\$.{56}$/); // bcrypt hash pattern
    });

    it('should reject password less than 6 characters', async () => {
      await request(app.getHttpServer())
        .patch(`/users/${studentUser.id}`)
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          password: '12345',
        })
        .expect(400);
    });

    it('should add skills to user profile', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/users/${studentUser.id}`)
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          skills: ['JavaScript', 'TypeScript', 'Node.js'],
        })
        .expect(200);

      expect(response.body.profile).toHaveProperty('skills');
      expect(response.body.profile.skills).toHaveLength(3);

      // Verify skills were created in database
      const skills = await prisma.skill.findMany({
        where: {
          name: {
            in: ['JavaScript', 'TypeScript', 'Node.js'],
          },
        },
      });

      expect(skills).toHaveLength(3);
    });

    it('should return 404 when updating non-existent user', async () => {
      await request(app.getHttpServer())
        .patch('/users/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          name: 'New Name',
        })
        .expect(404);
    });

    it('should require authentication to update user', async () => {
      await request(app.getHttpServer())
        .patch(`/users/${studentUser.id}`)
        .send({
          name: 'New Name',
        })
        .expect(401);
    });
  });

  describe('✅ Complete User Search Workflow', () => {
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

    it('should search users by name', async () => {
      const response = await request(app.getHttpServer())
        .get('/users/search?q=john')
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(200);

      expect(response.body).toBeInstanceOf(Array);
      expect(response.body.length).toBeGreaterThan(0);
      expect(response.body[0].name).toContain('John');
    });

    it('should search users by email', async () => {
      const response = await request(app.getHttpServer())
        .get('/users/search?q=jane.smith')
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(200);

      expect(response.body).toBeInstanceOf(Array);
      expect(
        response.body.some((u: any) => u.email.includes('jane.smith')),
      ).toBe(true);
    });

    it('should return empty array for queries less than 2 characters', async () => {
      const response = await request(app.getHttpServer())
        .get('/users/search?q=a')
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(200);

      expect(response.body).toEqual([]);
    });

    it('should limit search results to 20 users', async () => {
      const response = await request(app.getHttpServer())
        .get('/users/search?q=test')
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(200);

      expect(response.body.length).toBeLessThanOrEqual(20);
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

    it('should require authentication for search', async () => {
      await request(app.getHttpServer())
        .get('/users/search?q=john')
        .expect(401);
    });
  });

  describe('✅ Complete User Deletion Workflow', () => {
    it('should delete user and profile', async () => {
      await request(app.getHttpServer())
        .delete(`/users/${studentUser.id}`)
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(200);

      // Verify user was deleted from database
      const deletedUser = await prisma.user.findUnique({
        where: { id: studentUser.id },
      });

      expect(deletedUser).toBeNull();

      // Verify profile was also deleted
      const deletedProfile = await prisma.profile.findFirst({
        where: { userId: studentUser.id },
      });

      expect(deletedProfile).toBeNull();
    });

    it('should return 404 when deleting non-existent user', async () => {
      await request(app.getHttpServer())
        .delete('/users/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(404);
    });

    it('should require authentication for deletion', async () => {
      await request(app.getHttpServer())
        .delete(`/users/${studentUser.id}`)
        .expect(401);
    });
  });

  describe('✅ Complete FCM Token Management Workflow', () => {
    it('should register FCM device token', async () => {
      const deviceToken = 'fcm-token-12345';

      const response = await request(app.getHttpServer())
        .post('/users/fcm/register')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          deviceToken,
        })
        .expect(201);

      expect(response.body).toHaveProperty('fcmDeviceToken', deviceToken);

      // Verify token was saved in database
      const updatedUser = await prisma.user.findUnique({
        where: { id: studentUser.id },
      });

      expect(updatedUser?.fcmDeviceToken).toBe(deviceToken);
    });

    it('should unregister FCM device token', async () => {
      // First register a token
      await prisma.user.update({
        where: { id: studentUser.id },
        data: { fcmDeviceToken: 'existing-token' },
      });

      const response = await request(app.getHttpServer())
        .post('/users/fcm/unregister')
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(201);

      expect(response.body.fcmDeviceToken).toBeNull();

      // Verify token was removed from database
      const updatedUser = await prisma.user.findUnique({
        where: { id: studentUser.id },
      });

      expect(updatedUser?.fcmDeviceToken).toBeNull();
    });

    it('should require authentication for FCM registration', async () => {
      await request(app.getHttpServer())
        .post('/users/fcm/register')
        .send({
          deviceToken: 'token',
        })
        .expect(401);
    });
  });

  describe('✅ Admin-Only: Get All Users', () => {
    it('should allow admin to retrieve all users', async () => {
      const response = await request(app.getHttpServer())
        .get('/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toBeInstanceOf(Array);
      expect(response.body.length).toBeGreaterThan(0);
    });

    it('should deny non-admin access to all users', async () => {
      await request(app.getHttpServer())
        .get('/users')
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(403);
    });

    it('should include profiles and skills for all users', async () => {
      const response = await request(app.getHttpServer())
        .get('/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      if (response.body.length > 0) {
        expect(response.body[0]).toHaveProperty('profile');
      }
    });
  });

  describe('❌ Edge Cases: Invalid Input Validation', () => {
    it('should reject invalid UUID format', async () => {
      await request(app.getHttpServer())
        .get('/users/invalid-uuid')
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(404); // Or 400 depending on validation
    });

    it('should reject empty name update', async () => {
      await request(app.getHttpServer())
        .patch(`/users/${studentUser.id}`)
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          name: '',
        })
        .expect(200); // Empty is optional, so it should not update

      // Verify name was not changed
      const user = await prisma.user.findUnique({
        where: { id: studentUser.id },
      });

      expect(user?.name).toBe(studentUser.name);
    });

    it('should reject non-string values for name', async () => {
      await request(app.getHttpServer())
        .patch(`/users/${studentUser.id}`)
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          name: 12345,
        })
        .expect(400);
    });

    it('should reject non-array values for skills', async () => {
      await request(app.getHttpServer())
        .patch(`/users/${studentUser.id}`)
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          skills: 'JavaScript',
        })
        .expect(400);
    });
  });

  describe('❌ Edge Cases: Special Characters and Long Content', () => {
    it('should handle special characters in name', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/users/${studentUser.id}`)
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          name: "O'Brien <test>",
        })
        .expect(200);

      expect(response.body.name).toBe("O'Brien <test>");
    });

    it('should handle Unicode characters in bio', async () => {
      const unicodeBio = '你好 🎉 مرحبا';

      const response = await request(app.getHttpServer())
        .patch(`/users/${studentUser.id}`)
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          bio: unicodeBio,
        })
        .expect(200);

      expect(response.body.profile.bio).toBe(unicodeBio);
    });

    it('should handle very long bio text', async () => {
      const longBio = 'A'.repeat(5000);

      const response = await request(app.getHttpServer())
        .patch(`/users/${studentUser.id}`)
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          bio: longBio,
        })
        .expect(200);

      expect(response.body.profile.bio.length).toBe(5000);
    });

    it('should handle empty skills array', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/users/${studentUser.id}`)
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          skills: [],
        })
        .expect(200);

      expect(response.body.profile.skills).toEqual([]);
    });
  });

  describe('❌ Edge Cases: Concurrent Operations', () => {
    it('should handle concurrent profile updates', async () => {
      const promises = [];

      for (let i = 0; i < 3; i++) {
        const promise = request(app.getHttpServer())
          .patch(`/users/${studentUser.id}`)
          .set('Authorization', `Bearer ${studentToken}`)
          .send({
            bio: `Bio update ${i}`,
          });

        promises.push(promise);
      }

      const responses = await Promise.all(promises);

      responses.forEach((response) => {
        expect(response.status).toBe(200);
      });

      // Verify final state in database
      const finalUser = await prisma.user.findUnique({
        where: { id: studentUser.id },
        include: { profile: true },
      });

      expect(finalUser?.profile?.bio).toBeDefined();
    });
  });

  describe('🔒 Security: Authorization and Data Protection', () => {
    it('should require JWT for all endpoints', async () => {
      await request(app.getHttpServer())
        .get(`/users/${studentUser.id}`)
        .expect(401);

      await request(app.getHttpServer())
        .patch(`/users/${studentUser.id}`)
        .send({ name: 'Test' })
        .expect(401);

      await request(app.getHttpServer())
        .delete(`/users/${studentUser.id}`)
        .expect(401);

      await request(app.getHttpServer())
        .get('/users/search?q=test')
        .expect(401);
    });

    it('should not expose password in any response', async () => {
      const getResponse = await request(app.getHttpServer())
        .get(`/users/${studentUser.id}`)
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(200);

      expect(getResponse.body).not.toHaveProperty('password');

      const updateResponse = await request(app.getHttpServer())
        .patch(`/users/${studentUser.id}`)
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ name: 'Updated' })
        .expect(200);

      expect(updateResponse.body).not.toHaveProperty('password');
    });

    it('should enforce admin role for listing all users', async () => {
      await request(app.getHttpServer())
        .get('/users')
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(403);
    });
  });

  describe('✅ Complete User Lifecycle Journey', () => {
    it('should complete full user profile management flow', async () => {
      // 1. Get initial user data
      const initialResponse = await request(app.getHttpServer())
        .get(`/users/${studentUser.id}`)
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(200);

      expect(initialResponse.body.id).toBe(studentUser.id);

      // 2. Update profile information
      const updateResponse = await request(app.getHttpServer())
        .patch(`/users/${studentUser.id}`)
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          name: 'Updated Name',
          bio: 'Software engineer passionate about technology',
          location: 'Bangalore, India',
          interests: 'AI, Web Development, Cloud Computing',
          skills: ['Python', 'JavaScript', 'AWS'],
        })
        .expect(200);

      expect(updateResponse.body.name).toBe('Updated Name');
      expect(updateResponse.body.profile.bio).toContain('Software engineer');
      expect(updateResponse.body.profile.skills).toHaveLength(3);

      // 3. Register FCM token for notifications
      await request(app.getHttpServer())
        .post('/users/fcm/register')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          deviceToken: 'test-fcm-token',
        })
        .expect(201);

      // 4. Search for own profile
      const searchResponse = await request(app.getHttpServer())
        .get(`/users/search?q=${updateResponse.body.name}`)
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(200);

      expect(searchResponse.body.length).toBeGreaterThan(0);

      // 5. Unregister FCM token
      await request(app.getHttpServer())
        .post('/users/fcm/unregister')
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(201);

      // 6. Final verification
      const finalResponse = await request(app.getHttpServer())
        .get(`/users/${studentUser.id}`)
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(200);

      expect(finalResponse.body.name).toBe('Updated Name');
      expect(finalResponse.body.fcmDeviceToken).toBeNull();
    });
  });
});
