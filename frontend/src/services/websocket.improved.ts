import { io, Socket } from 'socket.io-client';
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';

export interface WebSocketMessage {
  type:
    | 'NEW_MESSAGE'
    | 'TYPING_START'
    | 'TYPING_STOP'
    | 'MESSAGE_READ'
    | 'USER_ONLINE'
    | 'USER_OFFLINE'
    | 'PING'
    | 'PONG'
    | 'MESSAGE_SENT'
    | 'MESSAGE_ERROR'
    | 'CONNECTION_SUCCESS'
    | 'CONNECTION_ERROR'
    | 'USER_TYPING'
    | 'MESSAGE_READ_RECEIPT'
    | 'USER_STATUS_CHANGE'
    | 'FORCE_DISCONNECT';
  data: unknown;
  timestamp: string;
}

export interface ChatMessage {
  id: string;
  content: string;
  senderId: string;
  receiverId: string;
  timestamp: string;
  createdAt: string;
  uniqueId?: string; // For deduplication
  confirmation?: boolean; // For sender confirmation
}

export type ConnectionStatus =
  | 'disconnected'
  | 'connecting'
  | 'connected'
  | 'reconnecting';

/**
 * Improved WebSocket Service with proper cleanup and deduplication
 *
 * Key improvements:
 * - Proper event listener cleanup to prevent duplicates
 * - Message deduplication using unique IDs
 * - Better connection status tracking
 * - Graceful reconnection handling
 * - Memory leak prevention
 */
export class ImprovedWebSocketService {
  private socket: Socket | null = null;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private heartbeatInterval: number | null = null;
  private messageHandlers: Map<string, (message: WebSocketMessage) => void> =
    new Map();
  private connectionStatus: ConnectionStatus = 'disconnected';
  private url: string;
  private currentUserId: string | null = null;
  private currentToken: string | null = null;
  private reconnectAttempts = 0;
  private isManualDisconnect = false;

  // Track processed messages to prevent duplicates
  private processedMessages = new Set<string>();

  // Connection status listeners
  private statusListeners: Set<(status: ConnectionStatus) => void> = new Set();

  constructor(baseUrl: string = BACKEND_URL) {
    this.url = baseUrl;
  }

  /**
   * Connects to the WebSocket server with proper authentication
   *
   * @param userId - The user ID
   * @param token - The JWT token
   * @returns Promise that resolves when connected
   */
  connect(userId: string, token: string): Promise<void> {
    return new Promise((resolve, reject) => {
      // Store current credentials
      this.currentUserId = userId;
      this.currentToken = token;
      this.isManualDisconnect = false;

      // If already connected, resolve immediately
      if (this.socket && this.socket.connected) {
        console.log('✅ Socket.IO already connected');
        resolve();
        return;
      }

      this.connectionStatus = 'connecting';
      this.updateStatusListeners();

      console.log('🔌 Attempting to connect to WebSocket...', {
        userId,
        hasToken: !!token,
      });

      try {
        // Clean up existing socket if any
        if (this.socket) {
          this.cleanupSocket();
        }

        // Create new socket connection
        this.socket = io(`${this.url}/ws`, {
          query: { userId, token },
          transports: ['websocket', 'polling'],
          autoConnect: true,
          reconnection: false, // We handle reconnection manually
          timeout: 10000,
          forceNew: true, // Force new connection
          withCredentials: true, // Include credentials for CORS
        });

        // Set up event listeners
        this.setupSocketListeners(resolve, reject);
      } catch (error) {
        console.error('❌ Error creating Socket.IO connection:', error);
        this.connectionStatus = 'disconnected';
        this.updateStatusListeners();
        reject(error);
      }
    });
  }

  /**
   * Disconnects from the WebSocket server
   */
  disconnect(): void {
    console.log('🔌 Manually disconnecting WebSocket...');
    this.isManualDisconnect = true;
    this.cleanupSocket();
    this.connectionStatus = 'disconnected';
    this.updateStatusListeners();
    this.currentUserId = null;
    this.currentToken = null;
    this.reconnectAttempts = 0;
  }

  /**
   * Attempts to reconnect to the WebSocket server
   *
   * @returns Promise that resolves when reconnected
   */
  reconnect(): Promise<void> {
    if (!this.currentUserId || !this.currentToken) {
      return Promise.reject(
        new Error('No credentials stored for reconnection')
      );
    }

    if (this.isManualDisconnect) {
      return Promise.reject(new Error('Manual disconnect in progress'));
    }

    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.log('❌ Max reconnection attempts reached');
      this.connectionStatus = 'disconnected';
      this.updateStatusListeners();
      return Promise.reject(new Error('Max reconnection attempts reached'));
    }

