# Frontend Integration Guide - ChatPage.tsx

## Overview
This document provides step-by-step instructions for integrating the new messaging features into ChatPage.tsx.

## Prerequisites
✅ All backend features implemented and running
✅ All frontend dependencies installed (dexie, zustand, firebase, @tanstack/react-virtual)
✅ Database schema updated with read receipts, message editing, deletion fields
✅ IndexedDB database created (messaging.db.ts)
✅ Zustand store created (messaging.store.ts)
✅ Firebase configuration created (firebase-config.ts)
✅ MessageStatus component created

## Architecture Changes

### Before
- Messages stored in React state only
- No persistence (lost on refresh)
- No optimistic UI updates
- No read receipts
- No message editing/deletion
- No offline support

### After
- Messages stored in Zustand store + IndexedDB
- Full persistence (survives refresh)
- Optimistic UI updates with tempId
- Read receipts with visual indicators
- Message editing and deletion
- Offline message sync
- Push notifications via FCM

## Step 1: Import Dependencies

Add these imports to the top of ChatPage.tsx:

```typescript
import { useMessagingStore } from '../store/messaging.store';
import { messagingDB } from '../db/messaging.db';
import { initializeFCM } from '../config/firebase-config';
import MessageStatus from '../components/MessageStatus';
```

## Step 2: Replace State with Zustand Store

### Current State (to be removed)
```typescript
const [messages, setMessages] = useState<Message[]>([]);
const [conversations, setConversations] = useState<Conversation[]>([]);
const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
```

### New Zustand Store Selectors (add these)
```typescript
const {
  messages: storeMessages,
  conversations,
  onlineUsers,
  typingUsers,
  setCurrentUser,
  setSelectedConversation,
  addMessage,
  updateMessage,
  updateMessageByTempId,
  updateMessageStatus,
  editMessage,
  deleteMessage,
  markMessageAsRead,
  loadMessagesForConversation,
  loadConversations,
  setUserOnline,
  setUserOffline,
  setUserTyping,
  setUserStoppedTyping,
  syncMessages,
  addConversation,
  updateConversation,
  clearUnreadCount,
} = useMessagingStore();

// Get messages for selected conversation
const messages = selectedConversation
  ? storeMessages.get(selectedConversation.id) || []
  : [];
```

## Step 3: Initialize FCM on Mount

Add this useEffect after the WebSocket connection effect:

```typescript
// Initialize FCM for push notifications
useEffect(() => {
  if (!user?.id || !token) return;

  const setupFCM = async () => {
    try {
      await initializeFCM(token);
      console.log('✅ FCM initialized');
    } catch (error) {
      console.error('❌ Error initializing FCM:', error);
    }
  };

  setupFCM();
}, [user?.id, token]);
```

## Step 4: Load Conversations from IndexedDB on Mount

Add this useEffect to load conversations:

```typescript
// Load conversations from IndexedDB on mount
useEffect(() => {
  if (!user?.id) return;

  const loadData = async () => {
    try {
      setLoading(true);
      setCurrentUser(user.id);

      // Load conversations from IndexedDB
      await loadConversations();

      // Load conversations from API
      const response = await apiService.messages.getConversations();
      const apiConversations = response.data;

      // Merge with IndexedDB data
      for (const conv of apiConversations) {
        await addConversation({
          id: `${user.id}-${conv.otherUser.id}`,
          otherUser: conv.otherUser,
          lastMessage: conv.lastMessage,
          unreadCount: conv.unreadCount,
          updatedAt: new Date().toISOString(),
        });
      }

      // Sync messages from server
      await syncMessages(user.id, token!);
    } catch (error) {
      console.error('❌ Error loading data:', error);
      setError('Failed to load conversations');
    } finally {
      setLoading(false);
    }
  };

  loadData();
}, [user?.id, token]);
```

## Step 5: Add New WebSocket Event Handlers

Replace the existing WebSocket effect with this enhanced version:

