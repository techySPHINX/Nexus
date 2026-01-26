import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/prisma/prisma.service';
import { TestDatabaseHelper } from '../helpers/test-database.helper';
import { JwtService } from '@nestjs/jwt';
import { Role } from '@prisma/client';

describe('Profile Integration Tests', () => {
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
      role: Role.ALUM,
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

  describe('✅ Profile Setup and Completion Workflow', () => {
    it('should create initial profile for new user', async () => {
      const profile = await prisma.profile.create({
        data: {
          userId: studentUser.id,
          bio: 'Initial bio',
          location: 'Test City',
        },
      });

      expect(profile).toBeDefined();
      expect(profile.userId).toBe(studentUser.id);
    });

    it('should calculate profile completion correctly', async () => {
      // Create incomplete profile (missing several fields)
      await prisma.profile.create({
        data: {
          userId: studentUser.id,
          bio: 'Test bio',
          location: 'Test City',
        },
      });

      const response = await request(app.getHttpServer())
        .get(`/profile/${studentUser.id}/completion`)
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('percentage');
      expect(response.body.percentage).toBeLessThan(100);
    });

    it('should return 100% for fully complete profile', async () => {
      // Create complete profile with all required fields
      await prisma.profile.create({
        data: {
          userId: studentUser.id,
          avatarUrl: 'https://example.com/avatar.jpg',
          bio: 'Complete bio',
          location: 'Complete City',
          branch: 'CSE',
          year: '2024',
          dept: 'Computer Science',
          interests: 'AI,ML,Web,Cloud,Database,Security',
          course: 'DS,Algo,DBMS,OS,Networks,Compiler',
        },
      });

      // Create 5+ skills
      for (let i = 1; i <= 5; i++) {
        await prisma.skill.create({
          data: {
            name: `Skill ${i}`,
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

      expect(response.body.percentage).toBe(100);
    });

    it('should require 5+ skills for completion', async () => {
      // Create profile with only 3 skills
      await prisma.profile.create({
        data: {
          userId: studentUser.id,
          avatarUrl: 'https://example.com/avatar.jpg',
          bio: 'Bio',
          location: 'City',
          branch: 'CSE',
          year: '2024',
          dept: 'CS',
          interests: 'A,B,C,D,E,F',
          course: 'A,B,C,D,E,F',
        },
      });

      for (let i = 1; i <= 3; i++) {
        await prisma.skill.create({
          data: {
            name: `Skill ${i}`,
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

      expect(response.body.percentage).toBeLessThan(100);
      if (response.body.details) {
        expect(response.body.details).toHaveProperty('skillsCount', 3);
      }
    });

    it('should require 5+ interests (CSV count)', async () => {
      await prisma.profile.create({
        data: {
          userId: studentUser.id,
          avatarUrl: 'https://example.com/avatar.jpg',
          bio: 'Bio',
          location: 'City',
          branch: 'CSE',
          year: '2024',
          dept: 'CS',
          interests: 'A,B,C', // Only 3
          course: 'A,B,C,D,E,F',
        },
      });

      // Add 5 skills
      for (let i = 1; i <= 5; i++) {
        await prisma.skill.create({
          data: {
            name: `Skill ${i}`,
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

      expect(response.body.percentage).toBeLessThan(100);
    });
  });

  describe('✅ Profile Retrieval Workflow', () => {
    beforeEach(async () => {
      await prisma.profile.create({
        data: {
          userId: studentUser.id,
          bio: 'Student profile',
          location: 'Bhubaneswar',
        },
      });
    });

    it('should retrieve profile with relations', async () => {
      const response = await request(app.getHttpServer())
        .get(`/profile/${studentUser.id}`)
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('userId', studentUser.id);
      expect(response.body).toHaveProperty('bio', 'Student profile');
      expect(response.body).toHaveProperty('skills');
      expect(response.body).toHaveProperty('user');
    });

    it('should include skills with endorsements', async () => {
      // Create skill and endorsement
      const skill = await prisma.skill.create({
        data: {
          name: 'JavaScript',
          profiles: {
            connect: { userId: studentUser.id },
          },
        },
      });

      await prisma.endorsement.create({
        data: {
          profileId: studentUser.id,
          skillId: skill.id,
          endorserId: alumniUser.id,
        },
      });

      const response = await request(app.getHttpServer())
        .get(`/profile/${studentUser.id}`)
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(200);

      expect(response.body.skills.length).toBeGreaterThan(0);
      const jsSkill = response.body.skills.find(
        (s: any) => s.name === 'JavaScript',
      );
      expect(jsSkill).toBeDefined();
      expect(jsSkill.endorsements).toBeDefined();
    });

    it('should include user points and transactions', async () => {
      const response = await request(app.getHttpServer())
        .get(`/profile/${studentUser.id}`)
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(200);

      expect(response.body.user).toHaveProperty('totalPoints');
      expect(response.body.user).toHaveProperty('pointTransactions');
    });

    it('should limit transactions to last 10', async () => {
      // Create 15 transactions
      for (let i = 0; i < 15; i++) {
        await prisma.pointTransaction.create({
          data: {
            userId: studentUser.id,
            points: 10,
            type: 'EARN',
            userPoints: {
              connect: {
                userId: studentUser.id,
              },
            },
          },
        });
      }

      const response = await request(app.getHttpServer())
        .get(`/profile/${studentUser.id}`)
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(200);

      expect(response.body.user.pointTransactions.length).toBeLessThanOrEqual(
        10,
      );
    });

    it('should return 404 for non-existent profile', async () => {
      await request(app.getHttpServer())
        .get('/profile/non-existent-id')
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(404);
    });
  });

  describe('✅ Profile Filtering Workflow', () => {
    beforeEach(async () => {
      // Create profiles for different users
      await prisma.profile.create({
        data: {
          userId: studentUser.id,
          bio: 'Student in CSE',
          location: 'Bhubaneswar',
          branch: 'CSE',
          year: '2024',
          dept: 'Computer Science',
        },
      });

      await prisma.profile.create({
        data: {
          userId: alumniUser.id,
          bio: 'Alumni from ECE',
          location: 'Delhi',
          branch: 'ECE',
          year: '2020',
          dept: 'Electronics',
        },
      });
    });

    it('should filter profiles by name (case-insensitive)', async () => {
      const response = await request(app.getHttpServer())
        .get('/profile?name=student')
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(200);

      expect(response.body.profiles.length).toBeGreaterThan(0);
      const found = response.body.profiles.find(
        (p: any) => p.userId === studentUser.id,
      );
      expect(found).toBeDefined();
    });

    it('should filter profiles by location', async () => {
      const response = await request(app.getHttpServer())
        .get('/profile?location=Bhubaneswar')
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(200);

      response.body.profiles.forEach((profile: any) => {
        expect(profile.location).toContain('Bhubaneswar');
      });
    });

    it('should filter profiles by branch', async () => {
      const response = await request(app.getHttpServer())
        .get('/profile?branch=CSE')
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(200);

      response.body.profiles.forEach((profile: any) => {
        expect(profile.branch).toBe('CSE');
      });
    });

    it('should filter profiles by year', async () => {
      const response = await request(app.getHttpServer())
        .get('/profile?year=2024')
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(200);

      response.body.profiles.forEach((profile: any) => {
        expect(profile.year).toBe('2024');
      });
    });

    it('should filter profiles by role', async () => {
      const response = await request(app.getHttpServer())
        .get('/profile?roles=ALUMNI')
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(200);

      response.body.profiles.forEach((profile: any) => {
        expect(profile.user.role).toBe('ALUMNI');
      });
    });

    it('should combine multiple filters', async () => {
      const response = await request(app.getHttpServer())
        .get('/profile?branch=CSE&year=2024')
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(200);

      response.body.profiles.forEach((profile: any) => {
        expect(profile.branch).toBe('CSE');
        expect(profile.year).toBe('2024');
      });
    });

    it('should support pagination', async () => {
      const response = await request(app.getHttpServer())
        .get('/profile?skip=0&take=1')
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(200);

      expect(response.body.profiles.length).toBeLessThanOrEqual(1);
      expect(response.body).toHaveProperty('total');
    });
  });

  describe('✅ Profile Update Workflow', () => {
    beforeEach(async () => {
      await prisma.profile.create({
        data: {
          userId: studentUser.id,
          bio: 'Original bio',
          location: 'Original location',
        },
      });
    });

    it('should update profile fields', async () => {
      const response = await request(app.getHttpServer())
        .patch('/profile')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          bio: 'Updated bio',
          location: 'Updated location',
        })
        .expect(200);

      expect(response.body.bio).toBe('Updated bio');
      expect(response.body.location).toBe('Updated location');
    });

    it('should upsert skills when provided', async () => {
      const response = await request(app.getHttpServer())
        .patch('/profile')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          bio: 'Updated',
          skills: ['JavaScript', 'TypeScript', 'React'],
        })
        .expect(200);

      expect(response.body.skills.length).toBeGreaterThan(0);
    });

    it('should handle empty skills array', async () => {
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

    it('should not modify skills when not provided', async () => {
      // Add initial skill
      await prisma.skill.create({
        data: {
          name: 'Java',
          profiles: {
            connect: { userId: studentUser.id },
          },
        },
      });

      const response = await request(app.getHttpServer())
        .patch('/profile')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          bio: 'Updated without skills',
        })
        .expect(200);

      expect(response.body.skills.length).toBeGreaterThan(0);
      expect(response.body.skills[0].name).toBe('Java');
    });

    it('should require authentication', async () => {
      await request(app.getHttpServer())
        .patch('/profile')
        .send({
          bio: 'Updated',
        })
        .expect(401);
    });
  });

  describe('✅ Skill Endorsement Workflow', () => {
    let skill: any;

    beforeEach(async () => {
      await prisma.profile.create({
        data: {
          userId: studentUser.id,
          bio: 'Test',
        },
      });

      skill = await prisma.skill.create({
        data: {
          name: 'Python',
          profiles: {
            connect: { userId: studentUser.id },
          },
        },
      });
    });

    it('should create skill endorsement', async () => {
      const response = await request(app.getHttpServer())
        .post(`/profile/skill/${skill.id}/endorse`)
        .set('Authorization', `Bearer ${alumniToken}`)
        .expect(201);

      expect(response.body).toHaveProperty('skillId', skill.id);
      expect(response.body).toHaveProperty('endorserId', alumniUser.id);
    });

    it('should prevent duplicate endorsements', async () => {
      // Create first endorsement
      await prisma.endorsement.create({
        data: {
          profileId: studentUser.id,
          skillId: skill.id,
          endorserId: alumniUser.id,
        },
      });

      // Try to endorse again
      await request(app.getHttpServer())
        .post(`/profile/skill/${skill.id}/endorse`)
        .set('Authorization', `Bearer ${alumniToken}`)
        .expect(409); // Conflict
    });

    it('should return 404 for non-existent skill', async () => {
      await request(app.getHttpServer())
        .post('/profile/skill/non-existent-id/endorse')
        .set('Authorization', `Bearer ${alumniToken}`)
        .expect(404);
    });

    it('should require authentication', async () => {
      await request(app.getHttpServer())
        .post(`/profile/skill/${skill.id}/endorse`)
        .expect(401);
    });
  });

  describe('✅ Remove Endorsement Workflow', () => {
    let skill: any;
    // let endorsement: any;

    beforeEach(async () => {
      await prisma.profile.create({
        data: {
          userId: studentUser.id,
          bio: 'Test',
        },
      });

      skill = await prisma.skill.create({
        data: {
          name: 'Go',
          profiles: {
            connect: { userId: studentUser.id },
          },
        },
      });

      await prisma.endorsement.create({
        data: {
          profileId: studentUser.id,
          skillId: skill.id,
          endorserId: alumniUser.id,
        },
      });
    });

    it('should remove endorsement', async () => {
      await request(app.getHttpServer())
        .delete(`/profile/skill/${skill.id}/endorse`)
        .set('Authorization', `Bearer ${alumniToken}`)
        .expect(200);

      // Verify deletion
      const deleted = await prisma.endorsement.findUnique({
        where: {
          profileId_skillId_endorserId: {
            profileId: studentUser.id,
            skillId: skill.id,
            endorserId: alumniUser.id,
          },
        },
      });

      expect(deleted).toBeNull();
    });

    it('should return 404 for non-existent endorsement', async () => {
      await request(app.getHttpServer())
        .delete('/profile/skill/non-existent-id/endorse')
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(404);
    });

    it('should require authentication', async () => {
      await request(app.getHttpServer())
        .delete(`/profile/skill/${skill.id}/endorse`)
        .expect(401);
    });
  });

  describe('❌ Edge Cases: Null and Empty Values', () => {
    it('should handle profile with null fields', async () => {
      await prisma.profile.create({
        data: {
          userId: studentUser.id,
          bio: null,
          location: null,
        },
      });

      const response = await request(app.getHttpServer())
        .get(`/profile/${studentUser.id}`)
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('userId', studentUser.id);
    });

    it('should handle empty interests CSV (count = 0)', async () => {
      await prisma.profile.create({
        data: {
          userId: studentUser.id,
          interests: '',
        },
      });

      const response = await request(app.getHttpServer())
        .get(`/profile/${studentUser.id}/completion`)
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(200);

      expect(response.body.percentage).toBeLessThan(100);
    });

    it('should handle whitespace-only fields', async () => {
      await prisma.profile.create({
        data: {
          userId: studentUser.id,
          bio: '   ',
          location: '   ',
        },
      });

      const response = await request(app.getHttpServer())
        .get(`/profile/${studentUser.id}/completion`)
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(200);

      expect(response.body.percentage).toBeLessThan(100);
    });
  });

  describe('❌ Edge Cases: Special Characters', () => {
    it('should handle special characters in bio', async () => {
      const response = await request(app.getHttpServer())
        .patch('/profile')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          bio: "O'Brien says: <script>alert('xss')</script>",
        })
        .expect(200);

      expect(response.body.bio).toContain("O'Brien");
      expect(response.body.bio).toContain('<script>');
    });

    it('should handle Unicode in bio', async () => {
      const response = await request(app.getHttpServer())
        .patch('/profile')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          bio: '你好世界 مرحبا بالعالم 🚀',
          location: 'São Paulo, Zürich',
        })
        .expect(200);

      expect(response.body.bio).toContain('你好世界');
      expect(response.body.bio).toContain('🚀');
      expect(response.body.location).toContain('São Paulo');
    });

    it('should handle special characters in skill names', async () => {
      const response = await request(app.getHttpServer())
        .patch('/profile')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          skills: ['C++', 'C#', 'Node.js', 'ASP.NET', '.NET Core'],
        })
        .expect(200);

      expect(response.body.skills.length).toBe(5);
    });
  });

  describe('❌ Edge Cases: Boundary Values', () => {
    it('should handle exactly 5 skills (boundary)', async () => {
      await prisma.profile.create({
        data: {
          userId: studentUser.id,
          avatarUrl: 'url',
          bio: 'bio',
          location: 'loc',
          branch: 'CSE',
          year: '2024',
          dept: 'CS',
          interests: 'A,B,C,D,E,F',
          course: 'A,B,C,D,E,F',
        },
      });

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

      expect(response.body.percentage).toBe(100);
    });

    it('should handle large number of skills (50 skills)', async () => {
      await prisma.profile.create({
        data: {
          userId: studentUser.id,
          bio: 'Many skills',
        },
      });

      const skillNames = Array.from({ length: 50 }, (_, i) => `Skill${i + 1}`);

      const response = await request(app.getHttpServer())
        .patch('/profile')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          skills: skillNames,
        })
        .expect(200);

      expect(response.body.skills.length).toBe(50);
    });

    it('should handle very long bio (5000+ characters)', async () => {
      const longBio = 'a'.repeat(5000);

      const response = await request(app.getHttpServer())
        .patch('/profile')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          bio: longBio,
        })
        .expect(200);

      expect(response.body.bio.length).toBe(5000);
    });
  });

  describe('🔒 Security: Data Validation', () => {
    it('should validate profile existence before update', async () => {
      // Create user but no profile
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

      await request(app.getHttpServer())
        .patch('/profile')
        .set('Authorization', `Bearer ${newToken}`)
        .send({
          bio: 'Test',
        })
        .expect(404);
    });

    it('should validate skill existence before endorsement', async () => {
      await request(app.getHttpServer())
        .post('/profile/skill/invalid-skill-id/endorse')
        .set('Authorization', `Bearer ${alumniToken}`)
        .expect(404);
    });

    it('should prevent unauthorized profile access', async () => {
      await request(app.getHttpServer())
        .get(`/profile/${studentUser.id}`)
        .expect(401);
    });
  });
});
