import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateNotificationDto } from './dto/create-notification.dto';

export enum NotificationType {
  CONNECTION_REQUEST = 'CONNECTION_REQUEST',
  CONNECTION_ACCEPTED = 'CONNECTION_ACCEPTED',
  POST_LIKE = 'POST_LIKE',
  POST_COMMENT = 'POST_COMMENT',
  MESSAGE = 'MESSAGE',
  SYSTEM = 'SYSTEM',
  EVENT = 'EVENT',
  REFERRAL_APPLICATION = 'REFERRAL_APPLICATION',
  REFERRAL_STATUS_UPDATE = 'REFERRAL_STATUS_UPDATE',
  REFERRAL_APPLICATION_STATUS_UPDATE = 'REFERRAL_APPLICATION_STATUS_UPDATE',
}

@Injectable()
export class NotificationService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateNotificationDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: dto.userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (!dto.message || dto.message.trim().length === 0) {
      throw new BadRequestException('Notification message cannot be empty');
    }

    if (dto.message.length > 500) {
      throw new BadRequestException(
        'Notification message too long (max 500 characters)',
      );
    }

    const validTypes = Object.values(NotificationType);
    if (dto.type && !validTypes.includes(dto.type as NotificationType)) {
      throw new BadRequestException('Invalid notification type');
    }

    return this.prisma.notification.create({
      data: {
        userId: dto.userId,
        message: dto.message.trim(),
        type: dto.type || NotificationType.SYSTEM,
      },
    });
  }

  async findAllForUser(
    userId: string,
    page = 1,
    limit = 20,
    unreadOnly = false,
    type?: string,
  ) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (page < 1 || limit < 1 || limit > 100) {
      throw new BadRequestException('Invalid pagination parameters');
    }

    const skip = (page - 1) * limit;
    const where: any = { userId };

    if (unreadOnly) {
      where.read = false;
    }

    if (type) {
      const validTypes = Object.values(NotificationType);
      if (!validTypes.includes(type as NotificationType)) {
        throw new BadRequestException('Invalid notification type');
      }
      where.type = type;
    }

    const [notifications, total, unreadCount] = await Promise.all([
      this.prisma.notification.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.notification.count({ where }),
      this.prisma.notification.count({
        where: { userId, read: false },
      }),
    ]);

    return {
      notifications,
      unreadCount,
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

  async getUnreadCount(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const count = await this.prisma.notification.count({
      where: { userId, read: false },
    });

    return { unreadCount: count };
  }

  async markAsRead(id: string, userId: string) {
    const notification = await this.prisma.notification.findUnique({
      where: { id },
      select: { userId: true, read: true },
    });

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    if (notification.userId !== userId) {
      throw new ForbiddenException(
        'You can only mark your own notifications as read',
      );
    }

    if (notification.read) {
      return { message: 'Notification already marked as read' };
    }

    await this.prisma.notification.update({
      where: { id },
      data: { read: true },
    });

    return { message: 'Notification marked as read' };
  }

  async markAllAsRead(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const result = await this.prisma.notification.updateMany({
      where: { userId, read: false },
      data: { read: true },
    });

    return {
      message: `${result.count} notifications marked as read`,
      count: result.count,
    };
  }

  async markAsUnread(id: string, userId: string) {
    const notification = await this.prisma.notification.findUnique({
      where: { id },
      select: { userId: true, read: true },
    });

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    if (notification.userId !== userId) {
      throw new ForbiddenException(
        'You can only mark your own notifications as unread',
      );
    }

    if (!notification.read) {
      return { message: 'Notification already marked as unread' };
    }

    await this.prisma.notification.update({
      where: { id },
      data: { read: false },
    });

    return { message: 'Notification marked as unread' };
  }

  async remove(id: string, userId: string) {
    const notification = await this.prisma.notification.findUnique({
      where: { id },
      select: { userId: true },
    });

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    if (notification.userId !== userId) {
      throw new ForbiddenException(
        'You can only delete your own notifications',
      );
    }

    await this.prisma.notification.delete({ where: { id } });

    return { message: 'Notification deleted successfully' };
  }

  async removeAllRead(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const result = await this.prisma.notification.deleteMany({
      where: { userId, read: true },
    });

    return {
      message: `${result.count} read notifications deleted`,
      count: result.count,
    };
  }

  async removeAll(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const result = await this.prisma.notification.deleteMany({
      where: { userId },
    });

    return {
      message: `${result.count} notifications deleted`,
      count: result.count,
    };
  }

  async createSystemNotification(userId: string, message: string) {
    return this.create({
      userId,
      message,
      type: NotificationType.SYSTEM,
    });
  }

  async createConnectionRequestNotification(
    recipientId: string,
    senderName: string,
  ) {
    return this.create({
      userId: recipientId,
      message: `${senderName} sent you a connection request`,
      type: NotificationType.CONNECTION_REQUEST,
    });
  }

  async createConnectionAcceptedNotification(
    recipientId: string,
    accepterName: string,
  ) {
    return this.create({
      userId: recipientId,
      message: `${accepterName} accepted your connection request`,
      type: NotificationType.CONNECTION_ACCEPTED,
    });
  }

  async createPostLikeNotification(
    postAuthorId: string,
    likerName: string,
    postContent: string,
  ) {
    const truncatedContent =
      postContent.length > 50
        ? postContent.substring(0, 50) + '...'
        : postContent;

    return this.create({
      userId: postAuthorId,
      message: `${likerName} liked your post: "${truncatedContent}"`,
      type: NotificationType.POST_LIKE,
    });
  }

  async createPostCommentNotification(
    postAuthorId: string,
    commenterName: string,
    postContent: string,
  ) {
    const truncatedContent =
      postContent.length > 50
        ? postContent.substring(0, 50) + '...'
        : postContent;

    return this.create({
      userId: postAuthorId,
      message: `${commenterName} commented on your post: "${truncatedContent}"`,
      type: NotificationType.POST_COMMENT,
    });
  }

  async createMessageNotification(
    recipientId: string,
    senderName: string,
    messagePreview: string,
  ) {
    const truncatedMessage =
      messagePreview.length > 50
        ? messagePreview.substring(0, 50) + '...'
        : messagePreview;

    return this.create({
      userId: recipientId,
      message: `${senderName}: ${truncatedMessage}`,
      type: NotificationType.MESSAGE,
    });
  }

  async getNotificationStats(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const [totalCount, unreadCount, readCount, typeStats, recentCount] =
      await Promise.all([
        this.prisma.notification.count({ where: { userId } }),
        this.prisma.notification.count({ where: { userId, read: false } }),
        this.prisma.notification.count({ where: { userId, read: true } }),
        this.prisma.notification.groupBy({
          by: ['type'],
          where: { userId },
          _count: { type: true },
        }),
        this.prisma.notification.count({
          where: {
            userId,
            createdAt: {
              gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
            },
          },
        }),
      ]);

    return {
      total: totalCount,
      unread: unreadCount,
      read: readCount,
      recent24h: recentCount,
      byType: typeStats.reduce(
        (
          acc: { [x: string]: any },
          stat: { type: any; _count: { type: any } },
        ) => {
          acc[stat.type || 'UNKNOWN'] = stat._count.type;
          return acc;
        },
        {} as Record<string, number>,
      ),
    };
  }
}
