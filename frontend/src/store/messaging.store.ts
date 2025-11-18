import { create } from 'zustand';
import { messagingDB, DBMessage } from '../db/messaging.db';

/**
 * Zustand Store for Messaging State Management
 *
 * Centralizes all messaging state and provides actions for WebSocket events.
 * Integrates with IndexedDB for persistence.
 */

export interface Message {
  id: string;
  content: string;
  senderId: string;
  receiverId: string;
  timestamp: string;
  createdAt: string;
  status: 'sending' | 'sent' | 'delivered' | 'read' | 'failed';
  tempId?: string;
  isEdited?: boolean;
  editedAt?: string;
  deletedAt?: string;
  isRead?: boolean;
  readAt?: string;
}

export interface Conversation {
  id: string;
  otherUser: {
    id: string;
    name: string;
    email: string;
    profilePicture?: string;
  };
  lastMessage?: Message;
  unreadCount: number;
  updatedAt: string;
}

export interface UserPresence {
  userId: string;
  isOnline: boolean;
  lastSeen?: string;
}

interface MessagingState {
  // State
  messages: Map<string, Message[]>; // conversationId -> messages[]
  conversations: Conversation[];
  onlineUsers: Set<string>;
  typingUsers: Set<string>;
  currentUserId: string | null;
  selectedConversationId: string | null;

  // Actions
  setCurrentUser: (userId: string) => void;
  setSelectedConversation: (conversationId: string | null) => void;

  // Message actions
  addMessage: (message: Message) => Promise<void>;
  updateMessage: (
    messageId: string,
    updates: Partial<Message>
  ) => Promise<void>;
  updateMessageByTempId: (
    tempId: string,
    updates: Partial<Message>
  ) => Promise<void>;
  updateMessageStatus: (
    messageId: string,
    status: Message['status']
  ) => Promise<void>;
  editMessage: (
    messageId: string,
    newContent: string,
    editedAt: string
  ) => Promise<void>;
  deleteMessage: (messageId: string, deletedAt: string) => Promise<void>;
  markMessageAsRead: (messageId: string, readAt: string) => Promise<void>;
  loadMessagesForConversation: (conversationId: string) => Promise<void>;

  // Conversation actions
  addConversation: (conversation: Conversation) => Promise<void>;
  updateConversation: (
    conversationId: string,
    updates: Partial<Conversation>
  ) => Promise<void>;
  updateConversationUnreadCount: (
    conversationId: string,
    count: number
  ) => Promise<void>;
  clearUnreadCount: (conversationId: string) => Promise<void>;
  loadConversations: () => Promise<void>;

  // Presence actions
  setUserOnline: (userId: string) => void;
  setUserOffline: (userId: string, lastSeen?: string) => void;
  setUserTyping: (userId: string) => void;
  setUserStoppedTyping: (userId: string) => void;

  // Sync action
  syncMessages: (userId: string, token: string) => Promise<void>;

  // Cleanup
  clearAllData: () => Promise<void>;
}

