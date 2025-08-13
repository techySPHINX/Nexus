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

interface AuthenticatedSocket extends Socket {
  userId?: string;
  userEmail?: string;
}

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

  afterInit() {
    console.log('WebSocket Gateway initialized');
  }

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

  @SubscribeMessage('PING')
  handlePing(@ConnectedSocket() client: AuthenticatedSocket) {
    // Respond with PONG
    client.emit('PONG', {
      type: 'PONG',
      data: { timestamp: Date.now() },
      timestamp: new Date().toISOString(),
    });
  }

  // Helper method to get connected users
  getConnectedUsers(): string[] {
    return Array.from(this.connectedUsers.keys());
  }

  // Helper method to send message to specific user
  sendToUser(userId: string, event: string, data: any) {
    const userSocket = this.connectedUsers.get(userId);
    if (userSocket) {
      userSocket.emit(event, data);
    }
  }
}
