import { FC, useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  Box,
  Typography,
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
import {
  Add as AddIcon,
  Search as SearchIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { improvedWebSocketService } from '../services/websocket.improved';
import type { WebSocketMessage } from '../services/websocket.improved';
import { apiService } from '../services/api';
import ChatBox from '../components/ChatBox';
import {
  useMessagingStore,
  Message,
  Conversation as StoreConversation,
} from '../store/messaging.store';
import { initializeFCM } from '../config/firebase-config';

interface SearchUser {
  id: string;
  name: string;
  email: string;
  profilePicture?: string;
}
// Removed empty interface Conversation

const ChatPage: FC = () => {
  const { user, token } = useAuth();
  const {
    conversations,
    messages: storeMessages,
    selectedConversationId,
    setCurrentUser,
    setSelectedConversation,
    addConversation,
    updateConversation,
    addMessage,
    updateMessageByTempId,
    markMessageAsRead,
    editMessage,
    deleteMessage,
    loadMessagesForConversation,
    loadConversations,
    clearUnreadCount,
  } = useMessagingStore();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newConversationOpen, setNewConversationOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchUser[]>([]);
  const [searching, setSearching] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const selectedConversation: StoreConversation | null = selectedConversationId
    ? conversations.find((c) => c.id === selectedConversationId) || null
    : null;
  const messages: Message[] = useMemo(
    () =>
      selectedConversationId
        ? storeMessages.get(selectedConversationId) || []
        : [],
    [selectedConversationId, storeMessages]
  );

  useEffect(() => {
    if (!user?.id) return;
    setCurrentUser(user.id);
    (async () => {
      try {
        setLoading(true);
        await loadConversations();
      } catch {
        setError('Failed to load conversations');
      } finally {
        setLoading(false);
      }
    })();
  }, [user?.id, setCurrentUser, loadConversations]);
  useEffect(() => {
    if (!token) return;
    (async () => {
      try {
        await initializeFCM(token);
      } catch {
        // Ignore FCM initialization errors
      }
    })();
  }, [token]);
  useEffect(() => {
    if (Notification.permission === 'default') Notification.requestPermission();
  }, []);

  useEffect(() => {
    if (!user?.id || !token) return;
    const handleNewMessage = async (ws: WebSocketMessage) => {
      const incoming = ws.data as Message;
      const other =
        incoming.senderId === user.id ? incoming.receiverId : incoming.senderId;
      const convId =
        user.id < other ? `${user.id}-${other}` : `${other}-${user.id}`;
      if (!conversations.some((c) => c.id === convId)) {
        await addConversation({
          id: convId,
          otherUser: { id: other, name: 'User', email: 'unknown@example.com' },
          lastMessage: incoming,
          unreadCount: incoming.receiverId === user.id ? 1 : 0,
          updatedAt: incoming.timestamp,
        });
      } else {
        await updateConversation(convId, {
          lastMessage: incoming,
          updatedAt: incoming.timestamp,
        });
      }
      if (selectedConversationId === convId) {
        await addMessage({
          ...incoming,
          status: incoming.status || 'delivered',
        });
      }
    };
    const handleSent = async (ws: WebSocketMessage) => {
      const d = ws.data as {
        tempId: string;
        messageId: string;
        timestamp: string;
      };
      await updateMessageByTempId(d.tempId, {
        id: d.messageId,
        status: 'sent',
        timestamp: d.timestamp,
      });
    };
    const handleRead = async (ws: WebSocketMessage) => {
      const d = ws.data as { messageId: string; readAt: string };
      await markMessageAsRead(d.messageId, d.readAt);
    };
    const handleEdited = async (ws: WebSocketMessage) => {
      const d = ws.data as {
        messageId: string;
        newContent: string;
        editedAt: string;
      };
      await editMessage(d.messageId, d.newContent, d.editedAt);
    };
    const handleDeleted = async (ws: WebSocketMessage) => {
      const d = ws.data as { messageId: string; deletedAt: string };
      await deleteMessage(d.messageId, d.deletedAt);
    };
    const handleError = (ws: WebSocketMessage) => {
      const d = ws.data as { message: string };
      setError(d.message || 'WebSocket error');
    };
    (async () => {
      try {
        await improvedWebSocketService.connect(user.id, token);
      } catch {
        setError('WebSocket connect failed');
      }
      improvedWebSocketService.on('NEW_MESSAGE', handleNewMessage);
      improvedWebSocketService.on('MESSAGE_SENT', handleSent);
      improvedWebSocketService.on('MESSAGE_READ_UPDATE', handleRead);
      improvedWebSocketService.on('MESSAGE_EDITED', handleEdited);
      improvedWebSocketService.on('MESSAGE_DELETED', handleDeleted);
      improvedWebSocketService.on('ERROR', handleError);
    })();
    return () => {
      improvedWebSocketService.off('NEW_MESSAGE');
      improvedWebSocketService.off('MESSAGE_SENT');
      improvedWebSocketService.off('MESSAGE_READ_UPDATE');
      improvedWebSocketService.off('MESSAGE_EDITED');
      improvedWebSocketService.off('MESSAGE_DELETED');
      improvedWebSocketService.off('ERROR');
    };
  }, [
    user?.id,
    token,
    conversations,
    selectedConversationId,
    addConversation,
    updateConversation,
    addMessage,
    updateMessageByTempId,
    markMessageAsRead,
    editMessage,
    deleteMessage,
  ]);

  useEffect(() => {
    if (!selectedConversationId || !user?.id) return;
    const list = storeMessages.get(selectedConversationId) || [];
    const unread = list.filter((m) => m.receiverId === user.id && !m.isRead);
    if (!unread.length) return;
    (async () => {
      for (const m of unread) {
        await markMessageAsRead(m.id, new Date().toISOString());
        improvedWebSocketService.send('MESSAGE_READ', {
          messageId: m.id,
          conversationId: selectedConversationId,
          userId: user.id,
        });
      }
      await clearUnreadCount(selectedConversationId);
    })();
  }, [
    selectedConversationId,
    user?.id,
    storeMessages,
    markMessageAsRead,
    clearUnreadCount,
  ]);

  const handleSearchUsers = useCallback(async (q: string) => {
    if (!q.trim()) {
      setSearchResults([]);
      return;
    }
    setSearching(true);
    try {
      const resp = await apiService.users.search(q);
      const arr = resp.data as Array<{
        id: string;
        name: string;
        email: string;
        profile?: { avatarUrl?: string };
      }>;
      setSearchResults(
        arr.map((u) => ({
          id: u.id,
          name: u.name,
          email: u.email,
          profilePicture: u.profile?.avatarUrl,
        }))
      );
    } catch {
      setError('User search failed');
    } finally {
      setSearching(false);
    }
  }, []);
  const handleStartConversation = (u: SearchUser) => {
    if (!user?.id) return;
    const convId = user.id < u.id ? `${user.id}-${u.id}` : `${u.id}-${user.id}`;
    if (!conversations.some((c) => c.id === convId)) {
      addConversation({
        id: convId,
        otherUser: u,
        lastMessage: undefined,
        unreadCount: 0,
        updatedAt: new Date().toISOString(),
      });
    }
    setSelectedConversation(convId);
    loadMessagesForConversation(convId);
    setNewConversationOpen(false);
    setSearchQuery('');
    setSearchResults([]);
  };
  const handleConversationSelect = (c: StoreConversation) => {
    setSelectedConversation(c.id);
    loadMessagesForConversation(c.id);
    clearUnreadCount(c.id);
  };
  const handleSendMessage = async (content: string) => {
    if (
      !content.trim() ||
      !selectedConversationId ||
      !selectedConversation ||
      !user?.id
    )
      return;
    const tempId = `temp_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    const ts = new Date().toISOString();
    await addMessage({
      id: tempId,
      tempId,
      content: content.trim(),
      senderId: user.id,
      receiverId: selectedConversation.otherUser.id,
      timestamp: ts,
      createdAt: ts,
      status: 'sending',
    });
    try {
      improvedWebSocketService.send('NEW_MESSAGE', {
        tempId,
        content: content.trim(),
        receiverId: selectedConversation.otherUser.id,
        conversationId: selectedConversationId,
        timestamp: ts,
      });
    } catch {
      updateMessageByTempId(tempId, { status: 'failed' });
    }
  };
  const handleTyping = (isTyping: boolean) => {
    if (!selectedConversation || !user?.id) return;
    improvedWebSocketService.sendTypingIndicator(
      selectedConversation.otherUser.id,
      isTyping
    );
  };
  const handleEditMessage = (id: string, newContent: string) => {
    editMessage(id, newContent, new Date().toISOString());
    improvedWebSocketService.send('EDIT_MESSAGE', {
      messageId: id,
      conversationId: selectedConversationId,
      newContent,
    });
  };
  const handleDeleteMessage = (id: string) => {
    deleteMessage(id, new Date().toISOString());
    improvedWebSocketService.send('DELETE_MESSAGE', {
      messageId: id,
      conversationId: selectedConversationId,
    });
  };
  useEffect(() => {
    if (messagesEndRef.current)
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (!user)
    return (
      <Box
        className="w-full mx-auto"
        sx={{ py: 4, maxWidth: '1280px', px: { xs: 2, md: 3 } }}
      >
        <Alert severity="warning">Please log in to access chat.</Alert>
      </Box>
    );

  return (
    <Box
      className="w-full mx-auto"
      sx={{ py: 4, maxWidth: '1280px', px: { xs: 2, md: 3 } }}
    >
      <Box
        sx={{
          mb: 3,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <Typography variant="h4">Messages</Typography>
        <Button
          variant="contained"
          size="small"
          startIcon={<AddIcon />}
          onClick={() => setNewConversationOpen(true)}
        >
          New Chat
        </Button>
      </Box>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
          <Button size="small" onClick={() => setError(null)} sx={{ ml: 2 }}>
            Dismiss
          </Button>
        </Alert>
      )}
      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Card
            sx={{ height: '70vh', display: 'flex', flexDirection: 'column' }}
          >
            <CardContent
              sx={{ p: 0, flex: 1, display: 'flex', flexDirection: 'column' }}
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
                <IconButton
                  size="small"
                  color="primary"
                  onClick={() => setNewConversationOpen(true)}
                >
                  <AddIcon />
                </IconButton>
              </Box>
              <Box sx={{ flex: 1, overflowY: 'auto' }}>
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
                  <List dense sx={{ p: 0 }}>
                    {conversations.map((c) => (
                      <ListItem
                        key={c.id}
                        button
                        selected={selectedConversationId === c.id}
                        onClick={() => handleConversationSelect(c)}
                        sx={{
                          '&:hover': { backgroundColor: 'action.hover' },
                          '&.Mui-selected': {
                            backgroundColor: 'primary.light',
                          },
                        }}
                      >
                        <ListItemAvatar>
                          <Avatar src={c.otherUser.profilePicture}>
                            {c.otherUser.name.charAt(0)}
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={c.otherUser.name}
                          secondary={c.lastMessage?.content}
                          primaryTypographyProps={{
                            fontWeight: c.unreadCount > 0 ? 700 : 600,
                          }}
                          secondaryTypographyProps={{
                            fontWeight: c.unreadCount > 0 ? 600 : 400,
                          }}
                        />
                        <Chip
                          label={c.unreadCount}
                          size="small"
                          color={c.unreadCount > 0 ? 'primary' : 'default'}
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
              typingUsers={new Set()}
              loading={loading}
              messagesEndRef={messagesEndRef}
              onEditMessage={handleEditMessage}
              onDeleteMessage={handleDeleteMessage}
              onlineUsers={new Set()}
            />
          </motion.div>
        </Grid>
      </Grid>
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
            size="small"
            onClick={() => setNewConversationOpen(false)}
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
              {searchResults.map((u) => (
                <ListItem
                  key={u.id}
                  button
                  onClick={() => handleStartConversation(u)}
                  sx={{ '&:hover': { backgroundColor: 'action.hover' } }}
                >
                  <ListItemAvatar>
                    <Avatar src={u.profilePicture}>{u.name.charAt(0)}</Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={u.name}
                    secondary={u.email}
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
      <div ref={messagesEndRef} />
    </Box>
  );
};

export default ChatPage;
