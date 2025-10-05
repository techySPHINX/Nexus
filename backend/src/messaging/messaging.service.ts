import {
  Injectable,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateMessageDto } from './dto/create-message.dto';
import { FilterMessagesDto } from './dto/filter-messages.dto';

/**
 * Service for handling messaging operations.
 * Manages sending messages, retrieving conversations, and listing all conversations.
 */
@Injectable()
export class MessagingService {
  constructor(private prisma: PrismaService) {}

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

    return this.prisma.message.create({
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
    // Get all messages for the user
    const messages = await this.prisma.message.findMany({
      where: {
        OR: [{ senderId: userId }, { receiverId: userId }],
      },
      select: {
        senderId: true,
        receiverId: true,
      },
    });

    // Create unique conversation pairs
    const uniqueConversations = new Set<string>();
    messages.forEach((message) => {
      const otherUserId = message.senderId === userId ? message.receiverId : message.senderId;
      // Create a consistent key for the conversation pair
      const conversationKey = [userId, otherUserId].sort().join('-');
      uniqueConversations.add(conversationKey);
    });

    // Get the latest message for each unique conversation
    const conversationDetails = await Promise.all(
      Array.from(uniqueConversations).map(async (conversationKey) => {
        const [user1Id, user2Id] = conversationKey.split('-');
        const otherUserId = user1Id === userId ? user2Id : user1Id;

        const latestMessage = await this.prisma.message.findFirst({
          where: {
            OR: [
              { senderId: userId, receiverId: otherUserId },
              { senderId: otherUserId, receiverId: userId },
            ],
          },
          orderBy: { timestamp: 'desc' },
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

        const otherUser = await this.prisma.user.findUnique({
          where: { id: otherUserId },
          select: {
            id: true,
            name: true,
            email: true,
            profile: {
              select: {
                bio: true,
                location: true,
              },
            },
          },
        });

        return {
          conversationId: `${userId}-${otherUserId}`,
          otherUser,
          latestMessage,
        };
      }),
    );

    return conversationDetails;
  }
}
