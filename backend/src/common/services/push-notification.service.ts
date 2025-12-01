import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { DashboardGateway } from '../gateways/dashboard.gateway';

/**
 * Push Notification Service
 * 
 * Handles sending push notifications via:
 * - Firebase Cloud Messaging (FCM) for mobile/web push
 * - WebSocket for real-time in-app notifications
 * - Email notifications (optional)
 */
@Injectable()
export class PushNotificationService {
  private readonly logger = new Logger(PushNotificationService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly dashboardGateway: DashboardGateway,
  ) { }

  /**
   * Send push notification to a user
   */
  async sendToUser(
    userId: string,
    notification: {
      title: string;
      body: string;
      data?: Record<string, any>;
      type?: string;
      priority?: 'high' | 'normal';
      clickAction?: string;
      icon?: string;
      badge?: number;
    },
  ): Promise<boolean> {
    try {
      // Get user's FCM token
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { fcmDeviceToken: true, email: true, name: true },
      });

      if (!user) {
        this.logger.warn(`User ${userId} not found`);
        return false;
      }

      // Save notification to database
      await this.prisma.notification.create({
        data: {
          userId,
          message: notification.body,
          type: notification.type || 'SYSTEM',
        },
      });

      // Send via WebSocket if user is online
      if (this.dashboardGateway.isUserOnline(userId)) {
        await this.dashboardGateway.sendNotificationToUser(userId, {
          title: notification.title,
          body: notification.body,
          data: notification.data,
          type: notification.type,
          priority: notification.priority || 'normal',
          icon: notification.icon,
          badge: notification.badge,
        });
        this.logger.log(`WebSocket notification sent to user ${userId}`);
      }

      // Send via FCM if token exists
      if (user.fcmDeviceToken) {
        const fcmSent = await this.sendFCM(user.fcmDeviceToken, notification);
        if (fcmSent) {
          this.logger.log(`FCM notification sent to user ${userId}`);
          return true;
        }
      }

