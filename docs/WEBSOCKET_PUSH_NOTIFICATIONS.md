# WebSocket & Push Notifications Implementation Guide

## Overview
This document describes the comprehensive real-time communication and push notification system implemented in Nexus.

## Features Implemented

### 1. Dashboard WebSocket Gateway (`/dashboard` namespace)
Real-time dashboard updates with the following capabilities:

#### Connection
- **Endpoint**: `ws://localhost:3000/dashboard`
- **Authentication**: JWT token required in query params
- **Query Parameters**:
  - `userId`: User's unique identifier
  - `token`: JWT authentication token

#### Events Emitted by Server

##### `connected`
Confirmation of successful connection
```json
{
  "userId": "user-uuid",
  "timestamp": "2025-12-01T10:00:00.000Z",
  "message": "Dashboard connection established"
}
```

##### `notification`
Real-time notification pushed to user
```json
{
  "title": "New Message",
  "body": "John sent you a message",
  "type": "MESSAGE",
  "priority": "high",
  "data": { "senderId": "sender-uuid" },
  "timestamp": "2025-12-01T10:00:00.000Z"
}
```

##### `activity`
User activity updates
```json
{
  "type": "connection_request",
  "userId": "user-uuid",
  "message": "New connection request",
  "timestamp": "2025-12-01T10:00:00.000Z"
}
```

##### `user_status`
User online/offline status changes
```json
{
  "userId": "user-uuid",
  "status": "online",
  "timestamp": "2025-12-01T10:00:00.000Z"
}
```

##### `announcement`
System-wide announcements
```json
{
  "title": "System Maintenance",
  "body": "Scheduled maintenance tonight",
  "timestamp": "2025-12-01T10:00:00.000Z"
}
```

##### `stats_update`
Real-time statistics updates
```json
{
  "connections": 150,
  "messages": 1250,
  "posts": 89,
  "timestamp": "2025-12-01T10:00:00.000Z"
}
```

#### Events Received by Server

##### `subscribe`
Subscribe to specific channels
```json
{
  "channels": ["referrals", "events", "projects"]
}
```

##### `unsubscribe`
Unsubscribe from specific channels
```json
{
  "channels": ["referrals"]
}
```

### 2. Messaging WebSocket Gateway (`/ws` namespace)
Real-time messaging with duplicate prevention

#### Connection
- **Endpoint**: `ws://localhost:3000/ws`
- **Authentication**: JWT token required
- **Features**:
  - Message deduplication
  - Typing indicators
  - Read receipts
  - Presence tracking

#### Events
- `message:new` - New message received
- `message:sent` - Message sent confirmation
- `typing:start` - User started typing
- `typing:stop` - User stopped typing
- `presence:online` - User came online
- `presence:offline` - User went offline

### 3. Push Notification Service
Multi-channel notification delivery system

#### Channels
1. **WebSocket** - Real-time in-app notifications
2. **FCM** - Mobile and web push notifications
3. **Database** - Persistent notification storage

#### Notification Types
- `MESSAGE` - New chat message
- `CONNECTION_REQUEST` - Connection request received
- `CONNECTION_ACCEPTED` - Connection accepted
- `POST_COMMENT` - Comment on your post
- `COMMENT_MENTION` - Mentioned in a comment
- `REFERRAL_APPLICATION` - New referral application
- `PROJECT_UPDATE` - Project update
- `SYSTEM` - System announcements

## API Endpoints

### Push Notification Management

#### Register Device Token
```http
POST /notifications/device-token
Authorization: Bearer <jwt-token>
Content-Type: application/json

{
  "token": "fcm-device-token-here"
}
```

**Response:**
```json
{
  "message": "Device token registered successfully"
}
```

#### Unregister Device Token
```http
DELETE /notifications/device-token
Authorization: Bearer <jwt-token>
```

**Response:**
```json
{
  "message": "Device token unregistered successfully"
}
```

## Frontend Integration Examples

### Dashboard WebSocket Connection

```typescript
import { io, Socket } from 'socket.io-client';

class DashboardService {
  private socket: Socket | null = null;

  connect(userId: string, token: string) {
    this.socket = io('http://localhost:3000/dashboard', {
      query: { userId, token },
      transports: ['websocket'],
    });

    this.socket.on('connected', (data) => {
      console.log('Dashboard connected:', data);
    });

    this.socket.on('notification', (notification) => {
      console.log('New notification:', notification);
      this.showNotification(notification);
    });

    this.socket.on('activity', (activity) => {
      console.log('Activity update:', activity);
      this.updateActivityFeed(activity);
    });

    this.socket.on('user_status', (status) => {
      console.log('User status:', status);
      this.updateUserPresence(status);
    });

    this.socket.on('stats_update', (stats) => {
      console.log('Stats update:', stats);
      this.updateDashboardStats(stats);
    });

    this.socket.on('error', (error) => {
      console.error('Dashboard error:', error);
    });
  }

  subscribe(channels: string[]) {
    this.socket?.emit('subscribe', { channels });
  }

  unsubscribe(channels: string[]) {
    this.socket?.emit('unsubscribe', { channels });
  }

  disconnect() {
    this.socket?.disconnect();
  }

  private showNotification(notification: any) {
    // Show browser notification or in-app toast
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(notification.title, {
        body: notification.body,
        icon: notification.icon || '/logo.png',
        badge: notification.badge,
      });
    }
  }

  private updateActivityFeed(activity: any) {
    // Update activity feed UI
  }

  private updateUserPresence(status: any) {
    // Update user online/offline status in UI
  }

  private updateDashboardStats(stats: any) {
    // Update dashboard statistics
  }
}

export const dashboardService = new DashboardService();
```

