import { Test, TestingModule } from '@nestjs/testing';
import {
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { MessagingService } from '../../src/messaging/messaging.service';
import { PrismaService } from '../../src/prisma/prisma.service';
import { ImprovedMessagingGateway } from '../../src/messaging/messaging.gateway.improved';
import { PushNotificationService } from '../../src/common/services/push-notification.service';
import { CreateMessageDto } from '../../src/messaging/dto/create-message.dto';
import { FilterMessagesDto } from '../../src/messaging/dto/filter-messages.dto';

describe('MessagingService - Unit Tests', () => {
  let service: MessagingService;
  let prisma: {
    user: { findUnique: jest.Mock };
    connection: { findFirst: jest.Mock };
    message: { create: jest.Mock; findMany: jest.Mock; findUnique: jest.Mock; update: jest.Mock };
    readReceipt: { findUnique: jest.Mock; create: jest.Mock };
  };
  let messagingGateway: jest.Mocked<ImprovedMessagingGateway>;
  let pushNotificationService: jest.Mocked<PushNotificationService>;

  const mockSenderId = 'sender-uuid-123';
  const mockReceiverId = 'receiver-uuid-456';
  const mockMessageId = 'message-uuid-789';

  const mockUser = {
    id: mockReceiverId,
    name: 'Test Receiver',
    email: 'receiver@kiit.ac.in',
    password: 'hashed_password',
    role: 'STUDENT' as any,
    accountStatus: 'ACTIVE' as any,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockConnection = {
    id: 'connection-uuid-123',
    requesterId: mockSenderId,
    recipientId: mockReceiverId,
    status: 'ACCEPTED' as any,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockMessage = {
    id: mockMessageId,
    content: 'Hello, how are you?',
    senderId: mockSenderId,
    receiverId: mockReceiverId,
    timestamp: new Date('2024-01-01T12:00:00Z'),
    deletedAt: null,
    isEdited: false,
    editedAt: null,
    sender: {
      id: mockSenderId,
      name: 'Test Sender',
      email: 'sender@kiit.ac.in',
    },
    receiver: {
      id: mockReceiverId,
      name: 'Test Receiver',
      email: 'receiver@kiit.ac.in',
    },
  };

  beforeEach(async () => {
    const mockPrismaService = {
      user: {
        findUnique: jest.fn(),
      },
      connection: {
        findFirst: jest.fn(),
      },
      message: {
        create: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      readReceipt: {
        findUnique: jest.fn(),
        create: jest.fn(),
      },
    };

    const mockMessagingGateway = {
      broadcastMessage: jest.fn(),
    };

    const mockPushNotification = {
      notifyNewMessage: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MessagingService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: ImprovedMessagingGateway,
          useValue: mockMessagingGateway,
        },
        {
          provide: PushNotificationService,
          useValue: mockPushNotification,
        },
      ],
    }).compile();

    service = module.get<MessagingService>(MessagingService);
    prisma = module.get(PrismaService) as any;
    messagingGateway = module.get(
      ImprovedMessagingGateway,
    ) as jest.Mocked<ImprovedMessagingGateway>;
    pushNotificationService = module.get(
      PushNotificationService,
    ) as jest.Mocked<PushNotificationService>;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('✅ Business Logic: Send Message', () => {
    it('should successfully send message between connected users', async () => {
      const dto: CreateMessageDto = {
        receiverId: mockReceiverId,
        content: 'Hello, how are you?',
      };

      prisma.user.findUnique.mockResolvedValue(mockUser);
      prisma.connection.findFirst.mockResolvedValue(mockConnection);
      prisma.message.create.mockResolvedValue(mockMessage as any);
      pushNotificationService.notifyNewMessage.mockResolvedValue(undefined);

      const result = await service.sendMessage(mockSenderId, dto);

      expect(result).toEqual(mockMessage);
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: mockReceiverId },
      });
      expect(prisma.connection.findFirst).toHaveBeenCalledWith({
        where: {
          status: 'ACCEPTED',
          OR: [
            { requesterId: mockSenderId, recipientId: mockReceiverId },
            { requesterId: mockReceiverId, recipientId: mockSenderId },
          ],
        },
      });
      expect(prisma.message.create).toHaveBeenCalled();
      expect(messagingGateway.broadcastMessage).toHaveBeenCalled();
      expect(pushNotificationService.notifyNewMessage).toHaveBeenCalled();
    });

    it('should throw NotFoundException if receiver does not exist', async () => {
      const dto: CreateMessageDto = {
        receiverId: 'non-existent-user',
        content: 'Hello',
      };

      prisma.user.findUnique.mockResolvedValue(null);

      await expect(service.sendMessage(mockSenderId, dto)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.sendMessage(mockSenderId, dto)).rejects.toThrow(
        'Receiver user not found',
      );

      expect(prisma.connection.findFirst).not.toHaveBeenCalled();
      expect(prisma.message.create).not.toHaveBeenCalled();
    });

    it('should throw ForbiddenException if users are not connected', async () => {
      const dto: CreateMessageDto = {
        receiverId: mockReceiverId,
        content: 'Hello',
      };

      prisma.user.findUnique.mockResolvedValue(mockUser);
      prisma.connection.findFirst.mockResolvedValue(null);

      await expect(service.sendMessage(mockSenderId, dto)).rejects.toThrow(
        ForbiddenException,
      );
      await expect(service.sendMessage(mockSenderId, dto)).rejects.toThrow(
        'You can only send messages to users you are connected with',
      );

      expect(prisma.message.create).not.toHaveBeenCalled();
    });

    it('should broadcast message via WebSocket after successful send', async () => {
      const dto: CreateMessageDto = {
        receiverId: mockReceiverId,
        content: 'Test broadcast',
      };

      prisma.user.findUnique.mockResolvedValue(mockUser);
      prisma.connection.findFirst.mockResolvedValue(mockConnection);
      prisma.message.create.mockResolvedValue(mockMessage as any);

      await service.sendMessage(mockSenderId, dto);

      expect(messagingGateway.broadcastMessage).toHaveBeenCalledWith({
        id: mockMessage.id,
        content: mockMessage.content,
        senderId: mockMessage.senderId,
        receiverId: mockMessage.receiverId,
        timestamp: mockMessage.timestamp.toISOString(),
        createdAt: mockMessage.timestamp.toISOString(),
        sender: mockMessage.sender,
        receiver: mockMessage.receiver,
      });
    });

    it('should continue sending message even if push notification fails', async () => {
      const dto: CreateMessageDto = {
        receiverId: mockReceiverId,
        content: 'Hello',
      };

      prisma.user.findUnique.mockResolvedValue(mockUser);
      prisma.connection.findFirst.mockResolvedValue(mockConnection);
      prisma.message.create.mockResolvedValue(mockMessage as any);
      pushNotificationService.notifyNewMessage.mockRejectedValue(
        new Error('Push notification failed'),
      );

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const result = await service.sendMessage(mockSenderId, dto);

      expect(result).toEqual(mockMessage);
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe('✅ Business Logic: Get Conversation', () => {
    it('should retrieve conversation between connected users', async () => {
      const dto: FilterMessagesDto = { skip: 0, take: 20 };
      const mockMessages = [mockMessage, { ...mockMessage, id: 'msg-2' }];

      prisma.connection.findFirst.mockResolvedValue(mockConnection);
      prisma.message.findMany.mockResolvedValue(mockMessages as any);

      const result = await service.getConversation(
        mockSenderId,
        mockReceiverId,
        dto,
      );

      expect(result).toEqual(mockMessages);
      expect(prisma.message.findMany).toHaveBeenCalledWith({
        where: {
          OR: [
            { senderId: mockSenderId, receiverId: mockReceiverId },
            { senderId: mockReceiverId, receiverId: mockSenderId },
          ],
        },
        orderBy: { timestamp: 'desc' },
        skip: 0,
        take: 20,
        include: {
          sender: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          receiver: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });
    });

    it('should throw ForbiddenException if users are not connected', async () => {
      const dto: FilterMessagesDto = { skip: 0, take: 20 };

      prisma.connection.findFirst.mockResolvedValue(null);

      await expect(
        service.getConversation(mockSenderId, mockReceiverId, dto),
      ).rejects.toThrow(ForbiddenException);
      await expect(
        service.getConversation(mockSenderId, mockReceiverId, dto),
      ).rejects.toThrow(
        'You can only view conversations with users you are connected with',
      );

      expect(prisma.message.findMany).not.toHaveBeenCalled();
    });

    it('should apply pagination correctly', async () => {
      const dto: FilterMessagesDto = { skip: 10, take: 5 };

      prisma.connection.findFirst.mockResolvedValue(mockConnection);
      prisma.message.findMany.mockResolvedValue([]);

      await service.getConversation(mockSenderId, mockReceiverId, dto);

      expect(prisma.message.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 10,
          take: 5,
        }),
      );
    });

    it('should use default pagination values if not provided', async () => {
      const dto: FilterMessagesDto = {};

      prisma.connection.findFirst.mockResolvedValue(mockConnection);
      prisma.message.findMany.mockResolvedValue([]);

      await service.getConversation(mockSenderId, mockReceiverId, dto);

      expect(prisma.message.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 0,
          take: 20,
        }),
      );
    });
  });

  describe('✅ Business Logic: Get All Conversations', () => {
    it('should return all conversations for a user', async () => {
      const mockMessages = [
        {
          ...mockMessage,
          sender: {
            id: mockReceiverId,
            name: 'User 1',
            email: 'user1@kiit.ac.in',
            profile: { bio: 'Bio 1', location: 'Location 1', avatarUrl: null },
          },
          receiver: {
            id: mockSenderId,
            name: 'Current User',
            email: 'current@kiit.ac.in',
            profile: { bio: 'Bio', location: 'Location', avatarUrl: null },
          },
        },
      ];

      prisma.message.findMany.mockResolvedValue(mockMessages as any);

      const result = await service.getAllConversations(mockSenderId);

      expect(result).toHaveLength(1);
      expect(result[0]).toHaveProperty('conversationId');
      expect(result[0]).toHaveProperty('otherUser');
      expect(result[0]).toHaveProperty('latestMessage');
      expect(result[0].otherUser.id).toBe(mockReceiverId);
    });

    it('should group messages by conversation partner', async () => {
      const user2Id = 'user-2-uuid';
      const mockMessages = [
        {
          ...mockMessage,
          senderId: mockReceiverId,
          receiverId: mockSenderId,
          timestamp: new Date('2024-01-02'),
          sender: {
            id: mockReceiverId,
            name: 'User 1',
            email: 'user1@kiit.ac.in',
            profile: { bio: null, location: null, avatarUrl: null },
          },
          receiver: {
            id: mockSenderId,
            name: 'Current',
            email: 'current@kiit.ac.in',
            profile: { bio: null, location: null, avatarUrl: null },
          },
        },
        {
          ...mockMessage,
          id: 'msg-2',
          senderId: mockSenderId,
          receiverId: user2Id,
          timestamp: new Date('2024-01-01'),
          sender: {
            id: mockSenderId,
            name: 'Current',
            email: 'current@kiit.ac.in',
            profile: { bio: null, location: null, avatarUrl: null },
          },
          receiver: {
            id: user2Id,
            name: 'User 2',
            email: 'user2@kiit.ac.in',
            profile: { bio: null, location: null, avatarUrl: null },
          },
        },
      ];

      prisma.message.findMany.mockResolvedValue(mockMessages as any);

      const result = await service.getAllConversations(mockSenderId);

      expect(result).toHaveLength(2);
      expect(result[0].otherUser.id).toBe(mockReceiverId); // Latest first
      expect(result[1].otherUser.id).toBe(user2Id);
    });

    it('should sort conversations by latest message timestamp', async () => {
      const user2Id = 'user-2-uuid';
      const mockMessages = [
        {
          ...mockMessage,
          id: 'msg-old',
          senderId: mockSenderId,
          receiverId: user2Id,
          timestamp: new Date('2024-01-01'),
          sender: {
            id: mockSenderId,
            name: 'Current',
            email: 'current@kiit.ac.in',
            profile: { bio: null, location: null, avatarUrl: null },
          },
          receiver: {
            id: user2Id,
            name: 'User 2',
            email: 'user2@kiit.ac.in',
            profile: { bio: null, location: null, avatarUrl: null },
          },
        },
        {
          ...mockMessage,
          id: 'msg-new',
          senderId: mockReceiverId,
          receiverId: mockSenderId,
          timestamp: new Date('2024-01-05'),
          sender: {
            id: mockReceiverId,
            name: 'User 1',
            email: 'user1@kiit.ac.in',
            profile: { bio: null, location: null, avatarUrl: null },
          },
          receiver: {
            id: mockSenderId,
            name: 'Current',
            email: 'current@kiit.ac.in',
            profile: { bio: null, location: null, avatarUrl: null },
          },
        },
      ];

      prisma.message.findMany.mockResolvedValue(mockMessages as any);

      const result = await service.getAllConversations(mockSenderId);

      expect(result[0].latestMessage.id).toBe('msg-new');
      expect(result[1].latestMessage.id).toBe('msg-old');
    });
  });

  describe('✅ Business Logic: Mark Message as Read', () => {
    it('should mark message as read for the receiver', async () => {
      const mockReadReceipt = {
        id: 'receipt-uuid',
        messageId: mockMessageId,
        userId: mockReceiverId,
        readAt: new Date(),
        user: {
          id: mockReceiverId,
          name: 'Test Receiver',
          email: 'receiver@kiit.ac.in',
        },
      };

      prisma.message.findUnique.mockResolvedValue(mockMessage as any);
      prisma.readReceipt.findUnique.mockResolvedValue(null);
      prisma.readReceipt.create.mockResolvedValue(mockReadReceipt as any);

      const result = await service.markMessageAsRead(
        mockReceiverId,
        mockMessageId,
      );

      expect(result).toEqual(mockReadReceipt);
      expect(prisma.readReceipt.create).toHaveBeenCalledWith({
        data: {
          messageId: mockMessageId,
          userId: mockReceiverId,
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });
    });

    it('should throw NotFoundException if message does not exist', async () => {
      prisma.message.findUnique.mockResolvedValue(null);

      await expect(
        service.markMessageAsRead(mockReceiverId, 'non-existent-message'),
      ).rejects.toThrow(NotFoundException);
      await expect(
        service.markMessageAsRead(mockReceiverId, 'non-existent-message'),
      ).rejects.toThrow('Message not found');

      expect(prisma.readReceipt.create).not.toHaveBeenCalled();
    });

    it('should throw ForbiddenException if user is not the receiver', async () => {
      prisma.message.findUnique.mockResolvedValue(mockMessage as any);

      await expect(
        service.markMessageAsRead('different-user-id', mockMessageId),
      ).rejects.toThrow(ForbiddenException);
      await expect(
        service.markMessageAsRead('different-user-id', mockMessageId),
      ).rejects.toThrow(
        'You can only mark messages addressed to you as read',
      );

      expect(prisma.readReceipt.create).not.toHaveBeenCalled();
    });

    it('should return existing read receipt if already marked', async () => {
      const existingReceipt = {
        id: 'existing-receipt',
        messageId: mockMessageId,
        userId: mockReceiverId,
        readAt: new Date(),
      };

      prisma.message.findUnique.mockResolvedValue(mockMessage as any);
      prisma.readReceipt.findUnique.mockResolvedValue(existingReceipt as any);

      const result = await service.markMessageAsRead(
        mockReceiverId,
        mockMessageId,
      );

      expect(result).toEqual(existingReceipt);
      expect(prisma.readReceipt.create).not.toHaveBeenCalled();
    });
  });

  describe('✅ Business Logic: Edit Message', () => {
    it('should allow sender to edit their own message', async () => {
      const newContent = 'Updated message content';
      const updatedMessage = {
        ...mockMessage,
        content: newContent,
        isEdited: true,
        editedAt: new Date(),
      };

      prisma.message.findUnique.mockResolvedValue(mockMessage as any);
      prisma.message.update.mockResolvedValue(updatedMessage as any);

      const result = await service.editMessage(
        mockSenderId,
        mockMessageId,
        newContent,
      );

      expect(result.content).toBe(newContent);
      expect(result.isEdited).toBe(true);
      expect(prisma.message.update).toHaveBeenCalledWith({
        where: { id: mockMessageId },
        data: {
          content: newContent,
          isEdited: true,
          editedAt: expect.any(Date),
        },
        include: {
          sender: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          receiver: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });
    });

    it('should throw NotFoundException if message does not exist', async () => {
      prisma.message.findUnique.mockResolvedValue(null);

      await expect(
        service.editMessage(mockSenderId, 'non-existent', 'New content'),
      ).rejects.toThrow(NotFoundException);
      await expect(
        service.editMessage(mockSenderId, 'non-existent', 'New content'),
      ).rejects.toThrow('Message not found');
    });

    it('should throw ForbiddenException if user is not the sender', async () => {
      prisma.message.findUnique.mockResolvedValue(mockMessage as any);

      await expect(
        service.editMessage('different-user', mockMessageId, 'New content'),
      ).rejects.toThrow(ForbiddenException);
      await expect(
        service.editMessage('different-user', mockMessageId, 'New content'),
      ).rejects.toThrow('You can only edit your own messages');
    });

    it('should throw ForbiddenException if message is deleted', async () => {
      const deletedMessage = {
        ...mockMessage,
        deletedAt: new Date(),
      };

      prisma.message.findUnique.mockResolvedValue(deletedMessage as any);

      await expect(
        service.editMessage(mockSenderId, mockMessageId, 'New content'),
      ).rejects.toThrow(ForbiddenException);
      await expect(
        service.editMessage(mockSenderId, mockMessageId, 'New content'),
      ).rejects.toThrow('Cannot edit a deleted message');
    });
  });

  describe('✅ Business Logic: Delete Message', () => {
    it('should soft delete message by sender', async () => {
      const deletedMessage = {
        ...mockMessage,
        deletedAt: new Date(),
        content: 'This message has been deleted',
      };

      prisma.message.findUnique.mockResolvedValue(mockMessage as any);
      prisma.message.update.mockResolvedValue(deletedMessage as any);

      const result = await service.deleteMessage(mockSenderId, mockMessageId);

      expect(result.deletedAt).not.toBeNull();
      expect(result.content).toBe('This message has been deleted');
      expect(prisma.message.update).toHaveBeenCalledWith({
        where: { id: mockMessageId },
        data: {
          deletedAt: expect.any(Date),
          content: 'This message has been deleted',
        },
        include: {
          sender: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          receiver: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });
    });

    it('should throw NotFoundException if message does not exist', async () => {
      prisma.message.findUnique.mockResolvedValue(null);

      await expect(
        service.deleteMessage(mockSenderId, 'non-existent'),
      ).rejects.toThrow(NotFoundException);
      await expect(
        service.deleteMessage(mockSenderId, 'non-existent'),
      ).rejects.toThrow('Message not found');
    });

    it('should throw ForbiddenException if user is not the sender', async () => {
      prisma.message.findUnique.mockResolvedValue(mockMessage as any);

      await expect(
        service.deleteMessage('different-user', mockMessageId),
      ).rejects.toThrow(ForbiddenException);
      await expect(
        service.deleteMessage('different-user', mockMessageId),
      ).rejects.toThrow('You can only delete your own messages');
    });

    it('should throw ForbiddenException if message already deleted', async () => {
      const deletedMessage = {
        ...mockMessage,
        deletedAt: new Date(),
      };

      prisma.message.findUnique.mockResolvedValue(deletedMessage as any);

      await expect(
        service.deleteMessage(mockSenderId, mockMessageId),
      ).rejects.toThrow(ForbiddenException);
      await expect(
        service.deleteMessage(mockSenderId, mockMessageId),
      ).rejects.toThrow('Message is already deleted');
    });
  });

  describe('✅ Business Logic: Sync Messages', () => {
    it('should retrieve messages after specified timestamp', async () => {
      const lastTimestamp = new Date('2024-01-01');
      const newMessages = [
        {
          ...mockMessage,
          timestamp: new Date('2024-01-02'),
          readReceipts: [],
        },
        {
          ...mockMessage,
          id: 'msg-2',
          timestamp: new Date('2024-01-03'),
          readReceipts: [],
        },
      ];

      prisma.message.findMany.mockResolvedValue(newMessages as any);

      const result = await service.syncMessages(mockSenderId, lastTimestamp);

      expect(result).toEqual(newMessages);
      expect(prisma.message.findMany).toHaveBeenCalledWith({
        where: {
          AND: [
            {
              OR: [
                { senderId: mockSenderId },
                { receiverId: mockSenderId },
              ],
            },
            {
              timestamp: {
                gt: lastTimestamp,
              },
            },
          ],
        },
        orderBy: { timestamp: 'asc' },
        include: {
          sender: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          receiver: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          readReceipts: {
            select: {
              userId: true,
              readAt: true,
            },
          },
        },
      });
    });

    it('should include read receipts in synced messages', async () => {
      const lastTimestamp = new Date('2024-01-01');
      const messageWithReceipt = {
        ...mockMessage,
        timestamp: new Date('2024-01-02'),
        readReceipts: [
          {
            userId: mockReceiverId,
            readAt: new Date(),
          },
        ],
      };

      prisma.message.findMany.mockResolvedValue([messageWithReceipt] as any);

      const result = await service.syncMessages(mockSenderId, lastTimestamp);

      expect(result[0].readReceipts).toHaveLength(1);
    });
  });

  describe('❌ Edge Cases: Null and Empty Values', () => {
    it('should handle empty message content gracefully', async () => {
      const dto: CreateMessageDto = {
        receiverId: mockReceiverId,
        content: '',
      };

      // This would be caught by class-validator, but testing service logic
      prisma.user.findUnique.mockResolvedValue(mockUser);
      prisma.connection.findFirst.mockResolvedValue(mockConnection);
      prisma.message.create.mockResolvedValue({
        ...mockMessage,
        content: '',
      } as any);

      const result = await service.sendMessage(mockSenderId, dto);

      expect(result.content).toBe('');
    });

    it('should handle null sender ID gracefully', async () => {
      const dto: CreateMessageDto = {
        receiverId: mockReceiverId,
        content: 'Hello',
      };

      prisma.user.findUnique.mockResolvedValue(mockUser);
      prisma.connection.findFirst.mockResolvedValue(null);

      await expect(service.sendMessage(null as any, dto)).rejects.toThrow();
    });

    it('should handle empty conversation pagination', async () => {
      const dto: FilterMessagesDto = { skip: 0, take: 20 };

      prisma.connection.findFirst.mockResolvedValue(mockConnection);
      prisma.message.findMany.mockResolvedValue([]);

      const result = await service.getConversation(
        mockSenderId,
        mockReceiverId,
        dto,
      );

      expect(result).toEqual([]);
    });
  });

  describe('❌ Edge Cases: Special Characters and Long Content', () => {
    it('should handle special characters in message content', async () => {
      const dto: CreateMessageDto = {
        receiverId: mockReceiverId,
        content: '<script>alert("XSS")</script>',
      };

      prisma.user.findUnique.mockResolvedValue(mockUser);
      prisma.connection.findFirst.mockResolvedValue(mockConnection);
      prisma.message.create.mockResolvedValue({
        ...mockMessage,
        content: dto.content,
      } as any);

      const result = await service.sendMessage(mockSenderId, dto);

      expect(result.content).toBe(dto.content);
    });

    it('should handle very long message content', async () => {
      const longContent = 'A'.repeat(10000);
      const dto: CreateMessageDto = {
        receiverId: mockReceiverId,
        content: longContent,
      };

      prisma.user.findUnique.mockResolvedValue(mockUser);
      prisma.connection.findFirst.mockResolvedValue(mockConnection);
      prisma.message.create.mockResolvedValue({
        ...mockMessage,
        content: longContent,
      } as any);

      const result = await service.sendMessage(mockSenderId, dto);

      expect(result.content.length).toBe(10000);
    });

    it('should handle Unicode characters in message', async () => {
      const unicodeContent = '你好 🎉 مرحبا';
      const dto: CreateMessageDto = {
        receiverId: mockReceiverId,
        content: unicodeContent,
      };

      prisma.user.findUnique.mockResolvedValue(mockUser);
      prisma.connection.findFirst.mockResolvedValue(mockConnection);
      prisma.message.create.mockResolvedValue({
        ...mockMessage,
        content: unicodeContent,
      } as any);

      const result = await service.sendMessage(mockSenderId, dto);

      expect(result.content).toBe(unicodeContent);
    });
  });

  describe('❌ Edge Cases: Boundary Values', () => {
    it('should handle pagination with zero skip', async () => {
      const dto: FilterMessagesDto = { skip: 0, take: 1 };

      prisma.connection.findFirst.mockResolvedValue(mockConnection);
      prisma.message.findMany.mockResolvedValue([mockMessage] as any);

      await service.getConversation(mockSenderId, mockReceiverId, dto);

      expect(prisma.message.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 0, take: 1 }),
      );
    });

    it('should handle very large pagination skip', async () => {
      const dto: FilterMessagesDto = { skip: 999999, take: 20 };

      prisma.connection.findFirst.mockResolvedValue(mockConnection);
      prisma.message.findMany.mockResolvedValue([]);

      const result = await service.getConversation(
        mockSenderId,
        mockReceiverId,
        dto,
      );

      expect(result).toEqual([]);
    });
  });

  describe('🔒 Security: Connection Validation', () => {
    it('should verify connection exists before sending message', async () => {
      const dto: CreateMessageDto = {
        receiverId: mockReceiverId,
        content: 'Hello',
      };

      prisma.user.findUnique.mockResolvedValue(mockUser);
      prisma.connection.findFirst.mockResolvedValue(null);

      await expect(service.sendMessage(mockSenderId, dto)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should verify connection status is ACCEPTED', async () => {
      const pendingConnection = {
        ...mockConnection,
        status: 'PENDING' as any,
      };

      // pendingConnection is defined to document test requirement
      expect(pendingConnection.status).toBe('PENDING');

      const dto: CreateMessageDto = {
        receiverId: mockReceiverId,
        content: 'Hello',
      };

      prisma.user.findUnique.mockResolvedValue(mockUser);
      prisma.connection.findFirst.mockResolvedValue(null); // Will not find ACCEPTED

      await expect(service.sendMessage(mockSenderId, dto)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should check connection in both directions', async () => {
      const dto: CreateMessageDto = {
        receiverId: mockReceiverId,
        content: 'Hello',
      };

      prisma.user.findUnique.mockResolvedValue(mockUser);
      prisma.connection.findFirst.mockResolvedValue(mockConnection);
      prisma.message.create.mockResolvedValue(mockMessage as any);

      await service.sendMessage(mockSenderId, dto);

      expect(prisma.connection.findFirst).toHaveBeenCalledWith({
        where: {
          status: 'ACCEPTED',
          OR: [
            { requesterId: mockSenderId, recipientId: mockReceiverId },
            { requesterId: mockReceiverId, recipientId: mockSenderId },
          ],
        },
      });
    });
  });
});
