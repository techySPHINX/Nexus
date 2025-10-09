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
 * WebSocket Gateway for real-time messaging functionality.
 * Handles WebSocket connections, disconnections, and message events.
 * Provides real-time communication for sending messages, typing indicators, and read receipts.
 */
@WebSocketGateway({
  cors: {
    origin: ['http://localhost:3001', 'http://localhost:3000'],
    credentials: true,
  },
  namespace: '/ws',
})
export class MessagingGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private connectedUsers = new Map<string, AuthenticatedSocket>();

  constructor(
    private readonly messagingService: MessagingService,
    private readonly jwtService: JwtService,
  ) {}

  /**
   * Called after the gateway has been initialized.
   * Logs a message indicating the gateway is ready.
   */
  afterInit() {
    console.log('WebSocket Gateway initialized');
  }

  /**
   * Handles new WebSocket connections.
   * Authenticates the client using a JWT token from query parameters.
   * Stores connected user information and joins them to a personal room.
   * Broadcasts user online status.
   * @param client - The connected WebSocket client socket.
   */
  async handleConnection(client: AuthenticatedSocket) {
    try {
      // Extract user info from query parameters
      const userId = client.handshake.query.userId as string;
      const token = client.handshake.query.token as string;

      console.log('WebSocket connection attempt:', {
        userId,
        hasToken: !!token,
      });

      if (!userId || !token) {
        console.log('WebSocket connection rejected: missing userId or token');
        client.disconnect();
        return;
      }

      // Verify JWT token
      try {
        const payload = this.jwtService.verify(token);
        console.log('JWT verified for user:', payload);
      } catch (jwtError) {
        console.log('JWT verification failed:', jwtError.message);
        client.disconnect();
        return;
      }

      // Store user info in socket
      client.userId = userId;
      client.userEmail = userId; // Using userId as email for now

      // Add to connected users
      this.connectedUsers.set(userId, client);

      // Join user to their personal room
      await client.join(`user_${userId}`);

      // Broadcast user online status
      this.server.emit('USER_ONLINE', {
        userId,
        timestamp: new Date().toISOString(),
      });

      console.log(
        `User ${userId} connected to WebSocket. Total connected: ${this.connectedUsers.size}`,
      );
    } catch (error) {
      console.error('WebSocket connection error:', error);
      client.disconnect();
    }
  }

  /**
   * Handles WebSocket disconnections.
   * Removes the user from connected users and broadcasts user offline status.
   * @param client - The disconnected WebSocket client socket.
   */
  handleDisconnect(client: AuthenticatedSocket) {
    if (client.userId) {
      // Remove from connected users
      this.connectedUsers.delete(client.userId);

      // Broadcast user offline status
      this.server.emit('USER_OFFLINE', {
        userId: client.userId,
        timestamp: new Date().toISOString(),
      });

      console.log(
        `User ${client.userId} disconnected from WebSocket. Total connected: ${this.connectedUsers.size}`,
      );
    }
  }

  /**
   * Handles incoming 'NEW_MESSAGE' events.
   * Saves the message to the database and broadcasts it to the recipient.
   * Sends a confirmation back to the sender.
   * @param data - The message data (receiverId, content).
   * @param client - The authenticated WebSocket client socket.
   * @returns An object indicating success or error.
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

      console.log('Handling new message:', {
        from: client.userId,
        to: data.receiverId,
        content: data.content,
      });

      // Create the message in the database
      const message = await this.messagingService.sendMessage(
        client.userId,
        data,
      );

      // Broadcast to recipient
      const recipientRoom = `user_${data.receiverId}`;
      this.server.to(recipientRoom).emit('NEW_MESSAGE', {
        id: message.id,
        content: message.content,
        senderId: message.senderId,
        receiverId: message.receiverId,
        timestamp: message.timestamp,
        sender: {
          id: message.senderId,
          name: client.userId, // We'll need to get the actual name from user service
          email: client.userId,
        },
      });

      // Send confirmation to sender
      client.emit('MESSAGE_SENT', {
        id: message.id,
        content: message.content,
        senderId: message.senderId,
        receiverId: message.receiverId,
        timestamp: message.timestamp,
      });

      console.log('Message sent successfully via WebSocket');
      return { success: true, message };
    } catch (error) {
      console.error('Error handling new message:', error);
      client.emit('MESSAGE_ERROR', {
        type: 'MESSAGE_ERROR',
        data: { error: error.message },
        timestamp: new Date().toISOString(),
      });
      return { error: error.message };
    }
  }

  /**
   * Handles 'TYPING_START' events.
   * Broadcasts a typing indicator to the specified receiver.
   * @param data - Object containing the receiverId.
   * @param client - The authenticated WebSocket client socket.
   */
  @SubscribeMessage('TYPING_START')
  handleTypingStart(
    @MessageBody() data: { receiverId: string },
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    if (!client.userId) return;

    console.log('Typing start:', { from: client.userId, to: data.receiverId });

    // Broadcast typing indicator to recipient
    const recipientRoom = `user_${data.receiverId}`;
    this.server.to(recipientRoom).emit('TYPING_START', {
      type: 'TYPING_START',
      data: { senderId: client.userId, receiverId: data.receiverId },
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Handles 'TYPING_STOP' events.
   * Broadcasts a typing stop indicator to the specified receiver.
   * @param data - Object containing the receiverId.
   * @param client - The authenticated WebSocket client socket.
   */
  @SubscribeMessage('TYPING_STOP')
  handleTypingStop(
    @MessageBody() data: { receiverId: string },
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    if (!client.userId) return;

    console.log('Typing stop:', { from: client.userId, to: data.receiverId });

    // Broadcast typing stop to recipient
    const recipientRoom = `user_${data.receiverId}`;
    this.server.to(recipientRoom).emit('TYPING_STOP', {
      type: 'TYPING_STOP',
      data: { senderId: client.userId, receiverId: data.receiverId },
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Handles 'MESSAGE_READ' events.
   * Broadcasts a read receipt to the sender of the message.
   * @param data - Object containing the messageId and receiverId.
   * @param client - The authenticated WebSocket client socket.
   */
  @SubscribeMessage('MESSAGE_READ')
  handleMessageRead(
    @MessageBody() data: { messageId: string; receiverId: string },
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    if (!client.userId) return;

    // Broadcast read receipt to sender
    const senderRoom = `user_${data.receiverId}`;
    this.server.to(senderRoom).emit('MESSAGE_READ', {
      type: 'MESSAGE_READ',
      data: { messageId: data.messageId, readBy: client.userId },
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Handles 'PING' events from clients.
   * Responds with a 'PONG' event to maintain connection heartbeat.
   * @param client - The authenticated WebSocket client socket.
   */
  @SubscribeMessage('PING')
  handlePing(@ConnectedSocket() client: AuthenticatedSocket) {
    // Respond with PONG
    client.emit('PONG', {
      type: 'PONG',
      data: { timestamp: Date.now() },
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Returns a list of currently connected user IDs.
   * @returns An array of strings representing connected user IDs.
   */
  getConnectedUsers(): string[] {
    return Array.from(this.connectedUsers.keys());
  }

  /**
   * Sends a WebSocket event to a specific user.
   * @param userId - The ID of the user to send the event to.
   * @param event - The name of the event to emit.
   * @param data - The data payload for the event.
   */
  sendToUser(userId: string, event: string, data: any) {
    const userSocket = this.connectedUsers.get(userId);
    if (userSocket) {
      userSocket.emit(event, data);
    }
  }
}
