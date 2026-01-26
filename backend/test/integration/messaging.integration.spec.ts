import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/prisma/prisma.service';
import { TestDatabaseHelper } from '../helpers/test-database.helper';
import { JwtService } from '@nestjs/jwt';
import { Role } from '@prisma/client';

describe('Messaging Integration Tests', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let dbHelper: TestDatabaseHelper;
  let jwtService: JwtService;

  let senderUser: any;
  let receiverUser: any;
  let unconnectedUser: any;
  let senderToken: string;
  let receiverToken: string;

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
    // Clean database before each test
    await dbHelper.cleanup();

    // Create test users
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

    unconnectedUser = await dbHelper.createTestUser({
      email: 'unconnected@kiit.ac.in',
      name: 'Unconnected User',
      role: Role.STUDENT,
    });

    // Generate JWT tokens
    senderToken = jwtService.sign({
      sub: senderUser.id,
      email: senderUser.email,
      userId: senderUser.id,
    });

    receiverToken = jwtService.sign({
      sub: receiverUser.id,
      email: receiverUser.email,
      userId: receiverUser.id,
    });

    // unconnectedToken would be generated if needed for tests
    // Currently not used in test suite

    // Create accepted connection between sender and receiver
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

  describe('✅ Complete Message Send Workflow', () => {
    it('should send message successfully between connected users', async () => {
      const response = await request(app.getHttpServer())
        .post('/messages')
        .set('Authorization', `Bearer ${senderToken}`)
        .send({
          receiverId: receiverUser.id,
          content: 'Hello, how are you?',
        })
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.content).toBe('Hello, how are you?');
      expect(response.body.senderId).toBe(senderUser.id);
      expect(response.body.receiverId).toBe(receiverUser.id);
      expect(response.body).toHaveProperty('sender');
      expect(response.body).toHaveProperty('receiver');
      expect(response.body).toHaveProperty('timestamp');

      // Verify message was saved to database
      const message = await prisma.message.findFirst({
        where: {
          senderId: senderUser.id,
          receiverId: receiverUser.id,
        },
      });

      expect(message).toBeDefined();
      expect(message?.content).toBe('Hello, how are you?');
    });

    it('should fail to send message without authentication', async () => {
      await request(app.getHttpServer())
        .post('/messages')
        .send({
          receiverId: receiverUser.id,
          content: 'Hello',
        })
        .expect(401);
    });

    it('should fail to send message to non-connected user', async () => {
      const response = await request(app.getHttpServer())
        .post('/messages')
        .set('Authorization', `Bearer ${senderToken}`)
        .send({
          receiverId: unconnectedUser.id,
          content: 'Hello stranger',
        })
        .expect(403);

      expect(response.body.message).toContain(
        'You can only send messages to users you are connected with',
      );
    });

    it('should fail to send message to non-existent user', async () => {
      const response = await request(app.getHttpServer())
        .post('/messages')
        .set('Authorization', `Bearer ${senderToken}`)
        .send({
          receiverId: '00000000-0000-0000-0000-000000000000',
          content: 'Hello ghost',
        })
        .expect(404);

      expect(response.body.message).toContain('Receiver user not found');
    });

    it('should validate message content is not empty', async () => {
      await request(app.getHttpServer())
        .post('/messages')
        .set('Authorization', `Bearer ${senderToken}`)
        .send({
          receiverId: receiverUser.id,
          content: '',
        })
        .expect(400);
    });

    it('should validate receiverId is a valid UUID', async () => {
      await request(app.getHttpServer())
        .post('/messages')
        .set('Authorization', `Bearer ${senderToken}`)
        .send({
          receiverId: 'invalid-uuid',
          content: 'Hello',
        })
        .expect(400);
    });
  });

  describe('✅ Get Conversation Workflow', () => {
    beforeEach(async () => {
      // Create some test messages
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
          {
            senderId: senderUser.id,
            receiverId: receiverUser.id,
            content: 'Message 3',
          },
        ],
      });
    });

    it('should retrieve conversation between connected users', async () => {
      const response = await request(app.getHttpServer())
        .get(`/messages/conversation/${receiverUser.id}`)
        .set('Authorization', `Bearer ${senderToken}`)
        .expect(200);

      expect(response.body).toBeInstanceOf(Array);
      expect(response.body).toHaveLength(3);
      expect(response.body[0]).toHaveProperty('id');
      expect(response.body[0]).toHaveProperty('content');
      expect(response.body[0]).toHaveProperty('sender');
      expect(response.body[0]).toHaveProperty('receiver');
    });

    it('should return messages in descending order by timestamp', async () => {
      const response = await request(app.getHttpServer())
        .get(`/messages/conversation/${receiverUser.id}`)
        .set('Authorization', `Bearer ${senderToken}`)
        .expect(200);

      expect(response.body[0].content).toBe('Message 3');
      expect(response.body[2].content).toBe('Message 1');
    });

    it('should support pagination with skip and take', async () => {
      const response = await request(app.getHttpServer())
        .get(`/messages/conversation/${receiverUser.id}?skip=1&take=1`)
        .set('Authorization', `Bearer ${senderToken}`)
        .expect(200);

      expect(response.body).toHaveLength(1);
      expect(response.body[0].content).toBe('Message 2');
    });

    it('should fail to retrieve conversation with non-connected user', async () => {
      const response = await request(app.getHttpServer())
        .get(`/messages/conversation/${unconnectedUser.id}`)
        .set('Authorization', `Bearer ${senderToken}`)
        .expect(403);

      expect(response.body.message).toContain(
        'You can only view conversations with users you are connected with',
      );
    });

    it('should fail without authentication', async () => {
      await request(app.getHttpServer())
        .get(`/messages/conversation/${receiverUser.id}`)
        .expect(401);
    });
  });

  describe('✅ Get All Conversations Workflow', () => {
    let user3: any;

    beforeEach(async () => {
      // Create third user and connect
      user3 = await dbHelper.createTestUser({
        email: 'user3@kiit.ac.in',
        name: 'User Three',
        role: Role.STUDENT,
      });

      await prisma.connection.create({
        data: {
          requesterId: senderUser.id,
          recipientId: user3.id,
          status: 'ACCEPTED',
        },
      });

      // Create messages with receiver
      await prisma.message.create({
        data: {
          senderId: senderUser.id,
          receiverId: receiverUser.id,
          content: 'Hello receiver',
          timestamp: new Date('2024-01-01T10:00:00Z'),
        },
      });

      // Create messages with user3
      await prisma.message.create({
        data: {
          senderId: user3.id,
          receiverId: senderUser.id,
          content: 'Hello from user3',
          timestamp: new Date('2024-01-01T12:00:00Z'),
        },
      });
    });

    it('should list all conversations for a user', async () => {
      const response = await request(app.getHttpServer())
        .get('/messages/conversations/all')
        .set('Authorization', `Bearer ${senderToken}`)
        .expect(200);

      expect(response.body).toBeInstanceOf(Array);
      expect(response.body).toHaveLength(2);
      expect(response.body[0]).toHaveProperty('conversationId');
      expect(response.body[0]).toHaveProperty('otherUser');
      expect(response.body[0]).toHaveProperty('latestMessage');
    });

    it('should sort conversations by latest message timestamp', async () => {
      const response = await request(app.getHttpServer())
        .get('/messages/conversations/all')
        .set('Authorization', `Bearer ${senderToken}`)
        .expect(200);

      // user3 conversation should be first (latest message)
      expect(response.body[0].otherUser.id).toBe(user3.id);
      expect(response.body[1].otherUser.id).toBe(receiverUser.id);
    });

    it('should include user profile in conversation list', async () => {
      const response = await request(app.getHttpServer())
        .get('/messages/conversations/all')
        .set('Authorization', `Bearer ${senderToken}`)
        .expect(200);

      expect(response.body[0].otherUser).toHaveProperty('name');
      expect(response.body[0].otherUser).toHaveProperty('email');
      expect(response.body[0].otherUser).toHaveProperty('profile');
    });

    it('should fail without authentication', async () => {
      await request(app.getHttpServer())
        .get('/messages/conversations/all')
        .expect(401);
    });
  });

  describe('✅ Message Sync Workflow', () => {
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
            content: 'New message 1',
            timestamp: new Date('2024-01-01T12:00:00Z'),
          },
          {
            senderId: senderUser.id,
            receiverId: receiverUser.id,
            content: 'New message 2',
            timestamp: new Date('2024-01-01T14:00:00Z'),
          },
        ],
      });
    });

    it('should sync messages after specified timestamp', async () => {
      const lastTimestamp = new Date('2024-01-01T11:00:00Z').toISOString();

      const response = await request(app.getHttpServer())
        .get(`/messages/sync?lastMessageTimestamp=${lastTimestamp}`)
        .set('Authorization', `Bearer ${senderToken}`)
        .expect(200);

      expect(response.body).toBeInstanceOf(Array);
      expect(response.body).toHaveLength(2);
      expect(response.body[0].content).toBe('New message 1');
      expect(response.body[1].content).toBe('New message 2');
    });

    it('should return all messages if no timestamp provided', async () => {
      const response = await request(app.getHttpServer())
        .get('/messages/sync')
        .set('Authorization', `Bearer ${senderToken}`)
        .expect(200);

      expect(response.body).toBeInstanceOf(Array);
      expect(response.body.length).toBeGreaterThanOrEqual(3);
    });

    it('should include read receipts in synced messages', async () => {
      const messages = await prisma.message.findMany({
        where: { receiverId: senderUser.id },
      });

      // Create read receipt
      await prisma.readReceipt.create({
        data: {
          messageId: messages[0].id,
          userId: senderUser.id,
        },
      });

      const lastTimestamp = new Date('2024-01-01T11:00:00Z').toISOString();

      const response = await request(app.getHttpServer())
        .get(`/messages/sync?lastMessageTimestamp=${lastTimestamp}`)
        .set('Authorization', `Bearer ${senderToken}`)
        .expect(200);

      const messageWithReceipt = response.body.find(
        (m: any) => m.id === messages[0].id,
      );

      expect(messageWithReceipt).toBeDefined();
      expect(messageWithReceipt.readReceipts).toBeInstanceOf(Array);
    });

    it('should fail without authentication', async () => {
      await request(app.getHttpServer()).get('/messages/sync').expect(401);
    });
  });

  describe('❌ Edge Cases: Special Characters and Long Messages', () => {
    it('should handle special characters in message content', async () => {
      const specialContent = '<script>alert("XSS")</script>';

      const response = await request(app.getHttpServer())
        .post('/messages')
        .set('Authorization', `Bearer ${senderToken}`)
        .send({
          receiverId: receiverUser.id,
          content: specialContent,
        })
        .expect(201);

      expect(response.body.content).toBe(specialContent);
    });

    it('should handle Unicode characters in messages', async () => {
      const unicodeContent = '你好 🎉 مرحبا';

      const response = await request(app.getHttpServer())
        .post('/messages')
        .set('Authorization', `Bearer ${senderToken}`)
        .send({
          receiverId: receiverUser.id,
          content: unicodeContent,
        })
        .expect(201);

      expect(response.body.content).toBe(unicodeContent);
    });

    it('should handle very long message content', async () => {
      const longContent = 'A'.repeat(5000);

      const response = await request(app.getHttpServer())
        .post('/messages')
        .set('Authorization', `Bearer ${senderToken}`)
        .send({
          receiverId: receiverUser.id,
          content: longContent,
        })
        .expect(201);

      expect(response.body.content.length).toBe(5000);
    });
  });

  describe('❌ Edge Cases: Concurrent Operations', () => {
    it('should handle concurrent message sends', async () => {
      const messagePromises = [];

      for (let i = 0; i < 5; i++) {
        const promise = request(app.getHttpServer())
          .post('/messages')
          .set('Authorization', `Bearer ${senderToken}`)
          .send({
            receiverId: receiverUser.id,
            content: `Concurrent message ${i}`,
          });

        messagePromises.push(promise);
      }

      const responses = await Promise.all(messagePromises);

      responses.forEach((response) => {
        expect(response.status).toBe(201);
      });

      // Verify all messages were created
      const messages = await prisma.message.findMany({
        where: {
          senderId: senderUser.id,
          receiverId: receiverUser.id,
        },
      });

      expect(messages).toHaveLength(5);
    });
  });

  describe('❌ Edge Cases: Invalid Input Validation', () => {
    it('should reject missing receiverId', async () => {
      await request(app.getHttpServer())
        .post('/messages')
        .set('Authorization', `Bearer ${senderToken}`)
        .send({
          content: 'Hello',
        })
        .expect(400);
    });

    it('should reject missing content', async () => {
      await request(app.getHttpServer())
        .post('/messages')
        .set('Authorization', `Bearer ${senderToken}`)
        .send({
          receiverId: receiverUser.id,
        })
        .expect(400);
    });

    it('should reject non-string content', async () => {
      await request(app.getHttpServer())
        .post('/messages')
        .set('Authorization', `Bearer ${senderToken}`)
        .send({
          receiverId: receiverUser.id,
          content: 12345,
        })
        .expect(400);
    });

    it('should reject invalid pagination parameters', async () => {
      await request(app.getHttpServer())
        .get(`/messages/conversation/${receiverUser.id}?skip=-1`)
        .set('Authorization', `Bearer ${senderToken}`)
        .expect(400);
    });

    it('should reject take less than 1', async () => {
      await request(app.getHttpServer())
        .get(`/messages/conversation/${receiverUser.id}?take=0`)
        .set('Authorization', `Bearer ${senderToken}`)
        .expect(400);
    });
  });

  describe('🔒 Security: Authorization and Access Control', () => {
    it('should prevent sending messages without valid JWT', async () => {
      await request(app.getHttpServer())
        .post('/messages')
        .set('Authorization', 'Bearer invalid-token')
        .send({
          receiverId: receiverUser.id,
          content: 'Hello',
        })
        .expect(401);
    });

    it('should prevent accessing conversations without authentication', async () => {
      await request(app.getHttpServer())
        .get(`/messages/conversation/${receiverUser.id}`)
        .expect(401);
    });

    it('should prevent syncing messages without authentication', async () => {
      await request(app.getHttpServer()).get('/messages/sync').expect(401);
    });

    it('should enforce connection requirement for messaging', async () => {
      // Try to message unconnected user
      await request(app.getHttpServer())
        .post('/messages')
        .set('Authorization', `Bearer ${senderToken}`)
        .send({
          receiverId: unconnectedUser.id,
          content: 'Hello',
        })
        .expect(403);

      // Verify no message was created
      const message = await prisma.message.findFirst({
        where: {
          senderId: senderUser.id,
          receiverId: unconnectedUser.id,
        },
      });

      expect(message).toBeNull();
    });

    it('should enforce connection requirement for viewing conversations', async () => {
      await request(app.getHttpServer())
        .get(`/messages/conversation/${unconnectedUser.id}`)
        .set('Authorization', `Bearer ${senderToken}`)
        .expect(403);
    });
  });

  describe('🔄 Idempotency: Duplicate Prevention', () => {
    it('should allow sending same message content multiple times', async () => {
      const messageData = {
        receiverId: receiverUser.id,
        content: 'Duplicate content test',
      };

      const response1 = await request(app.getHttpServer())
        .post('/messages')
        .set('Authorization', `Bearer ${senderToken}`)
        .send(messageData)
        .expect(201);

      const response2 = await request(app.getHttpServer())
        .post('/messages')
        .set('Authorization', `Bearer ${senderToken}`)
        .send(messageData)
        .expect(201);

      expect(response1.body.id).not.toBe(response2.body.id);

      // Verify both messages exist
      const messages = await prisma.message.findMany({
        where: {
          senderId: senderUser.id,
          receiverId: receiverUser.id,
          content: 'Duplicate content test',
        },
      });

      expect(messages).toHaveLength(2);
    });
  });

  describe('✅ Complete Messaging Journey', () => {
    it('should complete full messaging lifecycle', async () => {
      // 1. Sender sends message
      const sendResponse = await request(app.getHttpServer())
        .post('/messages')
        .set('Authorization', `Bearer ${senderToken}`)
        .send({
          receiverId: receiverUser.id,
          content: 'Hello, lets connect!',
        })
        .expect(201);

      const messageId = sendResponse.body.id;

      // 2. Receiver retrieves conversation
      const conversationResponse = await request(app.getHttpServer())
        .get(`/messages/conversation/${senderUser.id}`)
        .set('Authorization', `Bearer ${receiverToken}`)
        .expect(200);

      expect(conversationResponse.body).toHaveLength(1);
      expect(conversationResponse.body[0].id).toBe(messageId);

      // 3. Receiver views all conversations
      const allConversationsResponse = await request(app.getHttpServer())
        .get('/messages/conversations/all')
        .set('Authorization', `Bearer ${receiverToken}`)
        .expect(200);

      expect(allConversationsResponse.body).toHaveLength(1);
      expect(allConversationsResponse.body[0].latestMessage.id).toBe(messageId);

      // 4. Receiver replies
      await request(app.getHttpServer())
        .post('/messages')
        .set('Authorization', `Bearer ${receiverToken}`)
        .send({
          receiverId: senderUser.id,
          content: 'Sure, lets talk!',
        })
        .expect(201);

      // 5. Sender syncs messages
      const syncResponse = await request(app.getHttpServer())
        .get('/messages/sync')
        .set('Authorization', `Bearer ${senderToken}`)
        .expect(200);

      expect(syncResponse.body.length).toBeGreaterThanOrEqual(2);
    });
  });
});
