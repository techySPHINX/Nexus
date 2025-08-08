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
    if (requesterId === recipientId) {
      throw new BadRequestException('Cannot connect to yourself');
    }

    // Check if recipient exists
    const recipient = await this.prisma.user.findUnique({
      where: { id: recipientId },
    });

    if (!recipient) {
      throw new NotFoundException('Recipient user not found');
    }

    // Check for existing connection in either direction
    const existingConnection = await this.prisma.connection.findFirst({
      where: {
        OR: [
          {
            requesterId,
            recipientId,
          },
          {
            requesterId: recipientId,
            recipientId: requesterId,
          },
        ],
      },
    });

    if (existingConnection) {
      if (existingConnection.status === 'PENDING') {
        throw new ConflictException('Connection request already sent');
      } else if (existingConnection.status === 'ACCEPTED') {
        throw new ConflictException('Users are already connected');
      } else if (existingConnection.status === 'BLOCKED') {
        throw new ForbiddenException('Connection is blocked');
      }
    }

    return this.prisma.connection.create({
      data: {
        requesterId,
        recipientId,
      },
      include: {
        requester: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        recipient: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
  }

  async updateStatus(userId: string, dto: UpdateConnectionStatusDto) {
    const connection = await this.prisma.connection.findUnique({
      where: { id: dto.connectionId },
      include: {
        requester: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        recipient: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!connection) {
      throw new NotFoundException('Connection not found');
    }

    if (connection.recipientId !== userId) {
      throw new ForbiddenException(
        'You are not the recipient of this connection request',
      );
    }

    if (connection.status !== 'PENDING') {
      throw new BadRequestException(
        'Connection request has already been processed',
      );
    }

    return this.prisma.connection.update({
      where: { id: dto.connectionId },
      data: {
        status: dto.status,
      },
      include: {
        requester: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        recipient: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
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
        requester: {
          select: {
            id: true,
            name: true,
            email: true,
            profile: {
              select: {
                bio: true,
                location: true,
                interests: true,
                skills: {
                  select: {
                    name: true,
                  },
                },
              },
            },
          },
        },
        recipient: {
          select: {
            id: true,
            name: true,
            email: true,
            profile: {
              select: {
                bio: true,
                location: true,
                interests: true,
                skills: {
                  select: {
                    name: true,
                  },
                },
              },
            },
          },
        },
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
          select: {
            id: true,
            name: true,
            email: true,
            profile: {
              select: {
                bio: true,
                location: true,
                interests: true,
                skills: {
                  select: {
                    name: true,
                  },
                },
              },
            },
          },
        },
      },
    });
  }
}
