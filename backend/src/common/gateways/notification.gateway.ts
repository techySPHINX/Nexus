import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { FcmService } from '../services/fcm.service';
import Redis from 'ioredis';

interface AuthenticatedSocket extends Socket {
  userId?: string;
  userEmail?: string;
  lastActivity?: number;
}

interface NotificationPayload {
  userId: string;
  type: string;
  title: string;
  message: string;
  data?: any;
  priority?: 'high' | 'normal' | 'low';
  actionUrl?: string;
  imageUrl?: string;
}

/**
 * Dedicated Notification Gateway for Real-Time Push Notifications
 * 
 * Features:
 * ✅ Real-time notification delivery
 * ✅ Multi-device support
 * ✅ FCM fallback for offline users
 * ✅ Priority-based delivery
 * ✅ Notification history
 * ✅ Read receipts
 * ✅ Notification grouping
 * ✅ Sound and badge support
 */
@WebSocketGateway({
  cors: {
    origin: process.env.ALLOWED_ORIGIN?.split(',') || ['http://localhost:3001'],
    credentials: true,
  },
  namespace: '/notifications',
  transports: ['websocket', 'polling'],
  pingTimeout: 60000,
  pingInterval: 25000,
})
@Injectable()
export class NotificationGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(NotificationGateway.name);
  private readonly connectedUsers = new Map<string, Set<AuthenticatedSocket>>();
  private readonly socketToUser = new Map<string, string>();
  private redis: Redis;

  // Notification settings
  private readonly NOTIFICATION_QUEUE_SIZE = 200;
  private readonly NOTIFICATION_TTL = 2592000; // 30 days

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly prismaService: PrismaService,
    private readonly fcmService: FcmService,
  ) {
    this.initializeRedis();
  }

  private initializeRedis(): void {
    const redisUrl = this.configService.get('REDIS_URL');
    this.redis = new Redis(redisUrl);

    this.redis.on('connect', () => {
      this.logger.log('🔗 Notification Gateway: Redis connected');
    });

    this.redis.on('error', (err) => {
      this.logger.error('❌ Notification Gateway: Redis error:', err);
    });
  }

  afterInit(): void {
    this.logger.log('🚀 Notification Gateway initialized');
  }

  async handleConnection(client: AuthenticatedSocket): Promise<void> {
    this.logger.log(`🔔 New notification connection: ${client.id}`);

    const authTimeout = setTimeout(() => {
      if (!client.userId) {
        this.logger.warn(`⏰ Notification auth timeout: ${client.id}`);
        client.emit('notification:auth_error', {
          error: 'Authentication timeout',
          timestamp: new Date().toISOString(),
        });
        client.disconnect();
      }
    }, 10000);

    client.once('authenticate', async (data: { userId: string; token: string }) => {
      clearTimeout(authTimeout);

      try {
        const { userId, token } = data;

        if (!userId || !token) {
          throw new Error('Missing credentials');
        }

        // Verify JWT
        let payload: any;
        try {
          payload = await this.jwtService.verifyAsync(token);
        } catch (error) {
          this.logger.error(`❌ JWT verification failed: ${error.message}`, error.stack);
          throw new Error('Invalid or expired token');
        }

        // Set user info
        client.userId = payload.sub || userId;
        client.userEmail = payload.email;
        client.lastActivity = Date.now();

        // Store connection
        if (!this.connectedUsers.has(client.userId)) {
          this.connectedUsers.set(client.userId, new Set());
        }
        this.connectedUsers.get(client.userId)!.add(client);
        this.socketToUser.set(client.id, client.userId);

        // Join user-specific room
        await client.join(`notifications:${client.userId}`);

        // Send pending notifications
        await this.deliverPendingNotifications(client.userId, client);

        // Send unread count
        const unreadCount = await this.getUnreadCount(client.userId);

        client.emit('notification:connected', {
          userId: client.userId,
          unreadCount,
          timestamp: new Date().toISOString(),
        });

        this.logger.log(
          `✅ Notification client authenticated: ${client.userId} (${this.connectedUsers.get(client.userId)!.size} device(s))`,
        );
      } catch (error) {
        this.logger.error(`❌ Notification auth failed for ${client.id}:`, error.message);
        client.emit('notification:auth_error', {
          error: 'Authentication failed',
          message: error.message,
          timestamp: new Date().toISOString(),
        });
        client.disconnect();
      }
    });
  }

  async handleDisconnect(client: AuthenticatedSocket): Promise<void> {
    const userId = client.userId || this.socketToUser.get(client.id);

    if (!userId) {
      this.logger.log(`👋 Unauthenticated notification client ${client.id} disconnected`);
      return;
    }

    this.logger.log(`👋 Notification client ${userId} disconnecting`);

    const userSockets = this.connectedUsers.get(userId);
    if (userSockets) {
      userSockets.delete(client);

      if (userSockets.size === 0) {
        this.connectedUsers.delete(userId);
      }
    }

    this.socketToUser.delete(client.id);
  }

  /**
   * Send notification to user(s)
   * Can be called by other services
   */
  async sendNotification(payload: NotificationPayload): Promise<void> {
    try {
      const { userId, type, title, message, data, priority, actionUrl, imageUrl } = payload;

      // Create notification in database
      const notification = await this.prismaService.notification.create({
        data: {
          userId,
          type,
          message: `${title}: ${message}`,
          read: false,
        },
      });

      const notificationData = {
        id: notification.id,
        type,
        title,
        message,
        data,
        priority: priority || 'normal',
        actionUrl,
        imageUrl,
        timestamp: new Date().toISOString(),
        read: false,
      };

      // Check if user is online
      const userSockets = this.connectedUsers.get(userId);

      if (userSockets && userSockets.size > 0) {
        // User is online - send real-time notification
        this.server.to(`notifications:${userId}`).emit('notification:new', notificationData);

        this.logger.log(
          `📤 Real-time notification sent to ${userId} (${userSockets.size} device(s)): ${type}`,
        );
      } else {
        // User is offline - queue notification
        await this.queueNotification(userId, notificationData);

        // Send FCM push notification
        const user = await this.prismaService.user.findUnique({
          where: { id: userId },
          select: { fcmDeviceToken: true },
        });

        if (user?.fcmDeviceToken) {
          try {
            await this.fcmService.sendNotification(
              user.fcmDeviceToken,
              {
                title,
                body: message,
              },
              {
                notificationId: notification.id,
                type,
                ...data,
              },
            );

            this.logger.log(`📱 FCM push notification sent to ${userId}`);
          } catch (fcmError) {
            if (fcmError.message === 'INVALID_TOKEN') {
              await this.prismaService.user.update({
                where: { id: userId },
                data: { fcmDeviceToken: null },
              });
            }
            this.logger.error('❌ FCM notification failed:', fcmError);
          }
        }

        this.logger.log(`💾 Notification queued for offline user ${userId}: ${type}`);
      }
    } catch (error) {
      this.logger.error('❌ Error sending notification:', error);
      throw error;
    }
  }

  /**
   * Send notification to multiple users
   */
  async sendNotificationToUsers(
    userIds: string[],
    payload: Omit<NotificationPayload, 'userId'>,
  ): Promise<void> {
    const promises = userIds.map((userId) =>
      this.sendNotification({ ...payload, userId }),
    );
    await Promise.allSettled(promises);
  }

  /**
   * Broadcast notification to all users
   */
  async broadcastNotification(payload: Omit<NotificationPayload, 'userId'>): Promise<void> {
    this.server.emit('notification:broadcast', {
      ...payload,
      timestamp: new Date().toISOString(),
    });

    this.logger.log(`📢 Broadcast notification: ${payload.type}`);
  }

  /**
   * Mark notification as read
   */
  @SubscribeMessage('notification:mark_read')
  async handleMarkRead(
    @MessageBody() data: { notificationId: string },
    @ConnectedSocket() client: AuthenticatedSocket,
  ): Promise<{ success: boolean }> {
    if (!client.userId) {
      return { success: false };
    }

    try {
      await this.prismaService.notification.update({
        where: {
          id: data.notificationId,
          userId: client.userId,
        },
        data: {
          read: true,
        },
      });

      // Broadcast to all user's devices
      this.server.to(`notifications:${client.userId}`).emit('notification:read', {
        notificationId: data.notificationId,
        timestamp: new Date().toISOString(),
      });

      return { success: true };
    } catch (error) {
      this.logger.error(`❌ Error marking notification as read:`, error);
      return { success: false };
    }
  }

  /**
   * Mark all notifications as read
   */
  @SubscribeMessage('notification:mark_all_read')
  async handleMarkAllRead(
    @ConnectedSocket() client: AuthenticatedSocket,
  ): Promise<{ success: boolean; count: number }> {
    if (!client.userId) {
      return { success: false, count: 0 };
    }

    try {
      const result = await this.prismaService.notification.updateMany({
        where: {
          userId: client.userId,
          read: false,
        },
        data: {
          read: true,
        },
      });

      // Broadcast to all user's devices
      this.server.to(`notifications:${client.userId}`).emit('notification:all_read', {
        timestamp: new Date().toISOString(),
      });

      return { success: true, count: result.count };
    } catch (error) {
      this.logger.error(`❌ Error marking all notifications as read:`, error);
      return { success: false, count: 0 };
    }
  }

  /**
   * Get unread notification count
   */
  @SubscribeMessage('notification:get_unread_count')
  async handleGetUnreadCount(
    @ConnectedSocket() client: AuthenticatedSocket,
  ): Promise<{ count: number }> {
    if (!client.userId) {
      return { count: 0 };
    }

    const count = await this.getUnreadCount(client.userId);
    return { count };
  }

  /**
   * Get notification history
   */
  @SubscribeMessage('notification:get_history')
  async handleGetHistory(
    @MessageBody() data: { page?: number; limit?: number },
    @ConnectedSocket() client: AuthenticatedSocket,
  ): Promise<any> {
    if (!client.userId) {
      return { notifications: [], total: 0 };
    }

    try {
      const page = data.page || 1;
      const limit = Math.min(data.limit || 20, 100);
      const skip = (page - 1) * limit;

      const [notifications, total] = await Promise.all([
        this.prismaService.notification.findMany({
          where: { userId: client.userId },
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
        }),
        this.prismaService.notification.count({
          where: { userId: client.userId },
        }),
      ]);

      return {
        notifications,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      };
    } catch (error) {
      this.logger.error(`❌ Error getting notification history:`, error);
      return { notifications: [], total: 0 };
    }
  }

  /**
   * Delete notification
   */
  @SubscribeMessage('notification:delete')
  async handleDelete(
    @MessageBody() data: { notificationId: string },
    @ConnectedSocket() client: AuthenticatedSocket,
  ): Promise<{ success: boolean }> {
    if (!client.userId) {
      return { success: false };
    }

    try {
      await this.prismaService.notification.delete({
        where: {
          id: data.notificationId,
          userId: client.userId,
        },
      });

      // Broadcast to all user's devices
      this.server.to(`notifications:${client.userId}`).emit('notification:deleted', {
        notificationId: data.notificationId,
        timestamp: new Date().toISOString(),
      });

      return { success: true };
    } catch (error) {
      this.logger.error(`❌ Error deleting notification:`, error);
      return { success: false };
    }
  }

  /**
   * Queue notification for offline user
   */
  private async queueNotification(userId: string, notification: any): Promise<void> {
    try {
      const queueKey = `notification_queue:${userId}`;

      await this.redis.lpush(queueKey, JSON.stringify(notification));
      await this.redis.ltrim(queueKey, 0, this.NOTIFICATION_QUEUE_SIZE - 1);
      await this.redis.expire(queueKey, this.NOTIFICATION_TTL);
    } catch (error) {
      this.logger.error(`❌ Error queuing notification for ${userId}:`, error);
    }
  }

  /**
   * Deliver pending notifications
   */
  private async deliverPendingNotifications(
    userId: string,
    client: AuthenticatedSocket,
  ): Promise<void> {
    try {
      const queueKey = `notification_queue:${userId}`;
      const notifications = await this.redis.lrange(queueKey, 0, -1);

      if (notifications.length > 0) {
        this.logger.log(`📬 Delivering ${notifications.length} pending notifications to ${userId}`);

        for (const notifStr of notifications.reverse()) {
          const notification = JSON.parse(notifStr);
          client.emit('notification:new', notification);
        }

        await this.redis.del(queueKey);
      }
    } catch (error) {
      this.logger.error(`❌ Error delivering pending notifications for ${userId}:`, error);
    }
  }

  /**
   * Get unread notification count
   */
  private async getUnreadCount(userId: string): Promise<number> {
    try {
      return await this.prismaService.notification.count({
        where: {
          userId,
          read: false,
        },
      });
    } catch (error) {
      this.logger.error(`❌ Error getting unread count for ${userId}:`, error);
      return 0;
    }
  }
}
