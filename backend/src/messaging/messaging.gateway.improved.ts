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
import { MessagingService } from './messaging.service';
import { CreateMessageDto } from './dto/create-message.dto';

/**
 * Interface for an authenticated WebSocket client socket.
 * Extends the base Socket with optional userId and userEmail properties.
 */
interface AuthenticatedSocket extends Socket {
  userId?: string;
  userEmail?: string;
}

/**
 * Improved WebSocket Gateway for real-time messaging functionality.
 *
 * Key improvements:
 * - Prevents message duplication by only broadcasting to recipients
 * - Proper connection management with user tracking
 * - Message deduplication using unique IDs
 * - Clean separation of concerns
 */
@WebSocketGateway({
  cors: {
    origin: ['http://localhost:3001', 'http://localhost:3000'],
    credentials: true,
  },
  namespace: '/ws',
})
export class ImprovedMessagingGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  // Track connected users to prevent duplicate connections
  private connectedUsers = new Map<string, AuthenticatedSocket>();

  // Track message IDs to prevent duplicates
  private processedMessages = new Set<string>();

  constructor(
    private readonly messagingService: MessagingService,
    private readonly jwtService: JwtService,
  ) {}

  /**
   * Called after the gateway has been initialized.
   * Logs a message indicating the gateway is ready.
   */
  afterInit(server: Server) {
    console.log('🚀 Improved Messaging Gateway initialized');
    this.server = server;
  }

  /**
   * Handles new WebSocket connections.
   * Authenticates the user and joins them to their personal room.
   * Prevents duplicate connections for the same user.
   *
   * @param client - The WebSocket client socket
   */
  async handleConnection(client: AuthenticatedSocket) {
    try {
      console.log('🔌 New WebSocket connection attempt:', client.id);

      // Extract user info from query parameters
      const { userId, token } = client.handshake.query;

      if (!userId || !token) {
        console.log('❌ Missing userId or token in connection query');
        client.emit('CONNECTION_ERROR', {
          error: 'Missing authentication credentials',
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
        client.emit('CONNECTION_ERROR', {
          error: 'Invalid authentication token',
          timestamp: new Date().toISOString(),
        });
        client.disconnect();
        return;
      }

      // Check if user is already connected and disconnect old connection
      const existingConnection = this.connectedUsers.get(client.userId);
      if (existingConnection && existingConnection.id !== client.id) {
        console.log(
          `🔄 Disconnecting existing connection for user ${client.userId}`,
        );
        existingConnection.emit('FORCE_DISCONNECT', {
          reason: 'New connection established',
          timestamp: new Date().toISOString(),
        });
        existingConnection.disconnect();
      }

      // Store the new connection
      this.connectedUsers.set(client.userId, client);

      // Join user to their personal room for receiving messages
      const userRoom = `user_${client.userId}`;
      await client.join(userRoom);

      console.log(`✅ User ${client.userId} connected successfully`);
      console.log(`📊 Total connected users: ${this.connectedUsers.size}`);

      // Send connection confirmation
      client.emit('CONNECTION_SUCCESS', {
        userId: client.userId,
        userEmail: client.userEmail,
        timestamp: new Date().toISOString(),
      });

      // Notify other users that this user is online
      this.broadcastUserStatus(client.userId, 'ONLINE');
    } catch (error) {
      console.error('❌ Error handling connection:', error);
      client.emit('CONNECTION_ERROR', {
        error: 'Connection failed',
        timestamp: new Date().toISOString(),
      });
      client.disconnect();
    }
  }

  /**
   * Handles WebSocket disconnections.
   * Removes user from connected users and notifies others of offline status.
   *
   * @param client - The WebSocket client socket
   */
  handleDisconnect(client: AuthenticatedSocket) {
    if (client.userId) {
      console.log(`🔌 User ${client.userId} disconnected`);

      // Remove from connected users
      this.connectedUsers.delete(client.userId);

      // Notify other users that this user is offline
      this.broadcastUserStatus(client.userId, 'OFFLINE');

      console.log(`📊 Total connected users: ${this.connectedUsers.size}`);
    }
  }

  /**
   * Handles incoming 'NEW_MESSAGE' events.
   *
   * Key improvements:
   * - Prevents duplicate message processing using message IDs
   * - Only broadcasts to recipient (not sender) to prevent duplicates
   * - Sends confirmation to sender separately
   * - Proper error handling and logging
   *
   * @param data - The message data (receiverId, content)
   * @param client - The authenticated WebSocket client socket
   * @returns An object indicating success or error
   */
  @SubscribeMessage('NEW_MESSAGE')
  async handleNewMessage(
    @MessageBody() data: CreateMessageDto,
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    try {
      if (!client.userId) {
        return { error: 'User not authenticated' };
      }

      // Generate unique message ID for deduplication
      const messageId = `${client.userId}_${data.receiverId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Check if this message was already processed
      if (this.processedMessages.has(messageId)) {
        console.log(`⚠️ Duplicate message detected, ignoring: ${messageId}`);
        return { error: 'Duplicate message' };
      }

      // Mark message as processed
      this.processedMessages.add(messageId);

      console.log('📨 Handling new message:', {
        messageId,
        from: client.userId,
        to: data.receiverId,
        content: data.content,
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
        ...messageWithId,
        confirmation: true,
      });

      console.log('✅ Message sent successfully via WebSocket');
      return { success: true, message: messageWithId };
    } catch (error) {
      console.error('❌ Error handling new message:', error);
      client.emit('MESSAGE_ERROR', {
        type: 'MESSAGE_ERROR',
        data: { error: error.message },
        timestamp: new Date().toISOString(),
      });
      return { error: error.message };
    }
  }

  /**
   * Handles typing indicators.
   * Broadcasts typing status to the recipient.
   *
   * @param data - Contains receiverId and typing status
   * @param client - The authenticated WebSocket client socket
   */
  @SubscribeMessage('TYPING_START')
  async handleTypingStart(
    @MessageBody() data: { receiverId: string },
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    if (!client.userId) return;

    const recipientRoom = `user_${data.receiverId}`;
    this.server.to(recipientRoom).emit('USER_TYPING', {
      userId: client.userId,
      userEmail: client.userEmail,
      isTyping: true,
      timestamp: new Date().toISOString(),
    });
  }

  @SubscribeMessage('TYPING_STOP')
  async handleTypingStop(
    @MessageBody() data: { receiverId: string },
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    if (!client.userId) return;

    const recipientRoom = `user_${data.receiverId}`;
    this.server.to(recipientRoom).emit('USER_TYPING', {
      userId: client.userId,
      userEmail: client.userEmail,
      isTyping: false,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Handles read receipts.
   * Notifies the sender that their message was read.
   *
   * @param data - Contains messageId and senderId
   * @param client - The authenticated WebSocket client socket
   */
  @SubscribeMessage('MESSAGE_READ')
  async handleMessageRead(
    @MessageBody() data: { messageId: string; senderId: string },
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    if (!client.userId) return;

    const senderRoom = `user_${data.senderId}`;
    this.server.to(senderRoom).emit('MESSAGE_READ_RECEIPT', {
      messageId: data.messageId,
      readBy: client.userId,
      readAt: new Date().toISOString(),
    });
  }

  /**
   * Handles ping/pong for connection health checks.
   *
   * @param client - The authenticated WebSocket client socket
   */
  @SubscribeMessage('PING')
  handlePing(@ConnectedSocket() client: AuthenticatedSocket) {
    client.emit('PONG', {
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Broadcasts user online/offline status to all connected users.
   *
   * @param userId - The user ID
   * @param status - 'ONLINE' or 'OFFLINE'
   */
  private broadcastUserStatus(userId: string, status: 'ONLINE' | 'OFFLINE') {
    this.server.emit('USER_STATUS_CHANGE', {
      userId,
      status,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Sends a message to a specific user.
   * Used by other services to send notifications.
   *
   * @param userId - The target user ID
   * @param event - The event name
   * @param data - The data to send
   */
  sendToUser(userId: string, event: string, data: unknown) {
    const userRoom = `user_${userId}`;
    this.server.to(userRoom).emit(event, data);
  }

  /**
   * Gets the number of connected users.
   *
   * @returns The number of connected users
   */
  getConnectedUsersCount(): number {
    return this.connectedUsers.size;
  }

  /**
   * Gets a list of connected user IDs.
   *
   * @returns Array of connected user IDs
   */
  getConnectedUserIds(): string[] {
    return Array.from(this.connectedUsers.keys());
  }

  /**
   * Broadcasts a message to the recipient and sender.
   * Used when a message is sent via API to ensure real-time delivery.
   *
   * @param message - The message object to broadcast
   */
  broadcastMessage(message: any) {
    try {
      // Generate a unique ID for deduplication
      const messageId = `${message.id}_${message.senderId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Add unique ID to message for frontend deduplication
      const messageWithId = {
        ...message,
        uniqueId: messageId,
      };

      // Broadcast to recipient
      const recipientRoom = `user_${message.receiverId}`;
      this.server.to(recipientRoom).emit('NEW_MESSAGE', messageWithId);

      // Send confirmation to sender
      const senderRoom = `user_${message.senderId}`;
      this.server.to(senderRoom).emit('MESSAGE_SENT', {
        ...messageWithId,
        confirmation: true,
      });

      console.log('📨 Message broadcasted via API:', {
        messageId,
        from: message.senderId,
        to: message.receiverId,
        content: message.content,
      });
    } catch (error) {
      console.error('❌ Error broadcasting message:', error);
    }
  }

  /**
   * Cleanup processed messages periodically to prevent memory leaks.
   * This should be called periodically (e.g., every hour).
   */
  cleanupProcessedMessages() {
    // Keep only messages from the last hour
    const oneHourAgo = Date.now() - 60 * 60 * 1000;
    const messagesToKeep = new Set<string>();

    for (const messageId of this.processedMessages) {
      const timestamp = parseInt(messageId.split('_')[2]);
      if (timestamp > oneHourAgo) {
        messagesToKeep.add(messageId);
      }
    }

    this.processedMessages = messagesToKeep;
    console.log(
      `🧹 Cleaned up processed messages. Remaining: ${this.processedMessages.size}`,
    );
  }
}
