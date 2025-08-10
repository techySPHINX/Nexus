import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { UpdateConnectionStatusDto } from './dto/connection.dto';
import { NotificationService } from 'src/notification/notification.service';

@Injectable()
export class ConnectionService {
  constructor(
    private prisma: PrismaService,
    private notificationService: NotificationService,
  ) {}

  async sendRequest(requesterId: string, recipientId: string) {
    if (requesterId === recipientId) {
      throw new BadRequestException('Cannot connect to yourself');
    }

    const requester = await this.prisma.user.findUnique({
      where: { id: requesterId },
      select: { id: true, name: true, role: true },
    });

    if (!requester) {
      throw new NotFoundException('Requester user not found');
    }

    const recipient = await this.prisma.user.findUnique({
      where: { id: recipientId },
      select: { id: true, name: true, role: true },
    });

    if (!recipient) {
      throw new NotFoundException('Recipient user not found');
    }

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
        throw new ConflictException('Connection request already pending');
      } else if (existingConnection.status === 'ACCEPTED') {
        throw new ConflictException('Users are already connected');
      } else if (existingConnection.status === 'BLOCKED') {
        throw new ForbiddenException('Connection is blocked');
      } else if (existingConnection.status === 'REJECTED') {
        await this.prisma.connection.update({
          where: { id: existingConnection.id },
          data: { status: 'PENDING', createdAt: new Date() },
        });

        await this.notificationService.createConnectionRequestNotification(
          recipientId,
          requester.name,
        );

        return {
          message: 'Connection request sent successfully',
          connectionId: existingConnection.id,
        };
      }
    }

    const connection = await this.prisma.connection.create({
      data: {
        requesterId,
        recipientId,
        status: 'PENDING',
      },
      include: {
        requester: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            profile: {
              select: {
                bio: true,
                avatarUrl: true,
              },
            },
          },
        },
        recipient: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            profile: {
              select: {
                bio: true,
                avatarUrl: true,
              },
            },
          },
        },
      },
    });

    await this.notificationService.createConnectionRequestNotification(
      recipientId,
      requester.name,
    );

    return {
      message: 'Connection request sent successfully',
      connection,
    };
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
            role: true,
            profile: {
              select: {
                bio: true,
                avatarUrl: true,
              },
            },
          },
        },
        recipient: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            profile: {
              select: {
                bio: true,
                avatarUrl: true,
              },
            },
          },
        },
      },
    });

    if (!connection) {
      throw new NotFoundException('Connection request not found');
    }

    if (connection.recipientId !== userId) {
      throw new ForbiddenException(
        'Only the recipient can respond to connection requests',
      );
    }

    if (connection.status !== 'PENDING') {
      throw new BadRequestException(
        `Connection request has already been ${connection.status.toLowerCase()}`,
      );
    }

    const updatedConnection = await this.prisma.connection.update({
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
            role: true,
            profile: {
              select: {
                bio: true,
                avatarUrl: true,
              },
            },
          },
        },
        recipient: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            profile: {
              select: {
                bio: true,
                avatarUrl: true,
              },
            },
          },
        },
      },
    });

    if (dto.status === 'ACCEPTED') {
      await this.notificationService.createConnectionAcceptedNotification(
        connection.requesterId,
        connection.recipient.name,
      );
    }

    return {
      message: `Connection request ${dto.status.toLowerCase()} successfully`,
      connection: updatedConnection,
    };
  }

  async getConnections(
    userId: string,
    page = 1,
    limit = 20,
    role?: 'STUDENT' | 'ALUM' | 'ADMIN',
    search?: string,
  ) {
    if (page < 1 || limit < 1 || limit > 100) {
      throw new BadRequestException('Invalid pagination parameters');
    }

    const skip = (page - 1) * limit;

    const where: any = {
      OR: [{ requesterId: userId }, { recipientId: userId }],
      status: 'ACCEPTED',
    };

    if (role) {
      where.AND = [
        {
          OR: [
            {
              AND: [{ requesterId: userId }, { recipient: { role } }],
            },
            {
              AND: [{ recipientId: userId }, { requester: { role } }],
            },
          ],
        },
      ];
    }

    if (search && search.trim()) {
      const searchTerm = search.trim();
      if (!where.AND) where.AND = [];
      where.AND.push({
        OR: [
          {
            AND: [
              { requesterId: userId },
              {
                recipient: {
                  OR: [
                    { name: { contains: searchTerm, mode: 'insensitive' } },
                    { email: { contains: searchTerm, mode: 'insensitive' } },
                  ],
                },
              },
            ],
          },
          {
            AND: [
              { recipientId: userId },
              {
                requester: {
                  OR: [
                    { name: { contains: searchTerm, mode: 'insensitive' } },
                    { email: { contains: searchTerm, mode: 'insensitive' } },
                  ],
                },
              },
            ],
          },
        ],
      });
    }

    const [connections, total] = await Promise.all([
      this.prisma.connection.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          requester: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
              profile: {
                select: {
                  bio: true,
                  location: true,
                  interests: true,
                  avatarUrl: true,
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
              role: true,
              profile: {
                select: {
                  bio: true,
                  location: true,
                  interests: true,
                  avatarUrl: true,
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
      }),
      this.prisma.connection.count({ where }),
    ]);

    // Transform connections to show the other user's profile
    const transformedConnections = connections.map((connection) => {
      const otherUser =
        connection.requesterId === userId
          ? connection.recipient
          : connection.requester;

      return {
        id: connection.id,
        connectedAt: connection.createdAt,
        user: {
          ...otherUser,
          skills: otherUser.profile?.skills?.map((skill) => skill.name) || [],
        },
      };
    });

    return {
      connections: transformedConnections,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1,
      },
    };
  }

  async getPendingRequests(userId: string, page = 1, limit = 20) {
    if (page < 1 || limit < 1 || limit > 100) {
      throw new BadRequestException('Invalid pagination parameters');
    }

    const skip = (page - 1) * limit;

    const [requests, total] = await Promise.all([
      this.prisma.connection.findMany({
        where: {
          recipientId: userId,
          status: 'PENDING',
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          requester: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
              profile: {
                select: {
                  bio: true,
                  location: true,
                  interests: true,
                  avatarUrl: true,
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
      }),
      this.prisma.connection.count({
        where: {
          recipientId: userId,
          status: 'PENDING',
        },
      }),
    ]);

    const transformedRequests = requests.map((request) => ({
      id: request.id,
      requestedAt: request.createdAt,
      requester: {
        ...request.requester,
        skills:
          request.requester.profile?.skills?.map((skill) => skill.name) || [],
      },
    }));

    return {
      requests: transformedRequests,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1,
      },
    };
  }

  async getSentRequests(userId: string, page = 1, limit = 20) {
    // Validate pagination parameters
    if (page < 1 || limit < 1 || limit > 100) {
      throw new BadRequestException('Invalid pagination parameters');
    }

    const skip = (page - 1) * limit;

    const [requests, total] = await Promise.all([
      this.prisma.connection.findMany({
        where: {
          requesterId: userId,
          status: 'PENDING',
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          recipient: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
              profile: {
                select: {
                  bio: true,
                  location: true,
                  interests: true,
                  avatarUrl: true,
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
      }),
      this.prisma.connection.count({
        where: {
          requesterId: userId,
          status: 'PENDING',
        },
      }),
    ]);

    const transformedRequests = requests.map((request) => ({
      id: request.id,
      sentAt: request.createdAt,
      recipient: {
        ...request.recipient,
        skills:
          request.recipient.profile?.skills?.map((skill) => skill.name) || [],
      },
    }));

    return {
      requests: transformedRequests,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1,
      },
    };
  }

  async cancelRequest(userId: string, connectionId: string) {
    const connection = await this.prisma.connection.findUnique({
      where: { id: connectionId },
      select: {
        id: true,
        requesterId: true,
        status: true,
      },
    });

    if (!connection) {
      throw new NotFoundException('Connection request not found');
    }

    if (connection.requesterId !== userId) {
      throw new ForbiddenException(
        'You can only cancel your own connection requests',
      );
    }

    if (connection.status !== 'PENDING') {
      throw new BadRequestException(
        'Can only cancel pending connection requests',
      );
    }

    await this.prisma.connection.delete({
      where: { id: connectionId },
    });

    return { message: 'Connection request cancelled successfully' };
  }

  async removeConnection(userId: string, connectionId: string) {
    const connection = await this.prisma.connection.findUnique({
      where: { id: connectionId },
      select: {
        id: true,
        requesterId: true,
        recipientId: true,
        status: true,
      },
    });

    if (!connection) {
      throw new NotFoundException('Connection not found');
    }

    if (
      connection.requesterId !== userId &&
      connection.recipientId !== userId
    ) {
      throw new ForbiddenException('You can only remove your own connections');
    }

    if (connection.status !== 'ACCEPTED') {
      throw new BadRequestException('Can only remove accepted connections');
    }

    await this.prisma.connection.delete({
      where: { id: connectionId },
    });

    return { message: 'Connection removed successfully' };
  }

  async getConnectionStatus(userId: string, otherUserId: string) {
    if (userId === otherUserId) {
      return { status: 'SELF', connection: null };
    }

    const connection = await this.prisma.connection.findFirst({
      where: {
        OR: [
          {
            requesterId: userId,
            recipientId: otherUserId,
          },
          {
            requesterId: otherUserId,
            recipientId: userId,
          },
        ],
      },
      select: {
        id: true,
        requesterId: true,
        recipientId: true,
        status: true,
        createdAt: true,
      },
    });

    if (!connection) {
      return { status: 'NOT_CONNECTED', connection: null };
    }

    let userRole = 'NONE';
    if (connection.requesterId === userId) {
      userRole = 'REQUESTER';
    } else if (connection.recipientId === userId) {
      userRole = 'RECIPIENT';
    }

    return {
      status: connection.status,
      userRole,
      connection: {
        id: connection.id,
        createdAt: connection.createdAt,
      },
    };
  }

  async getConnectionStats(userId: string) {
    const [
      totalConnections,
      pendingReceived,
      pendingSent,
      studentConnections,
      alumniConnections,
      recentConnections,
    ] = await Promise.all([
      // Total accepted connections
      this.prisma.connection.count({
        where: {
          OR: [{ requesterId: userId }, { recipientId: userId }],
          status: 'ACCEPTED',
        },
      }),
      this.prisma.connection.count({
        where: {
          recipientId: userId,
          status: 'PENDING',
        },
      }),
      this.prisma.connection.count({
        where: {
          requesterId: userId,
          status: 'PENDING',
        },
      }),
      this.prisma.connection.count({
        where: {
          OR: [
            {
              AND: [
                { requesterId: userId },
                { recipient: { role: 'STUDENT' } },
              ],
            },
            {
              AND: [
                { recipientId: userId },
                { requester: { role: 'STUDENT' } },
              ],
            },
          ],
          status: 'ACCEPTED',
        },
      }),
      this.prisma.connection.count({
        where: {
          OR: [
            {
              AND: [{ requesterId: userId }, { recipient: { role: 'ALUM' } }],
            },
            {
              AND: [{ recipientId: userId }, { requester: { role: 'ALUM' } }],
            },
          ],
          status: 'ACCEPTED',
        },
      }),
      // Recent connections (last 30 days)
      this.prisma.connection.count({
        where: {
          OR: [{ requesterId: userId }, { recipientId: userId }],
          status: 'ACCEPTED',
          createdAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          },
        },
      }),
    ]);

    return {
      total: totalConnections,
      pendingReceived,
      pendingSent,
      byRole: {
        students: studentConnections,
        alumni: alumniConnections,
      },
      recent30Days: recentConnections,
    };
  }

  async suggestConnections(userId: string, limit = 10) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        profile: {
          include: {
            skills: true,
          },
        },
      },
    });

    if (!user || !user.profile) {
      return { suggestions: [] };
    }

    const existingConnections = await this.prisma.connection.findMany({
      where: {
        OR: [{ requesterId: userId }, { recipientId: userId }],
      },
      select: {
        requesterId: true,
        recipientId: true,
      },
    });

    const connectedUserIds = new Set([
      ...existingConnections.map((c) => c.requesterId),
      ...existingConnections.map((c) => c.recipientId),
      userId,
    ]);

    const userSkills = user.profile.skills.map((skill) => skill.name);

    const suggestions = await this.prisma.user.findMany({
      where: {
        AND: [
          {
            id: {
              notIn: Array.from(connectedUserIds),
            },
          },
          {
            OR: [
              userSkills.length > 0
                ? {
                    profile: {
                      skills: {
                        some: {
                          name: {
                            in: userSkills,
                          },
                        },
                      },
                    },
                  }
                : {},
              user.profile.interests
                ? {
                    profile: {
                      interests: {
                        contains: user.profile.interests,
                        mode: 'insensitive',
                      },
                    },
                  }
                : {},
              user.profile.location
                ? {
                    profile: {
                      location: {
                        contains: user.profile.location,
                        mode: 'insensitive',
                      },
                    },
                  }
                : {},
            ],
          },
        ],
      },
      take: limit,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        profile: {
          select: {
            bio: true,
            location: true,
            interests: true,
            avatarUrl: true,
            skills: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });

    // Transform and calculate match score
    const suggestionsWithScore = suggestions.map((suggestion) => {
      let score = 0;
      const reasons = [];

      const suggestionSkills =
        suggestion.profile?.skills?.map((s) => s.name) || [];
      const commonSkills = userSkills.filter((skill) =>
        suggestionSkills.includes(skill),
      );
      if (commonSkills.length > 0) {
        score += commonSkills.length * 3;
        reasons.push(`${commonSkills.length} common skills`);
      }

      // Calculate interest match
      if (
        user.profile.interests &&
        suggestion.profile?.interests &&
        suggestion.profile.interests
          .toLowerCase()
          .includes(user.profile.interests.toLowerCase())
      ) {
        score += 2;
        reasons.push('Similar interests');
      }

      // Calculate location match
      if (
        user.profile.location &&
        suggestion.profile?.location &&
        suggestion.profile.location
          .toLowerCase()
          .includes(user.profile.location.toLowerCase())
      ) {
        score += 1;
        reasons.push('Same location');
      }

      if (user.role !== suggestion.role) {
        score += 1;
        reasons.push('Different role perspective');
      }

      return {
        user: {
          ...suggestion,
          skills: suggestionSkills,
        },
        matchScore: score,
        reasons,
      };
    });

    // Sort by match score and return
    const sortedSuggestions = suggestionsWithScore
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, limit);

    return {
      suggestions: sortedSuggestions,
      basedOn: {
        skills: userSkills,
        interests: user.profile.interests,
        location: user.profile.location,
        role: user.role,
      },
    };
  }
}
