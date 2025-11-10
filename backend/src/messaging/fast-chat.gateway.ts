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
import { ConfigService } from '@nestjs/config';
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
    origin: process.env.FRONTEND_URLS?.split(',') || [
      'http://localhost:3001',
      'http://localhost:3000',
      'http://localhost:4173',
      'http://localhost:3002',
    ],
    credentials: true,
  },
  namespace: '/ws',
  transports: ['websocket', 'polling'],
  pingTimeout: 60000,
  pingInterval: 25000,
})
@Injectable()
export class FastChatGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
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
  ) {
    // Initialize Redis connection
    this.redis = new Redis({
      host: this.configService.get('REDIS_HOST', 'localhost'),
      port: this.configService.get('REDIS_PORT', 6379),
      password: this.configService.get('REDIS_PASSWORD'),
      db: this.configService.get('REDIS_DB', 0),
      enableReadyCheck: false,
      maxRetriesPerRequest: null,
    });

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

    // Set connection timeout
    const connectionTimeout = setTimeout(() => {
      if (!client.userId) {
        this.logger.warn(`⏰ Connection timeout for ${client.id}`);
        client.disconnect();
      }
    }, 10000);

    client.on('authenticate', async (data) => {
      try {
        clearTimeout(connectionTimeout);

        const { userId, token } = data;

        if (!userId || !token) {
          client.emit('CONNECTION_ERROR', {
            error: 'Missing authentication credentials',
            timestamp: new Date().toISOString(),
          });
          client.disconnect();
          return;
        }

        // Verify JWT token
        const payload = this.jwtService.verify(token);

        // Store user info
        client.userId = payload.userId || userId;
        client.userEmail = payload.email;
        client.lastActivity = Date.now();

        // Check for existing connection and disconnect if found
        const existingConnection = this.connectedUsers.get(client.userId);
        if (existingConnection && existingConnection.id !== client.id) {
          this.logger.log(
            `🔄 Disconnecting existing connection for user ${client.userId}`,
          );
          existingConnection.emit('FORCE_DISCONNECT', {
            reason: 'New connection established',
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

        this.logger.log(`✅ User ${client.userId} connected successfully`);
        this.logger.log(
          `📊 Total connected users: ${this.connectedUsers.size}`,
        );

        // Send connection confirmation
        client.emit('CONNECTION_SUCCESS', {
          userId: client.userId,
          timestamp: new Date().toISOString(),
          connectedUsers: this.connectedUsers.size,
        });

        // Send recent conversations (simplified for now)
        client.emit('CONVERSATIONS_UPDATE', []);
      } catch (error) {
        this.logger.error(`❌ Authentication failed for ${client.id}:`, error);
        client.emit('CONNECTION_ERROR', {
          error: 'Invalid authentication token',
          timestamp: new Date().toISOString(),
        });
        client.disconnect();
      }
    });
  }

  async handleDisconnect(client: AuthenticatedSocket) {
    if (client.userId) {
      this.logger.log(`👋 User ${client.userId} disconnected`);

      // Remove from connected users
      this.connectedUsers.delete(client.userId);

      // Update presence status
      await this.updateUserPresence(client.userId, 'offline');

      // Clean up typing indicators
      this.typingUsers.delete(client.userId);

      this.logger.log(`📊 Total connected users: ${this.connectedUsers.size}`);
    }
  }

  @SubscribeMessage('NEW_MESSAGE')
  async handleNewMessage(
    @MessageBody() data: CreateMessageDto,
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    try {
      if (!client.userId) {
        return { error: 'User not authenticated' };
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
        return { error: 'Duplicate message' };
      }

      // Mark message as processed in Redis (expires in 1 hour)
      await this.redis.setex(messageKey, 3600, '1');

      this.logger.log('📨 Handling new message:', {
        messageId,
        from: client.userId,
        to: data.receiverId,
        content: data.content?.substring(0, 50) + '...',
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

      // Send confirmation to sender ONLY
      client.emit('MESSAGE_SENT', {
        messageId,
        timestamp: new Date().toISOString(),
        status: 'sent',
      });

      // Update last activity
      client.lastActivity = Date.now();

      return { success: true, messageId };
    } catch (error) {
      this.logger.error('❌ Error handling new message:', error);
      client.emit('MESSAGE_ERROR', {
        error: 'Failed to send message',
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
    if (!client.userId) return;

    const { receiverId } = data;

    // Add to typing users
    if (!this.typingUsers.has(receiverId)) {
      this.typingUsers.set(receiverId, new Set());
    }
    this.typingUsers.get(receiverId)!.add(client.userId);

    // Broadcast typing indicator to recipient
    this.server.to(`user_${receiverId}`).emit('USER_TYPING', {
      userId: client.userId,
      isTyping: true,
    });

    // Auto-clear typing indicator after 3 seconds
    setTimeout(() => {
      this.handleTypingStop(data, client);
    }, 3000);
  }

  @SubscribeMessage('TYPING_STOP')
  async handleTypingStop(
    @MessageBody() data: TypingData,
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    if (!client.userId) return;

    const { receiverId } = data;

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
    });
  }

  @SubscribeMessage('GET_ONLINE_USERS')
  async handleGetOnlineUsers(@ConnectedSocket() client: AuthenticatedSocket) {
    if (!client.userId) return;

    try {
      // Get all online users from Redis
      const onlineUserIds = await this.redis.smembers('online_users');

      // Filter out current user
      const onlineUsers = onlineUserIds.filter(
        (userId) => userId !== client.userId,
      );

      client.emit('ONLINE_USERS', onlineUsers);
    } catch (error) {
      this.logger.error('Error getting online users:', error);
      client.emit('ONLINE_USERS', []);
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
      this.logger.error('Error updating user presence:', error);
    }
  }

  private cleanupInactiveConnections() {
    const now = Date.now();
    const inactiveThreshold = 5 * 60 * 1000; // 5 minutes

    for (const [userId, socket] of this.connectedUsers.entries()) {
      if (
        socket.lastActivity &&
        now - socket.lastActivity > inactiveThreshold
      ) {
        this.logger.log(
          `🧹 Cleaning up inactive connection for user ${userId}`,
        );
        socket.disconnect();
        this.connectedUsers.delete(userId);
      }
    }
  }

  // Health check endpoint
  @SubscribeMessage('HEALTH_CHECK')
  async handleHealthCheck(@ConnectedSocket() client: AuthenticatedSocket) {
    try {
      // Check Redis connection
      const redisStatus = await this.redis.ping();
      const onlineUsersCount = await this.redis.scard('online_users');

      client.emit('HEALTH_RESPONSE', {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        connectedUsers: this.connectedUsers.size,
        redisStatus: redisStatus === 'PONG' ? 'connected' : 'disconnected',
        onlineUsersCount,
      });
    } catch (error) {
      client.emit('HEALTH_RESPONSE', {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error.message,
        connectedUsers: this.connectedUsers.size,
        redisStatus: 'error',
      });
    }
  }
}