export const useMessagingStore = create<MessagingState>((set, get) => ({
  // Initial state
  messages: new Map(),
  conversations: [],
  onlineUsers: new Set(),
  typingUsers: new Set(),
  currentUserId: null,
  selectedConversationId: null,

  // Set current user
  setCurrentUser: (userId: string) => {
    set({ currentUserId: userId });
  },

  // Set selected conversation
  setSelectedConversation: (conversationId: string | null) => {
    set({ selectedConversationId: conversationId });
  },

  // Add a new message (optimistic or from server)
  addMessage: async (message: Message) => {
    const conversationId = get().selectedConversationId;
    if (!conversationId) return;

    // Update in-memory state
    set((state) => {
      const conversationMessages = state.messages.get(conversationId) || [];
      const newMessages = new Map(state.messages);
      newMessages.set(conversationId, [...conversationMessages, message]);
      return { messages: newMessages };
    });

    // Save to IndexedDB
    const dbMessage: DBMessage = {
      ...message,
      conversationId,
    };
    await messagingDB.saveMessage(dbMessage);

    // Update conversation
    get().updateConversation(conversationId, {
      lastMessage: message,
      updatedAt: message.timestamp,
    });
  },

  // Update a message
  updateMessage: async (messageId: string, updates: Partial<Message>) => {
    set((state) => {
      const newMessages = new Map(state.messages);
      for (const [conversationId, messages] of newMessages.entries()) {
        const messageIndex = messages.findIndex((m) => m.id === messageId);
        if (messageIndex !== -1) {
          const updatedMessages = [...messages];
          updatedMessages[messageIndex] = {
            ...updatedMessages[messageIndex],
            ...updates,
          };
          newMessages.set(conversationId, updatedMessages);
          break;
        }
      }
      return { messages: newMessages };
    });

    // Update in IndexedDB
    await messagingDB.messages.update(messageId, updates);
  },

  // Update message by tempId (for optimistic updates)
  updateMessageByTempId: async (tempId: string, updates: Partial<Message>) => {
    set((state) => {
      const newMessages = new Map(state.messages);
      for (const [conversationId, messages] of newMessages.entries()) {
        const messageIndex = messages.findIndex((m) => m.tempId === tempId);
        if (messageIndex !== -1) {
          const updatedMessages = [...messages];
          updatedMessages[messageIndex] = {
            ...updatedMessages[messageIndex],
            ...updates,
          };
          newMessages.set(conversationId, updatedMessages);
          break;
        }
      }
      return { messages: newMessages };
    });

    // Update in IndexedDB
    await messagingDB.updateMessageByTempId(tempId, updates);
  },

  // Update message status
  updateMessageStatus: async (messageId: string, status: Message['status']) => {
    await get().updateMessage(messageId, { status });
  },

  // Edit a message
  editMessage: async (
    messageId: string,
    newContent: string,
    editedAt: string
  ) => {
    await get().updateMessage(messageId, {
      content: newContent,
      isEdited: true,
      editedAt,
    });

    await messagingDB.markMessageAsEdited(messageId, newContent, editedAt);
  },

  // Delete a message
  deleteMessage: async (messageId: string, deletedAt: string) => {
    await get().updateMessage(messageId, {
      content: 'This message has been deleted',
      deletedAt,
    });

    await messagingDB.markMessageAsDeleted(messageId, deletedAt);
  },

  // Mark message as read
  markMessageAsRead: async (messageId: string, readAt: string) => {
    await get().updateMessage(messageId, {
      isRead: true,
      readAt,
      status: 'read',
    });

    await messagingDB.markMessageAsRead(messageId, readAt);
  },

  // Load messages for a conversation from IndexedDB
  loadMessagesForConversation: async (conversationId: string) => {
    const messages = await messagingDB.getMessagesForConversation(
      conversationId,
      50
    );
    const formattedMessages: Message[] = messages.map((msg) => ({
      id: msg.id,
      content: msg.content,
      senderId: msg.senderId,
      receiverId: msg.receiverId,
      timestamp: msg.timestamp,
      createdAt: msg.createdAt,
      status: msg.status,
      tempId: msg.tempId,
      isEdited: msg.isEdited,
      editedAt: msg.editedAt,
      deletedAt: msg.deletedAt,
      isRead: msg.isRead,
      readAt: msg.readAt,
    }));

    set((state) => {
      const newMessages = new Map(state.messages);
      newMessages.set(conversationId, formattedMessages);
      return { messages: newMessages };
    });
  },

  // Add a conversation
  addConversation: async (conversation: Conversation) => {
    set((state) => ({
      conversations: [conversation, ...state.conversations],
    }));

    // Save to IndexedDB
    await messagingDB.saveConversation({
      id: conversation.id,
      otherUserId: conversation.otherUser.id,
      otherUserName: conversation.otherUser.name,
      otherUserEmail: conversation.otherUser.email,
      otherUserProfilePicture: conversation.otherUser.profilePicture,
      lastMessageId: conversation.lastMessage?.id,
      lastMessageContent: conversation.lastMessage?.content,
      lastMessageTimestamp: conversation.lastMessage?.timestamp,
      unreadCount: conversation.unreadCount,
      updatedAt: conversation.updatedAt,
    });
  },

  // Update a conversation
  updateConversation: async (
    conversationId: string,
    updates: Partial<Conversation>
  ) => {
    set((state) => ({
      conversations: state.conversations.map((conv) =>
        conv.id === conversationId ? { ...conv, ...updates } : conv
      ),
    }));

    // Update in IndexedDB if needed
    if (updates.lastMessage) {
      await messagingDB.saveConversation({
        id: conversationId,
        otherUserId: '', // Will be filled from existing data
        otherUserName: '',
        otherUserEmail: '',
        lastMessageId: updates.lastMessage.id,
        lastMessageContent: updates.lastMessage.content,
        lastMessageTimestamp: updates.lastMessage.timestamp,
        unreadCount: 0,
        updatedAt: updates.updatedAt || new Date().toISOString(),
      });
    }
  },

  // Update conversation unread count
  updateConversationUnreadCount: async (
    conversationId: string,
    count: number
  ) => {
    set((state) => ({
      conversations: state.conversations.map((conv) =>
        conv.id === conversationId ? { ...conv, unreadCount: count } : conv
      ),
    }));

    await messagingDB.updateConversationUnreadCount(conversationId, count);
  },

  // Clear unread count
  clearUnreadCount: async (conversationId: string) => {
    await get().updateConversationUnreadCount(conversationId, 0);
    await messagingDB.clearUnreadCount(conversationId);
  },

  // Load all conversations from IndexedDB
  loadConversations: async () => {
    const dbConversations = await messagingDB.getAllConversations();
    const conversations: Conversation[] = dbConversations.map((conv) => ({
      id: conv.id,
      otherUser: {
        id: conv.otherUserId,
        name: conv.otherUserName,
        email: conv.otherUserEmail,
        profilePicture: conv.otherUserProfilePicture,
      },
      lastMessage: conv.lastMessageId
        ? {
            id: conv.lastMessageId,
            content: conv.lastMessageContent || '',
            senderId: '',
            receiverId: '',
            timestamp: conv.lastMessageTimestamp || '',
            createdAt: conv.lastMessageTimestamp || '',
            status: 'sent',
          }
        : undefined,
      unreadCount: conv.unreadCount,
      updatedAt: conv.updatedAt,
    }));

    set({ conversations });
  },

  // Set user online
  setUserOnline: (userId: string) => {
    set((state) => ({
      onlineUsers: new Set([...state.onlineUsers, userId]),
    }));

    messagingDB.updateUserPresence(userId, true);
  },

  // Set user offline
  setUserOffline: (userId: string, lastSeen?: string) => {
    set((state) => {
      const newOnlineUsers = new Set(state.onlineUsers);
      newOnlineUsers.delete(userId);
      return { onlineUsers: newOnlineUsers };
    });

    messagingDB.updateUserPresence(userId, false, lastSeen);
  },

  // Set user typing
  setUserTyping: (userId: string) => {
    set((state) => ({
      typingUsers: new Set([...state.typingUsers, userId]),
    }));
  },

  // Set user stopped typing
  setUserStoppedTyping: (userId: string) => {
    set((state) => {
      const newTypingUsers = new Set(state.typingUsers);
      newTypingUsers.delete(userId);
      return { typingUsers: newTypingUsers };
    });
  },

  // Sync messages with server
  syncMessages: async (userId: string, token: string) => {
    try {
      const lastTimestamp = await messagingDB.getLastMessageTimestamp();
      const response = await fetch(
        `http://localhost:3000/messages/sync?lastMessageTimestamp=${lastTimestamp || ''}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to sync messages');
      }

      const data = await response.json();
      const syncedMessages = data.messages as Message[];

      // Save synced messages to IndexedDB directly (not via addMessage which requires selectedConversation)
      for (const message of syncedMessages) {
        const conversationId =
          message.senderId === userId
            ? `${userId}-${message.receiverId}`
            : `${message.receiverId}-${userId}`;

        // Save directly to IndexedDB
        const dbMessage: DBMessage = {
          ...message,
          conversationId,
          status: message.isRead ? 'read' : 'delivered',
        };
        await messagingDB.saveMessage(dbMessage);
      }

      console.log(`✅ Synced ${syncedMessages.length} messages from server`);
    } catch (error) {
      console.error('❌ Error syncing messages:', error);
    }
  },

  // Clear all data
  clearAllData: async () => {
    set({
      messages: new Map(),
      conversations: [],
      onlineUsers: new Set(),
      typingUsers: new Set(),
      currentUserId: null,
      selectedConversationId: null,
    });

    await messagingDB.clearAllData();
  },
}));
