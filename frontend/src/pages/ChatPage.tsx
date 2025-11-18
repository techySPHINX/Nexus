import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Container,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Chip,
  CircularProgress,
  Alert,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  InputAdornment,
} from '@mui/material';
import { motion } from 'framer-motion';
import {
  Chat as ChatIcon,
  Add as AddIcon,
  Search as SearchIcon,
  Close as CloseIcon,
  Notifications as NotificationsIcon,
  NotificationsActive as NotificationsActiveIcon,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { improvedWebSocketService } from '../services/websocket.improved';
import ChatBox from '../components/ChatBox';
import { apiService } from '../services/api';
import type { WebSocketMessage } from '../services/websocket.improved';
import { useMessagingStore } from '../store/messaging.store';
import type { Message } from '../store/messaging.store';
import { initializeFCM } from '../config/firebase-config';

interface Conversation {
  id: string;
  otherUser: {
    id: string;
    name: string;
    email: string;
    profilePicture?: string;
  };
  lastMessage?: Message;
  unreadCount: number;
}

const ChatPage: React.FC = () => {
  const { user, token } = useAuth();

  // Zustand store selectors
  const {
    // messages: storeMessages,
    // conversations: storeConversations,
    onlineUsers,
    typingUsers: storeTypingUsers,
    setCurrentUser,
    // setSelectedConversation: setStoreSelectedConversation,
    addMessage,
    updateMessageByTempId,
    markMessageAsRead,
    editMessage,
    deleteMessage,
    loadConversations: loadStoreConversations,
    setUserOnline,
    setUserOffline,
    setUserTyping,
    setUserStoppedTyping,
    syncMessages,
    addConversation,
    updateConversation,
    clearUnreadCount,
  } = useMessagingStore();

  // Local UI state
  const [selectedConversation, setSelectedConversation] =
    useState<Conversation | null>(null);
  const [loading, setLoading] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<
    'disconnected' | 'connecting' | 'connected' | 'reconnecting'
  >('disconnected');
  const [error, setError] = useState<string | null>(null);
  const [newConversationOpen, setNewConversationOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  interface SearchUser {
    id: string;
    name: string;
    email: string;
    profilePicture?: string;
    role?: string;
    bio?: string;
    location?: string;
  }
  const [searchResults, setSearchResults] = useState<SearchUser[]>([]);
  // Local state for conversations and messages
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  // const [isTyping, setIsTyping] = useState(false); // Not used
  const [searching, setSearching] = useState(false);
  const [unreadMessages, setUnreadMessages] = useState<Set<string>>(new Set());
  const [unreadCounts, setUnreadCounts] = useState<Map<string, number>>(
    new Map()
  );
  const [notifications, setNotifications] = useState<
    Array<{
      id: string;
      type: 'message';
      title: string;
      message: string;
      timestamp: string;
      senderId: string;
      conversationId: string;
    }>
  >([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Get messages for selected conversation from store
  // Removed redeclaration of messages to fix error

  // Get conversations from store
  // const conversations = storeConversations;

  // Get typing users from store
  const typingUsers = storeTypingUsers;

  // Request notification permission
  useEffect(() => {
    if (Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // ===== Initialize FCM for Push Notifications =====
  useEffect(() => {
    if (!user?.id || !token) return;

    const setupFCM = async () => {
      try {
        await initializeFCM(token);
        console.log('✅ FCM initialized');
      } catch (error) {
        console.error('❌ Error initializing FCM:', error);
        // FCM is optional, don't block app
      }
    };

    setupFCM();
  }, [user?.id, token]);

  // ===== Load conversations from IndexedDB and sync with API =====
  useEffect(() => {
    if (!user?.id || !token) return;

    const loadData = async () => {
      try {
        setLoading(true);
        setCurrentUser(user.id);

        // Load conversations from IndexedDB first (fast)
        await loadStoreConversations();

        // Load conversations from API
        const response = await apiService.messages.getAllConversations();
        const apiConversations = response.data;

        // Add conversations to store
        type ApiConversation = {
          conversationId: string;
          otherUser: {
            id: string;
            name: string;
            email: string;
            profile?: { avatarUrl?: string };
          };
          latestMessage?: Message;
        };

        for (const conv of apiConversations as ApiConversation[]) {
          await addConversation({
            id: conv.conversationId,
            otherUser: {
              id: conv.otherUser.id,
              name: conv.otherUser.name,
              email: conv.otherUser.email,
              profilePicture: conv.otherUser.profile?.avatarUrl,
            },
            lastMessage: conv.latestMessage,
            unreadCount: 0,
            updatedAt: new Date().toISOString(),
          });
        }

        // Sync messages from server
        await syncMessages(user.id, token);

        console.log('✅ Data loaded and synced');
      } catch (error) {
        console.error('❌ Error loading data:', error);
        setError('Failed to load conversations');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [user?.id, token]);

  // ===== Send Read Receipts When Conversation Opens  =====
  useEffect(() => {
    if (
      !selectedConversation?.id ||
      !user?.id ||
      connectionStatus !== 'connected'
    )
      return;

    const sendReadReceipts = async () => {
      try {
        // Get messages for this conversation
        const conversationMessages = messages || [];

        // Find unread messages where current user is the receiver
        const unreadMessages = conversationMessages.filter(
          (msg) =>
            msg.receiverId === user.id && !msg.isRead && msg.status !== 'failed' // Only filter out failed messages
        );

        if (unreadMessages.length === 0) return;

        console.log(
          `📬 Marking ${unreadMessages.length} messages as read in conversation ${selectedConversation.id}`
        );

        // Mark each message as read in store
        for (const msg of unreadMessages) {
          markMessageAsRead(selectedConversation.id, msg.id);

          // Send read receipt to backend via WebSocket
          improvedWebSocketService.send('MESSAGE_READ', {
            messageId: msg.id,
            conversationId: selectedConversation.id,
            userId: user.id,
          });
        }

        // Clear unread count for this conversation
        await clearUnreadCount(selectedConversation.id);

        console.log(`✅ Sent ${unreadMessages.length} read receipts`);
      } catch (error) {
        console.error('❌ Error sending read receipts:', error);
      }
    };

    sendReadReceipts();
  }, [
    selectedConversation?.id,
    user?.id,
    connectionStatus,
    messages,
    markMessageAsRead,
    clearUnreadCount,
  ]);

  // Load conversations from API
  const loadConversations = useCallback(async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      const response = await apiService.messages.getAllConversations();
      const apiConversations = response.data;

      // Transform API data to match our interface
      type ApiConversation = {
        conversationId: string;
        otherUser: {
          id: string;
          name: string;
          email: string;
          profile?: { avatarUrl?: string };
        };
        latestMessage?: {
          id: string;
          content: string;
          senderId: string;
          receiverId: string;
          timestamp: string;
          createdAt: string;
        };
      };
      const transformedConversations: Conversation[] = (
        apiConversations as ApiConversation[]
      ).map((conv) => ({
        id: conv.conversationId,
        otherUser: {
          id: conv.otherUser.id,
          name: conv.otherUser.name,
          email: conv.otherUser.email,
          profilePicture: conv.otherUser.profile?.avatarUrl,
        },
        lastMessage: conv.latestMessage
          ? {
              id: conv.latestMessage.id,
              content: conv.latestMessage.content,
              senderId: conv.latestMessage.senderId,
              receiverId: conv.latestMessage.receiverId,
              timestamp: conv.latestMessage.timestamp,
              createdAt: conv.latestMessage.createdAt,
              status: 'sent', // Default to sent if not provided
            }
          : undefined,
        unreadCount:
          (conv as any).unreadCount !== undefined
            ? (conv as any).unreadCount
            : 0, // Implement unread count from API if available
      }));

      // Deduplicate conversations by otherUser.id
      const uniqueConversations = transformedConversations.reduce(
        (acc: Conversation[], current) => {
          const existingIndex = acc.findIndex(
            (conv) => conv.otherUser.id === current.otherUser.id
          );
          if (existingIndex === -1) {
            acc.push(current);
          } else {
            // Keep the conversation with the latest message
            const existing = acc[existingIndex];
            if (current.lastMessage && existing.lastMessage) {
              const currentTime = new Date(
                current.lastMessage.timestamp
              ).getTime();
              const existingTime = new Date(
                existing.lastMessage.timestamp
              ).getTime();
              if (currentTime > existingTime) {
                acc[existingIndex] = current;
              }
            }
          }
          return acc;
        },
        []
      );

      // Calculate unread counts for each conversation
      const conversationsWithUnreadCounts = uniqueConversations.map((conv) => {
        const conversationKey = `${user?.id}-${conv.otherUser.id}`;
        const unreadCount = unreadCounts.get(conversationKey) || 0;

        console.log(
          `📊 Conversation ${conv.otherUser.name}: unreadCount = ${unreadCount}, key = ${conversationKey}`
        );
        console.log(
          `📊 Available keys in unreadCounts:`,
          Array.from(unreadCounts.keys())
        );

        return {
          ...conv,
          unreadCount,
        };
      });

      setConversations(conversationsWithUnreadCounts);

      console.log(
        '📋 Loaded conversations:',
        conversationsWithUnreadCounts.map((c) => ({
          name: c.otherUser.name,
          unreadCount: c.unreadCount,
          lastMessage: c.lastMessage?.content,
        }))
      );

      console.log(
        '📊 Current unreadCounts Map:',
        Array.from(unreadCounts.entries())
      );

      // Initialize unread counts for conversations that might have unread messages
      const initialUnreadCounts = new Map<string, number>();
      conversationsWithUnreadCounts.forEach((conv) => {
        const conversationKey = `${user?.id}-${conv.otherUser.id}`;
        // If we don't have a count for this conversation, initialize it to 0
        if (!unreadCounts.has(conversationKey)) {
          initialUnreadCounts.set(conversationKey, 0);
        }
      });

      if (initialUnreadCounts.size > 0) {
        setUnreadCounts((prev) => {
          const newMap = new Map(prev);
          initialUnreadCounts.forEach((count, key) => {
            if (!newMap.has(key)) {
              newMap.set(key, count);
            }
          });
          return newMap;
        });
      }
    } catch (error) {
      console.error('❌ Error loading conversations:', error);
      setError('Failed to load conversations. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [user?.id, unreadCounts]);

  // Initialize WebSocket connection
  useEffect(() => {
    if (!user?.id || !token) return;

    const initializeWebSocket = async () => {
      try {
        setLoading(true);
        setError(null);

        // Connect to WebSocket with proper URL
        console.log('🔌 Attempting WebSocket connection with:', {
          userId: user.id,
          hasToken: !!token,
          tokenLength: token?.length,
        });
        await improvedWebSocketService.connect(user.id, token);

        // ===== NEW MESSAGE EVENT =====
        improvedWebSocketService.on(
          'NEW_MESSAGE',
          async (message: WebSocketMessage) => {
            console.log('📨 New message received:', message);
            const newMessage = message.data as Message;

            // Add to store
            const conversationId =
              newMessage.receiverId === user.id
                ? `${user.id}-${newMessage.senderId}`
                : `${user.id}-${newMessage.receiverId}`;

            await addMessage({
              ...newMessage,
              status: 'delivered',
            });

            // Update conversation
            await updateConversation(conversationId, {
              lastMessage: newMessage,
              updatedAt: newMessage.timestamp,
            });

            // Show notification for received messages
            if (newMessage.receiverId === user.id) {
              const notification = {
                id: newMessage.id,
                type: 'message' as const,
                title: 'New Message',
                message: newMessage.content,
                timestamp: new Date().toISOString(),
                senderId: newMessage.senderId,
                conversationId,
              };

              setNotifications((prev) => [notification, ...prev.slice(0, 9)]);

              if (Notification.permission === 'granted') {
                new Notification('New Message', {
                  body: newMessage.content,
                  icon: '/favicon.ico',
                });
              }
            }
          }
        );

        // ===== MESSAGE_SENT EVENT =====
        improvedWebSocketService.on(
          'MESSAGE_SENT',
          async (message: WebSocketMessage) => {
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
          }
        );

        // ===== MESSAGE_READ_UPDATE EVENT  =====
        improvedWebSocketService.on(
          'MESSAGE_READ_UPDATE',
          async (message: WebSocketMessage) => {
            console.log('👁️ Message read update:', message);
            const data = message.data as {
              messageId: string;
              readBy: string;
              readAt: string;
            };

            // Update message status to 'read'
            await markMessageAsRead(data.messageId, data.readAt);
          }
        );

        // ===== MESSAGE_EDITED EVENT =====
        improvedWebSocketService.on(
          'MESSAGE_EDITED',
          async (message: WebSocketMessage) => {
            console.log('✏️ Message edited:', message);
            const data = message.data as {
              messageId: string;
              newContent: string;
              editedAt: string;
            };

            // Update message content and mark as edited
            await editMessage(data.messageId, data.newContent, data.editedAt);
          }
        );

        // ===== MESSAGE_DELETED EVENT (Todo #5) =====
        improvedWebSocketService.on(
          'MESSAGE_DELETED',
          async (message: WebSocketMessage) => {
            console.log('🗑️ Message deleted:', message);
            const data = message.data as {
              messageId: string;
              deletedAt: string;
            };

            // Update message to show it's deleted
            await deleteMessage(data.messageId, data.deletedAt);
          }
        );

        // ===== USER_PRESENCE_UPDATE EVENT (Todo #6) =====
        improvedWebSocketService.on(
          'USER_PRESENCE_UPDATE',
          async (message: WebSocketMessage) => {
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
          }
        );

        // ===== TYPING_START EVENT =====
        improvedWebSocketService.on(
          'TYPING_START',
          (message: WebSocketMessage) => {
            console.log('⌨️ User started typing:', message);
            const data = message.data as { userId: string };
            setUserTyping(data.userId);
          }
        );

        // ===== TYPING_STOP EVENT =====
        improvedWebSocketService.on(
          'TYPING_STOP',
          (message: WebSocketMessage) => {
            console.log('⌨️ User stopped typing:', message);
            const data = message.data as { userId: string };
            setUserStoppedTyping(data.userId);
          }
        );

        // ===== ERROR EVENT =====
        improvedWebSocketService.on('ERROR', (message: WebSocketMessage) => {
          console.error('❌ WebSocket error:', message);
          const data = message.data as { code: string; message: string };
          setError(data.message || 'An error occurred');
        });

        // ===== FORCE_DISCONNECT EVENT =====
        improvedWebSocketService.on(
          'FORCE_DISCONNECT',
          (message: WebSocketMessage) => {
            console.warn('⚠️ Forced disconnect:', message);
            const data = message.data as { reason: string };
            setError(`Disconnected: ${data.reason}`);
            improvedWebSocketService.disconnect();
          }
        );

        improvedWebSocketService.on('CONNECTION_SUCCESS', () => {
          console.log('✅ WebSocket connected successfully');
          setConnectionStatus('connected');
        });

        improvedWebSocketService.on('CONNECTION_ERROR', () => {
          console.error('❌ WebSocket connection error');
          setError('Connection error. Please try again.');
          setConnectionStatus('disconnected');
        });

        // Set up connection status listener
        improvedWebSocketService.addStatusListener((status) => {
          setConnectionStatus(status);
        });

        // Load conversations (mock data for now)
        loadConversations();
      } catch (error) {
        console.error('❌ Failed to initialize WebSocket:', error);
        setError('WebSocket connection failed. Chat features may be limited.');
        // Don't set loading to false here, let the user know there's an issue but still show the interface
      } finally {
        setLoading(false);
      }
    };

    initializeWebSocket();

    // Cleanup on unmount
    return () => {
      improvedWebSocketService.disconnect();
    };
  }, [user?.id, token, loadConversations, selectedConversation]);

  // Search users for new conversations
  const handleSearchUsers = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setSearching(true);
    try {
      const response = await apiService.users.search(query);
      type ApiUser = {
        id: string;
        name: string;
        email: string;
        profile?: { avatarUrl?: string; bio?: string; location?: string };
        role?: string;
      };
      const apiUsers = response.data as ApiUser[];

      // Transform API data to match our interface
      const transformedUsers: SearchUser[] = apiUsers.map((u) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        profilePicture: u.profile?.avatarUrl,
        role: u.role,
        bio: u.profile?.bio,
        location: u.profile?.location,
      }));

      setSearchResults(transformedUsers);
    } catch (error) {
      console.error('❌ Error searching users:', error);
      setError('Failed to search users. Please try again.');
    } finally {
      setSearching(false);
    }
  }, []);

  // Start new conversation
  const handleStartConversation = useCallback((selectedUser: SearchUser) => {
    const newConversation: Conversation = {
      id: `conv-${Date.now()}`,
      otherUser: selectedUser,
      lastMessage: undefined,
      unreadCount: 0,
    };

    setConversations((prev: Conversation[]) => [newConversation, ...prev]);
    setSelectedConversation(newConversation);
    setMessages([]);
    setNewConversationOpen(false);
    setSearchQuery('');
    setSearchResults([]);
  }, []);

  // Reload conversations when unreadCounts change to update UI
  useEffect(() => {
    if (user?.id && conversations.length > 0) {
      // Update conversations with new unread counts
      const updatedConversations = conversations.map((conv) => {
        const conversationKey = `${user?.id}-${conv.otherUser.id}`;
        const unreadCount = unreadCounts.get(conversationKey) || 0;
        return {
          ...conv,
          unreadCount,
        };
      });
      setConversations(updatedConversations);
    }
  }, [unreadCounts, user?.id, conversations]);

  // Handle conversation selection
  const handleConversationSelect = useCallback(
    async (conversation: Conversation) => {
      setSelectedConversation(conversation);

      try {
        setLoading(true);
        // Request more messages to get the full conversation history
        const response = await apiService.messages.getConversation(
          conversation.otherUser.id,
          { skip: 0, take: 100 }
        );
        const apiMessages = response.data || [];

        // Transform API data to match our interface
        type ApiMessage = {
          id: string;
          content: string;
          senderId: string;
          receiverId: string;
          timestamp: string;
          createdAt: string;
        };
        const transformedMessages: Message[] = (
          apiMessages as ApiMessage[]
        ).map((msg) => ({
          id: msg.id,
          content: msg.content,
          senderId: msg.senderId,
          receiverId: msg.receiverId,
          timestamp: msg.timestamp,
          createdAt: msg.createdAt,
          status: 'sent', // Default to sent
          isRead: msg.senderId === user?.id || !unreadMessages.has(msg.id),
        }));

        // Reverse the order so oldest messages appear at bottom (normal chat order)
        setMessages(transformedMessages.reverse());

        // Mark all messages in this conversation as read
        const conversationMessageIds = transformedMessages
          .filter((msg) => msg.receiverId === user?.id)
          .map((msg) => msg.id);

        setUnreadMessages((prev) => {
          const newSet = new Set(prev);
          conversationMessageIds.forEach((id) => newSet.delete(id));
          return newSet;
        });

        // Clear unread count for this conversation
        const conversationKey = `${user?.id}-${conversation.otherUser.id}`;
        setUnreadCounts((prev) => {
          const newMap = new Map(prev);
          newMap.set(conversationKey, 0);
          return newMap;
        });
      } catch (error) {
        console.error('❌ Error loading messages:', error);
        setError('Failed to load messages. Please try again.');
        setMessages([]);
      } finally {
        setLoading(false);
      }
    },
    [user?.id, unreadMessages]
  );

  // Handle sending messages
  const handleSendMessage = useCallback(
    async (content: string) => {
      if (!selectedConversation || !user?.id) return;

      // ===== Optimistic UI Implementation  =====

      // Generate temporary ID for optimistic update
      const tempId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const timestamp = new Date().toISOString();

      // Create optimistic message
      const optimisticMessage: Message = {
        id: tempId,
        content,
        senderId: user.id,
        receiverId: selectedConversation.otherUser.id,
        timestamp,
        createdAt: timestamp,
        status: 'sending', // Shows clock icon
        tempId,
      };

      try {
        // Add message to store immediately (optimistic UI)
        await addMessage(optimisticMessage);

        // Update conversation with latest message
        await updateConversation(selectedConversation.id, {
          lastMessage: optimisticMessage,
          updatedAt: timestamp,
        });

        // Send message via WebSocket (NOT API - WebSocket is faster and real-time)
        improvedWebSocketService.send('NEW_MESSAGE', {
          tempId,
          content,
          receiverId: selectedConversation.otherUser.id,
          conversationId: selectedConversation.id,
          timestamp,
        });

        // The MESSAGE_SENT event handler will update tempId -> real messageId
        // and change status from 'sending' -> 'sent'
      } catch (error) {
        console.error('❌ Error sending message:', error);
        setError('Failed to send message. Please try again.');

        // Update message status to 'failed' on error
        await addMessage({
          ...optimisticMessage,
          status: 'failed',
        });
      }
    },
    [selectedConversation, user?.id, addMessage, updateConversation]
  );

  // Handle typing indicators
  const handleTyping = useCallback(
    (isTyping: boolean) => {
      if (!selectedConversation || !user?.id) return;

      improvedWebSocketService.sendTypingIndicator(
        selectedConversation.otherUser.id,
        isTyping
      );
    },
    [selectedConversation, user?.id]
  );

  // ===== Handle Message Editing  =====
  const handleEditMessage = useCallback(
    async (messageId: string, newContent: string) => {
      if (!selectedConversation || !user?.id) return;

      try {
        // Update message in store
        await editMessage(selectedConversation.id, messageId, newContent);

        // Send edit event via WebSocket
        improvedWebSocketService.send('EDIT_MESSAGE', {
          messageId,
          conversationId: selectedConversation.id,
          newContent,
        });

        console.log(`✏️ Message ${messageId} edited`);
      } catch (error) {
        console.error('❌ Error editing message:', error);
        setError('Failed to edit message. Please try again.');
      }
    },
    [selectedConversation, user?.id, editMessage]
  );

  // ===== Handle Message Deletion (Todo #12) =====
  const handleDeleteMessage = useCallback(
    async (messageId: string) => {
      if (!selectedConversation || !user?.id) return;

      try {
        // Update message in store
        await deleteMessage(selectedConversation.id, messageId);

        // Send delete event via WebSocket
        improvedWebSocketService.send('DELETE_MESSAGE', {
          messageId,
          conversationId: selectedConversation.id,
        });

        console.log(`🗑️ Message ${messageId} deleted`);
      } catch (error) {
        console.error('❌ Error deleting message:', error);
        setError('Failed to delete message. Please try again.');
      }
    },
    [selectedConversation, user?.id, deleteMessage]
  );

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  if (!user) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="warning">
          Please log in to access the chat feature.
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 3 }}>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: 2,
          }}
        >
          <Typography variant="h4" component="h1">
            Messages
          </Typography>
          <IconButton
            onClick={() => setShowNotifications(!showNotifications)}
            sx={{ position: 'relative' }}
          >
            {notifications.length > 0 ? (
              <NotificationsActiveIcon color="primary" />
            ) : (
              <NotificationsIcon />
            )}
            {notifications.length > 0 && (
              <Chip
                label={notifications.length}
                size="small"
                color="primary"
                sx={{
                  position: 'absolute',
                  top: -8,
                  right: -8,
                  minWidth: 20,
                  height: 20,
                  fontSize: '0.75rem',
                }}
              />
            )}
          </IconButton>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          {/* ===== Enhanced Connection Status Indicator (Todo #10) ===== */}
          <Chip
            icon={<ChatIcon />}
            label={`${connectionStatus.charAt(0).toUpperCase() + connectionStatus.slice(1)}`}
            color={
              connectionStatus === 'connected'
                ? 'success'
                : connectionStatus === 'connecting' ||
                    connectionStatus === 'reconnecting'
                  ? 'warning'
                  : 'error'
            }
            size="small"
            variant={connectionStatus === 'connected' ? 'filled' : 'outlined'}
          />
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setNewConversationOpen(true)}
            size="small"
            sx={{ borderRadius: 2 }}
          >
            New Chat
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
          <Button onClick={() => setError(null)} size="small" sx={{ ml: 2 }}>
            Dismiss
          </Button>
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Conversations List */}
        <Grid item xs={12} md={4}>
          <Card sx={{ height: '70vh', overflow: 'hidden' }}>
            <CardContent
              sx={{
                p: 0,
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <Box
                sx={{
                  p: 2,
                  borderBottom: 1,
                  borderColor: 'divider',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Conversations
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <IconButton
                    onClick={() => setNewConversationOpen(true)}
                    size="small"
                    color="primary"
                    sx={{ ml: 1 }}
                  >
                    <AddIcon />
                  </IconButton>
                  {/* Debug button to test unread counts */}
                  <Button
                    size="small"
                    onClick={() => {
                      if (conversations.length > 0) {
                        const firstConv = conversations[0];
                        const conversationKey = `${user?.id}-${firstConv.otherUser.id}`;
                        console.log(
                          `🧪 Debug button clicked for ${firstConv.otherUser.name}`
                        );
                        console.log(`🧪 Conversation key: ${conversationKey}`);
                        console.log(
                          `🧪 Current unreadCounts before:`,
                          Array.from(unreadCounts.entries())
                        );

                        setUnreadCounts((prev) => {
                          const newMap = new Map(prev);
                          const currentCount = newMap.get(conversationKey) || 0;
                          newMap.set(conversationKey, currentCount + 1);
                          console.log(
                            `🧪 Debug: Added unread count for ${firstConv.otherUser.name}: ${currentCount} -> ${currentCount + 1}`
                          );
                          console.log(
                            `🧪 New unreadCounts:`,
                            Array.from(newMap.entries())
                          );
                          return newMap;
                        });
                      } else {
                        console.log('🧪 No conversations available to test');
                      }
                    }}
                    sx={{ ml: 1, fontSize: '0.7rem' }}
                  >
                    +1
                  </Button>
                </Box>
              </Box>

              <Box sx={{ flex: 1, overflow: 'auto' }}>
                {loading ? (
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      height: '100%',
                    }}
                  >
                    <CircularProgress />
                  </Box>
                ) : (
                  <List sx={{ p: 0 }}>
                    {conversations.map((conversation) => (
                      <ListItem
                        key={conversation.id}
                        button
                        onClick={() => handleConversationSelect(conversation)}
                        selected={selectedConversation?.id === conversation.id}
                        sx={{
                          '&:hover': { backgroundColor: 'action.hover' },
                          '&.Mui-selected': {
                            backgroundColor: 'primary.light',
                          },
                        }}
                      >
                        <ListItemAvatar>
                          <Avatar
                            src={conversation.otherUser.profilePicture}
                            alt={conversation.otherUser.name}
                          >
                            {conversation.otherUser.name.charAt(0)}
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={conversation.otherUser.name}
                          secondary={conversation.lastMessage?.content}
                          primaryTypographyProps={{
                            fontWeight:
                              conversation.unreadCount > 0 ? 700 : 600,
                          }}
                          secondaryTypographyProps={{
                            fontWeight:
                              conversation.unreadCount > 0 ? 600 : 400,
                          }}
                        />
                        {/* Always show unread count for debugging */}
                        <Chip
                          label={conversation.unreadCount || 0}
                          size="small"
                          color={
                            conversation.unreadCount > 0 ? 'primary' : 'default'
                          }
                          sx={{ ml: 1 }}
                        />
                      </ListItem>
                    ))}
                  </List>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Chat Area */}
        <Grid item xs={12} md={8}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <ChatBox
              conversation={selectedConversation}
              messages={messages}
              onSendMessage={handleSendMessage}
              onTyping={handleTyping}
              typingUsers={typingUsers}
              loading={loading}
              messagesEndRef={messagesEndRef}
              onEditMessage={handleEditMessage}
              onDeleteMessage={handleDeleteMessage}
              onlineUsers={onlineUsers}
            />
          </motion.div>
        </Grid>
      </Grid>

      {/* New Conversation Dialog */}
      <Dialog
        open={newConversationOpen}
        onClose={() => setNewConversationOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          Start New Conversation
          <IconButton
            onClick={() => setNewConversationOpen(false)}
            size="small"
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            placeholder="Search users by name or email..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              handleSearchUsers(e.target.value);
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
            sx={{ mb: 2 }}
          />

          {searching && (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
              <CircularProgress size={24} />
            </Box>
          )}

          {searchResults.length > 0 && (
            <List sx={{ maxHeight: 300, overflow: 'auto' }}>
              {searchResults.map((user) => (
                <ListItem
                  key={user.id}
                  button
                  onClick={() => handleStartConversation(user)}
                  sx={{
                    '&:hover': { backgroundColor: 'action.hover' },
                  }}
                >
                  <ListItemAvatar>
                    <Avatar src={user.profilePicture}>
                      {user.name.charAt(0)}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={user.name}
                    secondary={user.email}
                    primaryTypographyProps={{ fontWeight: 600 }}
                  />
                </ListItem>
              ))}
            </List>
          )}

          {searchQuery && !searching && searchResults.length === 0 && (
            <Box sx={{ textAlign: 'center', py: 2 }}>
              <Typography variant="body2" color="text.secondary">
                No users found matching "{searchQuery}"
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setNewConversationOpen(false)}>Cancel</Button>
        </DialogActions>
      </Dialog>

      {/* Notifications Popup */}
      <Dialog
        open={showNotifications}
        onClose={() => setShowNotifications(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          Notifications
          <IconButton onClick={() => setShowNotifications(false)} size="small">
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          {notifications.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <NotificationsIcon
                sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }}
              />
              <Typography variant="body1" color="text.secondary">
                No notifications yet
              </Typography>
            </Box>
          ) : (
            <List>
              {notifications.map((notification) => (
                <ListItem
                  key={notification.id}
                  sx={{
                    borderBottom: '1px solid',
                    borderColor: 'divider',
                    '&:last-child': { borderBottom: 'none' },
                  }}
                >
                  <ListItemAvatar>
                    <Avatar sx={{ bgcolor: 'primary.main' }}>
                      <ChatIcon />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={notification.title}
                    secondary={notification.message}
                    primaryTypographyProps={{ fontWeight: 600 }}
                  />
                  <Typography variant="caption" color="text.secondary">
                    {new Date(notification.timestamp).toLocaleTimeString()}
                  </Typography>
                </ListItem>
              ))}
            </List>
          )}
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setNotifications([])}
            disabled={notifications.length === 0}
          >
            Clear All
          </Button>
          <Button onClick={() => setShowNotifications(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default ChatPage;
