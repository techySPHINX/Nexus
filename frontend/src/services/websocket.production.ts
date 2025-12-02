import { io, Socket } from 'socket.io-client';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';

/**
 * Connection Status
 */
export type ConnectionStatus =
  | 'disconnected'
  | 'connecting'
  | 'connected'
  | 'reconnecting'
  | 'error';

/**
 * Connection Quality
 */
export enum ConnectionQuality {
  EXCELLENT = 'excellent',
  GOOD = 'good',
  FAIR = 'fair',
  POOR = 'poor',
  OFFLINE = 'offline',
}

/**
 * Namespace Configuration
 */
export interface NamespaceConfig {
  path: string;
  autoConnect?: boolean;
  maxReconnectAttempts?: number;
}

/**
 * Event Handler
 */
export type EventHandler<T = unknown> = (data: T) => void;

/**
 * Production-Grade WebSocket Manager for Frontend
 *
 * Features:
 * ✅ Multi-namespace support (realtime, notifications, messaging)
 * ✅ Intelligent reconnection with exponential backoff
 * ✅ Message queue for offline scenarios
 * ✅ Connection health monitoring
 * ✅ Automatic heartbeat
 * ✅ Event deduplication
 * ✅ Network quality detection
 * ✅ Error recovery
 * ✅ Memory leak prevention
 * ✅ TypeScript support
 */
export class ProductionWebSocketManager {
  private namespaces: Map<string, Socket> = new Map();
  private eventHandlers: Map<string, Map<string, Set<EventHandler>>> =
    new Map();
  private messageQueue: Map<string, Array<{ event: string; data: unknown }>> =
    new Map();
  private processedMessages = new Set<string>();

  private userId: string | null = null;
  private token: string | null = null;

  // Connection management
  private connectionStatus: ConnectionStatus = 'disconnected';
  private connectionQuality: ConnectionQuality = ConnectionQuality.OFFLINE;
  private statusListeners = new Set<(status: ConnectionStatus) => void>();
  private qualityListeners = new Set<(quality: ConnectionQuality) => void>();

  // Reconnection strategy
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10;
  private reconnectDelay = 1000;
  private maxReconnectDelay = 30000;

  // Health monitoring
  private heartbeatInterval: number | null = null;
  private latencyCheckInterval: number | null = null;
  private lastPingTime = 0;
  private averageLatency = 0;
  private latencySamples: number[] = [];

  // Configuration
  private readonly MESSAGE_QUEUE_SIZE = 100;
  private readonly MESSAGE_DEDUP_TTL = 60000; // 1 minute
  private readonly HEARTBEAT_INTERVAL = 30000; // 30 seconds
  private readonly LATENCY_CHECK_INTERVAL = 10000; // 10 seconds
  private readonly LATENCY_SAMPLES_SIZE = 10;

  /**
   * Connect to WebSocket server
   */
  async connect(userId: string, token: string): Promise<void> {
    this.userId = userId;
    this.token = token;
    this.connectionStatus = 'connecting';
    this.notifyStatusListeners();

    try {
      // Connect to all namespaces
      await Promise.all([
        this.connectNamespace('realtime', '/realtime'),
        this.connectNamespace('notifications', '/notifications'),
        this.connectNamespace('messaging', '/ws'),
      ]);

      this.connectionStatus = 'connected';
      this.reconnectAttempts = 0;
      this.notifyStatusListeners();

      this.startHealthMonitoring();
      this.processQueuedMessages();

      console.log('✅ All WebSocket namespaces connected');
    } catch (error) {
      this.connectionStatus = 'error';
      this.notifyStatusListeners();
      console.error('❌ WebSocket connection failed:', error);
      throw error;
    }
  }

  /**
   * Connect to a specific namespace
   */
  private async connectNamespace(name: string, path: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.userId || !this.token) {
        reject(new Error('Missing authentication credentials'));
        return;
      }

      // Clean up existing connection
      if (this.namespaces.has(name)) {
        this.disconnectNamespace(name);
      }

      // Create new connection
      const socket = io(`${BACKEND_URL}${path}`, {
        query: { userId: this.userId, token: this.token },
        transports: ['websocket', 'polling'],
        autoConnect: true,
        reconnection: false, // Handle manually
        timeout: 10000,
        forceNew: true,
        withCredentials: true,
      });

