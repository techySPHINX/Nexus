import { io, Socket } from 'socket.io-client';

export interface WebSocketMessage {
  type: 'NEW_MESSAGE' | 'TYPING_START' | 'TYPING_STOP' | 'MESSAGE_READ' | 'USER_ONLINE' | 'USER_OFFLINE' | 'PING' | 'PONG' | 'MESSAGE_SENT' | 'MESSAGE_ERROR';
  data: any;
  timestamp: string;
}

export interface ChatMessage {
  id: string;
  content: string;
  senderId: string;
  receiverId: string;
  timestamp: string;
  createdAt: string;
}

export class WebSocketService {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private heartbeatInterval: number | null = null;
  private messageHandlers: Map<string, (message: WebSocketMessage) => void> = new Map();
  private connectionStatus: 'disconnected' | 'connecting' | 'connected' | 'reconnecting' = 'disconnected';
  private url: string;
  private currentUserId: string | null = null;
  private currentToken: string | null = null;

  constructor(baseUrl: string = 'http://localhost:3000') {
    this.url = baseUrl;
  }

  connect(userId: string, token: string): Promise<void> {
    return new Promise((resolve, reject) => {
      // Store current credentials
      this.currentUserId = userId;
      this.currentToken = token;

      if (this.socket && this.socket.connected) {
        console.log('Socket.IO already connected');
        resolve();
        return;
      }

      this.connectionStatus = 'connecting';
      console.log('Attempting to connect to WebSocket...', { userId, hasToken: !!token });
      
      try {
        // Connect to Socket.IO server
        this.socket = io(`${this.url}/ws`, {
          query: { userId, token },
          transports: ['websocket', 'polling'],
          autoConnect: true,
          reconnection: true,
          reconnectionAttempts: this.maxReconnectAttempts,
          reconnectionDelay: this.reconnectDelay,
          timeout: 10000, // 10 second timeout
        });
        
        this.socket.on('connect', () => {
          console.log('Socket.IO connected successfully');
          this.connectionStatus = 'connected';
          this.reconnectAttempts = 0;
          this.startHeartbeat();
          resolve();
        });

        this.socket.on('disconnect', (reason: string) => {
          console.log('Socket.IO disconnected:', reason);
          this.connectionStatus = 'disconnected';
          this.stopHeartbeat();
          
          if (reason === 'io server disconnect') {
            // Server disconnected, try to reconnect
            console.log('Server disconnected, attempting to reconnect...');
            this.socket?.connect();
          }
        });

        this.socket.on('connect_error', (error: Error) => {
          console.error('Socket.IO connection error:', error);
          this.connectionStatus = 'disconnected';
          reject(new Error(`Socket.IO connection failed: ${error.message}`));
        });

        // Set up message handlers
        this.setupMessageHandlers();

      } catch (error) {
        console.error('Error creating Socket.IO connection:', error);
        this.connectionStatus = 'disconnected';
        reject(error);
      }
    });
  }

  disconnect(): void {
    console.log('Disconnecting WebSocket...');
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.stopHeartbeat();
    this.connectionStatus = 'disconnected';
    this.currentUserId = null;
    this.currentToken = null;
  }

  reconnect(): Promise<void> {
    if (!this.currentUserId || !this.currentToken) {
      return Promise.reject(new Error('No credentials stored for reconnection'));
    }
    
    console.log('Attempting to reconnect...');
    this.disconnect();
    return this.connect(this.currentUserId, this.currentToken);
  }

  send(type: WebSocketMessage['type'], data: any): void {
    if (this.socket && this.socket.connected) {
      this.socket.emit(type, data);
      console.log('Socket.IO message sent:', { type, data });
    } else {
      console.warn('Socket.IO is not connected. Cannot send message.');
      // Try to reconnect if we have credentials
      if (this.currentUserId && this.currentToken) {
        console.log('Attempting to reconnect before sending message...');
        this.reconnect().then(() => {
          this.send(type, data);
        }).catch(error => {
          console.error('Reconnection failed:', error);
        });
      }
    }
  }

  sendChatMessage(message: Omit<ChatMessage, 'id' | 'timestamp' | 'createdAt'>): void {
    this.send('NEW_MESSAGE', message);
  }

  sendTypingIndicator(receiverId: string, isTyping: boolean): void {
    this.send(isTyping ? 'TYPING_START' : 'TYPING_STOP', { receiverId });
  }

  sendReadReceipt(messageId: string, receiverId: string): void {
    this.send('MESSAGE_READ', { messageId, receiverId });
  }

  on(type: string, handler: (message: WebSocketMessage) => void): void {
    this.messageHandlers.set(type, handler);
    console.log(`Socket.IO handler registered for type: ${type}`);
  }

  off(type: string): void {
    this.messageHandlers.delete(type);
  }

  getConnectionStatus(): string {
    return this.connectionStatus;
  }

  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  getCurrentUserId(): string | null {
    return this.currentUserId;
  }

  private setupMessageHandlers(): void {
    if (!this.socket) return;

    // Handle all incoming messages
    this.socket.onAny((eventName: string, ...args: any[]) => {
      console.log('Socket.IO message received:', eventName, args);
      
      // Find and call the appropriate handler
      const handler = this.messageHandlers.get(eventName);
      if (handler && args[0]) {
        const message: WebSocketMessage = {
          type: eventName as WebSocketMessage['type'],
          data: args[0],
          timestamp: new Date().toISOString(),
        };
        handler(message);
      }
    });
  }

  private startHeartbeat(): void {
    this.heartbeatInterval = window.setInterval(() => {
      if (this.socket && this.socket.connected) {
        this.socket.emit('PING');
      }
    }, 30000);
  }

  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }
}

export const webSocketService = new WebSocketService();
