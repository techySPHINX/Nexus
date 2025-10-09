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
  ) {}

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
}