      this.namespaces.set(name, socket);
      this.eventHandlers.set(name, new Map());

      // Connection events
      socket.on('connect', () => {
        console.log(`✅ Namespace ${name} connected`);

        // Authenticate
        socket.emit('authenticate', {
          userId: this.userId,
          token: this.token,
          deviceInfo: this.getDeviceInfo(),
        });
      });

      socket.on('auth:success', () => {
        console.log(`🔐 Namespace ${name} authenticated`);
        this.updateConnectionQuality();
        resolve();
      });

      socket.on('auth:error', (error: unknown) => {
        console.error(`❌ Namespace ${name} auth error:`, error);
        let errorMsg = 'Unknown error';
        if (error && typeof error === 'object' && 'error' in error) {
          errorMsg = (error as { error: string }).error;
        } else if (typeof error === 'string') {
          errorMsg = error;
        }
        reject(new Error(`Authentication failed: ${errorMsg}`));
      });

      socket.on('connect_error', (error: Error) => {
        console.error(`❌ Namespace ${name} connection error:`, error);
        this.connectionQuality = ConnectionQuality.OFFLINE;
        this.notifyQualityListeners();
        reject(error);
      });

      socket.on('disconnect', (reason: string) => {
        console.log(`🔌 Namespace ${name} disconnected:`, reason);

        if (reason === 'io server disconnect') {
          // Server disconnected, attempt reconnection
          this.attemptReconnection(name, path);
        }
      });

      // Set up message routing
      socket.onAny((event: string, data: unknown) => {
        this.handleEvent(name, event, data);
      });

