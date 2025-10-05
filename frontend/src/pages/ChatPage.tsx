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
  Person as PersonIcon, 
  Chat as ChatIcon, 
  Add as AddIcon,
  Search as SearchIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { improvedWebSocketService } from '../services/websocket.improved';
import ChatBox from '../components/ChatBox';
import { getErrorMessage } from '../utils/errorHandler';
import { apiService } from '../services/api';

interface Message {
  id: string;
  content: string;
  senderId: string;
  receiverId: string;
  timestamp: string;
  createdAt: string;
}

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
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected' | 'reconnecting'>('disconnected');
  const [error, setError] = useState<string | null>(null);
  const [newConversationOpen, setNewConversationOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

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
          tokenLength: token?.length
        });
        await improvedWebSocketService.connect(user.id, token);
        
        // Set up event listeners
        improvedWebSocketService.on('NEW_MESSAGE', (message: any) => {
          console.log('📨 New message received:', message);
          setMessages(prev => [...prev, message.data]);
        });

        improvedWebSocketService.on('TYPING_START', (message: any) => {
          console.log('⌨️ User started typing:', message);
          setTypingUsers(prev => new Set([...prev, message.data.userId]));
        });

        improvedWebSocketService.on('TYPING_STOP', (message: any) => {
          console.log('⌨️ User stopped typing:', message);
          setTypingUsers(prev => {
            const newSet = new Set(prev);
            newSet.delete(message.data.userId);
            return newSet;
          });
        });

        improvedWebSocketService.on('CONNECTION_SUCCESS', () => {
          console.log('✅ WebSocket connected successfully');
          setConnectionStatus('connected');
        });

        improvedWebSocketService.on('CONNECTION_ERROR', (message: any) => {
          console.error('❌ WebSocket connection error:', message);
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
  }, [user?.id, token]);

  // Search users for new conversations
  const handleSearchUsers = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setSearching(true);
    try {
      const response = await apiService.users.search(query);
      const apiUsers = response.data;

      // Transform API data to match our interface
      const transformedUsers = apiUsers.map((user: any) => ({
        id: user.id,
        name: user.name,
        email: user.email,
        profilePicture: user.profile?.avatarUrl,
        role: user.role,
        bio: user.profile?.bio,
        location: user.profile?.location,
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
  const handleStartConversation = useCallback((selectedUser: any) => {
    const newConversation: Conversation = {
      id: `conv-${Date.now()}`,
      otherUser: selectedUser,
      lastMessage: undefined,
      unreadCount: 0,
    };

    setConversations(prev => [newConversation, ...prev]);
    setSelectedConversation(newConversation);
    setMessages([]);
    setNewConversationOpen(false);
    setSearchQuery('');
    setSearchResults([]);
  }, []);

  // Load conversations from API
  const loadConversations = useCallback(async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      const response = await apiService.messages.getAllConversations();
      const apiConversations = response.data;

      // Transform API data to match our interface
      const transformedConversations: Conversation[] = apiConversations.map((conv: any) => ({
        id: conv.conversationId,
        otherUser: {
          id: conv.otherUser.id,
          name: conv.otherUser.name,
          email: conv.otherUser.email,
          profilePicture: conv.otherUser.profile?.avatarUrl,
        },
        lastMessage: conv.latestMessage ? {
          id: conv.latestMessage.id,
          content: conv.latestMessage.content,
          senderId: conv.latestMessage.senderId,
          receiverId: conv.latestMessage.receiverId,
          timestamp: conv.latestMessage.timestamp,
          createdAt: conv.latestMessage.createdAt,
        } : undefined,
        unreadCount: 0, // TODO: Implement unread count from API
      }));

      // Deduplicate conversations by otherUser.id
      const uniqueConversations = transformedConversations.reduce((acc: Conversation[], current) => {
        const existingIndex = acc.findIndex(conv => conv.otherUser.id === current.otherUser.id);
        if (existingIndex === -1) {
          acc.push(current);
        } else {
          // Keep the conversation with the latest message
          const existing = acc[existingIndex];
          if (current.lastMessage && existing.lastMessage) {
            const currentTime = new Date(current.lastMessage.timestamp).getTime();
            const existingTime = new Date(existing.lastMessage.timestamp).getTime();
            if (currentTime > existingTime) {
              acc[existingIndex] = current;
            }
          }
        }
        return acc;
      }, []);

      setConversations(uniqueConversations);
    } catch (error) {
      console.error('❌ Error loading conversations:', error);
      setError('Failed to load conversations. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  // Handle conversation selection
  const handleConversationSelect = useCallback(async (conversation: Conversation) => {
    setSelectedConversation(conversation);
    
    try {
      setLoading(true);
      // Request more messages to get the full conversation history
      const response = await apiService.messages.getConversation(conversation.otherUser.id, { skip: 0, take: 100 });
      const apiMessages = response.data || [];

      // Transform API data to match our interface
      const transformedMessages: Message[] = apiMessages.map((msg: any) => ({
        id: msg.id,
        content: msg.content,
        senderId: msg.senderId,
        receiverId: msg.receiverId,
        timestamp: msg.timestamp,
        createdAt: msg.createdAt,
      }));

      // Reverse the order so oldest messages appear at bottom (normal chat order)
      setMessages(transformedMessages.reverse());
    } catch (error) {
      console.error('❌ Error loading messages:', error);
      setError('Failed to load messages. Please try again.');
      setMessages([]);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  // Handle sending messages
  const handleSendMessage = useCallback(async (content: string) => {
    if (!selectedConversation || !user?.id) return;

    try {
      // Send message via API
      const response = await apiService.messages.send(content, selectedConversation.otherUser.id);
      const sentMessage = response.data;

      // Transform API response to match our interface
      const message: Message = {
        id: sentMessage.id,
        content: sentMessage.content,
        senderId: sentMessage.senderId,
        receiverId: sentMessage.receiverId,
        timestamp: sentMessage.timestamp,
        createdAt: sentMessage.createdAt,
      };

      // Send via WebSocket for real-time delivery
      improvedWebSocketService.sendChatMessage({
        content: message.content,
        senderId: message.senderId,
        receiverId: message.receiverId,
        uniqueId: `msg_${Date.now()}_${Math.random()}`,
      });

      // Add to local messages
      setMessages(prev => [...prev, message]);

      // Update conversation list with latest message
      setConversations(prev => 
        prev.map(conv => 
          conv.id === selectedConversation.id 
            ? { ...conv, lastMessage: message }
            : conv
        )
      );

    } catch (error) {
      console.error('❌ Error sending message:', error);
      setError('Failed to send message. Please try again.');
    }
  }, [selectedConversation, user?.id]);

  // Handle typing indicators
  const handleTyping = useCallback((isTyping: boolean) => {
    if (!selectedConversation || !user?.id) return;

    improvedWebSocketService.sendTypingIndicator(selectedConversation.otherUser.id, isTyping);
  }, [selectedConversation, user?.id]);

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
        <Typography variant="h4" component="h1" gutterBottom>
          Messages
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Chip
            icon={<ChatIcon />}
            label={`${connectionStatus.charAt(0).toUpperCase() + connectionStatus.slice(1)}`}
            color={connectionStatus === 'connected' ? 'success' : 'default'}
            size="small"
          />
          {error && (
            <Alert severity="error" sx={{ flex: 1 }}>
              {error}
              <Button onClick={() => setError(null)} size="small">
                Dismiss
              </Button>
            </Alert>
          )}
        </Box>
      </Box>

      <Grid container spacing={3}>
        {/* Conversations List */}
        <Grid item xs={12} md={4}>
          <Card sx={{ height: '70vh', overflow: 'hidden' }}>
            <CardContent sx={{ p: 0, height: '100%', display: 'flex', flexDirection: 'column' }}>
              <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Conversations
                </Typography>
                <IconButton 
                  onClick={() => setNewConversationOpen(true)}
                  size="small"
                  color="primary"
                  sx={{ ml: 1 }}
                >
                  <AddIcon />
                </IconButton>
              </Box>
              
              <Box sx={{ flex: 1, overflow: 'auto' }}>
                {loading ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
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
                          '&.Mui-selected': { backgroundColor: 'primary.light' },
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
                          primaryTypographyProps={{ fontWeight: 600 }}
                        />
                        {conversation.unreadCount > 0 && (
                          <Chip
                            label={conversation.unreadCount}
                            size="small"
                            color="primary"
                            sx={{ ml: 1 }}
                          />
                        )}
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
              isTyping={isTyping}
              typingUsers={typingUsers}
              loading={loading}
              messagesEndRef={messagesEndRef}
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
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          Start New Conversation
          <IconButton onClick={() => setNewConversationOpen(false)} size="small">
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
          <Button onClick={() => setNewConversationOpen(false)}>
            Cancel
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default ChatPage;