import React, { useState, useEffect } from 'react';
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
  Divider,
  Paper,
  Chip,
  IconButton,
  Badge,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  Send as SendIcon,
  Person as PersonIcon,
  Circle as CircleIcon,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { apiService, handleApiError } from '../services/api';

interface Message {
  id: string;
  content: string;
  senderId: string;
  receiverId: string;
  createdAt: string;
}

interface Conversation {
  id: string;
  otherUser: {
    id: string;
    name: string;
    avatarUrl?: string;
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

  useEffect(() => {
    if (token) {
      fetchConversations();
    }
  }, [token]);

  useEffect(() => {
    if (selectedConversation) {
      fetchMessages(selectedConversation.otherUser.id);
    }
  }, [selectedConversation]);

  const fetchConversations = async () => {
    try {
      setLoading(true);
      const response = await apiService.messages.getAllConversations();
      setConversations(response.data);
    } catch (error: any) {
      console.error('Error fetching conversations:', error);
      setError('Failed to load conversations');
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (otherUserId: string) => {
    try {
      const response = await apiService.messages.getConversation(otherUserId);
      setMessages(response.data);
    } catch (error: any) {
      console.error('Error fetching messages:', error);
      setError('Failed to load messages');
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation) return;

    try {
      const response = await apiService.messages.send(
        newMessage,
        selectedConversation.otherUser.id
      );

      const sentMessage = response.data;
      setMessages(prev => [...prev, sentMessage]);
      setNewMessage('');
      
      // Update conversation list with new message
      setConversations(prev => 
        prev.map(conv => 
          conv.id === selectedConversation.id 
            ? { ...conv, lastMessage: sentMessage }
            : conv
        )
      );
    } catch (error: any) {
      console.error('Error sending message:', error);
      setError('Failed to send message');
    }
  };

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      sendMessage();
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString();
    }
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
        <Typography variant="h3" component="h1" gutterBottom sx={{ fontWeight: 700 }}>
          Messages
        </Typography>
        <Typography variant="h6" color="text.secondary" gutterBottom>
          Chat with your connections
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        <Grid container spacing={3} sx={{ mt: 2 }}>
          {/* Conversations List */}
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Conversations
                </Typography>
                <List sx={{ maxHeight: 600, overflow: 'auto' }}>
                  {conversations.map((conversation) => (
                    <ListItem
                      key={conversation.id}
                      button
                      selected={selectedConversation?.id === conversation.id}
                      onClick={() => setSelectedConversation(conversation)}
                      sx={{
                        borderRadius: 2,
                        mb: 1,
                        '&.Mui-selected': {
                          backgroundColor: 'primary.light',
                          color: 'primary.contrastText',
                        },
                      }}
                    >
                      <ListItemAvatar>
                        <Badge
                          badgeContent={conversation.unreadCount}
                          color="error"
                          invisible={conversation.unreadCount === 0}
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
                        primary={conversation.otherUser.name}
                        secondary={
                          conversation.lastMessage
                            ? conversation.lastMessage.content.length > 50
                              ? `${conversation.lastMessage.content.substring(0, 50)}...`
                              : conversation.lastMessage.content
                            : 'No messages yet'
                        }
                        secondaryTypographyProps={{
                          noWrap: true,
                          color: conversation.unreadCount > 0 ? 'text.primary' : 'text.secondary',
                          fontWeight: conversation.unreadCount > 0 ? 600 : 400,
                        }}
                      />
                      {conversation.lastMessage && (
                        <Typography variant="caption" color="text.secondary">
                          {formatTime(conversation.lastMessage.createdAt)}
                        </Typography>
                      )}
                    </ListItem>
                  ))}
                  {conversations.length === 0 && (
                    <ListItem>
                      <ListItemText
                        primary="No conversations yet"
                        secondary="Start connecting with people to begin messaging"
                      />
                    </ListItem>
                  )}
                </List>
              </CardContent>
            </Card>
          </Grid>

          {/* Chat Area */}
          <Grid item xs={12} md={8}>
            <Card sx={{ height: 600, display: 'flex', flexDirection: 'column' }}>
              {selectedConversation ? (
                <>
                  {/* Chat Header */}
                  <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
                    <Box display="flex" alignItems="center">
                      <Avatar
                        src={selectedConversation.otherUser.avatarUrl}
                        sx={{ mr: 2 }}
                      >
                        <PersonIcon />
                      </Avatar>
                      <Box>
                        <Typography variant="h6">
                          {selectedConversation.otherUser.name}
                        </Typography>
                        <Box display="flex" alignItems="center">
                          <CircleIcon sx={{ fontSize: 12, color: 'success.main', mr: 1 }} />
                          <Typography variant="body2" color="text.secondary">
                            Online
                          </Typography>
                        </Box>
                      </Box>
                    </Box>
                  </Box>

                  {/* Messages */}
                  <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      {messages.map((message) => {
                        const isOwnMessage = message.senderId === user?.id;
                        return (
                          <Box
                            key={message.id}
                            display="flex"
                            justifyContent={isOwnMessage ? 'flex-end' : 'flex-start'}
                          >
                            <Paper
                              sx={{
                                p: 2,
                                maxWidth: '70%',
                                backgroundColor: isOwnMessage ? 'primary.main' : 'grey.100',
                                color: isOwnMessage ? 'white' : 'text.primary',
                                borderRadius: 3,
                                borderBottomRightRadius: isOwnMessage ? 1 : 3,
                                borderBottomLeftRadius: isOwnMessage ? 3 : 1,
                              }}
                            >
                              <Typography variant="body1">{message.content}</Typography>
                              <Typography
                                variant="caption"
                                sx={{
                                  display: 'block',
                                  mt: 1,
                                  opacity: 0.7,
                                  textAlign: isOwnMessage ? 'right' : 'left',
                                }}
                              >
                                {formatTime(message.createdAt)}
                              </Typography>
                            </Paper>
                          </Box>
                        );
                      })}
                    </Box>
                  </Box>

                  {/* Message Input */}
                  <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
                    <Box display="flex" gap={1}>
                      <TextField
                        fullWidth
                        multiline
                        maxRows={4}
                        placeholder="Type a message..."
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyPress={handleKeyPress}
                        variant="outlined"
                        size="small"
                      />
                      <Button
                        variant="contained"
                        onClick={sendMessage}
                        disabled={!newMessage.trim()}
                        sx={{ minWidth: 56 }}
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