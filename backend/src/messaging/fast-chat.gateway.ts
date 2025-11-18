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
import { MessagingService } from './messaging.service';
import { CreateMessageDto } from './dto/create-message.dto';
import { MessageReadDto } from './dto/message-read.dto';
import { EditMessageDto } from './dto/edit-message.dto';
import { DeleteMessageDto } from './dto/delete-message.dto';
import { ConfigService } from '@nestjs/config';
import { FcmService } from '../common/services/fcm.service';
import { PrismaService } from '../prisma/prisma.service';
import Redis from 'ioredis';

interface AuthenticatedSocket extends Socket {
  userId?: string;
  userEmail?: string;
  lastActivity?: number;
}

interface TypingData {
  receiverId: string;
  isTyping: boolean;
}

/**
 * Fast Chat Gateway for real-time messaging
 *
 * Features:
 * - Message deduplication
 * - User presence tracking
 * - Typing indicators
 * - Connection management
 * - Rate limiting (basic)
 */
@WebSocketGateway({
  cors: {
    origin: process.env.ALLOWED_ORIGIN || "https://localhost:3001",
    credentials: true,
  },
  namespace: '/ws',
  transports: ['websocket', 'polling'],
  pingTimeout: 60000,
  pingInterval: 25000,
})
@Injectable()
export class FastChatGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(FastChatGateway.name);
  private readonly connectedUsers = new Map<string, AuthenticatedSocket>();
  private redis: Redis;
  private readonly typingUsers = new Map<string, Set<string>>();

  constructor(
    private readonly messagingService: MessagingService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly fcmService: FcmService,
    private readonly prismaService: PrismaService,
  ) {
    // Initialize Redis connection
    const redisUrl = this.configService.get('REDIS_URL');
    if (redisUrl) {
      this.redis = new Redis(redisUrl);
    } else {
      this.redis = new Redis(
        this.configService.get('REDIS_URL'),
      );
    }

    this.redis.on('connect', () => {
      this.logger.log('🔗 Connected to Redis');
    });

    this.redis.on('error', (err) => {
      this.logger.error('❌ Redis connection error:', err);
    });
  }

  afterInit() {
    this.logger.log('🚀 Fast Chat Gateway initialized');

    // Set up periodic cleanup
    setInterval(() => {
      this.cleanupInactiveConnections();
    }, 30000); // Every 30 seconds
  }

  async handleConnection(client: AuthenticatedSocket) {
    this.logger.log(`🔌 New connection attempt: ${client.id}`);

    // Set connection timeout for authentication
    const connectionTimeout = setTimeout(() => {
      if (!client.userId) {
        this.logger.warn(
          `⏰ Connection timeout for ${client.id} - No authentication received`,
        );
        client.emit('CONNECTION_ERROR', {
          error: 'Authentication timeout',
          timestamp: new Date().toISOString(),
        });
        client.disconnect();
      }
    }, 10000); // 10 seconds to authenticate

    client.on('authenticate', async (data) => {
      try {
        clearTimeout(connectionTimeout);

        const { userId, token } = data;

        if (!userId || !token) {
          this.logger.warn(
            `❌ Missing credentials for connection ${client.id}`,
          );
          client.emit('CONNECTION_ERROR', {
            error: 'Missing authentication credentials',
            timestamp: new Date().toISOString(),
          });
          client.disconnect();
          return;
        }

        // Verify JWT token with proper error handling
        let payload;
        try {
          payload = this.jwtService.verify(token);
        } catch (jwtError) {
          this.logger.error(
            `❌ JWT verification failed for ${client.id}:`,
            jwtError.message,
          );
          client.emit('CONNECTION_ERROR', {
            error: 'Invalid or expired authentication token',
            timestamp: new Date().toISOString(),
          });
          client.disconnect();
          return;
        }

        // Store user info
        client.userId = payload.sub || userId;
        client.userEmail = payload.email;
        client.lastActivity = Date.now();

        // Check for existing connection and disconnect if found
        const existingConnection = this.connectedUsers.get(client.userId);
        if (existingConnection && existingConnection.id !== client.id) {
          this.logger.log(
            `🔄 Disconnecting existing connection for user ${client.userId}`,
          );
          existingConnection.emit('FORCE_DISCONNECT', {
            reason: 'New connection established from another location',
            timestamp: new Date().toISOString(),
          });
          existingConnection.disconnect();
        }

        // Store new connection
        this.connectedUsers.set(client.userId, client);

        // Join user to their personal room
        await client.join(`user_${client.userId}`);

        // Update presence status
        await this.updateUserPresence(client.userId, 'online');

        this.logger.log(
          `✅ User ${client.userId} (${client.userEmail}) connected successfully`,
        );
        this.logger.log(
          `📊 Total connected users: ${this.connectedUsers.size}`,
        );

        // Send connection confirmation
        client.emit('CONNECTION_SUCCESS', {
          userId: client.userId,
          timestamp: new Date().toISOString(),
          connectedUsers: this.connectedUsers.size,
        });

        // Notify connected users about this user coming online
        this.server.emit('USER_ONLINE', {
          userId: client.userId,
          timestamp: new Date().toISOString(),
        });
      } catch (error) {
        this.logger.error(
          `❌ Authentication failed for ${client.id}:`,
          error.message,
        );
        client.emit('CONNECTION_ERROR', {
          error: 'Authentication failed',
          timestamp: new Date().toISOString(),
        });
        client.disconnect();
      }
    });

    // Handle connection errors
    client.on('error', (error) => {
      this.logger.error(`❌ Client ${client.id} error:`, error);
    });
  }

  async handleDisconnect(client: AuthenticatedSocket) {
    if (client.userId) {
      this.logger.log(`👋 User ${client.userId} disconnecting`);

      // Remove from connected users
      this.connectedUsers.delete(client.userId);

      // Update presence status
      await this.updateUserPresence(client.userId, 'offline');

      // Clean up typing indicators
      this.typingUsers.delete(client.userId);

      // Notify other users that this user went offline
      this.server.emit('USER_OFFLINE', {
        userId: client.userId,
        timestamp: new Date().toISOString(),
      });

      this.logger.log(
        `📊 Total connected users: ${this.connectedUsers.size}`,
      );
    } else {
      this.logger.log(`👋 Unauthenticated client ${client.id} disconnected`);
    }
  }

  @SubscribeMessage('NEW_MESSAGE')
  async handleNewMessage(
    @MessageBody() data: CreateMessageDto,
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    try {
      if (!client.userId) {
        this.logger.warn('❌ Unauthenticated user attempted to send message');
        return { error: 'User not authenticated' };
      }

      // Validate message data
      if (!data.receiverId || !data.content) {
        this.logger.warn(
          `❌ Invalid message data from user ${client.userId}`,
        );
        client.emit('MESSAGE_ERROR', {
          error: 'Invalid message data',
          timestamp: new Date().toISOString(),
        });
        return { error: 'Invalid message data' };
      }

      // Rate limiting using Redis
      const rateLimitKey = `rate_limit:${client.userId}`;
      const currentCount = await this.redis.incr(rateLimitKey);

      if (currentCount === 1) {
        // Set expiration for 1 minute
        await this.redis.expire(rateLimitKey, 60);
      }

      const maxMessagesPerMinute = this.configService.get(
        'RATE_LIMIT_MESSAGES_PER_MINUTE',
        100,
      );
      if (currentCount > maxMessagesPerMinute) {
        this.logger.warn(
          `🚫 Rate limit exceeded for user ${client.userId}: ${currentCount}/${maxMessagesPerMinute}`,
        );
        client.emit('RATE_LIMIT_EXCEEDED', {
          error: 'Too many messages sent. Please slow down.',
          retryAfter: 60,
          timestamp: new Date().toISOString(),
        });
        return { error: 'Rate limit exceeded' };
      }

      // Generate unique message ID for deduplication
      const messageId = `${client.userId}_${data.receiverId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Check if this message was already processed using Redis
      const messageKey = `message:${messageId}`;
      const exists = await this.redis.exists(messageKey);

      if (exists) {
        this.logger.log(
          `⚠️ Duplicate message detected, ignoring: ${messageId}`,
        );
        return { error: 'Duplicate message', status: 'already_sent' };
      }

      // Mark message as processed in Redis (expires in 1 hour)
      await this.redis.setex(messageKey, 3600, '1');

      this.logger.log('📨 Processing new message:', {
        messageId,
        from: client.userId,
        to: data.receiverId,
        contentLength: data.content?.length || 0,
      });

      // Create the message in the database
      const message = await this.messagingService.sendMessage(
        client.userId,
        data,
      );

      // Add our generated ID to the message for frontend deduplication
      const messageWithId = {
        ...message,
        uniqueId: messageId,
      };

      // Broadcast to recipient ONLY (prevents duplicates)
      const recipientRoom = `user_${data.receiverId}`;
      this.server.to(recipientRoom).emit('NEW_MESSAGE', messageWithId);

      // Check if recipient is online, if not send push notification
      const isRecipientOnline = await this.redis.sismember(
        'online_users',
        data.receiverId,
      );

      if (!isRecipientOnline) {
        this.logger.log(
          `📱 Recipient ${data.receiverId} is offline, sending push notification`,
        );

        // Get recipient's FCM device token
        const recipient = await this.prismaService.user.findUnique({
          where: { id: data.receiverId },
          select: { fcmDeviceToken: true, name: true },
        });

        if (recipient?.fcmDeviceToken) {
          try {
            // Get sender's name
            const sender = await this.prismaService.user.findUnique({
              where: { id: client.userId },
              select: { name: true },
            });

            await this.fcmService.sendMessageNotification(
              recipient.fcmDeviceToken,
              sender?.name || 'Someone',
              data.content,
              message.id,
            );

            this.logger.log(
              `✅ Push notification sent to ${data.receiverId}`,
            );
          } catch (fcmError) {
            if (fcmError.message === 'INVALID_TOKEN') {
              // Remove invalid device token
              this.logger.warn(
                `⚠️ Removing invalid FCM token for user ${data.receiverId}`,
              );
              await this.prismaService.user.update({
                where: { id: data.receiverId },
                data: { fcmDeviceToken: null },
              });
            } else {
              this.logger.error('❌ Failed to send push notification:', fcmError);
            }
          }
        } else {
          this.logger.log(
            `ℹ️ No FCM token registered for user ${data.receiverId}`,
          );
        }
      }

      // Send confirmation to sender with message acknowledgment
      client.emit('MESSAGE_SENT', {
        messageId,
        dbMessageId: message.id,
        timestamp: new Date().toISOString(),
        status: 'delivered',
      });

      // Update last activity
      client.lastActivity = Date.now();

      this.logger.log(`✅ Message sent successfully: ${messageId}`);

      return {
        success: true,
        messageId,
        dbMessageId: message.id,
        timestamp: message.timestamp,
      };
    } catch (error) {
      this.logger.error(
        `❌ Error handling new message from user ${client.userId}:`,
        error.message,
      );
      client.emit('MESSAGE_ERROR', {
        error: 'Failed to send message. Please try again.',
        timestamp: new Date().toISOString(),
      });
      return { error: 'Internal server error' };
    }
  }

  @SubscribeMessage('TYPING_START')
  async handleTypingStart(
    @MessageBody() data: TypingData,
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    if (!client.userId) {
      this.logger.warn('❌ Unauthenticated typing event');
      return { error: 'Not authenticated' };
    }

    if (!data.receiverId) {
      this.logger.warn(`❌ Invalid typing data from user ${client.userId}`);
      return { error: 'Invalid data' };
    }

    const { receiverId } = data;

    try {
      // Add to typing users
      if (!this.typingUsers.has(receiverId)) {
        this.typingUsers.set(receiverId, new Set());
      }
      this.typingUsers.get(receiverId)!.add(client.userId);

      // Broadcast typing indicator to recipient
      this.server.to(`user_${receiverId}`).emit('USER_TYPING', {
        userId: client.userId,
        isTyping: true,
        timestamp: new Date().toISOString(),
      });

      // Auto-clear typing indicator after 5 seconds
      setTimeout(() => {
        this.handleTypingStop(data, client);
      }, 5000);

      return { success: true };
    } catch (error) {
      this.logger.error(
        `❌ Error handling typing start for user ${client.userId}:`,
        error,
      );
      return { error: 'Failed to process typing indicator' };
    }
  }

  @SubscribeMessage('TYPING_STOP')
  async handleTypingStop(
    @MessageBody() data: TypingData,
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    if (!client.userId) return { error: 'Not authenticated' };

    if (!data.receiverId) return { error: 'Invalid data' };

    const { receiverId } = data;

    try {
      // Remove from typing users
      const typingSet = this.typingUsers.get(receiverId);
      if (typingSet) {
        typingSet.delete(client.userId);
        if (typingSet.size === 0) {
          this.typingUsers.delete(receiverId);
        }
      }

      // Broadcast typing stop to recipient
      this.server.to(`user_${receiverId}`).emit('USER_TYPING', {
        userId: client.userId,
        isTyping: false,
        timestamp: new Date().toISOString(),
      });

      return { success: true };
    } catch (error) {
      this.logger.error(
        `❌ Error handling typing stop for user ${client.userId}:`,
        error,
      );
      return { error: 'Failed to process typing indicator' };
    }
  }

  @SubscribeMessage('GET_ONLINE_USERS')
  async handleGetOnlineUsers(@ConnectedSocket() client: AuthenticatedSocket) {
    if (!client.userId) {
      this.logger.warn('❌ Unauthenticated user requested online users');
      return { error: 'Not authenticated' };
    }

    try {
      // Get all online users from Redis
      const onlineUserIds = await this.redis.smembers('online_users');

      // Filter out current user
      const onlineUsers = onlineUserIds.filter(
        (userId) => userId !== client.userId,
      );

      client.emit('ONLINE_USERS', {
        users: onlineUsers,
        count: onlineUsers.length,
        timestamp: new Date().toISOString(),
      });

      return { success: true, count: onlineUsers.length };
    } catch (error) {
      this.logger.error(
        `❌ Error getting online users for ${client.userId}:`,
        error,
      );
      client.emit('ONLINE_USERS', {
        users: [],
        count: 0,
        error: 'Failed to fetch online users',
        timestamp: new Date().toISOString(),
      });
      return { error: 'Failed to fetch online users' };
    }
  }

  private async updateUserPresence(
    userId: string,
    status: 'online' | 'offline',
  ) {
    try {
      const presenceData = {
        userId,
        status,
        lastSeen: new Date().toISOString(),
      };

      if (status === 'online') {
        // Add user to online set
        await this.redis.sadd('online_users', userId);
        await this.redis.hset(
          `user:${userId}`,
          'status',
          'online',
          'lastSeen',
          presenceData.lastSeen,
        );
      } else {
        // Remove user from online set
        await this.redis.srem('online_users', userId);
        await this.redis.hset(
          `user:${userId}`,
          'status',
          'offline',
          'lastSeen',
          presenceData.lastSeen,
        );
      }

      // Broadcast presence update to all connected users
      this.server.emit('USER_PRESENCE_UPDATE', presenceData);

      this.logger.log(`👤 User ${userId} is now ${status}`);
    } catch (error) {
      this.logger.error(
        `❌ Error updating user presence for ${userId}:`,
        error.message,
      );
      // Don't throw to avoid breaking connection flow
    }
  }

  private cleanupInactiveConnections() {
    const now = Date.now();
    const inactiveThreshold = 5 * 60 * 1000; // 5 minutes

    try {
      for (const [userId, socket] of this.connectedUsers.entries()) {
        if (
          socket.lastActivity &&
          now - socket.lastActivity > inactiveThreshold
        ) {
          this.logger.log(
            `🧹 Cleaning up inactive connection for user ${userId}`,
          );
          socket.emit('FORCE_DISCONNECT', {
            reason: 'Connection inactive for too long',
            timestamp: new Date().toISOString(),
          });
          socket.disconnect();
          this.connectedUsers.delete(userId);
        }
      }
    } catch (error) {
      this.logger.error('❌ Error during connection cleanup:', error.message);
    }
  }

  @SubscribeMessage('MESSAGE_READ')
  async handleMessageRead(
    @MessageBody() data: MessageReadDto,
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    if (!client.userId) {
      this.logger.warn('❌ Unauthenticated user attempted to mark message as read');
      return { error: 'Not authenticated' };
    }

    try {
      const { messageId } = data;

      // Mark the message as read
      const readReceipt = await this.messagingService.markMessageAsRead(
        client.userId,
        messageId,
      );

      this.logger.log(
        `✅ Message ${messageId} marked as read by user ${client.userId}`,
      );

      // Get the message to find the sender
      const message = await this.messagingService['prisma'].message.findUnique({
        where: { id: messageId },
        select: { senderId: true, receiverId: true },
      });

      if (message) {
        // Broadcast read receipt to the sender
        this.server.to(`user_${message.senderId}`).emit('MESSAGE_READ_UPDATE', {
          messageId,
          userId: client.userId,
          readAt: readReceipt.readAt.toISOString(),
          timestamp: new Date().toISOString(),
        });
      }

      return { success: true, readAt: readReceipt.readAt };
    } catch (error) {
      this.logger.error(
        `❌ Error marking message as read for user ${client.userId}:`,
        error.message,
      );
      client.emit('ERROR', {
        message: error.message || 'Failed to mark message as read',
        code: 'MESSAGE_READ_FAILED',
        timestamp: new Date().toISOString(),
      });
      return { error: error.message || 'Failed to mark message as read' };
    }
  }

  @SubscribeMessage('EDIT_MESSAGE')
  async handleEditMessage(
    @MessageBody() data: EditMessageDto,
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    if (!client.userId) {
      this.logger.warn('❌ Unauthenticated user attempted to edit message');
      return { error: 'Not authenticated' };
    }

    try {
      const { messageId, content } = data;

      // Edit the message
      const updatedMessage = await this.messagingService.editMessage(
        client.userId,
        messageId,
        content,
      );

      this.logger.log(
        `✅ Message ${messageId} edited by user ${client.userId}`,
      );

      // Broadcast the edit to both sender and receiver
      const messageUpdate = {
        id: updatedMessage.id,
        content: updatedMessage.content,
        isEdited: updatedMessage.isEdited,
        editedAt: updatedMessage.editedAt?.toISOString(),
        timestamp: new Date().toISOString(),
      };

      this.server.to(`user_${updatedMessage.senderId}`).emit('MESSAGE_EDITED', messageUpdate);
      this.server.to(`user_${updatedMessage.receiverId}`).emit('MESSAGE_EDITED', messageUpdate);

      return { success: true, message: updatedMessage };
    } catch (error) {
      this.logger.error(
        `❌ Error editing message for user ${client.userId}:`,
        error.message,
      );
      client.emit('ERROR', {
        message: error.message || 'Failed to edit message',
        code: 'MESSAGE_EDIT_FAILED',
        timestamp: new Date().toISOString(),
      });
      return { error: error.message || 'Failed to edit message' };
    }
  }

  @SubscribeMessage('DELETE_MESSAGE')
  async handleDeleteMessage(
    @MessageBody() data: DeleteMessageDto,
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    if (!client.userId) {
      this.logger.warn('❌ Unauthenticated user attempted to delete message');
      return { error: 'Not authenticated' };
    }

    try {
      const { messageId } = data;

      // Delete the message
      const deletedMessage = await this.messagingService.deleteMessage(
        client.userId,
        messageId,
      );

      this.logger.log(
        `✅ Message ${messageId} deleted by user ${client.userId}`,
      );

      // Broadcast the deletion to both sender and receiver
      const messageDeletion = {
        id: deletedMessage.id,
        deletedAt: deletedMessage.deletedAt?.toISOString(),
        content: deletedMessage.content,
        timestamp: new Date().toISOString(),
      };

      this.server.to(`user_${deletedMessage.senderId}`).emit('MESSAGE_DELETED', messageDeletion);
      this.server.to(`user_${deletedMessage.receiverId}`).emit('MESSAGE_DELETED', messageDeletion);

      return { success: true, message: deletedMessage };
    } catch (error) {
      this.logger.error(
        `❌ Error deleting message for user ${client.userId}:`,
        error.message,
      );
      client.emit('ERROR', {
        message: error.message || 'Failed to delete message',
        code: 'MESSAGE_DELETE_FAILED',
        timestamp: new Date().toISOString(),
      });
      return { error: error.message || 'Failed to delete message' };
    }
  }

  // Health check endpoint for monitoring
  @SubscribeMessage('HEALTH_CHECK')
  async handleHealthCheck(@ConnectedSocket() client: AuthenticatedSocket) {
    try {
      // Check Redis connection
      const redisStatus = await this.redis.ping();
      const onlineUsersCount = await this.redis.scard('online_users');

      const healthData = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        connectedUsers: this.connectedUsers.size,
        redisStatus: redisStatus === 'PONG' ? 'connected' : 'disconnected',
        onlineUsersCount,
        authenticated: !!client.userId,
      };

      client.emit('HEALTH_RESPONSE', healthData);

      return healthData;
    } catch (error) {
      const errorData = {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error.message,
        connectedUsers: this.connectedUsers.size,
        redisStatus: 'error',
        authenticated: !!client.userId,
      };

      client.emit('HEALTH_RESPONSE', errorData);

      this.logger.error('❌ Health check failed:', error.message);

      return errorData;
    }
  }
}