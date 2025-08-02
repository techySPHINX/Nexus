import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateMessageDto } from './dto/create-message.dto';
import { FilterMessagesDto } from './dto/filter-messages.dto';

@Injectable()
export class MessagingService {
  constructor(private prisma: PrismaService) {}

  async sendMessage(senderId: string, dto: CreateMessageDto) {
    const { receiverId, content } = dto;

    const isConnected = await this.prisma.connection.findFirst({
      where: {
        status: 'ACCEPTED',
        OR: [
          { requesterId: senderId, recipientId: receiverId },
          { requesterId: receiverId, recipientId: senderId },
        ],
      },
    });

    if (!isConnected)
      throw new ForbiddenException('You are not connected with this user.');

    return this.prisma.message.create({
      data: {
        content,
        senderId,
        receiverId,
      },
    });
  }

  async getConversation(
    userId: string,
    otherUserId: string,
    dto: FilterMessagesDto,
  ) {
    const { skip = 0, take = 20 } = dto;

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
    });
  }

  async getAllConversations(userId: string) {
    return this.prisma.message.groupBy({
      by: ['senderId', 'receiverId'],
      where: {
        OR: [{ senderId: userId }, { receiverId: userId }],
      },
    });
  }
}
