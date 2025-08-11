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
  ListItemText,
  ListItemAvatar,
  Avatar,
  TextField,
  Button,
  Paper,
  Badge,
  CircularProgress,
  Alert,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Send as SendIcon,
  Person as PersonIcon,
  Circle as CircleIcon,
  MoreVert as MoreVertIcon,
  AttachFile as AttachFileIcon,
  EmojiEmotions as EmojiIcon,
  Refresh as RefreshIcon,
  Wifi as WifiIcon,
  WifiOff as WifiOffIcon,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { apiService, handleApiError } from '../services/api';
import { webSocketService, WebSocketMessage } from '../services/websocket';

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
    avatarUrl?: string;
    role?: string;
  };
  lastMessage?: Message;
  unreadCount: number;
}

const Messages: React.FC = () => {
  const { user, token } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isRealTimeEnabled, setIsRealTimeEnabled] = useState(false);
  const [newMessageCount, setNewMessageCount] = useState(0);
  const [isTyping, setIsTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const lastMessageIdRef = useRef<string | null>(null);
  const typingTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    if (token) {
      fetchConversations();
    }
    
    // Cleanup on unmount
    return () => {
      webSocketService.disconnect();
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [token]);

  useEffect(() => {
    if (selectedConversation) {
      console.log('Conversation selected, fetching messages and starting real-time updates...', {
        conversation: selectedConversation,
        user: user?.id,
        hasToken: !!token
      });
      
      fetchMessages(selectedConversation.otherUser.id);
      
      // Only start real-time updates if we have all required data
      if (user && token) {
        startRealTimeUpdates();
      } else {
        console.log('Cannot start real-time updates yet - missing user or token');
      }
      
      setNewMessageCount(0); // Reset new message count when switching conversations
    } else {
      console.log('No conversation selected, stopping real-time updates');
      stopRealTimeUpdates();
    }
  }, [selectedConversation, user, token]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const startRealTimeUpdates = useCallback(async () => {
    if (!selectedConversation || !user || !token) {
      console.log('Cannot start real-time updates: missing conversation, user, or token');
      return;
    }

    try {
      console.log('Starting WebSocket connection...', { userId: user.id, hasToken: !!token });
      
      // Connect to WebSocket
      await webSocketService.connect(user.id, token);
      setIsRealTimeEnabled(true);
      
      console.log('WebSocket connected successfully, setting up message handlers...');
      
      // Set up message handlers
      webSocketService.on('NEW_MESSAGE', (message: WebSocketMessage) => {
        console.log('Received NEW_MESSAGE:', message);
        if (message.data.senderId === selectedConversation.otherUser.id) {
          handleNewMessage(message.data);
        }
      });

      webSocketService.on('TYPING_START', (message: WebSocketMessage) => {
        console.log('Received TYPING_START:', message);
        if (message.data.receiverId === user.id) {
          setTypingUsers(prev => new Set(prev).add(message.data.senderId));
        }
      });

      webSocketService.on('TYPING_STOP', (message: WebSocketMessage) => {
        console.log('Received TYPING_STOP:', message);
        if (message.data.receiverId === user.id) {
          setTypingUsers(prev => {
            const newSet = new Set(prev);
            newSet.delete(message.data.senderId);
            return newSet;
          });
        }
      });

      webSocketService.on('USER_ONLINE', (message: WebSocketMessage) => {
        console.log('User online:', message.data);
      });

      webSocketService.on('USER_OFFLINE', (message: WebSocketMessage) => {
        console.log('User offline:', message.data);
      });

      webSocketService.on('MESSAGE_SENT', (message: WebSocketMessage) => {
        console.log('Message sent confirmation:', message.data);
      });

      webSocketService.on('MESSAGE_ERROR', (message: WebSocketMessage) => {
        console.error('Message error:', message.data);
      });

      console.log('WebSocket message handlers set up successfully');

    } catch (error: any) {
      console.error('WebSocket connection failed:', error);
      setIsRealTimeEnabled(false);
      setError(`WebSocket connection failed: ${error.message}`);
    }
  }, [selectedConversation, user, token]);

  const stopRealTimeUpdates = useCallback(() => {
    webSocketService.disconnect();
    setIsRealTimeEnabled(false);
    setTypingUsers(new Set());
  }, []);

  const handleNewMessage = useCallback((newMessage: Message) => {
    // Only add if it's not already in the messages array
    setMessages(prev => {
      const exists = prev.some(msg => msg.id === newMessage.id);
      if (!exists) {
        // Play notification sound for new messages (if not from current user)
        if (newMessage.senderId !== user?.id) {
          playNotificationSound();
          setNewMessageCount(prev => prev + 1);
        }
        
        return [...prev, newMessage].sort((a, b) => 
          new Date(a.timestamp || a.createdAt).getTime() - new Date(b.timestamp || b.createdAt).getTime()
        );
      }
      return prev;
    });

    // Update conversation list
    setConversations(prev => 
      prev.map(conv => 
        conv.id === selectedConversation?.id 
          ? { ...conv, lastMessage: newMessage }
          : conv
      )
    );

    // Update last message ID reference
    lastMessageIdRef.current = newMessage.id;
  }, [selectedConversation, user]);

  const playNotificationSound = () => {
    try {
      // Create a simple notification sound
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
      oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.1);
      
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.2);
    } catch (error) {
      console.log('Audio notification not supported');
    }
  };

  const fetchConversations = async () => {
    try {
      setLoading(true);
      const response = await apiService.messages.getAllConversations();
      setConversations(response.data);
    } catch (error: any) {
      console.error('Error fetching conversations:', error);
      setError(handleApiError(error) || 'Failed to load conversations');
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (otherUserId: string) => {
    try {
      const response = await apiService.messages.getConversation(otherUserId);
      // Ensure messages are sorted chronologically (oldest first)
      const sortedMessages = response.data.sort((a: Message, b: Message) => 
        new Date(a.timestamp || a.createdAt).getTime() - new Date(b.timestamp || b.createdAt).getTime()
      );
      setMessages(sortedMessages);
      
      // Update last message ID reference
      if (sortedMessages.length > 0) {
        lastMessageIdRef.current = sortedMessages[sortedMessages.length - 1].id;
      }
    } catch (error: any) {
      console.error('Error fetching messages:', error);
      setError(handleApiError(error) || 'Failed to load messages');
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation) return;

    try {
      // Stop typing indicator
      webSocketService.sendTypingIndicator(selectedConversation.otherUser.id, false);
      setIsTyping(false);
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      const response = await apiService.messages.send(
        newMessage,
        selectedConversation.otherUser.id
      );

      const sentMessage = response.data;
      
      // Send message via WebSocket for real-time delivery
      webSocketService.sendChatMessage({
        content: newMessage,
        senderId: user!.id,
        receiverId: selectedConversation.otherUser.id
      });

      // Add new message to the end of the messages array (maintaining chronological order)
      setMessages(prev => [...prev, sentMessage]);
      setNewMessage('');
      setSuccess('Message sent successfully!');
      
      // Update conversation list with new message
      setConversations(prev => 
        prev.map(conv => 
          conv.id === selectedConversation.id 
            ? { ...conv, lastMessage: sentMessage }
            : conv
        )
      );

      // Update last message ID reference
      lastMessageIdRef.current = sentMessage.id;

      // Clear success message after 2 seconds
      setTimeout(() => setSuccess(null), 2000);
    } catch (error: any) {
      console.error('Error sending message:', error);
      setError(handleApiError(error) || 'Failed to send message');
    }
  };

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      sendMessage();
    }
  };

  const handleTyping = (event: React.ChangeEvent<HTMLInputElement>) => {
    setNewMessage(event.target.value);
    
    // Send typing indicator
    if (selectedConversation && !isTyping) {
      setIsTyping(true);
      webSocketService.sendTypingIndicator(selectedConversation.otherUser.id, true);
    }
    
    // Clear typing indicator after 2 seconds of no typing
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    typingTimeoutRef.current = window.setTimeout(() => {
      if (selectedConversation) {
        setIsTyping(false);
        webSocketService.sendTypingIndicator(selectedConversation.otherUser.id, false);
      }
    }, 2000);
  };

  const refreshMessages = async () => {
    if (selectedConversation) {
      await fetchMessages(selectedConversation.otherUser.id);
      setSuccess('Messages refreshed!');
      setTimeout(() => setSuccess(null), 2000);
    }
  };

  const formatMessageTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    const diffInHours = Math.floor(diffInMinutes / 60);
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInDays < 7) return `${diffInDays}d ago`;
    
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
  };

  const formatConversationTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInDays < 7) return `${diffInDays}d ago`;
    
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
  };

  const formatDateHeader = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

    if (diffInDays === 0) return 'Today';
    if (diffInDays === 1) return 'Yesterday';
    if (diffInDays < 7) return date.toLocaleDateString('en-US', { weekday: 'long' });
    
    return date.toLocaleDateString('en-US', { 
      weekday: 'long',
      month: 'long', 
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
  };

  const groupMessagesByDate = (messages: Message[]) => {
    const groups: { [key: string]: Message[] } = {};
    
    messages.forEach(message => {
      const date = new Date(message.timestamp || message.createdAt);
      const dateKey = date.toDateString();
      
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(message);
    });

    // Sort dates chronologically (oldest first)
    const sortedDates = Object.keys(groups).sort((a, b) => 
      new Date(a).getTime() - new Date(b).getTime()
    );

    return sortedDates.map(dateKey => ({
      date: new Date(dateKey),
      messages: groups[dateKey].sort((a, b) => 
        new Date(a.timestamp || a.createdAt).getTime() - new Date(b.timestamp || b.createdAt).getTime()
      )
    }));
  };

  if (loading && conversations.length === 0) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Box>
            <Typography variant="h3" component="h1" gutterBottom sx={{ fontWeight: 700 }}>
              Messages
            </Typography>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              Chat with your connections
            </Typography>
          </Box>
          {isRealTimeEnabled && (
            <Box display="flex" alignItems="center" gap={1}>
              <WifiIcon sx={{ fontSize: 16, color: 'success.main' }} />
              <Typography variant="body2" color="success.main" sx={{ fontWeight: 500 }}>
                WebSocket Connected
              </Typography>
            </Box>
          )}
          {!isRealTimeEnabled && (
            <Box display="flex" alignItems="center" gap={1}>
              <WifiOffIcon sx={{ fontSize: 16, color: 'warning.main' }} />
              <Typography variant="body2" color="warning.main" sx={{ fontWeight: 500 }}>
                WebSocket Disconnected
              </Typography>
            </Box>
          )}
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>
            {success}
          </Alert>
        )}

        <Grid container spacing={3} sx={{ mt: 2 }}>
          {/* Conversations List */}
          <Grid item xs={12} md={4}>
            <Card sx={{ height: 700 }}>
              <CardContent sx={{ p: 0 }}>
                <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    Conversations ({conversations.length})
                  </Typography>
                </Box>
                <List sx={{ maxHeight: 600, overflow: 'auto', p: 0 }}>
                  {conversations.map((conversation) => (
                    <ListItem
                      key={conversation.id}
                      button
                      selected={selectedConversation?.id === conversation.id}
                      onClick={() => setSelectedConversation(conversation)}
                      sx={{
                        borderRadius: 0,
                        borderBottom: 1,
                        borderColor: 'divider',
                        '&.Mui-selected': {
                          backgroundColor: 'primary.light',
                          color: 'primary.contrastText',
                          '&:hover': {
                            backgroundColor: 'primary.light',
                          },
                        },
                        '&:hover': {
                          backgroundColor: 'action.hover',
                        },
                      }}
                    >
                      <ListItemAvatar>
                        <Badge
                          badgeContent={conversation.unreadCount}
                          color="error"
                          invisible={conversation.unreadCount === 0}
                          sx={{
                            '& .MuiBadge-badge': {
                              fontSize: '0.75rem',
                              height: 20,
                              minWidth: 20,
                            },
                          }}
                        >
                          <Avatar
                            src={conversation.otherUser.avatarUrl}
                            sx={{ width: 48, height: 48 }}
                          >
                            <PersonIcon />
                          </Avatar>
                        </Badge>
                      </ListItemAvatar>
                      <ListItemText
                        primary={
                          <Box display="flex" justifyContent="space-between" alignItems="center">
                            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                              {conversation.otherUser.name}
                            </Typography>
                            {conversation.lastMessage && (
                              <Typography variant="caption" color="text.secondary">
                                {formatConversationTime(conversation.lastMessage.timestamp || conversation.lastMessage.createdAt)}
                              </Typography>
                            )}
                          </Box>
                        }
                        secondary={
                          <Box>
                            {conversation.otherUser.role && (
                              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                                {conversation.otherUser.role}
                              </Typography>
                            )}
                            <Typography
                              variant="body2"
                              color={conversation.unreadCount > 0 ? 'text.primary' : 'text.secondary'}
                              fontWeight={conversation.unreadCount > 0 ? 600 : 400}
                              sx={{
                                display: '-webkit-box',
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: 'vertical',
                                overflow: 'hidden',
                                lineHeight: 1.2,
                              }}
                            >
                              {conversation.lastMessage
                                ? conversation.lastMessage.content.length > 60
                                  ? `${conversation.lastMessage.content.substring(0, 60)}...`
                                  : conversation.lastMessage.content
                                : 'No messages yet'}
                            </Typography>
                          </Box>
                        }
                        secondaryTypographyProps={{
                          component: 'div',
                        }}
                      />
                    </ListItem>
                  ))}
                  {conversations.length === 0 && (
                    <Box sx={{ p: 3, textAlign: 'center' }}>
                      <PersonIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                      <Typography variant="h6" color="text.secondary" gutterBottom>
                        No conversations yet
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Start connecting with people to begin messaging
                      </Typography>
                    </Box>
                  )}
                </List>
              </CardContent>
            </Card>
          </Grid>

          {/* Chat Area */}
          <Grid item xs={12} md={8}>
            <Card sx={{ height: 700, display: 'flex', flexDirection: 'column' }}>
              {selectedConversation ? (
                <>
                  {/* Chat Header */}
                  <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                      <Box display="flex" alignItems="center">
                        <Avatar
                          src={selectedConversation.otherUser.avatarUrl}
                          sx={{ mr: 2, width: 40, height: 40 }}
                        >
                          <PersonIcon />
                        </Avatar>
                        <Box>
                          <Typography variant="h6" sx={{ fontWeight: 600 }}>
                            {selectedConversation.otherUser.name}
                          </Typography>
                          <Box display="flex" alignItems="center" gap={1}>
                            <CircleIcon sx={{ fontSize: 12, color: 'success.main' }} />
                            <Typography variant="body2" color="text.secondary">
                              Online
                            </Typography>
                            {isRealTimeEnabled && (
                              <Box display="flex" alignItems="center" gap={0.5}>
                                <CircleIcon sx={{ fontSize: 8, color: 'success.main' }} />
                                <Typography variant="caption" color="success.main">
                                  Real-time
                                </Typography>
                              </Box>
                            )}
                          </Box>
                        </Box>
                      </Box>
                      <Box display="flex" alignItems="center" gap={1}>
                        <Tooltip title="Refresh messages">
                          <IconButton size="small" onClick={refreshMessages}>
                            <RefreshIcon />
                          </IconButton>
                        </Tooltip>
                        <IconButton size="small">
                          <MoreVertIcon />
                        </IconButton>
                      </Box>
                    </Box>
                  </Box>

                  {/* Messages */}
                  <Box 
                    ref={chatContainerRef}
                    sx={{ 
                      flex: 1, 
                      overflow: 'auto', 
                      p: 2,
                      backgroundColor: 'grey.50',
                      display: 'flex',
                      flexDirection: 'column',
                      position: 'relative',
                    }}
                  >
                    {/* New Message Indicator */}
                    {newMessageCount > 0 && (
                      <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        style={{
                          position: 'absolute',
                          top: 10,
                          right: 20,
                          zIndex: 10,
                        }}
                      >
                        <Paper
                          sx={{
                            px: 2,
                            py: 1,
                            backgroundColor: 'success.main',
                            color: 'white',
                            borderRadius: 2,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1,
                            cursor: 'pointer',
                          }}
                          onClick={() => {
                            scrollToBottom();
                            setNewMessageCount(0);
                          }}
                        >
                          <CircleIcon sx={{ fontSize: 16 }} />
                          <Typography variant="caption" sx={{ fontWeight: 600 }}>
                            {newMessageCount} new message{newMessageCount > 1 ? 's' : ''}
                          </Typography>
                        </Paper>
                      </motion.div>
                    )}
                    
                    {/* Messages are displayed chronologically: oldest (top) to newest (bottom) */}
                    <AnimatePresence>
                      {groupMessagesByDate(messages).map(({ date, messages: dateMessages }) => (
                        <Box key={date.toDateString()} sx={{ mb: 3 }}>
                          {/* Date Header */}
                          <Box sx={{ textAlign: 'center', mb: 2 }}>
                            <Paper
                              sx={{
                                display: 'inline-block',
                                px: 2,
                                py: 0.5,
                                backgroundColor: 'white',
                                border: 1,
                                borderColor: 'divider',
                                borderRadius: 2,
                              }}
                            >
                              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>
                                {formatDateHeader(date.toDateString())}
                              </Typography>
                            </Paper>
                          </Box>

                          {/* Messages for this date */}
                          {dateMessages.map((message, index) => {
                            const isOwnMessage = message.senderId === user?.id;
                            const showAvatar = !isOwnMessage && (
                              index === 0 || 
                              dateMessages[index - 1]?.senderId !== message.senderId
                            );
                            
                            return (
                              <motion.div
                                key={message.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.2 }}
                              >
                                <Box
                                  sx={{
                                    display: 'flex',
                                    justifyContent: isOwnMessage ? 'flex-end' : 'flex-start',
                                    mb: 1,
                                    alignItems: 'flex-end',
                                  }}
                                >
                                  {/* Avatar for received messages */}
                                  {showAvatar && (
                                    <Avatar
                                      src={selectedConversation.otherUser.avatarUrl}
                                      sx={{ 
                                        width: 28, 
                                        height: 28, 
                                        mr: 1,
                                        mb: 0.5,
                                      }}
                                    >
                                      <PersonIcon />
                                    </Avatar>
                                  )}
                                  
                                  {/* Spacer for sent messages to align properly */}
                                  {isOwnMessage && (
                                    <Box sx={{ width: 29, ml: 1 }} />
                                  )}

                                  {/* Message Bubble */}
                                  <Box sx={{ maxWidth: '70%' }}>
                                    <Paper
                                      elevation={1}
                                      sx={{
                                        p: 1.5,
                                        backgroundColor: isOwnMessage ? 'primary.main' : 'white',
                                        color: isOwnMessage ? 'white' : 'text.primary',
                                        borderRadius: 2,
                                        borderBottomRightRadius: isOwnMessage ? 0 : 2,
                                        borderBottomLeftRadius: isOwnMessage ? 2 : 0,
                                        position: 'relative',
                                        '&::after': isOwnMessage ? {
                                          content: '""',
                                          position: 'absolute',
                                          right: -8,
                                          bottom: 0,
                                          width: 0,
                                          height: 0,
                                          borderLeft: '8px solid',
                                          borderLeftColor: 'primary.main',
                                          borderBottom: '8px solid transparent',
                                        } : {},
                                        '&::before': !isOwnMessage ? {
                                          content: '""',
                                          position: 'absolute',
                                          left: -8,
                                          bottom: 0,
                                          width: 0,
                                          height: 0,
                                          borderRight: '8px solid',
                                          borderRightColor: 'white',
                                          borderBottom: '8px solid transparent',
                                        } : {},
                                      }}
                                    >
                                      <Typography variant="body2" sx={{ wordBreak: 'break-word', lineHeight: 1.4 }}>
                                        {message.content}
                                      </Typography>
                                    </Paper>
                                    
                                    {/* Time stamp */}
                                    <Typography
                                      variant="caption"
                                      color="text.secondary"
                                      sx={{
                                        display: 'block',
                                        mt: 0.5,
                                        ml: isOwnMessage ? 0 : 1,
                                        mr: isOwnMessage ? 1 : 0,
                                        textAlign: isOwnMessage ? 'right' : 'left',
                                        fontSize: '0.75rem',
                                      }}
                                    >
                                      {formatMessageTime(message.timestamp || message.createdAt)}
                                    </Typography>
                                  </Box>
                                </Box>
                              </motion.div>
                            );
                          })}
                        </Box>
                      ))}
                    </AnimatePresence>
                    
                    {/* Typing Indicator */}
                    {typingUsers.has(selectedConversation.otherUser.id) && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        style={{ marginTop: 8 }}
                      >
                        <Box display="flex" alignItems="center" gap={1}>
                          <Avatar
                            src={selectedConversation.otherUser.avatarUrl}
                            sx={{ width: 24, height: 24 }}
                          >
                            <PersonIcon />
                          </Avatar>
                          <Paper
                            sx={{
                              px: 2,
                              py: 1,
                              backgroundColor: 'grey.200',
                              borderRadius: 2,
                              maxWidth: 200,
                            }}
                          >
                            <Typography variant="body2" color="text.secondary">
                              {selectedConversation.otherUser.name} is typing...
                            </Typography>
                          </Paper>
                        </Box>
                      </motion.div>
                    )}
                    
                    {/* Invisible div to scroll to bottom */}
                    <div ref={messagesEndRef} />
                  </Box>

                  {/* Message Input */}
                  <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider', backgroundColor: 'white' }}>
                    <Box display="flex" gap={1} alignItems="flex-end">
                      <Box sx={{ display: 'flex', gap: 0.5, mb: 1 }}>
                        <Tooltip title="Attach file">
                          <IconButton size="small" sx={{ color: 'text.secondary' }}>
                            <AttachFileIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Add emoji">
                          <IconButton size="small" sx={{ color: 'text.secondary' }}>
                            <EmojiIcon />
                          </IconButton>
                        </Tooltip>
                      </Box>
                      <TextField
                        fullWidth
                        multiline
                        maxRows={4}
                        placeholder="Type a message..."
                        value={newMessage}
                        onChange={handleTyping}
                        onKeyPress={handleKeyPress}
                        variant="outlined"
                        size="small"
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            borderRadius: 3,
                          },
                        }}
                      />
                      <Button
                        variant="contained"
                        onClick={sendMessage}
                        disabled={!newMessage.trim()}
                        sx={{ 
                          minWidth: 56, 
                          height: 40,
                          borderRadius: 3,
                          px: 2,
                        }}
                      >
                        <SendIcon />
                      </Button>
                    </Box>
                  </Box>
                </>
              ) : (
                <Box
                  display="flex"
                  flexDirection="column"
                  alignItems="center"
                  justifyContent="center"
                  height="100%"
                  color="text.secondary"
                  sx={{ backgroundColor: 'grey.50' }}
                >
                  <PersonIcon sx={{ fontSize: 64, mb: 2, opacity: 0.5 }} />
                  <Typography variant="h6" gutterBottom>
                    Select a conversation
                  </Typography>
                  <Typography variant="body2" textAlign="center">
                    Choose a conversation from the list to start messaging
                  </Typography>
                </Box>
              )}
            </Card>
          </Grid>
        </Grid>
      </motion.div>
    </Container>
  );
};

export default Messages; 