### Messaging WebSocket Connection

```typescript
import { io, Socket } from 'socket.io-client';

class MessagingService {
  private socket: Socket | null = null;

  connect(userId: string, token: string) {
    this.socket = io('http://localhost:3000/ws', {
      query: { userId, token },
      transports: ['websocket'],
    });

    this.socket.on('MESSAGE_BROADCAST', (message) => {
      console.log('New message:', message);
      this.handleNewMessage(message);
    });

    this.socket.on('TYPING_INDICATOR', (data) => {
      console.log('Typing indicator:', data);
      this.showTypingIndicator(data);
    });
  }

  sendMessage(receiverId: string, content: string) {
    this.socket?.emit('sendMessage', {
      receiverId,
      content,
    });
  }

  startTyping(receiverId: string) {
    this.socket?.emit('typing', { receiverId, isTyping: true });
  }

  stopTyping(receiverId: string) {
    this.socket?.emit('typing', { receiverId, isTyping: false });
  }

  markAsRead(messageId: string) {
    this.socket?.emit('markAsRead', { messageId });
  }

  private handleNewMessage(message: any) {
    // Add message to chat UI
  }

  private showTypingIndicator(data: any) {
    // Show/hide typing indicator
  }
}

export const messagingService = new MessagingService();
```

### FCM Push Notification Registration

```typescript
import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';

const firebaseConfig = {
  apiKey: 'YOUR_API_KEY',
  authDomain: 'YOUR_AUTH_DOMAIN',
  projectId: 'YOUR_PROJECT_ID',
  storageBucket: 'YOUR_STORAGE_BUCKET',
  messagingSenderId: 'YOUR_SENDER_ID',
  appId: 'YOUR_APP_ID',
};

const app = initializeApp(firebaseConfig);
const messaging = getMessaging(app);

async function registerPushNotifications() {
  try {
    // Request permission
    const permission = await Notification.requestPermission();
    
    if (permission === 'granted') {
      // Get FCM token
      const token = await getToken(messaging, {
        vapidKey: 'YOUR_VAPID_KEY',
      });

      // Register token with backend
      const response = await fetch('/api/notifications/device-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ token }),
      });

      if (response.ok) {
        console.log('Push notifications enabled');
      }
    }
  } catch (error) {
    console.error('Failed to enable push notifications:', error);
  }
}

// Handle foreground messages
onMessage(messaging, (payload) => {
  console.log('Foreground message:', payload);
  
  // Show notification
  new Notification(payload.notification.title, {
    body: payload.notification.body,
    icon: payload.notification.icon,
  });
});

export { registerPushNotifications };
```

## Environment Variables

Add the following to your `.env` file:

```env
# WebSocket Configuration
ALLOWED_ORIGIN=http://localhost:3001

# JWT Configuration
JWT_SECRET=your-secret-key-here

# Firebase Cloud Messaging (optional)
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY=your-private-key
FIREBASE_CLIENT_EMAIL=your-client-email
```

## Testing

### Test Dashboard WebSocket
```bash
# Using wscat
wscat -c "ws://localhost:3000/dashboard?userId=user-uuid&token=your-jwt-token"

# Subscribe to channels
> {"event": "subscribe", "data": {"channels": ["referrals", "events"]}}
```

### Test Messaging WebSocket
```bash
wscat -c "ws://localhost:3000/ws?userId=user-uuid&token=your-jwt-token"

# Send a message
> {"event": "sendMessage", "data": {"receiverId": "receiver-uuid", "content": "Hello"}}
```

## Performance Considerations

1. **Connection Pooling**: Maximum 5 connections per user
2. **Message Deduplication**: 5-minute window for duplicate detection
3. **Auto-reconnection**: Client should implement exponential backoff
4. **Heartbeat**: 30-second ping/pong to maintain connection
5. **Compression**: Enabled for messages > 1KB

## Security Features

1. **JWT Authentication**: Required for all WebSocket connections
2. **Rate Limiting**: 100 messages per minute per user
3. **Message Encryption**: Optional end-to-end encryption support
4. **Token Validation**: Real-time token verification
5. **Connection Limits**: Maximum 1000 concurrent connections per namespace

## Monitoring

The system provides real-time monitoring through:

- `DashboardGateway.getOnlineUsersCount()` - Current online users
- `DashboardGateway.isUserOnline(userId)` - Check specific user status
- WebSocket event logs in console
- Connection/disconnection tracking

## Troubleshooting

### Common Issues

1. **Connection Failed**
   - Verify JWT token is valid
   - Check userId matches token payload
   - Ensure CORS is properly configured

2. **Messages Not Received**
   - Check user is subscribed to correct channels
   - Verify WebSocket connection is active
   - Check server logs for errors

3. **Push Notifications Not Working**
   - Verify FCM token is registered
   - Check browser notification permissions
   - Ensure Firebase is properly configured

## Next Steps

1. **Configure Firebase**: Set up Firebase project for FCM
2. **Install Dependencies**: `npm install firebase-admin`
3. **Update Environment**: Add Firebase credentials
4. **Frontend Integration**: Implement WebSocket clients
5. **Testing**: Test all notification flows
6. **Monitoring**: Set up logging and analytics

## Support

For issues or questions, refer to:
- Nexus Backend Documentation
- Socket.io Documentation: https://socket.io/docs/
- Firebase Cloud Messaging: https://firebase.google.com/docs/cloud-messaging