      return true;
    } catch (error) {
      this.logger.error(`Failed to send notification to user ${userId}:`, error);
      return false;
    }
  }

  /**
   * Send push notification to multiple users
   */
  async sendToMultipleUsers(
    userIds: string[],
    notification: {
      title: string;
      body: string;
      data?: Record<string, any>;
      type?: string;
      priority?: 'high' | 'normal';
    },
  ): Promise<{ sent: number; failed: number }> {
    let sent = 0;
    let failed = 0;

    const results = await Promise.allSettled(
      userIds.map((userId) => this.sendToUser(userId, notification)),
    );

    results.forEach((result) => {
      if (result.status === 'fulfilled' && result.value) {
        sent++;
      } else {
        failed++;
      }
    });

    this.logger.log(
      `Bulk notification sent: ${sent} successful, ${failed} failed`,
    );

    return { sent, failed };
  }

  /**
   * Send FCM notification
   * Note: This is a placeholder. You need to install and configure Firebase Admin SDK
   * npm install firebase-admin
   */
  private async sendFCM(
    token: string,
    notification: {
      title: string;
      body: string;
      data?: Record<string, any>;
      priority?: 'high' | 'normal';
      clickAction?: string;
      icon?: string;
      badge?: number;
    },
  ): Promise<boolean> {
    try {
      // Placeholder for FCM implementation
      // Uncomment and configure when Firebase Admin SDK is set up

      /*
      const admin = require('firebase-admin');
      
      const message = {
        notification: {
          title: notification.title,
          body: notification.body,
          icon: notification.icon,
        },
        data: notification.data || {},
        token: token,
        android: {
          priority: notification.priority === 'high' ? 'high' : 'normal',
          notification: {
            clickAction: notification.clickAction,
            badge: notification.badge,
          },
        },
        apns: {
          payload: {
            aps: {
              badge: notification.badge,
              sound: 'default',
            },
          },
        },
        webpush: {
          notification: {
            title: notification.title,
            body: notification.body,
            icon: notification.icon,
            badge: notification.badge,
            requireInteraction: notification.priority === 'high',
          },
          fcmOptions: {
            link: notification.clickAction,
          },
        },
      };

      const response = await admin.messaging().send(message);
      this.logger.log('FCM sent successfully:', response);
      return true;
      */

      // For now, just log the attempt
      this.logger.debug('FCM notification would be sent:', {
        token,
        title: notification.title,
        body: notification.body,
      });

      return true;
    } catch (error) {
      this.logger.error('FCM send failed:', error);

      // If token is invalid, remove it from database
      if (error.code === 'messaging/invalid-registration-token') {
        await this.removeInvalidToken(token);
      }

      return false;
    }
  }

  /**
   * Remove invalid FCM token from database
   */
  private async removeInvalidToken(token: string): Promise<void> {
    try {
      await this.prisma.user.updateMany({
        where: { fcmDeviceToken: token },
        data: { fcmDeviceToken: null },
      });
      this.logger.log(`Removed invalid FCM token: ${token}`);
    } catch (error) {
      this.logger.error('Failed to remove invalid token:', error);
    }
  }

  /**
   * Register FCM token for a user
   */
  async registerDeviceToken(userId: string, token: string): Promise<boolean> {
    try {
      await this.prisma.user.update({
        where: { id: userId },
        data: { fcmDeviceToken: token },
      });
      this.logger.log(`FCM token registered for user ${userId}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to register FCM token for user ${userId}:`, error);
      return false;
    }
  }

  /**
   * Unregister FCM token for a user
   */
  async unregisterDeviceToken(userId: string): Promise<boolean> {
    try {
      await this.prisma.user.update({
        where: { id: userId },
        data: { fcmDeviceToken: null },
      });
      this.logger.log(`FCM token unregistered for user ${userId}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to unregister FCM token for user ${userId}:`, error);
      return false;
    }
  }

  /**
   * Send notification for new message
   */
  async notifyNewMessage(
    recipientId: string,
    senderId: string,
    messagePreview: string,
  ): Promise<void> {
    const sender = await this.prisma.user.findUnique({
      where: { id: senderId },
      select: { name: true },
    });

    await this.sendToUser(recipientId, {
      title: `New message from ${sender?.name || 'Someone'}`,
      body: messagePreview,
      type: 'MESSAGE',
      priority: 'high',
      clickAction: '/messages',
      data: {
        senderId,
        type: 'message',
      },
    });
  }

  /**
   * Send notification for new connection request
   */
  async notifyConnectionRequest(
    recipientId: string,
    requesterId: string,
  ): Promise<void> {
    const requester = await this.prisma.user.findUnique({
      where: { id: requesterId },
      select: { name: true },
    });

    await this.sendToUser(recipientId, {
      title: 'New Connection Request',
      body: `${requester?.name || 'Someone'} wants to connect with you`,
      type: 'CONNECTION_REQUEST',
      priority: 'normal',
      clickAction: '/connections',
      data: {
        requesterId,
        type: 'connection_request',
      },
    });
  }

  /**
   * Send notification for connection accepted
   */
  async notifyConnectionAccepted(
    userId: string,
    acceptedById: string,
  ): Promise<void> {
    const acceptedBy = await this.prisma.user.findUnique({
      where: { id: acceptedById },
      select: { name: true },
    });

    await this.sendToUser(userId, {
      title: 'Connection Accepted',
      body: `${acceptedBy?.name || 'Someone'} accepted your connection request`,
      type: 'CONNECTION_ACCEPTED',
      priority: 'normal',
      clickAction: '/connections',
      data: {
        acceptedById,
        type: 'connection_accepted',
      },
    });
  }

  /**
   * Send notification for post comment
   */
  async notifyPostComment(
    authorId: string,
    commenterId: string,
    postId: string,
    commentPreview: string,
  ): Promise<void> {
    const commenter = await this.prisma.user.findUnique({
      where: { id: commenterId },
      select: { name: true },
    });

    await this.sendToUser(authorId, {
      title: 'New Comment',
      body: `${commenter?.name || 'Someone'} commented: ${commentPreview}`,
      type: 'POST_COMMENT',
      priority: 'normal',
      clickAction: `/posts/${postId}`,
      data: {
        commenterId,
        postId,
        type: 'post_comment',
      },
    });
  }

  /**
   * Send notification for mention in comment
   */
  async notifyMention(
    mentionedUserId: string,
    mentionerId: string,
    postId: string,
    commentPreview: string,
  ): Promise<void> {
    const mentioner = await this.prisma.user.findUnique({
      where: { id: mentionerId },
      select: { name: true },
    });

    await this.sendToUser(mentionedUserId, {
      title: 'You were mentioned',
      body: `${mentioner?.name || 'Someone'} mentioned you: ${commentPreview}`,
      type: 'COMMENT_MENTION',
      priority: 'high',
      clickAction: `/posts/${postId}`,
      data: {
        mentionerId,
        postId,
        type: 'mention',
      },
    });
  }
}
