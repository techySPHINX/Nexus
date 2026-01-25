import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/prisma/prisma.service';
import { TestDatabaseHelper } from '../helpers/test-database.helper';
import { JwtService } from '@nestjs/jwt';
import { Role } from '@prisma/client';

describe('Profile Contract Tests - API Validation', () => {
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

    // Create profiles
    await prisma.profile.create({
      data: {
        userId: studentUser.id,
        bio: 'Student bio',
        location: 'Bhubaneswar',
      },
    });

    await prisma.profile.create({
      data: {
        userId: alumniUser.id,
        bio: 'Alumni bio',
        location: 'Delhi',
      },
    });
  });

  afterAll(async () => {
    await dbHelper.cleanup();
    await app.close();
  });

  describe('✅ GET /profile/:userId - Profile Response Contract', () => {
    it('should return 200 with complete profile structure', async () => {
      const response = await request(app.getHttpServer())
        .get(`/profile/${studentUser.id}`)
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(200)
        .expect('Content-Type', /json/);

      // Validate top-level profile structure
      expect(response.body).toHaveProperty('userId', studentUser.id);
      expect(response.body).toHaveProperty('bio', 'Student bio');
      expect(response.body).toHaveProperty('location', 'Bhubaneswar');

      // Optional fields
      expect(response.body).toHaveProperty('avatarUrl');
      expect(response.body).toHaveProperty('branch');
      expect(response.body).toHaveProperty('year');
      expect(response.body).toHaveProperty('dept');
      expect(response.body).toHaveProperty('interests');
      expect(response.body).toHaveProperty('courses');

      // Relations
      expect(response.body).toHaveProperty('skills');
      expect(response.body).toHaveProperty('user');
      expect(Array.isArray(response.body.skills)).toBe(true);

      // Data types
      expect(typeof response.body.userId).toBe('string');
      expect(typeof response.body.bio).toBe('string');
      expect(typeof response.body.location).toBe('string');
    });

    it('should return 200 with user details and points', async () => {
      const response = await request(app.getHttpServer())
        .get(`/profile/${studentUser.id}`)
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(200);

      // Validate user object
      expect(response.body.user).toHaveProperty('id', studentUser.id);
      expect(response.body.user).toHaveProperty('name', 'Test Student');
      expect(response.body.user).toHaveProperty('email', 'student@kiit.ac.in');
      expect(response.body.user).toHaveProperty('role', Role.STUDENT);
      expect(response.body.user).toHaveProperty('totalPoints');
      expect(response.body.user).toHaveProperty('pointTransactions');

      // Validate points
      expect(typeof response.body.user.totalPoints).toBe('number');
      expect(Array.isArray(response.body.user.pointTransactions)).toBe(true);
    });

    it('should return 200 with skills including endorsements', async () => {
      // Create skill and endorsement
      const skill = await prisma.skill.create({
        data: {
          name: 'TypeScript',
          profiles: {
            connect: { userId: studentUser.id },
          },
        },
      });

      await prisma.endorsement.create({
        data: {
          skillId: skill.id,
          endorserId: alumniUser.id,
        },
      });

      const response = await request(app.getHttpServer())
        .get(`/profile/${studentUser.id}`)
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(200);

      // Validate skills array
      expect(response.body.skills.length).toBeGreaterThan(0);
      const tsSkill = response.body.skills.find(
        (s: any) => s.name === 'TypeScript',
      );

      expect(tsSkill).toBeDefined();
      expect(tsSkill).toHaveProperty('id');
      expect(tsSkill).toHaveProperty('name', 'TypeScript');
      expect(tsSkill).toHaveProperty('endorsements');
      expect(Array.isArray(tsSkill.endorsements)).toBe(true);
      expect(tsSkill.endorsements.length).toBeGreaterThan(0);

      // Validate endorsement structure
      const endorsement = tsSkill.endorsements[0];
      expect(endorsement).toHaveProperty('skillId', skill.id);
      expect(endorsement).toHaveProperty('endorserId', alumniUser.id);
    });

    it('should return 404 for non-existent profile', async () => {
      const response = await request(app.getHttpServer())
        .get('/profile/non-existent-id')
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(404)
        .expect('Content-Type', /json/);

      expect(response.body).toHaveProperty('statusCode', 404);
      expect(response.body).toHaveProperty('message');
    });

    it('should return 401 for missing authentication', async () => {
      await request(app.getHttpServer())
        .get(`/profile/${studentUser.id}`)
        .expect(401);
    });
  });

  describe('✅ GET /profile/:userId/completion - Completion Response Contract', () => {
    it('should return 200 with percentage for incomplete profile', async () => {
      const response = await request(app.getHttpServer())
        .get(`/profile/${studentUser.id}/completion`)
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(200)
        .expect('Content-Type', /json/);

      // Validate structure
      expect(response.body).toHaveProperty('percentage');
      expect(typeof response.body.percentage).toBe('number');
      expect(response.body.percentage).toBeGreaterThanOrEqual(0);
      expect(response.body.percentage).toBeLessThanOrEqual(100);

      // For incomplete profile, should have details
      if (response.body.percentage < 100) {
        expect(response.body).toHaveProperty('details');
        expect(response.body.details).toHaveProperty('filledFields');
        expect(response.body.details).toHaveProperty('emptyFields');
        expect(response.body.details).toHaveProperty('skillsCount');
        expect(response.body.details).toHaveProperty('interestsCount');
        expect(response.body.details).toHaveProperty('coursesCount');
      }
    });

    it('should return 200 with 100% for complete profile', async () => {
      // Update profile to be complete
      await prisma.profile.update({
        where: { userId: studentUser.id },
        data: {
          avatarUrl: 'https://example.com/avatar.jpg',
          bio: 'Complete bio',
          location: 'Complete City',
          branch: 'CSE',
          year: '2024',
          dept: 'Computer Science',
          interests: 'A,B,C,D,E,F',
          courses: 'A,B,C,D,E,F',
        },
      });

      // Add 5+ skills
      for (let i = 1; i <= 5; i++) {
        await prisma.skill.create({
          data: {
            name: `Skill${i}`,
            profiles: {
              connect: { userId: studentUser.id },
            },
          },
        });
      }

      const response = await request(app.getHttpServer())
        .get(`/profile/${studentUser.id}/completion`)
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('percentage', 100);
      // Should not have details for complete profile
      expect(response.body.details).toBeUndefined();
    });

    it('should return 404 for non-existent profile', async () => {
      await request(app.getHttpServer())
        .get('/profile/non-existent-id/completion')
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(404);
    });

    it('should return 401 for missing authentication', async () => {
      await request(app.getHttpServer())
        .get(`/profile/${studentUser.id}/completion`)
        .expect(401);
    });
  });

  describe('✅ GET /profile - Filtered Profiles Response Contract', () => {
    it('should return 200 with profiles array and total count', async () => {
      const response = await request(app.getHttpServer())
        .get('/profile')
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(200)
        .expect('Content-Type', /json/);

      // Validate structure
      expect(response.body).toHaveProperty('profiles');
      expect(response.body).toHaveProperty('total');
      expect(Array.isArray(response.body.profiles)).toBe(true);
      expect(typeof response.body.total).toBe('number');
    });

    it('should return 200 with correct profile structure in array', async () => {
      const response = await request(app.getHttpServer())
        .get('/profile')
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(200);

      if (response.body.profiles.length > 0) {
        const profile = response.body.profiles[0];

        // Validate profile fields
        expect(profile).toHaveProperty('userId');
        expect(profile).toHaveProperty('bio');
        expect(profile).toHaveProperty('location');
        expect(profile).toHaveProperty('user');
        expect(profile).toHaveProperty('skills');

        // Validate user relation
        expect(profile.user).toHaveProperty('id');
        expect(profile.user).toHaveProperty('name');
        expect(profile.user).toHaveProperty('email');
        expect(profile.user).toHaveProperty('role');
      }
    });

    it('should support name filter query param', async () => {
      const response = await request(app.getHttpServer())
        .get('/profile?name=Student')
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('profiles');
      expect(response.body).toHaveProperty('total');
    });

    it('should support location filter query param', async () => {
      const response = await request(app.getHttpServer())
        .get('/profile?location=Bhubaneswar')
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('profiles');
      response.body.profiles.forEach((profile: any) => {
        expect(profile.location).toContain('Bhubaneswar');
      });
    });

    it('should support pagination query params', async () => {
      const response = await request(app.getHttpServer())
        .get('/profile?skip=0&take=5')
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(200);

      expect(response.body.profiles.length).toBeLessThanOrEqual(5);
    });

    it('should return 401 for missing authentication', async () => {
      await request(app.getHttpServer()).get('/profile').expect(401);
    });
  });

  describe('✅ PATCH /profile - Update Profile Response Contract', () => {
    it('should return 200 with updated profile', async () => {
      const response = await request(app.getHttpServer())
        .patch('/profile')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          bio: 'Updated bio',
          location: 'Updated location',
          branch: 'CSE',
        })
        .expect(200)
        .expect('Content-Type', /json/);

      // Validate updated fields
      expect(response.body).toHaveProperty('userId', studentUser.id);
      expect(response.body).toHaveProperty('bio', 'Updated bio');
      expect(response.body).toHaveProperty('location', 'Updated location');
      expect(response.body).toHaveProperty('branch', 'CSE');

      // Should include relations
      expect(response.body).toHaveProperty('skills');
      expect(response.body).toHaveProperty('user');
    });

    it('should return 200 with skills when updated', async () => {
      const response = await request(app.getHttpServer())
        .patch('/profile')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          bio: 'Updated',
          skills: ['JavaScript', 'Python', 'Go'],
        })
        .expect(200);

      // Validate skills array
      expect(Array.isArray(response.body.skills)).toBe(true);
      expect(response.body.skills.length).toBe(3);

      response.body.skills.forEach((skill: any) => {
        expect(skill).toHaveProperty('id');
        expect(skill).toHaveProperty('name');
        expect(['JavaScript', 'Python', 'Go']).toContain(skill.name);
      });
    });

    it('should return 200 with empty skills array when cleared', async () => {
      const response = await request(app.getHttpServer())
        .patch('/profile')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          bio: 'Updated',
          skills: [],
        })
        .expect(200);

      expect(response.body.skills).toEqual([]);
    });

    it('should return 404 for non-existent profile', async () => {
      // Create user without profile
      const newUser = await dbHelper.createTestUser({
        email: 'newuser@kiit.ac.in',
        name: 'New User',
        role: Role.STUDENT,
      });

      const newToken = jwtService.sign({
        sub: newUser.id,
        email: newUser.email,
        userId: newUser.id,
      });

      const response = await request(app.getHttpServer())
        .patch('/profile')
        .set('Authorization', `Bearer ${newToken}`)
        .send({
          bio: 'Test',
        })
        .expect(404);

      expect(response.body).toHaveProperty('statusCode', 404);
    });

    it('should return 400 for invalid data', async () => {
      const response = await request(app.getHttpServer())
        .patch('/profile')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          invalidField: 'invalid data',
        })
        .expect(400);

      expect(response.body).toHaveProperty('statusCode', 400);
    });

    it('should return 401 for missing authentication', async () => {
      await request(app.getHttpServer())
        .patch('/profile')
        .send({
          bio: 'Updated',
        })
        .expect(401);
    });
  });

  describe('✅ POST /profile/skill/:skillId/endorse - Endorsement Response Contract', () => {
    let skill: any;

    beforeEach(async () => {
      skill = await prisma.skill.create({
        data: {
          name: 'Rust',
          profiles: {
            connect: { userId: studentUser.id },
          },
        },
      });
    });

    it('should return 201 with endorsement object', async () => {
      const response = await request(app.getHttpServer())
        .post(`/profile/skill/${skill.id}/endorse`)
        .set('Authorization', `Bearer ${alumniToken}`)
        .expect(201)
        .expect('Content-Type', /json/);

      // Validate endorsement structure
      expect(response.body).toHaveProperty('skillId', skill.id);
      expect(response.body).toHaveProperty('endorserId', alumniUser.id);
      expect(response.body).toHaveProperty('createdAt');

      // Data types
      expect(typeof response.body.skillId).toBe('string');
      expect(typeof response.body.endorserId).toBe('string');
      expect(typeof response.body.createdAt).toBe('string');
    });

    it('should return 409 for duplicate endorsement', async () => {
      // Create first endorsement
      await prisma.endorsement.create({
        data: {
          skillId: skill.id,
          endorserId: alumniUser.id,
        },
      });

      const response = await request(app.getHttpServer())
        .post(`/profile/skill/${skill.id}/endorse`)
        .set('Authorization', `Bearer ${alumniToken}`)
        .expect(409);

      expect(response.body).toHaveProperty('statusCode', 409);
      expect(response.body).toHaveProperty('message');
    });

    it('should return 404 for non-existent skill', async () => {
      await request(app.getHttpServer())
        .post('/profile/skill/non-existent-id/endorse')
        .set('Authorization', `Bearer ${alumniToken}`)
        .expect(404);
    });

    it('should return 401 for missing authentication', async () => {
      await request(app.getHttpServer())
        .post(`/profile/skill/${skill.id}/endorse`)
        .expect(401);
    });
  });

  describe('✅ DELETE /profile/skill/:skillId/endorse - Remove Endorsement Response Contract', () => {
    let skill: any;

    beforeEach(async () => {
      skill = await prisma.skill.create({
        data: {
          name: 'Kotlin',
          profiles: {
            connect: { userId: studentUser.id },
          },
        },
      });

      await prisma.endorsement.create({
        data: {
          skillId: skill.id,
          endorserId: alumniUser.id,
        },
      });
    });

    it('should return 200 with success message', async () => {
      const response = await request(app.getHttpServer())
        .delete(`/profile/skill/${skill.id}/endorse`)
        .set('Authorization', `Bearer ${alumniToken}`)
        .expect(200)
        .expect('Content-Type', /json/);

      expect(response.body).toHaveProperty('message');
      expect(typeof response.body.message).toBe('string');
    });

    it('should return 404 for non-existent endorsement', async () => {
      // Delete the endorsement first
      await prisma.endorsement.delete({
        where: {
          endorserId_skillId: {
            endorserId: alumniUser.id,
            skillId: skill.id,
          },
        },
      });

      await request(app.getHttpServer())
        .delete(`/profile/skill/${skill.id}/endorse`)
        .set('Authorization', `Bearer ${alumniToken}`)
        .expect(404);
    });

    it('should return 401 for missing authentication', async () => {
      await request(app.getHttpServer())
        .delete(`/profile/skill/${skill.id}/endorse`)
        .expect(401);
    });
  });

  describe('🔒 Security: HTTP Headers and Validation', () => {
    it('should always return application/json content-type', async () => {
      await request(app.getHttpServer())
        .get(`/profile/${studentUser.id}`)
        .set('Authorization', `Bearer ${studentToken}`)
        .expect('Content-Type', /json/);
    });

    it('should handle OPTIONS preflight for CORS', async () => {
      await request(app.getHttpServer())
        .options('/profile')
        .expect((res) => {
          expect([200, 204]).toContain(res.status);
        });
    });

    it('should reject invalid JSON in request body', async () => {
      const response = await request(app.getHttpServer())
        .patch('/profile')
        .set('Authorization', `Bearer ${studentToken}`)
        .set('Content-Type', 'application/json')
        .send('invalid json')
        .expect(400);

      expect(response.body).toHaveProperty('statusCode', 400);
    });

    it('should handle malformed Authorization header', async () => {
      await request(app.getHttpServer())
        .get(`/profile/${studentUser.id}`)
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
        { expiresIn: '-1h' },
      );

      await request(app.getHttpServer())
        .get(`/profile/${studentUser.id}`)
        .set('Authorization', `Bearer ${expiredToken}`)
        .expect(401);
    });
  });

  describe('❌ Edge Cases: Error Response Structure', () => {
    it('should return consistent error structure for all errors', async () => {
      const response = await request(app.getHttpServer())
        .get('/profile/non-existent-id')
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(404);

      // Standard NestJS error structure
      expect(response.body).toHaveProperty('statusCode');
      expect(response.body).toHaveProperty('message');
      expect(typeof response.body.statusCode).toBe('number');
    });

    it('should handle very long skill names gracefully', async () => {
      const longSkillName = 'a'.repeat(500);

      const response = await request(app.getHttpServer())
        .patch('/profile')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          skills: [longSkillName],
        })
        .expect((res) => {
          // Should either succeed or fail with proper error
          expect([200, 400]).toContain(res.status);
        });
    });

    it('should handle special characters in filter params', async () => {
      const response = await request(app.getHttpServer())
        .get("/profile?name=O'Brien<script>")
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('profiles');
    });
  });
});
