# WebSocket Migration Guide

## Overview

This guide helps you migrate from the current WebSocket implementation to the production-grade system.

## 🎯 Migration Checklist

- [ ] Backend: Install new gateways and services
- [ ] Backend: Update CommonModule
- [ ] Backend: Update environment variables
- [ ] Frontend: Install production WebSocket manager
- [ ] Frontend: Update Dashboard component
- [ ] Frontend: Update ChatPage component  
- [ ] Frontend: Update all WebSocket imports
- [ ] Testing: Verify all features work
- [ ] Monitoring: Set up metrics dashboard
- [ ] Deploy: Roll out to production

---

## Backend Migration

### Step 1: Verify File Structure

Ensure these files exist:
```
backend/src/common/
├── gateways/
│   ├── unified-websocket.gateway.ts ✅
│   └── notification.gateway.ts ✅
└── services/
    ├── presence.service.ts ✅
    └── websocket-monitoring.service.ts ✅
```

### Step 2: Update Existing Messaging Gateway

**Option A: Keep Both (Recommended for gradual migration)**

Rename `fast-chat.gateway.ts` to `legacy-messaging.gateway.ts` and keep it alongside the new system.

**Option B: Replace Completely**

1. Export messaging logic from `fast-chat.gateway.ts`
2. Import into services
3. Use `UnifiedWebSocketGateway` for real-time communication

### Step 3: Update Services to Use New Gateways

#### Notification Service

```typescript
// Before (in notification.service.ts)
// No real-time notifications

// After
import { NotificationGateway } from '../common/gateways/notification.gateway';

@Injectable()
export class NotificationService {
  constructor(
    private readonly notificationGateway: NotificationGateway,
  ) {}

  async create(dto: CreateNotificationDto) {
    // Create in database
    const notification = await this.prisma.notification.create(...);

    // Send real-time notification
    await this.notificationGateway.sendNotification({
      userId: dto.userId,
      type: dto.type,
      title: this.getNotificationTitle(dto.type),
      message: dto.message,
      priority: this.getPriority(dto.type),
      data: { notificationId: notification.id },
    });

    return notification;
  }
}
```

#### Connection Service

```typescript
// In connection.service.ts
import { UnifiedWebSocketGateway } from '../common/gateways/unified-websocket.gateway';

@Injectable()
export class ConnectionService {
  constructor(
    private readonly unifiedGateway: UnifiedWebSocketGateway,
  ) {}

  async acceptConnection(userId: string, connectionId: string) {
    const connection = await this.prisma.connection.update(...);

    // Notify both users in real-time
    await this.unifiedGateway.broadcastToUser(
      connection.senderId,
      'connection:accepted',
      { connection },
    );

    await this.unifiedGateway.broadcastToUser(
      connection.receiverId,
      'connection:accepted',
      { connection },
    );

    return connection;
  }
}
```

#### Messaging Service

```typescript
// In messaging.service.ts
import { UnifiedWebSocketGateway } from '../common/gateways/unified-websocket.gateway';
import { PresenceService } from '../common/services/presence.service';

@Injectable()
export class MessagingService {
  constructor(
    private readonly unifiedGateway: UnifiedWebSocketGateway,
    private readonly presenceService: PresenceService,
  ) {}

  async sendMessage(senderId: string, dto: CreateMessageDto) {
    const message = await this.prisma.message.create(...);

    // Check if receiver is online
    const isOnline = await this.presenceService.isUserOnline(dto.receiverId);

    if (isOnline) {
      // Send via WebSocket
      await this.unifiedGateway.broadcastToUser(
        dto.receiverId,
        'message:new',
        message,
      );
    }

    // Sender confirmation
    await this.unifiedGateway.broadcastToUser(
      senderId,
      'message:sent',
      { messageId: message.id },
    );

    return message;
  }
}
```

### Step 4: Update Environment Variables

Add to `.env`:
```env
# WebSocket Configuration
RATE_LIMIT_MESSAGES_PER_MINUTE=200
ALLOWED_ORIGIN=http://localhost:3001,https://yourdomain.com

# Redis (if not already configured)
REDIS_URL=redis://localhost:6379

# JWT (if not already configured)
JWT_SECRET=your-secret-key-here
```

### Step 5: Remove Old Fast-Chat Gateway (Optional)

If you want to completely replace the old system:

1. **Backup** `fast-chat.gateway.ts`
2. **Extract** any business logic to services
3. **Update** `messaging.module.ts`:

```typescript
// Before
import { FastChatGateway } from './fast-chat.gateway';

@Module({
  providers: [FastChatGateway, ...],
})

// After
// Remove FastChatGateway, it's now in CommonModule
@Module({
  providers: [...], // No gateway needed
})
```

---

## Frontend Migration

### Step 1: Verify File Exists