    this.reconnectAttempts++;
    this.connectionStatus = 'reconnecting';
    this.updateStatusListeners();

    console.log(
      `🔄 Attempting to reconnect... (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`
    );

    // Wait before reconnecting
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        this.connect(this.currentUserId!, this.currentToken!)
          .then(() => {
            this.reconnectAttempts = 0;
            resolve();
          })
          .catch((error) => {
            console.error('❌ Reconnection failed:', error);
            reject(error);
          });
      }, this.reconnectDelay * this.reconnectAttempts);
    });
  }

  /**
   * Sends a message via WebSocket
   *
   * @param type - The message type
   * @param data - The message data
   */
  send(type: WebSocketMessage['type'], data: unknown): void {
    if (this.socket && this.socket.connected) {
      this.socket.emit(type, data);
      console.log('📤 Socket.IO message sent:', { type, data });
    } else {
      console.warn('⚠️ Socket.IO is not connected. Cannot send message.');

      // Try to reconnect if we have credentials and it's not a manual disconnect
      if (this.currentUserId && this.currentToken && !this.isManualDisconnect) {
        console.log('🔄 Attempting to reconnect before sending message...');
        this.reconnect()
          .then(() => {
            this.send(type, data);
          })
          .catch((error) => {
            console.error('❌ Reconnection failed:', error);
          });
      }
    }
  }

  /**
   * Sends a chat message
   *
   * @param message - The message to send
   */
  sendChatMessage(
    message: Omit<ChatMessage, 'id' | 'timestamp' | 'createdAt'>
  ): void {
    this.send('NEW_MESSAGE', message);
  }

  /**
   * Sends typing indicator
   *
   * @param receiverId - The receiver's user ID
   * @param isTyping - Whether the user is typing
   */
  sendTypingIndicator(receiverId: string, isTyping: boolean): void {
    this.send(isTyping ? 'TYPING_START' : 'TYPING_STOP', { receiverId });
  }

  /**
   * Sends read receipt
   *
   * @param messageId - The message ID
   * @param senderId - The sender's user ID
   */
  sendReadReceipt(messageId: string, senderId: string): void {
    this.send('MESSAGE_READ', { messageId, senderId });
  }

  /**
   * Registers a message handler
   *
   * @param type - The message type to handle
   * @param handler - The handler function
   */
  on(type: string, handler: (message: WebSocketMessage) => void): void {
    // Remove existing handler to prevent duplicates
    this.messageHandlers.delete(type);

    // Add new handler
    this.messageHandlers.set(type, handler);
    console.log(`📝 Socket.IO handler registered for type: ${type}`);
  }

  /**
   * Removes a message handler
   *
   * @param type - The message type to remove handler for
   */
  off(type: string): void {
    this.messageHandlers.delete(type);
    console.log(`🗑️ Socket.IO handler removed for type: ${type}`);
  }

  /**
   * Adds a connection status listener
   *
   * @param listener - The status change listener
   */
  addStatusListener(listener: (status: ConnectionStatus) => void): void {
    this.statusListeners.add(listener);
  }

  /**
   * Removes a connection status listener
   *
   * @param listener - The status change listener to remove
   */
  removeStatusListener(listener: (status: ConnectionStatus) => void): void {
    this.statusListeners.delete(listener);
  }

  /**
   * Gets the current connection status
   *
   * @returns The current connection status
   */
  getConnectionStatus(): ConnectionStatus {
    return this.connectionStatus;
  }

  /**
   * Checks if the socket is connected
   *
   * @returns True if connected, false otherwise
   */
  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  /**
   * Gets the current user ID
   *
   * @returns The current user ID or null
   */
  getCurrentUserId(): string | null {
    return this.currentUserId;
  }

  /**
   * Sets up socket event listeners
   *
   * @param resolve - Promise resolve function
   * @param reject - Promise reject function
   */
  private setupSocketListeners(
    resolve: () => void,
    reject: (error: Error) => void
  ): void {
    if (!this.socket) return;

    // Connection success
    this.socket.on('connect', () => {
      console.log('✅ Socket.IO connected successfully');
      this.connectionStatus = 'connected';
      this.updateStatusListeners();
      this.reconnectAttempts = 0;
      this.startHeartbeat();
      resolve();
    });

    // Connection error
    this.socket.on('connect_error', (error: Error) => {
      console.error('❌ Socket.IO connection error:', error);
      this.connectionStatus = 'disconnected';
      this.updateStatusListeners();
      reject(new Error(`Socket.IO connection failed: ${error.message}`));
    });

    // Disconnection
    this.socket.on('disconnect', (reason: string) => {
      console.log('🔌 Socket.IO disconnected:', reason);
      this.connectionStatus = 'disconnected';
      this.updateStatusListeners();
      this.stopHeartbeat();

      // Handle different disconnect reasons
      if (reason === 'io server disconnect') {
        // Server disconnected, try to reconnect
        console.log('🔄 Server disconnected, attempting to reconnect...');
        if (!this.isManualDisconnect) {
          this.reconnect().catch((error) => {
            console.error('❌ Reconnection failed:', error);
          });
        }
      } else if (reason === 'io client disconnect') {
        // Client disconnected, don't try to reconnect
        console.log('🔌 Client disconnected manually');
      }
    });

    // Handle incoming messages
    this.socket.onAny((eventName: string, ...args: unknown[]) => {
      console.log('📨 Socket.IO message received:', eventName, args);

      // Find and call the appropriate handler
      const handler = this.messageHandlers.get(eventName);
      if (handler && args[0]) {
        const message: WebSocketMessage = {
          type: eventName as WebSocketMessage['type'],
          data: args[0],
          timestamp: new Date().toISOString(),
        };

        // Check for message deduplication
        if (this.shouldProcessMessage(message)) {
          handler(message);
        } else {
          console.log('⚠️ Duplicate message ignored:', eventName);
        }
      }
    });

    // Handle force disconnect
    this.socket.on('FORCE_DISCONNECT', (data: { reason: string }) => {
      console.log('🔌 Force disconnect received:', data.reason);
      this.disconnect();
    });
  }

  /**
   * Checks if a message should be processed (deduplication)
   *
   * @param message - The message to check
   * @returns True if message should be processed, false otherwise
   */
  private shouldProcessMessage(message: WebSocketMessage): boolean {
    // For NEW_MESSAGE, check uniqueId
    if (
      message.type === 'NEW_MESSAGE' &&
      message.data &&
      typeof message.data === 'object'
    ) {
      const data = message.data as { uniqueId?: string };
      if (data.uniqueId) {
        if (this.processedMessages.has(data.uniqueId)) {
          return false;
        }
        this.processedMessages.add(data.uniqueId);
      }
    }

    // For MESSAGE_SENT, check uniqueId
    if (
      message.type === 'MESSAGE_SENT' &&
      message.data &&
      typeof message.data === 'object'
    ) {
      const data = message.data as { uniqueId?: string };
      if (data.uniqueId) {
        if (this.processedMessages.has(data.uniqueId)) {
          return false;
        }
        this.processedMessages.add(data.uniqueId);
      }
    }

    return true;
  }

  /**
   * Cleans up the socket connection
   */
  private cleanupSocket(): void {
    if (this.socket) {
      // Remove all event listeners to prevent memory leaks
      this.socket.removeAllListeners();
      this.socket.disconnect();
      this.socket = null;
    }
    this.stopHeartbeat();
  }

  /**
   * Starts the heartbeat to keep connection alive
   */
  private startHeartbeat(): void {
    this.stopHeartbeat(); // Clear any existing heartbeat
    this.heartbeatInterval = window.setInterval(() => {
      if (this.socket && this.socket.connected) {
        this.socket.emit('PING');
      }
    }, 30000); // Ping every 30 seconds
  }

  /**
   * Stops the heartbeat
   */
  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  /**
   * Updates all status listeners
   */
  private updateStatusListeners(): void {
    this.statusListeners.forEach((listener) => {
      try {
        listener(this.connectionStatus);
      } catch (error) {
        console.error('❌ Error in status listener:', error);
      }
    });
  }

  /**
   * Cleans up processed messages to prevent memory leaks
   * Should be called periodically
   */
  cleanupProcessedMessages(): void {
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
      `🧹 Cleaned up processed messages. Remaining: ${this.processedMessages.size}`
    );
  }
}

// Export singleton instance
export const improvedWebSocketService = new ImprovedWebSocketService();