      // Error handling
      socket.on('error', (error: unknown) => {
        console.error(`❌ Namespace ${name} error:`, error);
      });
    });
  }

  /**
   * Disconnect from all namespaces
   */
  disconnect(): void {
    console.log('🔌 Disconnecting all WebSocket namespaces...');

    this.namespaces.forEach((_, ns) => {
      this.disconnectNamespace(ns);
    });

    this.connectionStatus = 'disconnected';
    this.connectionQuality = ConnectionQuality.OFFLINE;
    this.notifyStatusListeners();
    this.notifyQualityListeners();

    this.stopHealthMonitoring();

    this.userId = null;
    this.token = null;
    this.reconnectAttempts = 0;
  }

  /**
   * Disconnect from a specific namespace
   */
  private disconnectNamespace(name: string): void {
    const socket = this.namespaces.get(name);
    if (socket) {
      socket.removeAllListeners();
      socket.disconnect();
      this.namespaces.delete(name);
    }

    this.eventHandlers.delete(name);
  }

  /**
   * Attempt reconnection with exponential backoff
   */
  private async attemptReconnection(name: string, path: string): Promise<void> {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error(`❌ Max reconnection attempts reached for ${name}`);
      this.connectionStatus = 'error';
      this.notifyStatusListeners();
      return;
    }

    this.reconnectAttempts++;
    this.connectionStatus = 'reconnecting';
    this.notifyStatusListeners();

    const delay = Math.min(
      this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1),
      this.maxReconnectDelay
    );

    console.log(
      `🔄 Reconnecting ${name} in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`
    );

    await new Promise((resolve) => setTimeout(resolve, delay));

    try {
      await this.connectNamespace(name, path);
      this.connectionStatus = 'connected';
      this.reconnectAttempts = 0;
      this.notifyStatusListeners();
    } catch (error) {
      console.error(`❌ Reconnection failed for ${name}:`, error);
      this.attemptReconnection(name, path);
    }
  }

  /**
   * Register event handler
   */
  on<T = unknown>(
    namespace: string,
    event: string,
    handler: EventHandler<T>
  ): void {
    const nsHandlers = this.eventHandlers.get(namespace);
    if (!nsHandlers) {
      console.warn(`⚠️ Namespace ${namespace} not found`);
      return;
    }

    if (!nsHandlers.has(event)) {
      nsHandlers.set(event, new Set());
    }

    (nsHandlers.get(event) as Set<EventHandler<T>>).add(handler);
    console.log(`📝 Handler registered: ${namespace}/${event}`);
  }

  /**
   * Unregister event handler
   */
  off(namespace: string, event: string, handler?: EventHandler): void {
    const nsHandlers = this.eventHandlers.get(namespace);
    if (!nsHandlers) return;

    if (handler) {
      nsHandlers.get(event)?.delete(handler);
    } else {
      nsHandlers.delete(event);
    }

    console.log(`🗑️ Handler unregistered: ${namespace}/${event}`);
  }

  /**
   * Emit event to namespace
   */
  emit(namespace: string, event: string, data: unknown): void {
    const socket = this.namespaces.get(namespace);

    if (socket && socket.connected) {
      socket.emit(event, data);
      console.log(`📤 Event emitted: ${namespace}/${event}`);
    } else {
      // Queue message if offline
      this.queueMessage(namespace, event, data);
      console.warn(`💾 Message queued (offline): ${namespace}/${event}`);
    }
  }

  /**
   * Handle incoming event
   */
  private handleEvent(namespace: string, event: string, data: unknown): void {
    console.log(`📨 Event received: ${namespace}/${event}`, data);

    // Check for deduplication
    if (this.shouldDeduplicateEvent(namespace, event, data)) {
      console.log(`⚠️ Duplicate event ignored: ${namespace}/${event}`);
      return;
    }

    // Call registered handlers
    const nsHandlers = this.eventHandlers.get(namespace);
    if (nsHandlers) {
      const handlers = nsHandlers.get(event);
      if (handlers) {
        handlers.forEach((handler) => {
          try {
            handler(data);
          } catch (error) {
            console.error(
              `❌ Error in event handler ${namespace}/${event}:`,
              error
            );
          }
        });
      }
    }
  }

  /**
   * Check if event should be deduplicated
   */
  private shouldDeduplicateEvent(
    namespace: string,
    event: string,
    data: unknown
  ): boolean {
    // Only deduplicate events with unique IDs
    if (
      typeof data === 'object' &&
      data !== null &&
      ('id' in data || 'uniqueId' in data || 'messageId' in data)
    ) {
      const d = data as { id?: string; uniqueId?: string; messageId?: string };
      const uniqueId = d.id || d.uniqueId || d.messageId;
      const key = `${namespace}:${event}:${uniqueId}`;

      if (this.processedMessages.has(key)) {
        return true;
      }

      this.processedMessages.add(key);

      // Clean up old messages
      setTimeout(() => {
        this.processedMessages.delete(key);
      }, this.MESSAGE_DEDUP_TTL);
    }

    return false;
  }

  /**
   * Queue message for later delivery
   */
  private queueMessage(namespace: string, event: string, data: unknown): void {
    if (!this.messageQueue.has(namespace)) {
      this.messageQueue.set(namespace, []);
    }

    const queue = this.messageQueue.get(namespace)!;
    queue.push({ event, data });

    // Limit queue size
    if (queue.length > this.MESSAGE_QUEUE_SIZE) {
      queue.shift();
    }
  }

  /**
   * Process queued messages
   */
  private processQueuedMessages(): void {
    this.messageQueue.forEach((queue, namespace) => {
      const socket = this.namespaces.get(namespace);
      if (socket && socket.connected) {
        console.log(
          `📬 Processing ${queue.length} queued messages for ${namespace}`
        );

        queue.forEach(({ event, data }) => {
          socket.emit(event, data);
        });

        queue.length = 0;
      }
    });
  }

  /**
   * Start health monitoring
   */
  private startHealthMonitoring(): void {
    // Heartbeat
    this.heartbeatInterval = window.setInterval(() => {
      this.sendHeartbeat();
    }, this.HEARTBEAT_INTERVAL);

    // Latency check
    this.latencyCheckInterval = window.setInterval(() => {
      this.checkLatency();
    }, this.LATENCY_CHECK_INTERVAL);
  }

  /**
   * Stop health monitoring
   */
  private stopHealthMonitoring(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }

    if (this.latencyCheckInterval) {
      clearInterval(this.latencyCheckInterval);
      this.latencyCheckInterval = null;
    }
  }

  /**
   * Send heartbeat to all namespaces
   */
  private sendHeartbeat(): void {
    this.namespaces.forEach((socket) => {
      if (socket.connected) {
        socket.emit('activity:ping');
      }
    });
  }

  /**
   * Check connection latency
   */
  private checkLatency(): void {
    const socket = this.namespaces.get('realtime');
    if (!socket || !socket.connected) return;

    this.lastPingTime = Date.now();

    socket.emit('health:check');
    socket.once('health:response', () => {
      const latency = Date.now() - this.lastPingTime;
      this.updateLatency(latency);
    });
  }

  /**
   * Update latency and connection quality
   */
  private updateLatency(latency: number): void {
    this.latencySamples.push(latency);

    if (this.latencySamples.length > this.LATENCY_SAMPLES_SIZE) {
      this.latencySamples.shift();
    }

    this.averageLatency =
      this.latencySamples.reduce((a, b) => a + b, 0) /
      this.latencySamples.length;

    this.updateConnectionQuality();
  }

  /**
   * Update connection quality based on latency
   */
  private updateConnectionQuality(): void {
    let quality: ConnectionQuality;

    if (this.connectionStatus !== 'connected') {
      quality = ConnectionQuality.OFFLINE;
    } else if (this.averageLatency < 100) {
      quality = ConnectionQuality.EXCELLENT;
    } else if (this.averageLatency < 300) {
      quality = ConnectionQuality.GOOD;
    } else if (this.averageLatency < 1000) {
      quality = ConnectionQuality.FAIR;
    } else {
      quality = ConnectionQuality.POOR;
    }

    if (quality !== this.connectionQuality) {
      this.connectionQuality = quality;
      this.notifyQualityListeners();
    }
  }

  /**
   * Add connection status listener
   */
  addStatusListener(listener: (status: ConnectionStatus) => void): void {
    this.statusListeners.add(listener);
  }

  /**
   * Remove connection status listener
   */
  removeStatusListener(listener: (status: ConnectionStatus) => void): void {
    this.statusListeners.delete(listener);
  }

  /**
   * Add connection quality listener
   */
  addQualityListener(listener: (quality: ConnectionQuality) => void): void {
    this.qualityListeners.add(listener);
  }

  /**
   * Remove connection quality listener
   */
  removeQualityListener(listener: (quality: ConnectionQuality) => void): void {
    this.qualityListeners.delete(listener);
  }

  /**
   * Notify status listeners
   */
  private notifyStatusListeners(): void {
    this.statusListeners.forEach((listener) => {
      try {
        listener(this.connectionStatus);
      } catch (error) {
        console.error('❌ Error in status listener:', error);
      }
    });
  }

  /**
   * Notify quality listeners
   */
  private notifyQualityListeners(): void {
    this.qualityListeners.forEach((listener) => {
      try {
        listener(this.connectionQuality);
      } catch (error) {
        console.error('❌ Error in quality listener:', error);
      }
    });
  }

  /**
   * Get connection status
   */
  getConnectionStatus(): ConnectionStatus {
    return this.connectionStatus;
  }

  /**
   * Get connection quality
   */
  getConnectionQuality(): ConnectionQuality {
    return this.connectionQuality;
  }

  /**
   * Get average latency
   */
  getAverageLatency(): number {
    return this.averageLatency;
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.connectionStatus === 'connected';
  }

  /**
   * Check if namespace is connected
   */
  isNamespaceConnected(namespace: string): boolean {
    const socket = this.namespaces.get(namespace);
    return socket ? socket.connected : false;
  }

  /**
   * Get device info
   */
  private getDeviceInfo() {
    return {
      type: this.isMobile() ? 'mobile' : 'desktop',
      browser: this.getBrowser(),
      os: this.getOS(),
      platform: navigator.platform,
    };
  }

  private isMobile(): boolean {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    );
  }

  private getBrowser(): string {
    const ua = navigator.userAgent;
    if (ua.includes('Firefox')) return 'Firefox';
    if (ua.includes('Chrome')) return 'Chrome';
    if (ua.includes('Safari')) return 'Safari';
    if (ua.includes('Edge')) return 'Edge';
    return 'Unknown';
  }

  private getOS(): string {
    const ua = navigator.userAgent;
    if (ua.includes('Win')) return 'Windows';
    if (ua.includes('Mac')) return 'MacOS';
    if (ua.includes('Linux')) return 'Linux';
    if (ua.includes('Android')) return 'Android';
    if (ua.includes('iOS')) return 'iOS';
    return 'Unknown';
  }
}

// Export singleton instance
export const productionWebSocketManager = new ProductionWebSocketManager();