Ensure `frontend/src/services/websocket.production.ts` exists ✅

### Step 2: Update Dashboard Component

**File:** `frontend/src/pages/Dashboard.tsx`

```typescript
// Before
import { improvedWebSocketService } from '../services/websocket.improved';

useEffect(() => {
  improvedWebSocketService.connect(user.id, token);
  
  improvedWebSocketService.on('NEW_MESSAGE', handleNewMessage);
  improvedWebSocketService.on('CONNECTION_REQUEST', handleConnectionRequest);
  
  return () => {
    improvedWebSocketService.off('NEW_MESSAGE');
    improvedWebSocketService.off('CONNECTION_REQUEST');
  };
}, [user?.id, token]);

// After
import { productionWebSocketManager } from '../services/websocket.production';

useEffect(() => {
  const initWebSocket = async () => {
    try {
      await productionWebSocketManager.connect(user.id, token);
    } catch (error) {
      console.error('WebSocket connection failed:', error);
    }
  };

  initWebSocket();
  
  // Listen to events (note the namespace!)
  productionWebSocketManager.on('realtime', 'message:new', handleNewMessage);
  productionWebSocketManager.on('realtime', 'connection:request', handleConnectionRequest);
  
  // Listen to connection status
  const statusHandler = (status) => {
    console.log('WebSocket status:', status);
  };
  productionWebSocketManager.addStatusListener(statusHandler);
  
  return () => {
    productionWebSocketManager.off('realtime', 'message:new');
    productionWebSocketManager.off('realtime', 'connection:request');
    productionWebSocketManager.removeStatusListener(statusHandler);
    // Don't disconnect here if other components use it
  };
}, [user?.id, token]);
```

### Step 3: Update ChatPage Component

**File:** `frontend/src/pages/ChatPage.tsx`

```typescript
// Before
import { improvedWebSocketService } from '../services/websocket.improved';

useEffect(() => {
  improvedWebSocketService.on('NEW_MESSAGE', handleNewMessage);
  improvedWebSocketService.on('MESSAGE_SENT', handleSent);
  // ...
}, []);

const sendMessage = (content: string) => {
  improvedWebSocketService.sendChatMessage({
    content,
    receiverId: selectedUser.id,
    senderId: user.id,
  });
};

// After
import { productionWebSocketManager } from '../services/websocket.production';

useEffect(() => {
  // Use 'messaging' namespace for chat
  productionWebSocketManager.on('messaging', 'NEW_MESSAGE', handleNewMessage);
  productionWebSocketManager.on('messaging', 'MESSAGE_SENT', handleSent);
  productionWebSocketManager.on('messaging', 'USER_TYPING', handleTyping);
  productionWebSocketManager.on('messaging', 'MESSAGE_READ_UPDATE', handleRead);
  
  return () => {
    productionWebSocketManager.off('messaging', 'NEW_MESSAGE');
    productionWebSocketManager.off('messaging', 'MESSAGE_SENT');
    productionWebSocketManager.off('messaging', 'USER_TYPING');
    productionWebSocketManager.off('messaging', 'MESSAGE_READ_UPDATE');
  };
}, []);

const sendMessage = (content: string) => {
  productionWebSocketManager.emit('messaging', 'NEW_MESSAGE', {
    content,
    receiverId: selectedUser.id,
  });
};

const sendTypingIndicator = (isTyping: boolean) => {
  productionWebSocketManager.emit('messaging', isTyping ? 'TYPING_START' : 'TYPING_STOP', {
    receiverId: selectedUser.id,
  });
};
```

### Step 4: Add Notifications Component

Create `frontend/src/components/Notifications/NotificationCenter.tsx`:

```typescript
import React, { useEffect, useState } from 'react';
import { Badge, IconButton, Menu, MenuItem, ListItemText } from '@mui/material';
import { Notifications as NotificationsIcon } from '@mui/icons-material';
import { productionWebSocketManager } from '@/services/websocket.production';

export function NotificationCenter() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  useEffect(() => {
    // Listen to new notifications
    const handleNewNotification = (data: any) => {
      setNotifications(prev => [data, ...prev]);
      setUnreadCount(prev => prev + 1);
      
      // Show browser notification
      if (Notification.permission === 'granted') {
        new Notification(data.title, {
          body: data.message,
          icon: '/logo.png',
        });
      }
    };

    productionWebSocketManager.on(
      'notifications',
      'notification:new',
      handleNewNotification,
    );

    // Get initial unread count
    productionWebSocketManager.emit(
      'notifications',
      'notification:get_unread_count',
      {},
    );

    return () => {
      productionWebSocketManager.off('notifications', 'notification:new');
    };
  }, []);

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleMarkAsRead = (notificationId: string) => {
    productionWebSocketManager.emit(
      'notifications',
      'notification:mark_read',
      { notificationId },
    );
    
    setNotifications(prev =>
      prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  return (
    <>
      <IconButton color="inherit" onClick={handleClick}>
        <Badge badgeContent={unreadCount} color="error">
          <NotificationsIcon />
        </Badge>
      </IconButton>
      
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
      >
        {notifications.length === 0 ? (
          <MenuItem>No notifications</MenuItem>
        ) : (
          notifications.slice(0, 10).map((notif) => (
            <MenuItem
              key={notif.id}
              onClick={() => handleMarkAsRead(notif.id)}
              sx={{ opacity: notif.read ? 0.6 : 1 }}
            >
              <ListItemText
                primary={notif.title}
                secondary={notif.message}
              />
            </MenuItem>
          ))
        )}
      </Menu>
    </>
  );
}
```

