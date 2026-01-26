import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/prisma/prisma.service';
import { TestDatabaseHelper } from '../helpers/test-database.helper';
import { JwtService } from '@nestjs/jwt';
import { Role } from '@prisma/client';

describe('Messaging API Contract Tests', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let dbHelper: TestDatabaseHelper;
  let jwtService: JwtService;

  let senderUser: any;
  let receiverUser: any;
  let senderToken: string;

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

    senderUser = await dbHelper.createTestUser({
      email: 'sender@kiit.ac.in',
      name: 'Sender User',
      role: Role.STUDENT,
    });

    receiverUser = await dbHelper.createTestUser({
      email: 'receiver@kiit.ac.in',
      name: 'Receiver User',
      role: Role.STUDENT,
    });

    senderToken = jwtService.sign({
      sub: senderUser.id,
      email: senderUser.email,
      userId: senderUser.id,
    });

    // Create connection
    await prisma.connection.create({
      data: {
        requesterId: senderUser.id,
        recipientId: receiverUser.id,
        status: 'ACCEPTED',
      },
    });
  });

  afterAll(async () => {
    await dbHelper.cleanup();
    await app.close();
  });

  describe('POST /messages - Send Message', () => {
    it('should return 201 with correct response structure on successful message send', async () => {
      const response = await request(app.getHttpServer())
        .post('/messages')
        .set('Authorization', `Bearer ${senderToken}`)
        .send({
          receiverId: receiverUser.id,
          content: 'Hello, how are you?',
        })
        .expect(201)
        .expect('Content-Type', /json/);

      // Validate response structure
      expect(response.body).toMatchObject({
        id: expect.any(String),
        content: expect.any(String),
        senderId: expect.any(String),
        receiverId: expect.any(String),
        timestamp: expect.any(String),
        sender: {
          id: expect.any(String),
          name: expect.any(String),
          email: expect.any(String),
        },
        receiver: {
          id: expect.any(String),
          name: expect.any(String),
          email: expect.any(String),
        },
      });

      // Validate specific values
      expect(response.body.senderId).toBe(senderUser.id);
      expect(response.body.receiverId).toBe(receiverUser.id);
      expect(response.body.content).toBe('Hello, how are you?');

      // Ensure no sensitive data exposed
      expect(response.body.sender).not.toHaveProperty('password');
      expect(response.body.receiver).not.toHaveProperty('password');
    });

    it('should return 401 without authentication', async () => {
      const response = await request(app.getHttpServer())
        .post('/messages')
        .send({
          receiverId: receiverUser.id,
          content: 'Hello',
        })
        .expect(401)
        .expect('Content-Type', /json/);

      expect(response.body).toHaveProperty('statusCode', 401);
      expect(response.body).toHaveProperty('message');
    });

    it('should return 403 when messaging non-connected user', async () => {
      const unconnectedUser = await dbHelper.createTestUser({
        email: 'unconnected@kiit.ac.in',
        name: 'Unconnected',
        role: Role.STUDENT,
      });

      const response = await request(app.getHttpServer())
        .post('/messages')
        .set('Authorization', `Bearer ${senderToken}`)
        .send({
          receiverId: unconnectedUser.id,
          content: 'Hello',
        })
        .expect(403)
        .expect('Content-Type', /json/);

      expect(response.body).toMatchObject({
        statusCode: 403,
        message: expect.stringContaining(
          'You can only send messages to users you are connected with',
        ),
      });
    });

    it('should return 404 when receiver does not exist', async () => {
      const response = await request(app.getHttpServer())
        .post('/messages')
        .set('Authorization', `Bearer ${senderToken}`)
        .send({
          receiverId: '00000000-0000-0000-0000-000000000000',
          content: 'Hello',
        })
        .expect(404)
        .expect('Content-Type', /json/);

      expect(response.body).toMatchObject({
        statusCode: 404,
        message: expect.stringContaining('Receiver user not found'),
      });
    });

    it('should return 400 for invalid receiverId format', async () => {
      const response = await request(app.getHttpServer())
        .post('/messages')
        .set('Authorization', `Bearer ${senderToken}`)
        .send({
          receiverId: 'invalid-uuid',
          content: 'Hello',
        })
        .expect(400)
        .expect('Content-Type', /json/);

      expect(response.body).toHaveProperty('statusCode', 400);
      expect(response.body).toHaveProperty('message');
    });

    it('should return 400 for empty content', async () => {
      const response = await request(app.getHttpServer())
        .post('/messages')
        .set('Authorization', `Bearer ${senderToken}`)
        .send({
          receiverId: receiverUser.id,
          content: '',
        })
        .expect(400)
        .expect('Content-Type', /json/);

      expect(response.body).toHaveProperty('statusCode', 400);
    });

    it('should return 400 for missing required fields', async () => {
      await request(app.getHttpServer())
        .post('/messages')
        .set('Authorization', `Bearer ${senderToken}`)
        .send({
          receiverId: receiverUser.id,
          // Missing content
        })
        .expect(400);

      await request(app.getHttpServer())
        .post('/messages')
        .set('Authorization', `Bearer ${senderToken}`)
        .send({
          // Missing receiverId
          content: 'Hello',
        })
        .expect(400);
    });

    it('should validate timestamp is in ISO 8601 format', async () => {
      const response = await request(app.getHttpServer())
        .post('/messages')
        .set('Authorization', `Bearer ${senderToken}`)
        .send({
          receiverId: receiverUser.id,
          content: 'Hello',
        })
        .expect(201);

      // Validate ISO 8601 format
      expect(response.body.timestamp).toMatch(
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/,
      );

      // Ensure it's a valid date
      const date = new Date(response.body.timestamp);
      expect(date.toString()).not.toBe('Invalid Date');
    });

    it('should reject extra fields not in DTO', async () => {
      const response = await request(app.getHttpServer())
        .post('/messages')
        .set('Authorization', `Bearer ${senderToken}`)
        .send({
          receiverId: receiverUser.id,
          content: 'Hello',
          extraField: 'should be rejected',
        })
        .expect(400);

      expect(response.body).toHaveProperty('statusCode', 400);
    });
  });

  describe('GET /messages/conversation/:otherUserId - Get Conversation', () => {
    beforeEach(async () => {
      // Create test messages
      await prisma.message.createMany({
        data: [
          {
            senderId: senderUser.id,
            receiverId: receiverUser.id,
            content: 'Message 1',
          },
          {
            senderId: receiverUser.id,
            receiverId: senderUser.id,
            content: 'Message 2',
          },
        ],
      });
    });

    it('should return 200 with array of messages', async () => {
      const response = await request(app.getHttpServer())
        .get(`/messages/conversation/${receiverUser.id}`)
        .set('Authorization', `Bearer ${senderToken}`)
        .expect(200)
        .expect('Content-Type', /json/);

      expect(response.body).toBeInstanceOf(Array);
      expect(response.body).toHaveLength(2);

      // Validate message structure
      response.body.forEach((message: any) => {
        expect(message).toMatchObject({
          id: expect.any(String),
          content: expect.any(String),
          senderId: expect.any(String),
          receiverId: expect.any(String),
          timestamp: expect.any(String),
          sender: {
            id: expect.any(String),
            name: expect.any(String),
            email: expect.any(String),
          },
          receiver: {
            id: expect.any(String),
            name: expect.any(String),
            email: expect.any(String),
          },
        });
      });
    });

    it('should return 401 without authentication', async () => {
      await request(app.getHttpServer())
        .get(`/messages/conversation/${receiverUser.id}`)
        .expect(401);
    });

    it('should return 403 for non-connected user', async () => {
      const unconnectedUser = await dbHelper.createTestUser({
        email: 'unconnected@kiit.ac.in',
        name: 'Unconnected',
        role: Role.STUDENT,
      });

      const response = await request(app.getHttpServer())
        .get(`/messages/conversation/${unconnectedUser.id}`)
        .set('Authorization', `Bearer ${senderToken}`)
        .expect(403);

      expect(response.body).toMatchObject({
        statusCode: 403,
        message: expect.stringContaining(
          'You can only view conversations with users you are connected with',
        ),
      });
    });

    it('should support pagination with skip and take query params', async () => {
      const response = await request(app.getHttpServer())
        .get(`/messages/conversation/${receiverUser.id}?skip=0&take=1`)
        .set('Authorization', `Bearer ${senderToken}`)
        .expect(200);

      expect(response.body).toHaveLength(1);
    });

    it('should return 400 for invalid pagination parameters', async () => {
      await request(app.getHttpServer())
        .get(`/messages/conversation/${receiverUser.id}?skip=-1`)
        .set('Authorization', `Bearer ${senderToken}`)
        .expect(400);

      await request(app.getHttpServer())
        .get(`/messages/conversation/${receiverUser.id}?take=0`)
        .set('Authorization', `Bearer ${senderToken}`)
        .expect(400);
    });

    it('should return empty array when no messages exist', async () => {
      await prisma.message.deleteMany({});

      const response = await request(app.getHttpServer())
        .get(`/messages/conversation/${receiverUser.id}`)
        .set('Authorization', `Bearer ${senderToken}`)
        .expect(200);

      expect(response.body).toEqual([]);
    });

    it('should not expose sensitive user information', async () => {
      const response = await request(app.getHttpServer())
        .get(`/messages/conversation/${receiverUser.id}`)
        .set('Authorization', `Bearer ${senderToken}`)
        .expect(200);

      response.body.forEach((message: any) => {
        expect(message.sender).not.toHaveProperty('password');
        expect(message.receiver).not.toHaveProperty('password');
        expect(message.sender).not.toHaveProperty('accountStatus');
        expect(message.receiver).not.toHaveProperty('accountStatus');
      });
    });
  });

  describe('GET /messages/conversations/all - Get All Conversations', () => {
    beforeEach(async () => {
      // Create messages
      await prisma.message.create({
        data: {
          senderId: senderUser.id,
          receiverId: receiverUser.id,
          content: 'Test message',
          timestamp: new Date(),
        },
      });
    });

    it('should return 200 with array of conversation summaries', async () => {
      const response = await request(app.getHttpServer())
        .get('/messages/conversations/all')
        .set('Authorization', `Bearer ${senderToken}`)
        .expect(200)
        .expect('Content-Type', /json/);

      expect(response.body).toBeInstanceOf(Array);
      expect(response.body.length).toBeGreaterThan(0);

      // Validate conversation structure
      response.body.forEach((conversation: any) => {
        expect(conversation).toMatchObject({
          conversationId: expect.any(String),
          otherUser: {
            id: expect.any(String),
            name: expect.any(String),
            email: expect.any(String),
            profile: expect.any(Object),
          },
          latestMessage: {
            id: expect.any(String),
            content: expect.any(String),
            senderId: expect.any(String),
            receiverId: expect.any(String),
            timestamp: expect.any(String),
          },
        });
      });
    });

    it('should return 401 without authentication', async () => {
      await request(app.getHttpServer())
        .get('/messages/conversations/all')
        .expect(401);
    });

    it('should return empty array when user has no conversations', async () => {
      await prisma.message.deleteMany({});

      const response = await request(app.getHttpServer())
        .get('/messages/conversations/all')
        .set('Authorization', `Bearer ${senderToken}`)
        .expect(200);

      expect(response.body).toEqual([]);
    });

    it('should include profile information in conversation summary', async () => {
      const response = await request(app.getHttpServer())
        .get('/messages/conversations/all')
        .set('Authorization', `Bearer ${senderToken}`)
        .expect(200);

      expect(response.body[0].otherUser.profile).toBeDefined();
      expect(response.body[0].otherUser.profile).toHaveProperty('bio');
      expect(response.body[0].otherUser.profile).toHaveProperty('location');
      expect(response.body[0].otherUser.profile).toHaveProperty('avatarUrl');
    });

    it('should not expose sensitive information', async () => {
      const response = await request(app.getHttpServer())
        .get('/messages/conversations/all')
        .set('Authorization', `Bearer ${senderToken}`)
        .expect(200);

      response.body.forEach((conversation: any) => {
        expect(conversation.otherUser).not.toHaveProperty('password');
        expect(conversation.latestMessage.sender).not.toHaveProperty(
          'password',
        );
        expect(conversation.latestMessage.receiver).not.toHaveProperty(
          'password',
        );
      });
    });
  });

  describe('GET /messages/sync - Sync Messages', () => {
    beforeEach(async () => {
      // Create messages with different timestamps
      await prisma.message.createMany({
        data: [
          {
            senderId: senderUser.id,
            receiverId: receiverUser.id,
            content: 'Old message',
            timestamp: new Date('2024-01-01T10:00:00Z'),
          },
          {
            senderId: receiverUser.id,
            receiverId: senderUser.id,
            content: 'New message',
            timestamp: new Date('2024-01-01T12:00:00Z'),
          },
        ],
      });
    });

    it('should return 200 with array of messages after timestamp', async () => {
      const lastTimestamp = new Date('2024-01-01T11:00:00Z').toISOString();

      const response = await request(app.getHttpServer())
        .get(`/messages/sync?lastMessageTimestamp=${lastTimestamp}`)
        .set('Authorization', `Bearer ${senderToken}`)
        .expect(200)
        .expect('Content-Type', /json/);

      expect(response.body).toBeInstanceOf(Array);
      expect(response.body).toHaveLength(1);
      expect(response.body[0].content).toBe('New message');
    });

    it('should return 401 without authentication', async () => {
      await request(app.getHttpServer()).get('/messages/sync').expect(401);
    });

    it('should include readReceipts in synced messages', async () => {
      const messages = await prisma.message.findMany({
        where: { receiverId: senderUser.id },
      });

      await prisma.readReceipt.create({
        data: {
          messageId: messages[0].id,
          userId: senderUser.id,
        },
      });

      const response = await request(app.getHttpServer())
        .get('/messages/sync?lastMessageTimestamp=2024-01-01T10:00:00Z')
        .set('Authorization', `Bearer ${senderToken}`)
        .expect(200);

      const messageWithReceipt = response.body.find(
        (m: any) => m.id === messages[0].id,
      );

      expect(messageWithReceipt.readReceipts).toBeInstanceOf(Array);
    });

    it('should validate messages are ordered by timestamp ascending', async () => {
      const response = await request(app.getHttpServer())
        .get('/messages/sync?lastMessageTimestamp=2024-01-01T09:00:00Z')
        .set('Authorization', `Bearer ${senderToken}`)
        .expect(200);

      expect(response.body).toHaveLength(2);

      const timestamps = response.body.map((m: any) => new Date(m.timestamp));

      for (let i = 1; i < timestamps.length; i++) {
        expect(timestamps[i].getTime()).toBeGreaterThanOrEqual(
          timestamps[i - 1].getTime(),
        );
      }
    });

    it('should use ISO 8601 date format for timestamps', async () => {
      const response = await request(app.getHttpServer())
        .get('/messages/sync')
        .set('Authorization', `Bearer ${senderToken}`)
        .expect(200);

      response.body.forEach((message: any) => {
        expect(message.timestamp).toMatch(
          /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/,
        );
      });
    });
  });

  describe('📋 Consistent Error Response Format', () => {
    it('should return consistent error format for 400 Bad Request', async () => {
      const response = await request(app.getHttpServer())
        .post('/messages')
        .set('Authorization', `Bearer ${senderToken}`)
        .send({
          receiverId: 'invalid-uuid',
          content: 'Test',
        })
        .expect(400);

      expect(response.body).toHaveProperty('statusCode', 400);
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toBeDefined();
    });

    it('should return consistent error format for 401 Unauthorized', async () => {
      const response = await request(app.getHttpServer())
        .post('/messages')
        .send({
          receiverId: receiverUser.id,
          content: 'Test',
        })
        .expect(401);

      expect(response.body).toHaveProperty('statusCode', 401);
      expect(response.body).toHaveProperty('message');
    });

    it('should return consistent error format for 403 Forbidden', async () => {
      const unconnectedUser = await dbHelper.createTestUser({
        email: 'unconnected@kiit.ac.in',
        name: 'Unconnected',
        role: Role.STUDENT,
      });

      const response = await request(app.getHttpServer())
        .post('/messages')
        .set('Authorization', `Bearer ${senderToken}`)
        .send({
          receiverId: unconnectedUser.id,
          content: 'Test',
        })
        .expect(403);

      expect(response.body).toHaveProperty('statusCode', 403);
      expect(response.body).toHaveProperty('message');
      expect(typeof response.body.message).toBe('string');
    });

    it('should return consistent error format for 404 Not Found', async () => {
      const response = await request(app.getHttpServer())
        .post('/messages')
        .set('Authorization', `Bearer ${senderToken}`)
        .send({
          receiverId: '00000000-0000-0000-0000-000000000000',
          content: 'Test',
        })
        .expect(404);

      expect(response.body).toHaveProperty('statusCode', 404);
      expect(response.body).toHaveProperty('message');
    });
  });

  describe('🔒 Security Headers and Data Protection', () => {
    it('should set proper Content-Type headers', async () => {
      const response = await request(app.getHttpServer())
        .post('/messages')
        .set('Authorization', `Bearer ${senderToken}`)
        .send({
          receiverId: receiverUser.id,
          content: 'Test',
        })
        .expect(201);

      expect(response.headers['content-type']).toMatch(/json/);
    });

    it('should never expose password fields in any response', async () => {
      const sendResponse = await request(app.getHttpServer())
        .post('/messages')
        .set('Authorization', `Bearer ${senderToken}`)
        .send({
          receiverId: receiverUser.id,
          content: 'Test',
        })
        .expect(201);

      const responseString = JSON.stringify(sendResponse.body);
      expect(responseString).not.toContain('password');

      const conversationResponse = await request(app.getHttpServer())
        .get(`/messages/conversation/${receiverUser.id}`)
        .set('Authorization', `Bearer ${senderToken}`)
        .expect(200);

      const conversationString = JSON.stringify(conversationResponse.body);
      expect(conversationString).not.toContain('password');
    });

    it('should validate JWT token on all endpoints', async () => {
      await request(app.getHttpServer()).post('/messages').expect(401);

      await request(app.getHttpServer())
        .get(`/messages/conversation/${receiverUser.id}`)
        .expect(401);

      await request(app.getHttpServer())
        .get('/messages/conversations/all')
        .expect(401);

      await request(app.getHttpServer()).get('/messages/sync').expect(401);
    });
  });
});
