# Production-Grade Messaging Platform Implementation Guide

**Date:** November 6, 2025  
**Status:** ✅ Backend Complete | ⏳ Frontend Pending  
**Version:** 2.0.0

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Backend Features Implemented](#backend-features-implemented)
3. [Architecture & Scalability](#architecture--scalability)
4. [Database Schema Updates](#database-schema-updates)
5. [API Endpoints](#api-endpoints)
6. [WebSocket Events](#websocket-events)
7. [Firebase Cloud Messaging Setup](#firebase-cloud-messaging-setup)
8. [Testing Guide](#testing-guide)
9. [Frontend Implementation TODO](#frontend-implementation-todo)
10. [Environment Configuration](#environment-configuration)

---

## 🎯 Overview

This document outlines the comprehensive production-grade messaging platform implementation for Nexus. The system now supports:

- ✅ **Horizontal Scalability** - Redis-based Socket.IO adapter for multi-server deployment
- ✅ **Read Receipts** - Track when messages are read with real-time updates
- ✅ **Message Editing & Deletion** - Edit or soft-delete sent messages
- ✅ **Offline Message Sync** - Catch-up API for offline users
- ✅ **Push Notifications** - Firebase Cloud Messaging for offline delivery
- ✅ **Production-Ready WebSocket** - Rate limiting, deduplication, presence tracking
- ⏳ **End-to-End Encryption** - Database schema ready, implementation pending
- ⏳ **Frontend Integration** - IndexedDB, optimistic UI, state management pending

---

## 🚀 Backend Features Implemented

### 1. Horizontal Scalability with Redis Adapter

**File:** `src/common/adapters/redis-io.adapter.ts`

The Redis Adapter enables running multiple backend instances behind a load balancer. All instances communicate through Redis Pub/Sub.

**How it works:**
- All WebSocket servers connect to the same Redis instance
- When Server A receives a message, it publishes to Redis
- Redis broadcasts to all servers (A, B, C, etc.)
- Server B can deliver the message to users connected to it

**Configuration:**
```typescript
// In main.ts
const redisIoAdapter = new RedisIoAdapter(app);
await redisIoAdapter.connectToRedis();
app.useWebSocketAdapter(redisIoAdapter);
```

**Benefits:**
- 🔄 Zero downtime deployments
- 📈 Horizontal scaling (add more servers as needed)
- 🌍 Cross-region communication
- 💪 High availability (if one server crashes, others continue)

---

### 2. Read Receipts

**Database Model:**
```prisma
model ReadReceipt {
  id        String   @id @default(uuid())
  messageId String
  userId    String
  readAt    DateTime @default(now())
  message   Message  @relation(...)
  user      User     @relation(...)
}
```

**WebSocket Event:** `MESSAGE_READ`

**Request:**
```json
{
  "messageId": "uuid-of-message"
}
```

**Response (Broadcast to sender):**
```json
{
  "event": "MESSAGE_READ_UPDATE",
  "data": {
    "messageId": "uuid-of-message",
    "userId": "uuid-of-reader",
    "readAt": "2025-11-06T10:30:00.000Z",
    "timestamp": "2025-11-06T10:30:00.000Z"
  }
}
```

**Service Method:**
```typescript
await messagingService.markMessageAsRead(userId, messageId);
```

---

### 3. Message Editing & Deletion

**Database Fields:**
```prisma
model Message {
  isEdited     Boolean       @default(false)
  editedAt     DateTime?
  deletedAt    DateTime?      // Soft delete
  // ... other fields
}
```

#### Edit Message

**WebSocket Event:** `EDIT_MESSAGE`

**Request:**
```json
{
  "messageId": "uuid-of-message",
  "content": "Updated message content"
}
```

**Response (Broadcast to both users):**
```json
{
  "event": "MESSAGE_EDITED",
  "data": {
    "id": "uuid-of-message",
    "content": "Updated message content",
    "isEdited": true,
    "editedAt": "2025-11-06T10:30:00.000Z",
    "timestamp": "2025-11-06T10:30:00.000Z"
  }
}
```

#### Delete Message

**WebSocket Event:** `DELETE_MESSAGE`

**Request:**
```json
{
  "messageId": "uuid-of-message"
}
```

**Response (Broadcast to both users):**
```json
{
  "event": "MESSAGE_DELETED",
  "data": {
    "id": "uuid-of-message",
    "deletedAt": "2025-11-06T10:30:00.000Z",
    "content": "This message has been deleted",
    "timestamp": "2025-11-06T10:30:00.000Z"
  }
}
```

**Permission Logic:**
- ✅ Only the message sender can edit or delete
- ❌ Cannot edit already deleted messages
- ✅ Deleted messages are soft-deleted (kept in database)

---

### 4. Offline Message Sync API

**Endpoint:** `GET /messages/sync`

**Query Parameters:**
- `lastMessageTimestamp` - ISO timestamp of the last message the client has

**Request:**
```http
GET /messages/sync?lastMessageTimestamp=2025-11-06T10:00:00.000Z
Authorization: Bearer <jwt-token>
```

**Response:**
```json
[
  {
    "id": "msg-uuid-1",
    "content": "Hello!",
    "senderId": "user-uuid-1",
    "receiverId": "user-uuid-2",
    "timestamp": "2025-11-06T10:05:00.000Z",
    "isEdited": false,
    "deletedAt": null,
    "sender": {
      "id": "user-uuid-1",
      "name": "John Doe",
      "email": "john@example.com"
    },
    "receiver": {
      "id": "user-uuid-2",
      "name": "Jane Smith",
      "email": "jane@example.com"
    },
    "readReceipts": [
      {
        "userId": "user-uuid-2",
        "readAt": "2025-11-06T10:06:00.000Z"
      }
    ]
  }
]
```

**Use Case:**
1. User A goes offline at 10:00 AM
2. User B sends 5 messages between 10:00-10:30 AM
3. User A comes back online at 10:30 AM
4. Frontend calls `/messages/sync?lastMessageTimestamp=2025-11-06T10:00:00.000Z`
5. Backend returns all 5 messages
6. Frontend displays them and saves to IndexedDB

---

### 5. Firebase Cloud Messaging (FCM) - Push Notifications

**File:** `src/common/services/fcm.service.ts`

**How it works:**
1. When a user sends a message, the gateway checks if the recipient is online
2. If offline (not in Redis `online_users` set), it triggers a push notification
3. FCM sends the notification to the recipient's registered device
4. Notification appears on their phone/browser even when the app is closed

**Device Token Registration:**

**Endpoint:** `POST /users/fcm/register`

**Request:**
```json
{
  "deviceToken": "fcm-device-token-from-firebase-sdk"
}
```

**Response:**
```json
{
  "id": "user-uuid",
  "name": "John Doe",
  "email": "john@example.com",
  "fcmDeviceToken": "fcm-device-token-from-firebase-sdk"
}
```

**Notification Payload:**
```json
{
  "notification": {
    "title": "New message from John Doe",
    "body": "Hello! How are you?"
  },
  "data": {
    "type": "new_message",
    "messageId": "msg-uuid",
    "senderName": "John Doe",
    "clickAction": "/messages"
  }
}
```

**Invalid Token Handling:**
- If FCM returns `INVALID_TOKEN` error, the device token is automatically removed from the database
- User must re-register their device token

---

### 6. Production WebSocket Features

**File:** `src/messaging/fast-chat.gateway.ts`

#### Features:

1. **Rate Limiting** - Max 100 messages/minute per user (configurable)
2. **Message Deduplication** - Prevents duplicate messages on network retries
3. **User Presence Tracking** - Real-time online/offline status via Redis
4. **Typing Indicators** - Shows when users are typing
5. **Connection Management** - Auto-disconnects inactive connections (5min)
6. **Health Checks** - Monitor WebSocket and Redis health

#### WebSocket Event Summary:

| Event | Direction | Purpose |
|-------|-----------|---------|
| `NEW_MESSAGE` | Client → Server | Send a new message |
| `MESSAGE_SENT` | Server → Client | Confirm message delivery |
| `MESSAGE_READ` | Client → Server | Mark message as read |
| `MESSAGE_READ_UPDATE` | Server → Client | Notify sender of read receipt |
| `EDIT_MESSAGE` | Client → Server | Edit an existing message |
| `MESSAGE_EDITED` | Server → Client | Notify both users of edit |
| `DELETE_MESSAGE` | Client → Server | Delete a message |
| `MESSAGE_DELETED` | Server → Client | Notify both users of deletion |
| `TYPING_START` | Client → Server | User started typing |
| `TYPING_STOP` | Client → Server | User stopped typing |
| `USER_TYPING` | Server → Client | Notify recipient of typing |
| `GET_ONLINE_USERS` | Client → Server | Request list of online users |
| `ONLINE_USERS` | Server → Client | List of online users |
| `USER_PRESENCE_UPDATE` | Server → Broadcast | User went online/offline |
| `HEALTH_CHECK` | Client → Server | Check connection health |
| `HEALTH_RESPONSE` | Server → Client | Health status response |
| `ERROR` | Server → Client | Error occurred |
| `FORCE_DISCONNECT` | Server → Client | Server forcing disconnect |
| `RATE_LIMIT_EXCEEDED` | Server → Client | Too many messages |

---

## 🗄️ Database Schema Updates

**Migration:** `add_messaging_features`

### Updated Message Model:
```prisma
model Message {
  id           String        @id @default(uuid())
  content      String
  timestamp    DateTime      @default(now())
  senderId     String
  receiverId   String
  isEdited     Boolean       @default(false)  // NEW
  editedAt     DateTime?                       // NEW
  deletedAt    DateTime?                       // NEW
  isEncrypted  Boolean       @default(false)  // NEW (E2EE ready)
  encryptionKeyId String?                      // NEW (E2EE ready)
  receiver     User          @relation(...)
  sender       User          @relation(...)
  readReceipts ReadReceipt[]                   // NEW
  
  @@index([senderId])
  @@index([receiverId])
  @@index([timestamp])
  @@map("message")
}
```

### New ReadReceipt Model:
```prisma
model ReadReceipt {
  id        String   @id @default(uuid())
  messageId String
  userId    String
  readAt    DateTime @default(now())
  message   Message  @relation(...)
  user      User     @relation(...)
  
  @@unique([messageId, userId])
  @@index([messageId])
  @@index([userId])
  @@map("read_receipt")
}
```

### Updated User Model:
```prisma
model User {
  // ... existing fields
  fcmDeviceToken       String?         // NEW - Firebase Cloud Messaging token
  publicEncryptionKey  String?         // NEW - For E2EE (future use)
  readReceipts         ReadReceipt[]   // NEW
  // ... other relations
}
```

---

## 📡 API Endpoints

### Messaging Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/messages` | ✅ | Send a new message |
| `GET` | `/messages/conversation/:otherUserId` | ✅ | Get conversation history |
| `GET` | `/messages/conversations/all` | ✅ | Get all conversations |
| `GET` | `/messages/sync` | ✅ | Sync missed messages (offline) |

### FCM Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/users/fcm/register` | ✅ | Register device token |
| `POST` | `/users/fcm/unregister` | ✅ | Unregister device token |

---

## 🔧 Firebase Cloud Messaging Setup

### Step 1: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Click **Add Project**
3. Enter project name: `nexus-messaging`
4. Disable Google Analytics (optional)
5. Click **Create Project**

### Step 2: Generate Service Account

1. In Firebase Console, click the ⚙️ icon → **Project Settings**
2. Navigate to **Service Accounts** tab
3. Click **Generate New Private Key**
4. Click **Generate Key** (downloads a JSON file)
5. Keep this file secure - it contains sensitive credentials

### Step 3: Configure Backend

**Option 1: Service Account JSON (Recommended)**

Copy the entire JSON content and set it as an environment variable:

```bash
FCM_SERVICE_ACCOUNT_JSON='{"type":"service_account","project_id":"your-project-id",...}'
```

**Option 2: Individual Credentials**

Extract values from the JSON file:

```bash
FCM_PROJECT_ID=your-firebase-project-id
FCM_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FCM_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com
```

### Step 4: Test FCM Integration

```bash
# Start the backend
npm run start:dev

# Check logs for:
# ✅ Firebase Admin initialized with service account JSON
# 🔔 FCM service ready to send push notifications
```

### Step 5: Frontend Configuration (Pending)

In the frontend, you'll need to:
1. Install Firebase SDK: `npm install firebase`
2. Initialize Firebase with your Web App credentials
3. Request notification permissions
4. Get the FCM device token
5. Send it to the backend via `POST /users/fcm/register`

---

## 🧪 Testing Guide

### Test 1: WebSocket Connection

**Using WebSocket Client (e.g., Postman, Socket.IO Client):**

```javascript
const io = require('socket.io-client');

// Connect to WebSocket
const socket = io('http://localhost:3000/ws', {
  transports: ['websocket'],
  auth: {
    token: 'your-jwt-token'
  }
});

// Listen for connection success
socket.on('CONNECTION_SUCCESS', (data) => {
  console.log('✅ Connected:', data);
});

// Send a message
socket.emit('NEW_MESSAGE', {
  receiverId: 'recipient-user-id',
  content: 'Hello from WebSocket!'
});

// Listen for message sent confirmation
socket.on('MESSAGE_SENT', (data) => {
  console.log('✅ Message sent:', data);
});
```

### Test 2: Read Receipts

```javascript
// Send a read receipt
socket.emit('MESSAGE_READ', {
  messageId: 'message-uuid'
});

// Listen for read receipt updates (as sender)
socket.on('MESSAGE_READ_UPDATE', (data) => {
  console.log('✅ Message read by:', data.userId, 'at', data.readAt);
});
```

### Test 3: Message Editing

```javascript
// Edit a message
socket.emit('EDIT_MESSAGE', {
  messageId: 'message-uuid',
  content: 'Updated content here'
});

// Listen for edit confirmation
socket.on('MESSAGE_EDITED', (data) => {
  console.log('✅ Message edited:', data);
});
```

### Test 4: Message Deletion

```javascript
// Delete a message
socket.emit('DELETE_MESSAGE', {
  messageId: 'message-uuid'
});

// Listen for deletion confirmation
socket.on('MESSAGE_DELETED', (data) => {
  console.log('✅ Message deleted:', data);
});
```

### Test 5: Offline Message Sync

```bash
# Using cURL
curl -X GET "http://localhost:3000/messages/sync?lastMessageTimestamp=2025-11-06T10:00:00.000Z" \
  -H "Authorization: Bearer your-jwt-token"
```

### Test 6: FCM Device Token Registration

```bash
# Register device token
curl -X POST "http://localhost:3000/users/fcm/register" \
  -H "Authorization: Bearer your-jwt-token" \
  -H "Content-Type: application/json" \
  -d '{"deviceToken":"fcm-device-token-here"}'
```

### Test 7: Push Notification Trigger

1. Register FCM token for User A
2. User A goes offline (close WebSocket connection)
3. User B sends a message to User A
4. Check logs for: `📱 Recipient {userId} is offline, sending push notification`
5. User A should receive a push notification

---

## 📱 Frontend Implementation TODO

### Priority 1: Core Functionality

#### 1. WebSocket Event Handlers (ChatPage.tsx)

```typescript
// In ChatPage.tsx useEffect

// Message Sent Confirmation
improvedWebSocketService.on('MESSAGE_SENT', (data) => {
  const { messageId, dbMessageId, timestamp } = data;
  // Update message status from 'sending' to 'sent'
  setMessages(prev => prev.map(msg => 
    msg.tempId === messageId 
      ? { ...msg, id: dbMessageId, status: 'sent', timestamp }
      : msg
  ));
});

// Read Receipt Update
improvedWebSocketService.on('MESSAGE_READ_UPDATE', (data) => {
  const { messageId, userId, readAt } = data;
  // Mark message as read
  setMessages(prev => prev.map(msg =>
    msg.id === messageId
      ? { ...msg, status: 'read', readAt }
      : msg
  ));
});

// Message Edited
improvedWebSocketService.on('MESSAGE_EDITED', (data) => {
  const { id, content, isEdited, editedAt } = data;
  // Update message content
  setMessages(prev => prev.map(msg =>
    msg.id === id
      ? { ...msg, content, isEdited, editedAt }
      : msg
  ));
});

// Message Deleted
improvedWebSocketService.on('MESSAGE_DELETED', (data) => {
  const { id, deletedAt, content } = data;
  // Mark message as deleted
  setMessages(prev => prev.map(msg =>
    msg.id === id
      ? { ...msg, content, deletedAt, isDeleted: true }
      : msg
  ));
});

// User Presence Update
improvedWebSocketService.on('USER_PRESENCE_UPDATE', (data) => {
  const { userId, status, lastSeen } = data;
  setOnlineUsers(prev => {
    const updated = new Set(prev);
    if (status === 'online') {
      updated.add(userId);
    } else {
      updated.delete(userId);
    }
    return updated;
  });
});

// Error Handling
improvedWebSocketService.on('ERROR', (data) => {
  const { message, code, timestamp } = data;
  // Display user-friendly error
  setError(message);
  console.error('WebSocket Error:', code, message);
});
```

#### 2. IndexedDB Persistence

```bash
# Install Dexie.js
cd frontend
npm install dexie
```

```typescript
// Create database schema
import Dexie, { Table } from 'dexie';

interface Message {
  id: string;
  content: string;
  senderId: string;
  receiverId: string;
  timestamp: string;
  status: 'sending' | 'sent' | 'delivered' | 'read';
  isEdited: boolean;
  deletedAt?: string;
}

interface Conversation {
  id: string;
  otherUserId: string;
  lastMessage: Message;
  unreadCount: number;
}

class MessagingDatabase extends Dexie {
  messages!: Table<Message>;
  conversations!: Table<Conversation>;

  constructor() {
    super('NexusMessaging');
    this.version(1).stores({
      messages: 'id, senderId, receiverId, timestamp',
      conversations: 'id, otherUserId, lastMessage.timestamp',
    });
  }
}

const db = new MessagingDatabase();

// Save message to IndexedDB
async function saveMessage(message: Message) {
  await db.messages.put(message);
}

// Load messages from IndexedDB
async function loadMessages(conversationId: string) {
  return await db.messages
    .where('conversationId')
    .equals(conversationId)
    .sortBy('timestamp');
}
```

#### 3. Optimistic UI Updates

```typescript
// When sending a message
const sendMessage = async (content: string) => {
  const tempId = `temp_${Date.now()}_${Math.random()}`;
  
  // Optimistically add to UI
  const optimisticMessage = {
    tempId,
    content,
    senderId: currentUser.id,
    receiverId: selectedConversation.otherUser.id,
    timestamp: new Date().toISOString(),
    status: 'sending' as const,
    isEdited: false,
  };
  
  setMessages(prev => [...prev, optimisticMessage]);
  
  // Send via WebSocket
  improvedWebSocketService.sendChatMessage({
    content,
    senderId: currentUser.id,
    receiverId: selectedConversation.otherUser.id,
    tempId, // Include tempId for correlation
  });
};
```

#### 4. State Management with Zustand

```bash
# Install Zustand
npm install zustand
```

```typescript
// messaging.store.ts
import create from 'zustand';

interface Message {
  id: string;
  content: string;
  senderId: string;
  receiverId: string;
  timestamp: string;
  status: 'sending' | 'sent' | 'delivered' | 'read';
}

interface MessagingStore {
  messages: Map<string, Message[]>; // conversationId -> messages
  onlineUsers: Set<string>;
  addMessage: (conversationId: string, message: Message) => void;
  updateMessageStatus: (messageId: string, status: Message['status']) => void;
  setUserOnline: (userId: string, isOnline: boolean) => void;
}

const useMessagingStore = create<MessagingStore>((set) => ({
  messages: new Map(),
  onlineUsers: new Set(),
  
  addMessage: (conversationId, message) =>
    set((state) => {
      const conversationMessages = state.messages.get(conversationId) || [];
      const updated = new Map(state.messages);
      updated.set(conversationId, [...conversationMessages, message]);
      return { messages: updated };
    }),
    
  updateMessageStatus: (messageId, status) =>
    set((state) => {
      const updated = new Map(state.messages);
      for (const [convId, msgs] of updated.entries()) {
        const msgIndex = msgs.findIndex(m => m.id === messageId);
        if (msgIndex !== -1) {
          const updatedMsgs = [...msgs];
          updatedMsgs[msgIndex] = { ...updatedMsgs[msgIndex], status };
          updated.set(convId, updatedMsgs);
          break;
        }
      }
      return { messages: updated };
    }),
    
  setUserOnline: (userId, isOnline) =>
    set((state) => {
      const updated = new Set(state.onlineUsers);
      isOnline ? updated.add(userId) : updated.delete(userId);
      return { onlineUsers: updated };
    }),
}));

export default useMessagingStore;
```

#### 5. Infinite Scroll & Virtualization

```bash
# Install @tanstack/react-virtual
npm install @tanstack/react-virtual
```

```typescript
import { useVirtualizer } from '@tanstack/react-virtual';

function MessageList({ messages }: { messages: Message[] }) {
  const parentRef = React.useRef<HTMLDivElement>(null);
  
  const virtualizer = useVirtualizer({
    count: messages.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 80, // Estimated message height
    overscan: 5, // Render 5 extra items for smooth scrolling
  });
  
  return (
    <div ref={parentRef} style={{ height: '600px', overflow: 'auto' }}>
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          position: 'relative',
        }}
      >
        {virtualizer.getVirtualItems().map((virtualItem) => {
          const message = messages[virtualItem.index];
          return (
            <div
              key={virtualItem.key}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: `${virtualItem.size}px`,
                transform: `translateY(${virtualItem.start}px)`,
              }}
            >
              <MessageBubble message={message} />
            </div>
          );
        })}
      </div>
    </div>
  );
}
```

#### 6. Firebase Cloud Messaging Integration

```bash
# Install Firebase
npm install firebase
```

```typescript
// firebase-config.ts
import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';

const firebaseConfig = {
  apiKey: "your-api-key",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "sender-id",
  appId: "app-id"
};

const app = initializeApp(firebaseConfig);
const messaging = getMessaging(app);

// Request notification permissions
export async function requestNotificationPermission() {
  const permission = await Notification.requestPermission();
  
  if (permission === 'granted') {
    const token = await getToken(messaging, {
      vapidKey: 'your-vapid-key'
    });
    
    // Send token to backend
    await fetch('/users/fcm/register', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${jwtToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ deviceToken: token })
    });
    
    return token;
  }
  
  throw new Error('Notification permission denied');
}

// Handle foreground messages
onMessage(messaging, (payload) => {
  console.log('Foreground message received:', payload);
  
  // Display notification in-app
  showNotification(payload.notification.title, payload.notification.body);
});
```

#### 7. Message Status Indicators UI

```typescript
import { CheckIcon, CheckCircleIcon, ClockIcon, ErrorIcon } from '@mui/icons-material';

function MessageStatus({ status }: { status: 'sending' | 'sent' | 'delivered' | 'read' }) {
  switch (status) {
    case 'sending':
      return <ClockIcon sx={{ fontSize: 14, color: 'text.disabled' }} />;
    case 'sent':
      return <CheckIcon sx={{ fontSize: 14, color: 'text.disabled' }} />;
    case 'delivered':
      return <CheckCircleIcon sx={{ fontSize: 14, color: 'primary.main' }} />;
    case 'read':
      return <CheckCircleIcon sx={{ fontSize: 14, color: 'success.main' }} />;
    default:
      return <ErrorIcon sx={{ fontSize: 14, color: 'error.main' }} />;
  }
}

// Usage in message bubble
<Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
  <Typography>{message.content}</Typography>
  <MessageStatus status={message.status} />
</Box>
```

---

## ⚙️ Environment Configuration

### Backend (.env)

```bash
# Redis (Required for WebSocket scalability)
REDIS_URL=redis://localhost:6379

# Firebase Cloud Messaging (Optional for push notifications)
FCM_SERVICE_ACCOUNT_JSON='{"type":"service_account","project_id":"..."}'
# OR
FCM_PROJECT_ID=your-project-id
FCM_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FCM_CLIENT_EMAIL=firebase-adminsdk@your-project.iam.gserviceaccount.com

# WebSocket Rate Limiting
RATE_LIMIT_MESSAGES_PER_MINUTE=100

# CORS
FRONTEND_URL=http://localhost:3001
```

### Frontend (.env)

```bash
# Firebase Configuration
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=sender-id
VITE_FIREBASE_APP_ID=app-id
VITE_FIREBASE_VAPID_KEY=your-vapid-key

# Backend URL
VITE_API_URL=http://localhost:3000
VITE_WS_URL=http://localhost:3000/ws
```

---

## 📊 Testing Checklist

### Backend Tests

- [ ] **Redis Adapter**
  - [ ] Start two backend instances
  - [ ] Connect users to different instances
  - [ ] Verify messages are delivered across instances
  - [ ] Check Redis Pub/Sub activity

- [ ] **Read Receipts**
  - [ ] Send a message
  - [ ] Recipient marks it as read
  - [ ] Sender receives `MESSAGE_READ_UPDATE` event
  - [ ] Read receipt saved in database

- [ ] **Message Editing**
  - [ ] Send a message
  - [ ] Edit the message
  - [ ] Verify both users see the updated content
  - [ ] Check `isEdited` flag is set

- [ ] **Message Deletion**
  - [ ] Send a message
  - [ ] Delete the message
  - [ ] Verify it's soft-deleted (not removed from DB)
  - [ ] Content changed to "This message has been deleted"

- [ ] **Offline Sync**
  - [ ] User A goes offline
  - [ ] User B sends messages
  - [ ] User A comes back online
  - [ ] Call `/messages/sync` with last known timestamp
  - [ ] Verify all missed messages are returned

- [ ] **Push Notifications**
  - [ ] Register FCM token for User A
  - [ ] User A goes offline
  - [ ] User B sends message to User A
  - [ ] Verify push notification is sent
  - [ ] Check logs for FCM activity

### Frontend Tests (After Implementation)

- [ ] **WebSocket Events**
  - [ ] Verify all event handlers are registered
  - [ ] Test message sending with optimistic UI
  - [ ] Test message editing in UI
  - [ ] Test message deletion in UI
  - [ ] Test read receipts display

- [ ] **IndexedDB**
  - [ ] Send messages and verify they're saved
  - [ ] Refresh page and verify messages persist
  - [ ] Test offline mode (messages load from IndexedDB)

- [ ] **State Management**
  - [ ] Verify Zustand store updates correctly
  - [ ] Test cross-component state synchronization

- [ ] **Infinite Scroll**
  - [ ] Load 100+ messages in a conversation
  - [ ] Verify smooth scrolling
  - [ ] Check that only visible messages are rendered

- [ ] **FCM**
  - [ ] Request notification permissions
  - [ ] Verify device token is registered
  - [ ] Receive a push notification
  - [ ] Click notification and verify navigation

---

## 🎉 Summary

### ✅ Backend Complete

1. **Horizontal Scalability** - Redis Adapter for multi-server deployment
2. **Read Receipts** - Track and display when messages are read
3. **Message Editing** - Update sent messages with edit history
4. **Message Deletion** - Soft-delete messages with preservation
5. **Offline Sync API** - Catch-up endpoint for offline users
6. **Firebase Cloud Messaging** - Push notifications for offline delivery
7. **Production WebSocket** - Rate limiting, deduplication, health checks

### ⏳ Frontend Pending

1. **WebSocket Event Handlers** - Handle all new backend events
2. **IndexedDB Persistence** - Offline message storage
3. **Optimistic UI** - Instant feedback for user actions
4. **State Management** - Zustand for centralized messaging state
5. **Infinite Scroll** - Virtualized rendering for performance
6. **FCM Integration** - Push notification registration and handling
7. **Message Status UI** - Visual indicators for message states

### 🚀 Next Steps

1. **Frontend Implementation** - Follow the Frontend Implementation TODO section
2. **End-to-End Encryption** - Implement E2EE for message content
3. **Testing** - Comprehensive integration testing
4. **Performance Optimization** - Load testing and optimization
5. **Documentation** - User guide and API documentation

---

**Last Updated:** November 6, 2025  
**Status:** ✅ Backend Production-Ready | ⏳ Frontend Integration Required  
**Contributors:** GitHub Copilot, Backend Team