### Step 5: Add Connection Status Indicator

Create `frontend/src/components/ConnectionStatus.tsx`:

```typescript
import React, { useEffect, useState } from 'react';
import { Chip } from '@mui/material';
import { productionWebSocketManager, ConnectionQuality } from '@/services/websocket.production';

export function ConnectionStatus() {
  const [quality, setQuality] = useState<ConnectionQuality>(ConnectionQuality.OFFLINE);
  const [latency, setLatency] = useState(0);

  useEffect(() => {
    const qualityHandler = (q: ConnectionQuality) => {
      setQuality(q);
      setLatency(productionWebSocketManager.getAverageLatency());
    };

    productionWebSocketManager.addQualityListener(qualityHandler);

    return () => {
      productionWebSocketManager.removeQualityListener(qualityHandler);
    };
  }, []);

  const getColor = () => {
    switch (quality) {
      case ConnectionQuality.EXCELLENT: return 'success';
      case ConnectionQuality.GOOD: return 'success';
      case ConnectionQuality.FAIR: return 'warning';
      case ConnectionQuality.POOR: return 'error';
      default: return 'default';
    }
  };

  return (
    <Chip
      label={`${quality.toUpperCase()} (${Math.round(latency)}ms)`}
      color={getColor()}
      size="small"
    />
  );
}
```

---

## Testing Migration

### Unit Tests

```typescript
// test/websocket.spec.ts
import { Test } from '@nestjs/testing';
import { UnifiedWebSocketGateway } from '../src/common/gateways/unified-websocket.gateway';

describe('UnifiedWebSocketGateway', () => {
  let gateway: UnifiedWebSocketGateway;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [UnifiedWebSocketGateway],
    }).compile();

    gateway = module.get<UnifiedWebSocketGateway>(UnifiedWebSocketGateway);
  });

  it('should be defined', () => {
    expect(gateway).toBeDefined();
  });

  // Add more tests
});
```

### Integration Tests

1. **Test Connection**
   - Connect from frontend
   - Verify authentication
   - Check presence update

2. **Test Messaging**
   - Send message
   - Verify delivery
   - Test offline queuing

3. **Test Notifications**
   - Send notification
   - Verify real-time delivery
   - Test FCM fallback

4. **Test Presence**
   - Update status
   - Check idle detection
   - Verify broadcasting

### Load Testing

Use the existing load test scripts:

```bash
# Test with 5000 concurrent connections
node load-test-5k.js
```

---

## Rollback Plan

If issues arise, you can quickly rollback:

### Backend Rollback

1. Revert `common.module.ts`:
```bash
git checkout HEAD -- src/common/common.module.ts
```

2. Remove new files (if needed):
```bash
rm -rf src/common/gateways/unified-websocket.gateway.ts
rm -rf src/common/gateways/notification.gateway.ts
rm -rf src/common/services/presence.service.ts
rm -rf src/common/services/websocket-monitoring.service.ts
```

### Frontend Rollback

1. Revert components to use old service:
```typescript
// Change back to
import { improvedWebSocketService } from '../services/websocket.improved';
```

---

## Post-Migration

### 1. Monitor Metrics

Check WebSocket dashboard for:
- Connection success rate
- Message delivery rate
- Error rates
- Latency metrics

### 2. Gradual Rollout

- Week 1: Internal testing
- Week 2: Beta users (10%)
- Week 3: Expand to 50%
- Week 4: Full rollout (100%)

### 3. Optimization

Based on metrics:
- Adjust rate limits
- Tune Redis configuration
- Optimize message batching
- Fine-tune reconnection strategy

---

## Support

If you encounter issues:

1. Check logs: Backend and frontend console
2. Verify Redis connection
3. Check environment variables
4. Review CORS configuration
5. Test with different browsers/devices

For questions, refer to:
- `WEBSOCKET_PRODUCTION_GUIDE.md`
- Inline documentation in source files
- Existing `Chat_Implementation.md`

Good luck with your migration! 🚀
