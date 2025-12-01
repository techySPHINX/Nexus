import {
  Injectable,
  ForbiddenException,
  NotFoundException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateMessageDto } from './dto/create-message.dto';
import { FilterMessagesDto } from './dto/filter-messages.dto';
import { ImprovedMessagingGateway } from './messaging.gateway.improved';
import { PushNotificationService } from '../common/services/push-notification.service';

/**
 * Service for handling messaging operations.
 * Manages sending messages, retrieving conversations, and listing all conversations.
 */
@Injectable()
export class MessagingService {
  constructor(
    private prisma: PrismaService,
    @Inject(forwardRef(() => ImprovedMessagingGateway))
    private messagingGateway: ImprovedMessagingGateway,
    private pushNotificationService: PushNotificationService,
  ) { }

  /**
   * Sends a new message from a sender to a receiver.
   * Requires an existing accepted connection between sender and receiver.
   * @param senderId - The ID of the user sending the message.
   * @param dto - The data transfer object containing the receiver ID and message content.
   * @returns A promise that resolves to the created message object.
   * @throws {NotFoundException} If the receiver user is not found.
   * @throws {ForbiddenException} If there is no accepted connection between the sender and receiver.
   */
  async sendMessage(senderId: string, dto: CreateMessageDto) {
    const { receiverId, content } = dto;

    const receiver = await this.prisma.user.findUnique({
      where: { id: receiverId },
    });

    if (!receiver) {
      throw new NotFoundException('Receiver user not found');
    }

    const isConnected = await this.prisma.connection.findFirst({
      where: {
        status: 'ACCEPTED',
        OR: [
          { requesterId: senderId, recipientId: receiverId },
          { requesterId: receiverId, recipientId: senderId },
        ],
      },
    });

    if (!isConnected) {
      throw new ForbiddenException(
        'You can only send messages to users you are connected with',
      );
    }

    const message = await this.prisma.message.create({
      data: {
        content,
        senderId,
        receiverId,
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

    // Broadcast the message via WebSocket for real-time delivery
    this.messagingGateway.broadcastMessage({
      id: message.id,
      content: message.content,
      senderId: message.senderId,
      receiverId: message.receiverId,
      timestamp: message.timestamp.toISOString(),
      createdAt: message.timestamp.toISOString(),
      sender: message.sender,
      receiver: message.receiver,
    });

    // Send push notification to receiver if they're offline
    try {
      await this.pushNotificationService.notifyNewMessage(
        message.receiverId,
        message.senderId,
        message.content,
      );
    } catch (error) {
      // Log error but don't fail the message sending
      console.error('Failed to send message push notification:', error);
    }

    return message;
  }

  /**
   * Retrieves the conversation history between two users.
   * Requires an existing accepted connection between the two users.
   * Supports pagination for fetching messages.
   * @param userId - The ID of the current user.
   * @param otherUserId - The ID of the other user in the conversation.
   * @param dto - Data transfer object for filtering messages (e.g., skip, take).
   * @returns A promise that resolves to an array of message objects in the conversation.
   * @throws {ForbiddenException} If there is no accepted connection between the two users.
   */
  async getConversation(
    userId: string,
    otherUserId: string,
    dto: FilterMessagesDto,
  ) {
    const { skip = 0, take = 20 } = dto;

    const isConnected = await this.prisma.connection.findFirst({
      where: {
        status: 'ACCEPTED',
        OR: [
          { requesterId: userId, recipientId: otherUserId },
          { requesterId: otherUserId, recipientId: userId },
        ],
      },
    });

    if (!isConnected) {
      throw new ForbiddenException(
        'You can only view conversations with users you are connected with',
      );
    }

    return this.prisma.message.findMany({
      where: {
        OR: [
          { senderId: userId, receiverId: otherUserId },
          { senderId: otherUserId, receiverId: userId },
        ],
      },
      orderBy: { timestamp: 'desc' },
      skip,
      take,
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
  }

  /**
   * Retrieves a list of all conversations for a given user.
   * Each conversation includes the last message and details of the other participant.
   * @param userId - The ID of the user to retrieve conversations for.
   * @returns A promise that resolves to an array of conversation summary objects.
   */
  async getAllConversations(userId: string) {
    // Get all messages for the user with full details
    const messages = await this.prisma.message.findMany({
      where: {
        OR: [{ senderId: userId }, { receiverId: userId }],
      },
      orderBy: { timestamp: 'desc' },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            email: true,
            profile: {
              select: {
                bio: true,
                location: true,
                avatarUrl: true,
              },
            },
          },
        },
        receiver: {
          select: {
            id: true,
            name: true,
            email: true,
            profile: {
              select: {
                bio: true,
                location: true,
                avatarUrl: true,
              },
            },
          },
        },
      },
    });

    // Group messages by conversation partner
    const conversationMap = new Map<string, any>();

    messages.forEach((message) => {
      const otherUserId =
        message.senderId === userId ? message.receiverId : message.senderId;
      const otherUser =
        message.senderId === userId ? message.receiver : message.sender;

      if (!conversationMap.has(otherUserId)) {
        conversationMap.set(otherUserId, {
          conversationId: `${userId}-${otherUserId}`,
          otherUser: {
            id: otherUser.id,
            name: otherUser.name,
            email: otherUser.email,
            profile: otherUser.profile,
          },
          latestMessage: message,
        });
      }
    });

    // Convert map to array and sort by latest message timestamp
    const conversations = Array.from(conversationMap.values()).sort((a, b) => {
      const aTime = new Date(a.latestMessage.timestamp).getTime();
      const bTime = new Date(b.latestMessage.timestamp).getTime();
      return bTime - aTime;
    });

    return conversations;
  }

  /**
   * Records a read receipt for a message.
   * Creates a ReadReceipt entry if one doesn't already exist.
   * @param userId - The ID of the user who read the message.
   * @param messageId - The ID of the message that was read.
   * @returns A promise that resolves to the created read receipt.
   * @throws {NotFoundException} If the message is not found.
   * @throws {ForbiddenException} If the user is not the receiver of the message.
   */
  async markMessageAsRead(userId: string, messageId: string) {
    // Verify the message exists and the user is the receiver
    const message = await this.prisma.message.findUnique({
      where: { id: messageId },
    });

    if (!message) {
      throw new NotFoundException('Message not found');
    }

    if (message.receiverId !== userId) {
      throw new ForbiddenException(
        'You can only mark messages addressed to you as read',
      );
    }

    // Check if read receipt already exists
    const existingReceipt = await this.prisma.readReceipt.findUnique({
      where: {
        messageId_userId: {
          messageId,
          userId,
        },
      },
    });

    if (existingReceipt) {
      return existingReceipt; // Already marked as read
    }

    // Create the read receipt
    const readReceipt = await this.prisma.readReceipt.create({
      data: {
        messageId,
        userId,
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

    return readReceipt;
  }

  /**
   * Edits an existing message.
   * Only the sender can edit their own messages.
   * @param userId - The ID of the user editing the message.
   * @param messageId - The ID of the message to edit.
   * @param content - The new content for the message.
   * @returns A promise that resolves to the updated message.
   * @throws {NotFoundException} If the message is not found.
   * @throws {ForbiddenException} If the user is not the sender of the message.
   */
  async editMessage(userId: string, messageId: string, content: string) {
    // Verify the message exists and the user is the sender
    const message = await this.prisma.message.findUnique({
      where: { id: messageId },
    });

    if (!message) {
      throw new NotFoundException('Message not found');
    }

    if (message.senderId !== userId) {
      throw new ForbiddenException('You can only edit your own messages');
    }

    if (message.deletedAt) {
      throw new ForbiddenException('Cannot edit a deleted message');
    }

    // Update the message
    const updatedMessage = await this.prisma.message.update({
      where: { id: messageId },
      data: {
        content,
        isEdited: true,
        editedAt: new Date(),
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

    return updatedMessage;
  }

  /**
   * Soft deletes a message.
   * Only the sender can delete their own messages.
   * @param userId - The ID of the user deleting the message.
   * @param messageId - The ID of the message to delete.
   * @returns A promise that resolves to the soft-deleted message.
   * @throws {NotFoundException} If the message is not found.
   * @throws {ForbiddenException} If the user is not the sender of the message.
   */
  async deleteMessage(userId: string, messageId: string) {
    // Verify the message exists and the user is the sender
    const message = await this.prisma.message.findUnique({
      where: { id: messageId },
    });

    if (!message) {
      throw new NotFoundException('Message not found');
    }

    if (message.senderId !== userId) {
      throw new ForbiddenException('You can only delete your own messages');
    }

    if (message.deletedAt) {
      throw new ForbiddenException('Message is already deleted');
    }

    // Soft delete the message
    const deletedMessage = await this.prisma.message.update({
      where: { id: messageId },
      data: {
        deletedAt: new Date(),
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

    return deletedMessage;
  }

  /**
   * Retrieves messages sent after a specific timestamp.
   * Used for syncing offline users with new messages.
   * @param userId - The ID of the user requesting sync.
   * @param lastMessageTimestamp - The timestamp of the last message the user has.
   * @returns A promise that resolves to an array of new messages.
   */
  async syncMessages(userId: string, lastMessageTimestamp: Date) {
    const messages = await this.prisma.message.findMany({
      where: {
        AND: [
          {
            OR: [{ senderId: userId }, { receiverId: userId }],
          },
          {
            timestamp: {
              gt: lastMessageTimestamp,
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

    return messages;
  }
}
