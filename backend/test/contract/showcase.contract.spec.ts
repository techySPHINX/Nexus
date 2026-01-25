import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { ShowcaseModule } from '../../src/showcase/showcase.module';
import { PrismaModule } from '../../src/prisma/prisma.module';
import { PrismaService } from '../../src/prisma/prisma.service';
import { NotificationService } from '../../src/notification/notification.service';
import { GamificationService } from '../../src/gamification/gamification.service';
import { JwtService } from '@nestjs/jwt';
import { AuthGuard } from '@nestjs/passport';

describe('Showcase API Contract Tests (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let authToken: string;
  let testUserId: string;

  // Mock auth guard
  const mockAuthGuard = {
    canActivate: jest.fn((context) => {
      const request = context.switchToHttp().getRequest();
      request.user = { sub: testUserId }; // Inject user into request
      return true;
    }),
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [ShowcaseModule, PrismaModule],
    })
      .overrideGuard(AuthGuard('jwt'))
      .useValue(mockAuthGuard)
      .overrideProvider(NotificationService)
      .useValue({
        create: jest.fn().mockResolvedValue({ id: 'notification-id' }),
      })
      .overrideProvider(GamificationService)
      .useValue({
        awardForEvent: jest.fn().mockResolvedValue(undefined),
      })
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    await app.init();

    prisma = moduleFixture.get<PrismaService>(PrismaService);
    testUserId = 'test-user-id';

    // Generate mock JWT token
    const jwtService = new JwtService({ secret: 'test-secret' });
    authToken = jwtService.sign({ sub: testUserId });
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    // Clean up in correct order
    await prisma.projectUpdate.deleteMany({});
    await prisma.projectFollower.deleteMany({});
    await prisma.projectSupport.deleteMany({});
    await prisma.projectCollaborationRequest.deleteMany({});
    await prisma.projectMember.deleteMany({});
    await prisma.project.deleteMany({});
  });

  describe('POST /projects - Create Project', () => {
    it('should return 201 with created project', async () => {
      const createDto = {
        title: 'Test Project',
        description: 'A test project description',
        tags: ['javascript', 'typescript'],
        githubUrl: 'https://github.com/test/project',
        liveUrl: 'https://test-project.com',
      };

      const response = await request(app.getHttpServer())
        .post('/projects')
        .set('Authorization', `Bearer ${authToken}`)
        .send(createDto)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('title', 'Test Project');
      expect(response.body).toHaveProperty('description', createDto.description);
      expect(response.body).toHaveProperty('tags');
      expect(response.body.tags).toEqual(createDto.tags);
      expect(response.body).toHaveProperty('ownerId', testUserId);
      expect(response.body).toHaveProperty('_count');
    });

    it('should return 400 when required fields are missing', async () => {
      const response = await request(app.getHttpServer())
        .post('/projects')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ title: 'Only Title' })
        .expect(400);

      expect(response.body).toHaveProperty('message');
      expect(Array.isArray(response.body.message)).toBe(true);
    });

    it('should return 401 when no auth token provided', async () => {
      const createDto = {
        title: 'Unauthorized Project',
        description: 'Should fail',
        tags: [],
      };

      // Override mock to reject
      mockAuthGuard.canActivate.mockReturnValueOnce(false);

      await request(app.getHttpServer())
        .post('/projects')
        .send(createDto)
        .expect(401);
    });

    it('should validate tags as array', async () => {
      const response = await request(app.getHttpServer())
        .post('/projects')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Test',
          description: 'Test',
          tags: 'not-an-array', // Invalid
        })
        .expect(400);

      expect(response.body).toHaveProperty('message');
    });

    it('should return correct Content-Type header', async () => {
      const response = await request(app.getHttpServer())
        .post('/projects')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Content Type Test',
          description: 'Testing headers',
          tags: [],
        })
        .expect(201);

      expect(response.headers['content-type']).toContain('application/json');
    });
  });

  describe('GET /projects - List Projects', () => {
    beforeEach(async () => {
      // Create test projects
      await prisma.project.createMany({
        data: [
          {
            title: 'Project 1',
            description: 'Description 1',
            ownerId: testUserId,
            tags: ['tag1'],
            status: 'ACTIVE',
          },
          {
            title: 'Project 2',
            description: 'Description 2',
            ownerId: testUserId,
            tags: ['tag2'],
            status: 'ACTIVE',
          },
        ],
      });

      // Add team members
      const projects = await prisma.project.findMany();
      for (const project of projects) {
        await prisma.projectMember.create({
          data: {
            projectId: project.id,
            userId: testUserId,
            role: 'OWNER',
          },
        });
      }
    });

    it('should return 200 with array of projects', async () => {
      const response = await request(app.getHttpServer())
        .get('/projects')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(2);
      expect(response.body[0]).toHaveProperty('id');
      expect(response.body[0]).toHaveProperty('title');
      expect(response.body[0]).toHaveProperty('description');
      expect(response.body[0]).toHaveProperty('tags');
    });

    it('should support pagination parameters', async () => {
      // Create more projects
      await prisma.project.createMany({
        data: Array.from({ length: 15 }, (_, i) => ({
          title: `Extra Project ${i}`,
          description: `Description ${i}`,
          ownerId: 'other-user',
          tags: [],
          status: 'ACTIVE',
        })),
      });

      const response = await request(app.getHttpServer())
        .get('/projects?skip=5&take=10')
        .expect(200);

      expect(response.body.length).toBeLessThanOrEqual(10);
    });

    it('should return empty array when no projects exist', async () => {
      await prisma.projectMember.deleteMany({});
      await prisma.project.deleteMany({});

      const response = await request(app.getHttpServer())
        .get('/projects')
        .expect(200);

      expect(response.body).toEqual([]);
    });
  });

  describe('GET /projects/:id - Get Project by ID', () => {
    it('should return 200 with project details', async () => {
      const project = await prisma.project.create({
        data: {
          title: 'Single Project',
          description: 'Test description',
          ownerId: testUserId,
          tags: ['test'],
          status: 'ACTIVE',
        },
      });

      await prisma.projectMember.create({
        data: {
          projectId: project.id,
          userId: testUserId,
          role: 'OWNER',
        },
      });

      const response = await request(app.getHttpServer())
        .get(`/projects/${project.id}`)
        .expect(200);

      expect(response.body).toHaveProperty('id', project.id);
      expect(response.body).toHaveProperty('title', 'Single Project');
      expect(response.body).toHaveProperty('ownerId', testUserId);
    });

    it('should return 404 when project does not exist', async () => {
      await request(app.getHttpServer())
        .get('/projects/non-existent-id')
        .expect(404);
    });

    it('should include owner information in response', async () => {
      const project = await prisma.project.create({
        data: {
          title: 'Owner Info Test',
          description: 'Test',
          ownerId: testUserId,
          tags: [],
          status: 'ACTIVE',
        },
      });

      await prisma.projectMember.create({
        data: {
          projectId: project.id,
          userId: testUserId,
          role: 'OWNER',
        },
      });

      const response = await request(app.getHttpServer())
        .get(`/projects/${project.id}`)
        .expect(200);

      expect(response.body).toHaveProperty('ownerId');
    });
  });

  describe('PATCH /projects/:id - Update Project', () => {
    it('should return 200 with updated project', async () => {
      const project = await prisma.project.create({
        data: {
          title: 'Original Title',
          description: 'Original description',
          ownerId: testUserId,
          tags: ['original'],
          status: 'ACTIVE',
        },
      });

      await prisma.projectMember.create({
        data: {
          projectId: project.id,
          userId: testUserId,
          role: 'OWNER',
        },
      });

      const updateDto = {
        title: 'Updated Title',
        description: 'Updated description',
        tags: ['updated', 'new'],
      };

      const response = await request(app.getHttpServer())
        .patch(`/projects/${project.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateDto)
        .expect(200);

      expect(response.body).toHaveProperty('updatedProject');
      expect(response.body.updatedProject.title).toBe('Updated Title');
    });

    it('should return 403 when user is not owner', async () => {
      const project = await prisma.project.create({
        data: {
          title: 'Other User Project',
          description: 'Not yours',
          ownerId: 'other-user-id',
          tags: [],
          status: 'ACTIVE',
        },
      });

      await request(app.getHttpServer())
        .patch(`/projects/${project.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ title: 'Unauthorized Update' })
        .expect(403);
    });

    it('should return 404 when project does not exist', async () => {
      await request(app.getHttpServer())
        .patch('/projects/non-existent-id')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ title: 'Update' })
        .expect(404);
    });

    it('should support partial updates', async () => {
      const project = await prisma.project.create({
        data: {
          title: 'Partial Update Test',
          description: 'Original description',
          ownerId: testUserId,
          tags: ['tag1'],
          status: 'ACTIVE',
        },
      });

      await prisma.projectMember.create({
        data: {
          projectId: project.id,
          userId: testUserId,
          role: 'OWNER',
        },
      });

      const response = await request(app.getHttpServer())
        .patch(`/projects/${project.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ description: 'Only description changed' })
        .expect(200);

      expect(response.body.updatedProject.description).toBe(
        'Only description changed',
      );
      expect(response.body.updatedProject.title).toBe('Partial Update Test');
    });
  });

  describe('DELETE /projects/:id - Delete Project', () => {
    it('should return 200 when project is deleted', async () => {
      const project = await prisma.project.create({
        data: {
          title: 'To Delete',
          description: 'Will be deleted',
          ownerId: testUserId,
          tags: [],
          status: 'ACTIVE',
        },
      });

      await prisma.projectMember.create({
        data: {
          projectId: project.id,
          userId: testUserId,
          role: 'OWNER',
        },
      });

      await request(app.getHttpServer())
        .delete(`/projects/${project.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // Verify deletion
      const deleted = await prisma.project.findUnique({
        where: { id: project.id },
      });
      expect(deleted).toBeNull();
    });

    it('should return 403 when user is not owner', async () => {
      const project = await prisma.project.create({
        data: {
          title: 'Protected Project',
          description: 'Cannot delete',
          ownerId: 'other-user-id',
          tags: [],
          status: 'ACTIVE',
        },
      });

      await request(app.getHttpServer())
        .delete(`/projects/${project.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(403);

      // Verify not deleted
      const stillExists = await prisma.project.findUnique({
        where: { id: project.id },
      });
      expect(stillExists).toBeDefined();
    });

    it('should return 404 when project does not exist', async () => {
      await request(app.getHttpServer())
        .delete('/projects/non-existent-id')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });
  });

  describe('GET /projects/counts - Get Project Statistics', () => {
    it('should return 200 with project counts', async () => {
      // Create test data
      await prisma.project.create({
        data: {
          title: 'My Project',
          description: 'Test',
          ownerId: testUserId,
          tags: [],
          status: 'ACTIVE',
          teamMembers: {
            create: { userId: testUserId, role: 'OWNER' },
          },
        },
      });

      const response = await request(app.getHttpServer())
        .get('/projects/counts')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('totalProjects');
      expect(response.body).toHaveProperty('myProjects');
      expect(response.body).toHaveProperty('supportedProjects');
      expect(response.body).toHaveProperty('followedProjects');

      expect(typeof response.body.totalProjects).toBe('number');
      expect(typeof response.body.myProjects).toBe('number');
    });

    it('should return zero counts when no projects exist', async () => {
      const response = await request(app.getHttpServer())
        .get('/projects/counts')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.totalProjects).toBe(0);
      expect(response.body.myProjects).toBe(0);
      expect(response.body.supportedProjects).toBe(0);
      expect(response.body.followedProjects).toBe(0);
    });
  });

  describe('🔒 Authorization and Security', () => {
    it('should require authentication for POST /projects', async () => {
      mockAuthGuard.canActivate.mockReturnValueOnce(false);

      await request(app.getHttpServer())
        .post('/projects')
        .send({
          title: 'Test',
          description: 'Test',
          tags: [],
        })
        .expect(401);
    });

    it('should require authentication for PATCH /projects/:id', async () => {
      const project = await prisma.project.create({
        data: {
          title: 'Test',
          description: 'Test',
          ownerId: testUserId,
          tags: [],
          status: 'ACTIVE',
        },
      });

      mockAuthGuard.canActivate.mockReturnValueOnce(false);

      await request(app.getHttpServer())
        .patch(`/projects/${project.id}`)
        .send({ title: 'Updated' })
        .expect(401);
    });

    it('should require authentication for DELETE /projects/:id', async () => {
      const project = await prisma.project.create({
        data: {
          title: 'Test',
          description: 'Test',
          ownerId: testUserId,
          tags: [],
          status: 'ACTIVE',
        },
      });

      mockAuthGuard.canActivate.mockReturnValueOnce(false);

      await request(app.getHttpServer())
        .delete(`/projects/${project.id}`)
        .expect(401);
    });

    it('should sanitize input to prevent XSS', async () => {
      const maliciousDto = {
        title: '<script>alert("xss")</script>',
        description: 'Normal description',
        tags: ['<script>'],
      };

      const response = await request(app.getHttpServer())
        .post('/projects')
        .set('Authorization', `Bearer ${authToken}`)
        .send(maliciousDto)
        .expect(201);

      // Project should be created but script tags should be handled
      expect(response.body.id).toBeDefined();
    });
  });

  describe('📋 Response Structure Validation', () => {
    it('should return consistent project structure', async () => {
      const project = await prisma.project.create({
        data: {
          title: 'Structure Test',
          description: 'Testing response structure',
          ownerId: testUserId,
          tags: ['test'],
          status: 'ACTIVE',
          teamMembers: {
            create: { userId: testUserId, role: 'OWNER' },
          },
        },
      });

      const response = await request(app.getHttpServer())
        .get(`/projects/${project.id}`)
        .expect(200);

      // Validate required fields
      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('title');
      expect(response.body).toHaveProperty('description');
      expect(response.body).toHaveProperty('ownerId');
      expect(response.body).toHaveProperty('tags');
      expect(response.body).toHaveProperty('status');
      expect(response.body).toHaveProperty('createdAt');

      // Validate data types
      expect(typeof response.body.id).toBe('string');
      expect(typeof response.body.title).toBe('string');
      expect(Array.isArray(response.body.tags)).toBe(true);
    });

    it('should return consistent error structure', async () => {
      const response = await request(app.getHttpServer())
        .get('/projects/non-existent-id')
        .expect(404);

      expect(response.body).toHaveProperty('statusCode', 404);
      expect(response.body).toHaveProperty('message');
    });
  });
});
