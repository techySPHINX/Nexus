import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { UpdateConnectionStatusDto } from './dto/connection.dto';

@Injectable()
export class ConnectionService {
  constructor(private prisma: PrismaService) {}

  async sendRequest(requesterId: string, recipientId: string) {
    if (requesterId === recipientId)
      throw new BadRequestException('Cannot connect to yourself');

    const existing = await this.prisma.connection.findUnique({
      where: {
        requesterId_recipientId: {
          requesterId,
          recipientId,
        },
      },
    });
    if (existing)
      throw new ConflictException('Connection request already sent');

    return this.prisma.connection.create({
      data: {
        requesterId,
        recipientId,
      },
    });
  }

  async updateStatus(userId: string, dto: UpdateConnectionStatusDto) {
    const connection = await this.prisma.connection.findUnique({
      where: { id: dto.connectionId },
    });

    if (!connection) throw new NotFoundException('Connection not found');
    if (connection.recipientId !== userId)
      throw new ForbiddenException('You are not the recipient');

    return this.prisma.connection.update({
      where: { id: dto.connectionId },
      data: {
        status: dto.status,
      },
    });
  }

  async getConnections(userId: string) {
    return this.prisma.connection.findMany({
      where: {
        OR: [{ requesterId: userId }, { recipientId: userId }],
        status: 'ACCEPTED',
      },
      include: {
        requester: { select: { id: true, profile: true } },
        recipient: { select: { id: true, profile: true } },
      },
    });
  }

  async getPendingRequests(userId: string) {
    return this.prisma.connection.findMany({
      where: {
        recipientId: userId,
        status: 'PENDING',
      },
      include: {
        requester: {
          select: { id: true, profile: true },
        },
      },
    });
  }
}
