import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { VoteType } from '@prisma/client';
import { CreateNotificationDto } from './dto/create-notification.dto';

/**
 * Enum for different types of notifications.
 */
export enum NotificationType {
  CONNECTION_REQUEST = 'CONNECTION_REQUEST',
  CONNECTION_ACCEPTED = 'CONNECTION_ACCEPTED',
  POST_VOTE = 'POST_VOTE',
  COMMENT_VOTE = 'COMMENT_VOTE',
  POST_COMMENT = 'POST_COMMENT',
  COMMENT_MENTION = 'COMMENT_MENTION',
  MESSAGE = 'MESSAGE',
  SYSTEM = 'SYSTEM',
  EVENT = 'EVENT',
  REFERRAL_APPLICATION = 'REFERRAL_APPLICATION',
  REFERRAL_STATUS_UPDATE = 'REFERRAL_STATUS_UPDATE',
  REFERRAL_APPLICATION_STATUS_UPDATE = 'REFERRAL_APPLICATION_STATUS_UPDATE',
}

/**
 * Service for managing user notifications.
 * Handles creation, retrieval, marking as read/unread, and deletion of notifications.
 */
@Injectable()
export class NotificationService {
  constructor(private prisma: PrismaService) {}

  /**
   * Creates a new notification.
   * @param dto - The data for creating the notification.
   * @returns A promise that resolves to the created notification.
   * @throws {NotFoundException} If the target user is not found.
   * @throws {BadRequestException} If the message is empty, too long, or the type is invalid.
   */
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

  /**
   * Retrieves notifications for a specific user with pagination and optional filtering.
   * @param userId - The ID of the user to retrieve notifications for.
   * @param page - The page number for pagination.
   * @param limit - The number of notifications per page.
   * @param unreadOnly - If true, only retrieves unread notifications.
   * @param type - Optional. Filters notifications by type.
   * @returns A promise that resolves to an object containing paginated notifications, unread count, and pagination details.
   * @throws {NotFoundException} If the user is not found.
   * @throws {BadRequestException} If pagination parameters are invalid or the type is invalid.
   */
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

  /**
   * Retrieves the count of unread notifications for a specific user.
   * @param userId - The ID of the user.
   * @returns A promise that resolves to an object containing the unread count.
   * @throws {NotFoundException} If the user is not found.
   */
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

  /**
   * Marks a specific notification as read.
   * @param id - The ID of the notification to mark.
   * @param userId - The ID of the user who owns the notification.
   * @returns A promise that resolves to a success message.
   * @throws {NotFoundException} If the notification is not found.
   * @throws {ForbiddenException} If the user does not own the notification.
   */
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

  /**
   * Marks all unread notifications for a specific user as read.
   * @param userId - The ID of the user.
   * @returns A promise that resolves to an object containing a success message and the count of updated notifications.
   * @throws {NotFoundException} If the user is not found.
   */
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

  /**
   * Marks a specific notification as unread.
   * @param id - The ID of the notification to mark.
   * @param userId - The ID of the user who owns the notification.
   * @returns A promise that resolves to a success message.
   * @throws {NotFoundException} If the notification is not found.
   * @throws {ForbiddenException} If the user does not own the notification.
   */
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

  /**
   * Deletes a specific notification.
   * @param id - The ID of the notification to delete.
   * @param userId - The ID of the user who owns the notification.
   * @returns A promise that resolves to a success message.
   * @throws {NotFoundException} If the notification is not found.
   * @throws {ForbiddenException} If the user does not own the notification.
   */
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

  /**
   * Deletes all read notifications for a specific user.
   * @param userId - The ID of the user.
   * @returns A promise that resolves to an object containing a success message and the count of deleted notifications.
   * @throws {NotFoundException} If the user is not found.
   */
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

  /**
   * Deletes all notifications for a specific user.
   * @param userId - The ID of the user.
   * @returns A promise that resolves to an object containing a success message and the count of deleted notifications.
   * @throws {NotFoundException} If the user is not found.
   */
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

  /**
   * Creates a system notification for a user.
   * @param userId - The ID of the user to notify.
   * @param message - The content of the system notification.
   * @returns A promise that resolves to the created notification.
   */
  async createSystemNotification(userId: string, message: string) {
    return this.create({
      userId,
      message,
      type: NotificationType.SYSTEM,
    });
  }

  /**
   * Creates a connection request notification.
   * @param recipientId - The ID of the user receiving the request.
   * @param senderName - The name of the user who sent the request.
   * @returns A promise that resolves to the created notification.
   */
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

  /**
   * Creates a connection accepted notification.
   * @param recipientId - The ID of the user whose request was accepted.
   * @param accepterName - The name of the user who accepted the request.
   * @returns A promise that resolves to the created notification.
   */
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