```typescript
useEffect(() => {
  if (!user?.id || !token) return;

  const initializeWebSocket = async () => {
    try {
      await improvedWebSocketService.connect(user.id, token);

      // 1. NEW_MESSAGE - Existing event (already implemented)
      improvedWebSocketService.on('NEW_MESSAGE', async (message: WebSocketMessage) => {
        console.log('📨 New message received:', message);
        const newMessage = message.data as Message;

        // Add to store and IndexedDB
        await addMessage({
          ...newMessage,
          status: 'delivered',
        });

        // Update conversation
        const conversationId =
          newMessage.receiverId === user.id
            ? `${user.id}-${newMessage.senderId}`
            : `${user.id}-${newMessage.receiverId}`;

        await updateConversation(conversationId, {
          lastMessage: newMessage,
          updatedAt: newMessage.timestamp,
        });
      });

      // 2. MESSAGE_SENT - Confirms message was sent successfully
      improvedWebSocketService.on('MESSAGE_SENT', async (message: WebSocketMessage) => {
        console.log('✅ Message sent confirmation:', message);
        const data = message.data as {
          tempId: string;
          messageId: string;
          timestamp: string;
        };

        // Update message from 'sending' to 'sent'
        await updateMessageByTempId(data.tempId, {
          id: data.messageId,
          status: 'sent',
          timestamp: data.timestamp,
        });
      });

      // 3. MESSAGE_READ_UPDATE - Someone read your message
      improvedWebSocketService.on('MESSAGE_READ_UPDATE', async (message: WebSocketMessage) => {
        console.log('👁️ Message read update:', message);
        const data = message.data as {
          messageId: string;
          readBy: string;
          readAt: string;
        };

        // Update message status to 'read'
        await markMessageAsRead(data.messageId, data.readAt);
      });

      // 4. MESSAGE_EDITED - Someone edited a message
      improvedWebSocketService.on('MESSAGE_EDITED', async (message: WebSocketMessage) => {
        console.log('✏️ Message edited:', message);
        const data = message.data as {
          messageId: string;
          newContent: string;
          editedAt: string;
        };

        // Update message content and mark as edited
        await editMessage(data.messageId, data.newContent, data.editedAt);
      });

      // 5. MESSAGE_DELETED - Someone deleted a message
      improvedWebSocketService.on('MESSAGE_DELETED', async (message: WebSocketMessage) => {
        console.log('🗑️ Message deleted:', message);
        const data = message.data as {
          messageId: string;
          deletedAt: string;
        };

        // Update message to show it's deleted
        await deleteMessage(data.messageId, data.deletedAt);
      });

      // 6. USER_PRESENCE_UPDATE - User went online/offline
      improvedWebSocketService.on('USER_PRESENCE_UPDATE', async (message: WebSocketMessage) => {
        console.log('👤 User presence update:', message);
        const data = message.data as {
          userId: string;
          isOnline: boolean;
          lastSeen?: string;
        };

        if (data.isOnline) {
          setUserOnline(data.userId);
        } else {
          setUserOffline(data.userId, data.lastSeen);
        }
      });

      // 7. TYPING_START - User started typing
      improvedWebSocketService.on('TYPING_START', (message: WebSocketMessage) => {
        console.log('⌨️ User started typing:', message);
        const data = message.data as { userId: string };
        setUserTyping(data.userId);
      });

      // 8. TYPING_STOP - User stopped typing
      improvedWebSocketService.on('TYPING_STOP', (message: WebSocketMessage) => {
        console.log('⌨️ User stopped typing:', message);
        const data = message.data as { userId: string };
        setUserStoppedTyping(data.userId);
      });

      // 9. ERROR - WebSocket error
      improvedWebSocketService.on('ERROR', (message: WebSocketMessage) => {
        console.error('❌ WebSocket error:', message);
        const data = message.data as { code: string; message: string };
        setError(data.message || 'An error occurred');
      });

      // 10. FORCE_DISCONNECT - Server forcing disconnect
      improvedWebSocketService.on('FORCE_DISCONNECT', (message: WebSocketMessage) => {
        console.warn('⚠️ Forced disconnect:', message);
        const data = message.data as { reason: string };
        setError(`Disconnected: ${data.reason}`);
        improvedWebSocketService.disconnect();
      });

      // Connection status updates
      improvedWebSocketService.addStatusListener((status) => {
        setConnectionStatus(status);
      });

      console.log('✅ WebSocket initialized with all event handlers');
    } catch (error) {
      console.error('❌ Failed to initialize WebSocket:', error);
      setError('WebSocket connection failed');
    }
  };

  initializeWebSocket();

  return () => {
    improvedWebSocketService.disconnect();
  };
}, [user?.id, token]);
```

