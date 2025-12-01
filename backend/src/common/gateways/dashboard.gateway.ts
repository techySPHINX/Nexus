import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { Injectable } from '@nestjs/common';

/**
 * Interface for an authenticated WebSocket client socket.
 */
interface AuthenticatedSocket extends Socket {
  userId?: string;
  userEmail?: string;
}

/**
 * WebSocket Gateway for real-time dashboard updates.
 * 
 * Features:
 * - Real-time notifications
 * - Live activity feed
 * - Connection status updates
 * - User presence tracking
 * - System announcements
 */
@Injectable()
@WebSocketGateway({
  cors: {
    origin: process.env.ALLOWED_ORIGIN || '*',
    credentials: true,
  },
  namespace: '/dashboard',
})
export class DashboardGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  // Track connected users
  private connectedUsers = new Map<string, Set<string>>(); // userId -> Set of socketIds
  private socketToUser = new Map<string, string>(); // socketId -> userId

  constructor(private readonly jwtService: JwtService) { }

  /**
   * Called after the gateway has been initialized.
   */
  afterInit(server: Server) {
    console.log('🎯 Dashboard Gateway initialized');
    this.server = server;
  }

  /**
   * Handles new WebSocket connections.
   */
  async handleConnection(client: AuthenticatedSocket) {
    try {
      console.log('🔌 Dashboard connection attempt:', client.id);

      const { userId, token } = client.handshake.query;

      if (!userId || !token) {
        console.log('❌ Missing userId or token');
        client.emit('error', {
          message: 'Missing authentication credentials',
          timestamp: new Date().toISOString(),
        });
        client.disconnect();
        return;
      }

      // Verify JWT token
      try {
        const payload = this.jwtService.verify(token as string);
        client.userId = payload.userId || userId;
        client.userEmail = payload.email;
      } catch (jwtError) {
        console.log('❌ Invalid JWT token:', jwtError.message);
        client.emit('error', {
          message: 'Invalid authentication token',
          timestamp: new Date().toISOString(),
        });
        client.disconnect();
        return;
      }

      const userIdStr = client.userId as string;

      // Track connection
      if (!this.connectedUsers.has(userIdStr)) {
        this.connectedUsers.set(userIdStr, new Set());
      }
      this.connectedUsers.get(userIdStr)!.add(client.id);
      this.socketToUser.set(client.id, userIdStr);

      // Join user-specific room
      await client.join(`user:${userIdStr}`);

      console.log(`✅ Dashboard connection established for user ${userIdStr}`);

      // Send connection confirmation
      client.emit('connected', {
        userId: userIdStr,
        timestamp: new Date().toISOString(),
        message: 'Dashboard connection established',
      });

      // Notify about online status
      this.broadcastUserStatus(userIdStr, 'online');
    } catch (error) {
      console.error('❌ Dashboard connection error:', error);
      client.disconnect();
    }
  }

  /**
   * Handles client disconnection.
   */
  async handleDisconnect(client: AuthenticatedSocket) {
    const userId = this.socketToUser.get(client.id);

    if (userId) {
      const userSockets = this.connectedUsers.get(userId);
      if (userSockets) {
        userSockets.delete(client.id);

        // If no more sockets for this user, remove from map and broadcast offline
        if (userSockets.size === 0) {
          this.connectedUsers.delete(userId);
          this.broadcastUserStatus(userId, 'offline');
        }
      }

      this.socketToUser.delete(client.id);
      console.log(`🔌 Dashboard disconnected: ${client.id} (User: ${userId})`);
    }
  }

  /**
   * Subscribe to specific dashboard channels
   */
  @SubscribeMessage('subscribe')
  handleSubscribe(
    @MessageBody() data: { channels: string[] },
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    if (!data.channels || !Array.isArray(data.channels)) {
      client.emit('error', { message: 'Invalid channels format' });
      return;
    }

    data.channels.forEach((channel) => {
      client.join(channel);
    });

    client.emit('subscribed', {
      channels: data.channels,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Unsubscribe from specific dashboard channels
   */
  @SubscribeMessage('unsubscribe')
  handleUnsubscribe(
    @MessageBody() data: { channels: string[] },
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    if (!data.channels || !Array.isArray(data.channels)) {
      client.emit('error', { message: 'Invalid channels format' });
      return;
    }

    data.channels.forEach((channel) => {
      client.leave(channel);
    });

    client.emit('unsubscribed', {
      channels: data.channels,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Broadcast notification to a specific user
   */
  async sendNotificationToUser(userId: string, notification: any) {
    this.server.to(`user:${userId}`).emit('notification', {
      ...notification,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Broadcast activity update to a specific user
   */
  async sendActivityUpdate(userId: string, activity: any) {
    this.server.to(`user:${userId}`).emit('activity', {
      ...activity,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Broadcast system announcement to all connected users
   */
  async broadcastSystemAnnouncement(announcement: any) {
    this.server.emit('announcement', {
      ...announcement,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Broadcast user status change
   */
  private broadcastUserStatus(userId: string, status: 'online' | 'offline') {
    this.server.emit('user_status', {
      userId,
      status,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Get online users count
   */
  getOnlineUsersCount(): number {
    return this.connectedUsers.size;
  }

  /**
   * Check if a user is online
   */
  isUserOnline(userId: string): boolean {
    return this.connectedUsers.has(userId);
  }

  /**
   * Broadcast to a specific channel
   */
  async broadcastToChannel(channel: string, event: string, data: any) {
    this.server.to(channel).emit(event, {
      ...data,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Send real-time stats update
   */
  async sendStatsUpdate(userId: string, stats: any) {
    this.server.to(`user:${userId}`).emit('stats_update', {
      ...stats,
      timestamp: new Date().toISOString(),
    });
  }
}
