import { webSocketService } from './websocket';

export interface Notification {
  id: string;
  type:
    | 'MESSAGE'
    | 'CONNECTION_REQUEST'
    | 'CONNECTION_ACCEPTED'
    | 'CONNECTION_REJECTED';
  title: string;
  message: string;
  userId: string;
  relatedId?: string; // message ID or connection ID
  isRead: boolean;
  createdAt: string;
  data?: any; // additional data
}

export interface NotificationCounts {
  unread: number;
  total: number;
}

class NotificationService {
  private listeners: Map<string, Function[]> = new Map();
  private notifications: Notification[] = [];
  private unreadCount: number = 0;

  constructor() {
    // Temporarily disabled for debugging
    // this.setupWebSocketListeners();
  }

  private setupWebSocketListeners() {
    // Listen for new messages
    webSocketService.on('NEW_MESSAGE', (data: any) => {
      this.addNotification({
        id: `msg_${Date.now()}`,
        type: 'MESSAGE',
        title: 'New Message',
        message: `You have a new message from ${data.sender?.name || 'Someone'}`,
        userId: data.receiverId,
        relatedId: data.id,
        isRead: false,
        createdAt: new Date().toISOString(),
        data: data,
      });
    });

    // Listen for connection requests
    webSocketService.on('CONNECTION_REQUEST', (data: any) => {
      this.addNotification({
        id: `conn_${Date.now()}`,
        type: 'CONNECTION_REQUEST',
        title: 'New Connection Request',
        message: `${data.requester?.name || 'Someone'} wants to connect with you`,
        userId: data.recipientId,
        relatedId: data.id,
        isRead: false,
        createdAt: new Date().toISOString(),
        data: data,
      });
    });

    // Listen for connection status updates
    webSocketService.on('CONNECTION_STATUS_UPDATE', (data: any) => {
      if (data.status === 'ACCEPTED') {
        this.addNotification({
          id: `acc_${Date.now()}`,
          type: 'CONNECTION_ACCEPTED',
          title: 'Connection Accepted',
          message: `${data.recipient?.name || 'Someone'} accepted your connection request`,
          userId: data.requesterId,
          relatedId: data.id,
          isRead: false,
          createdAt: new Date().toISOString(),
          data: data,
        });
      } else if (data.status === 'REJECTED') {
        this.addNotification({
          id: `rej_${Date.now()}`,
          type: 'CONNECTION_REJECTED',
          title: 'Connection Rejected',
          message: `${data.recipient?.name || 'Someone'} rejected your connection request`,
          userId: data.requesterId,
          relatedId: data.id,
          isRead: false,
          createdAt: new Date().toISOString(),
          data: data,
        });
      }
    });
  }

  private addNotification(notification: Notification) {
    this.notifications.unshift(notification);
    if (!notification.isRead) {
      this.unreadCount++;
    }

    // Emit to listeners
    this.emit('notification', notification);
    this.emit('countUpdate', {
      unread: this.unreadCount,
      total: this.notifications.length,
    });

    // Show browser notification if supported
    this.showBrowserNotification(notification);

    // Play notification sound
    this.playNotificationSound();
  }

  private showBrowserNotification(notification: Notification) {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(notification.title, {
        body: notification.message,
        icon: '/logo192.png',
        tag: notification.id,
      });
    }
  }

  private playNotificationSound() {
    try {
      const audio = new Audio('/notification.mp3'); // You'll need to add this sound file
      audio.volume = 0.5;
      audio.play().catch(() => {
        // Ignore errors if audio can't play
      });
    } catch (error) {
      // Ignore errors
    }
  }

  // Request browser notification permission
  async requestPermission(): Promise<boolean> {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }
    return false;
  }

  // Get all notifications
  getNotifications(): Notification[] {
    return [...this.notifications];
  }

  // Get unread notifications
  getUnreadNotifications(): Notification[] {
    return this.notifications.filter((n) => !n.isRead);
  }

  // Get notification counts
  getCounts(): NotificationCounts {
    return {
      unread: this.unreadCount,
      total: this.notifications.length,
    };
  }

  // Mark notification as read
  markAsRead(notificationId: string) {
    const notification = this.notifications.find(
      (n) => n.id === notificationId
    );
    if (notification && !notification.isRead) {
      notification.isRead = true;
      this.unreadCount--;
      this.emit('countUpdate', {
        unread: this.unreadCount,
        total: this.notifications.length,
      });
    }
  }

  // Mark all notifications as read
  markAllAsRead() {
    this.notifications.forEach((n) => (n.isRead = true));
    this.unreadCount = 0;
    this.emit('countUpdate', {
      unread: this.unreadCount,
      total: this.notifications.length,
    });
  }

  // Clear notification
  clearNotification(notificationId: string) {
    const index = this.notifications.findIndex((n) => n.id === notificationId);
    if (index !== -1) {
      const notification = this.notifications[index];
      if (!notification.isRead) {
        this.unreadCount--;
      }
      this.notifications.splice(index, 1);
      this.emit('countUpdate', {
        unread: this.unreadCount,
        total: this.notifications.length,
      });
    }
  }

  // Clear all notifications
  clearAllNotifications() {
    this.notifications = [];
    this.unreadCount = 0;
    this.emit('countUpdate', {
      unread: this.unreadCount,
      total: this.notifications.length,
    });
  }

  // Event listener methods
  on(event: string, callback: Function) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(callback);
  }

  off(event: string, callback: Function) {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      const index = callbacks.indexOf(callback);
      if (index !== -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  private emit(event: string, data: any) {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach((callback) => {
        try {
          callback(data);
        } catch (error) {
          console.error('Error in notification listener:', error);
        }
      });
    }
  }

  // Initialize the service
  async init() {
    // Request notification permission
    await this.requestPermission();

    // Load existing notifications from localStorage (optional)
    this.loadFromStorage();
  }

  private loadFromStorage() {
    try {
      const stored = localStorage.getItem('notifications');
      if (stored) {
        const data = JSON.parse(stored);
        this.notifications = data.notifications || [];
        this.unreadCount = data.unreadCount || 0;
      }
    } catch (error) {
      console.error('Error loading notifications from storage:', error);
    }
  }

  private saveToStorage() {
    try {
      localStorage.setItem(
        'notifications',
        JSON.stringify({
          notifications: this.notifications,
          unreadCount: this.unreadCount,
        })
      );
    } catch (error) {
      console.error('Error saving notifications to storage:', error);
    }
  }
}

// Create singleton instance
export const notificationService = new NotificationService();

// Initialize when module loads - temporarily disabled for debugging
// notificationService.init();