  /**
   * Creates a post vote notification.
   * @param postAuthorId - The ID of the author of the voted post.
   * @param voterName - The name of the user who voted on the post.
   * @param postContent - The content of the voted post (for truncation).
   * @param voteType - The type of vote (UPVOTE or DOWNVOTE).
   * @returns A promise that resolves to the created notification.
   */
  async createPostVoteNotification(
    postAuthorId: string,
    voterName: string,
    postContent: string,
    voteType: VoteType,
  ) {
    const truncatedContent =
      postContent.length > 50
        ? postContent.substring(0, 50) + '...'
        : postContent;

    const message =
      voteType === VoteType.UPVOTE
        ? `${voterName} upvoted your post: "${truncatedContent}"`
        : `${voterName} downvoted your post: "${truncatedContent}"`;

    return this.create({
      userId: postAuthorId,
      message,
      type: NotificationType.POST_VOTE,
    });
  }

  /**
   * Creates a comment vote notification.
   * @param commentAuthorId - The ID of the author of the voted comment.
   * @param voterName - The name of the user who voted on the comment.
   * @param commentContent - The content of the voted comment (for truncation).
   * @param voteType - The type of vote (UPVOTE or DOWNVOTE).
   * @returns A promise that resolves to the created notification.
   */
  async createCommentVoteNotification(
    commentAuthorId: string,
    voterName: string,
    commentContent: string,
    voteType: VoteType,
  ) {
    const truncatedContent =
      commentContent.length > 50
        ? commentContent.substring(0, 50) + '...'
        : commentContent;

    const message =
      voteType === VoteType.UPVOTE
        ? `${voterName} upvoted your comment: "${truncatedContent}"`
        : `${voterName} downvoted your comment: "${truncatedContent}"`;

    return this.create({
      userId: commentAuthorId,
      message,
      type: NotificationType.COMMENT_VOTE,
    });
  }

  /**
   * Creates a post comment notification.
   * @param postAuthorId - The ID of the author of the commented post.
   * @param commenterName - The name of the user who commented.
   * @param postContent - The content of the commented post (for truncation).
   * @returns A promise that resolves to the created notification.
   */
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

  async createMentionNotification(
    mentionedUserId: string,
    commenterName: string,
    postId: string,
  ) {
    const post = await this.prisma.post.findUnique({ where: { id: postId } });
    if (!post) {
      return;
    }

    const truncatedContent =
      post.content.length > 50
        ? post.content.substring(0, 50) + '...'
        : post.content;

    return this.create({
      userId: mentionedUserId,
      message: `${commenterName} mentioned you in a comment on the post: "${truncatedContent}"`,
      type: NotificationType.COMMENT_MENTION,
    });
  }

  /**
   * Creates a new message notification.
   * @param recipientId - The ID of the user receiving the message.
   * @param senderName - The name of the user who sent the message.
   * @param messagePreview - A preview of the message content (for truncation).
   * @returns A promise that resolves to the created notification.
   */
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

  /**
   * Retrieves various statistics about notifications for a specific user.
   * Includes total, unread, read counts, recent (last 24h) count, and counts by type.
   * @param userId - The ID of the user.
   * @returns A promise that resolves to an object containing notification statistics.
   * @throws {NotFoundException} If the user is not found.
   */
  async getNotificationStats(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Get unread counts by type
    const unreadTypeStats = await this.prisma.notification.groupBy({
      by: ['type'],
      where: { userId, read: false },
      _count: { type: true },
    });

    // Map types to categories
    const typeToCategory = {
      CONNECTION_REQUEST: 'CONNECTION',
      CONNECTION_ACCEPTED: 'CONNECTION',
      POST_LIKE: 'POST',
      POST_COMMENT: 'POST',
      MESSAGE: 'MESSAGE',
      SYSTEM: 'SYSTEM',
      EVENT: 'EVENT',
      REFERRAL_APPLICATION: 'REFERRAL',
      REFERRAL_STATUS_UPDATE: 'REFERRAL',
      REFERRAL_APPLICATION_STATUS_UPDATE: 'REFERRAL',
    };

    // Calculate unread counts by category
    const unreadByCategory = unreadTypeStats.reduce(
      (acc, stat) => {
        const category = typeToCategory[stat.type] || 'OTHER';
        acc[category] = (acc[category] || 0) + stat._count.type;
        return acc;
      },
      {} as Record<string, number>,
    );

    // Get total counts
    const [totalCount, unreadCount, readCount, recentCount] = await Promise.all(
      [
        this.prisma.notification.count({ where: { userId } }),
        this.prisma.notification.count({ where: { userId, read: false } }),
        this.prisma.notification.count({ where: { userId, read: true } }),
        this.prisma.notification.count({
          where: {
            userId,
            createdAt: {
              gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
            },
          },
        }),
      ],
    );

    return {
      total: totalCount,
      unread: unreadCount,
      read: readCount,
      recent24h: recentCount,
      byCategory: {
        ALL: unreadCount,
        CONNECTION: unreadByCategory.CONNECTION || 0,
        POST: unreadByCategory.POST || 0,
        MESSAGE: unreadByCategory.MESSAGE || 0,
        SYSTEM: unreadByCategory.SYSTEM || 0,
        EVENT: unreadByCategory.EVENT || 0,
        REFERRAL: unreadByCategory.REFERRAL || 0,
      },
    };
  }
}