## Step 6: Update sendMessage with Optimistic UI

Replace the existing sendMessage function:

```typescript
const handleSendMessage = async (content: string) => {
  if (!content.trim() || !selectedConversation || !user) return;

  try {
    // Generate temporary ID for optimistic update
    const tempId = `temp_${Date.now()}_${Math.random()}`;
    const optimisticMessage: Message = {
      id: tempId,
      tempId,
      content: content.trim(),
      senderId: user.id,
      receiverId: selectedConversation.otherUser.id,
      timestamp: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      status: 'sending',
    };

    // Add message to UI immediately (optimistic)
    await addMessage(optimisticMessage);

    // Send via WebSocket
    improvedWebSocketService.send('NEW_MESSAGE', {
      tempId,
      receiverId: selectedConversation.otherUser.id,
      content: content.trim(),
    });

    // Clear input
    // (Implement based on your input handling)
  } catch (error) {
    console.error('❌ Error sending message:', error);
    
    // Update message status to 'failed'
    await updateMessage(tempId, { status: 'failed' });
    setError('Failed to send message');
  }
};
```

## Step 7: Add Message Editing Handler

Add this new function:

```typescript
const handleEditMessage = async (messageId: string, newContent: string) => {
  try {
    // Optimistically update UI
    const message = messages.find((m) => m.id === messageId);
    if (!message || message.senderId !== user?.id) {
      setError('You can only edit your own messages');
      return;
    }

    await editMessage(messageId, newContent, new Date().toISOString());

    // Send edit event via WebSocket
    improvedWebSocketService.send('EDIT_MESSAGE', {
      messageId,
      newContent,
    });
  } catch (error) {
    console.error('❌ Error editing message:', error);
    setError('Failed to edit message');
  }
};
```

## Step 8: Add Message Deletion Handler

Add this new function:

```typescript
const handleDeleteMessage = async (messageId: string) => {
  try {
    // Check if user owns the message
    const message = messages.find((m) => m.id === messageId);
    if (!message || message.senderId !== user?.id) {
      setError('You can only delete your own messages');
      return;
    }

    // Optimistically update UI
    await deleteMessage(messageId, new Date().toISOString());

    // Send delete event via WebSocket
    improvedWebSocketService.send('DELETE_MESSAGE', {
      messageId,
    });
  } catch (error) {
    console.error('❌ Error deleting message:', error);
    setError('Failed to delete message');
  }
};
```

## Step 9: Add Read Receipt Handler

Add this to mark messages as read when conversation is opened:

```typescript
// Mark messages as read when conversation is opened
useEffect(() => {
  if (!selectedConversation || !user?.id) return;

  const markConversationAsRead = async () => {
    const conversationMessages = messages;
    const unreadMessages = conversationMessages.filter(
      (msg) => !msg.isRead && msg.receiverId === user.id
    );

    for (const message of unreadMessages) {
      // Mark as read locally
      await markMessageAsRead(message.id, new Date().toISOString());

      // Send read receipt via WebSocket
      improvedWebSocketService.send('MESSAGE_READ', {
        messageId: message.id,
      });
    }

    // Clear unread count
    await clearUnreadCount(selectedConversation.id);
  };

  markConversationAsRead();
}, [selectedConversation?.id, user?.id]);
```

## Step 10: Update Message Rendering with Status Indicators

In your message rendering code, add the MessageStatus component:

```tsx
{messages.map((message) => (
  <Box key={message.id} sx={{ mb: 1 }}>
    <Box
      sx={{
        display: 'flex',
        justifyContent: message.senderId === user?.id ? 'flex-end' : 'flex-start',
      }}
    >
      <Box
        sx={{
          maxWidth: '70%',
          backgroundColor:
            message.senderId === user?.id ? 'primary.main' : 'grey.200',
          color: message.senderId === user?.id ? 'white' : 'text.primary',
          borderRadius: 2,
          px: 2,
          py: 1,
          position: 'relative',
        }}
      >
        {/* Message content */}
        <Typography variant="body1">
          {message.content}
        </Typography>

        {/* Edited indicator */}
        {message.isEdited && (
          <Typography variant="caption" sx={{ fontStyle: 'italic', opacity: 0.7 }}>
            (edited)
          </Typography>
        )}

        {/* Timestamp and status */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
          <Typography variant="caption" sx={{ opacity: 0.7 }}>
            {new Date(message.timestamp).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </Typography>

          {/* Show status only for sent messages */}
          {message.senderId === user?.id && (
            <MessageStatus
              status={message.status}
              timestamp={message.readAt}
            />
          )}
        </Box>
      </Box>
    </Box>
  </Box>
))}
```

## Step 11: Add Connection Status Indicator

Add this to the top of the chat interface:

```tsx
<Box sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
  <Chip
    label={
      connectionStatus === 'connected'
        ? 'Connected'
        : connectionStatus === 'connecting'
        ? 'Connecting...'
        : connectionStatus === 'reconnecting'
        ? 'Reconnecting...'
        : 'Disconnected'
    }
    color={
      connectionStatus === 'connected'
        ? 'success'
        : connectionStatus === 'connecting' || connectionStatus === 'reconnecting'
        ? 'warning'
        : 'error'
    }
    size="small"
  />

  {selectedConversation && (
    <Chip
      label={
        onlineUsers.has(selectedConversation.otherUser.id)
          ? 'Online'
          : 'Offline'
      }
      color={
        onlineUsers.has(selectedConversation.otherUser.id)
          ? 'success'
          : 'default'
      }
      size="small"
      variant="outlined"
    />
  )}
</Box>
```

## Step 12: Add Typing Indicator

Add this where you display messages:

```tsx
{typingUsers.has(selectedConversation?.otherUser.id) && (
  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
    <Avatar
      src={selectedConversation?.otherUser.profilePicture}
      sx={{ width: 24, height: 24 }}
    />
    <Typography variant="caption" sx={{ fontStyle: 'italic', color: 'text.secondary' }}>
      {selectedConversation?.otherUser.name} is typing...
    </Typography>
  </Box>
)}
```

## Summary of Changes

### Files Modified
1. ✅ `frontend/src/pages/ChatPage.tsx` - Major refactor with Zustand integration
2. ✅ `frontend/src/services/websocket.improved.ts` - Added new event types
3. ✅ Created `frontend/src/db/messaging.db.ts` - IndexedDB persistence
4. ✅ Created `frontend/src/store/messaging.store.ts` - Zustand state management
5. ✅ Created `frontend/src/config/firebase-config.ts` - FCM integration
6. ✅ Created `frontend/src/components/MessageStatus.tsx` - Status indicators
7. ✅ Created `frontend/public/firebase-messaging-sw.js` - Background notifications

### New Features Enabled
✅ Offline persistence (IndexedDB)
✅ Optimistic UI updates
✅ Read receipts with visual indicators
✅ Message editing
✅ Message deletion
✅ Real-time presence (online/offline)
✅ Typing indicators
✅ Push notifications (FCM)
✅ Message status tracking (sending/sent/delivered/read)
✅ Connection status indicator
✅ Error handling

### Testing Checklist
- [ ] Send a message (verify optimistic UI)
- [ ] Verify MESSAGE_SENT confirmation
- [ ] Verify read receipts (double blue checkmark)
- [ ] Edit a message (verify "(edited)" label)
- [ ] Delete a message (verify deletion)
- [ ] Refresh page (verify messages persist)
- [ ] Go offline and receive messages (verify sync)
- [ ] Test push notifications
- [ ] Test typing indicators
- [ ] Test presence updates (online/offline)

## Next Steps
1. Apply these changes to ChatPage.tsx
2. Test each feature individually
3. Implement infinite scroll (use @tanstack/react-virtual)
4. Add E2E encryption (optional, advanced feature)
5. Run full integration tests

## Environment Variables Required

Add to `frontend/.env`:

```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_VAPID_KEY=your_vapid_key
```

Also update `firebase-messaging-sw.js` with your actual Firebase config.
