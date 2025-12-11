import { FC, useEffect, useState, useRef, RefObject } from 'react';
import {
  Box,
  Typography,
  Avatar,
  Paper,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  CircularProgress,
} from '@mui/material';
import { Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import { useVirtualizer } from '@tanstack/react-virtual';
import MessageStatus from './MessageStatus';

interface Message {
  id: string;
  content: string;
  senderId: string;
  receiverId: string;
  timestamp: string;
  createdAt: string;
  isRead?: boolean;
  status?: 'sending' | 'sent' | 'delivered' | 'read' | 'failed' | 'deleted';
  readAt?: string;
  tempId?: string;
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

interface MessageListProps {
  messages: Message[];
  conversation: Conversation;
  messagesEndRef: RefObject<HTMLDivElement>;
  onEditMessage?: (messageId: string, newContent: string) => void;
  onDeleteMessage?: (messageId: string) => void;
  onLoadMore?: () => Promise<void>;
  hasMore?: boolean;
}

/**
 * MessageList Component
 *
 * Features:
 * - Displays messages in chronological order with virtual scrolling
 * - Shows sender/receiver distinction
 * - Smooth animations for new messages
 * - Auto-scroll to bottom
 * - Message timestamps
 * - Edit/Delete message controls (for own messages)
 * - Infinite scroll for loading older messages
 */
const MessageList: FC<MessageListProps> = ({
  messages,
  conversation,
  messagesEndRef,
  onEditMessage,
  onDeleteMessage,
  onLoadMore,
  hasMore = false,
}) => {
  // ===== State for Edit/Delete Dialogs =====
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [deleteMessageId, setDeleteMessageId] = useState<string | null>(null);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // ===== Infinite Scroll Setup =====
  const parentRef = useRef<HTMLDivElement>(null);

  // Virtualizer for efficient rendering of large message lists
  const virtualizer = useVirtualizer({
    count: messages.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 100, // Estimated message height
    overscan: 5, // Render 5 extra items above/below viewport
  });

  // Auto-scroll to bottom when new messages arrive
  const prevMessageCountRef = useRef(messages.length);
  useEffect(() => {
    if (
      messages.length > prevMessageCountRef.current &&
      messagesEndRef.current
    ) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
    prevMessageCountRef.current = messages.length;
  }, [messages.length, messagesEndRef]);

  // Load more messages when scrolling to top
  useEffect(() => {
    if (!parentRef.current || !onLoadMore || !hasMore) return;

    const handleScroll = async () => {
      const element = parentRef.current;
      if (!element) return;

      // Check if scrolled to top (within 100px)
      if (element.scrollTop < 100 && !isLoadingMore) {
        setIsLoadingMore(true);
        try {
          await onLoadMore();
        } catch (error) {
          console.error('Error loading more messages:', error);
        } finally {
          setIsLoadingMore(false);
        }
      }
    };

    const element = parentRef.current;
    element.addEventListener('scroll', handleScroll);
    return () => element.removeEventListener('scroll', handleScroll);
  }, [onLoadMore, hasMore, isLoadingMore]);

  const handleEditClick = (messageId: string, currentContent: string) => {
    setEditingMessageId(messageId);
    setEditContent(currentContent);
  };

  const handleEditSave = () => {
    if (editingMessageId && onEditMessage) {
      onEditMessage(editingMessageId, editContent);
      setEditingMessageId(null);
      setEditContent('');
    }
  };

  const handleEditCancel = () => {
    setEditingMessageId(null);
    setEditContent('');
  };

  const handleDeleteClick = (messageId: string) => {
    setDeleteMessageId(messageId);
  };

  const handleDeleteConfirm = () => {
    if (deleteMessageId && onDeleteMessage) {
      onDeleteMessage(deleteMessageId);
      setDeleteMessageId(null);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteMessageId(null);
  };

  if (messages.length === 0) {
    return (
      <Box
        sx={{
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'text.secondary',
          p: 3,
        }}
      >
        <Typography variant="h6" gutterBottom>
          No messages yet
        </Typography>
        <Typography variant="body2" textAlign="center">
          Start the conversation by sending a message below
        </Typography>
      </Box>
    );
  }

  return (
    <Box
      ref={parentRef}
      sx={{
        height: '100%',
        overflow: 'auto',
        p: 2,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Loading indicator for older messages */}
      {isLoadingMore && hasMore && (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
          <CircularProgress size={24} />
        </Box>
      )}

      {/* Virtual scroll container */}
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative',
        }}
      >
        <AnimatePresence>
          {virtualizer.getVirtualItems().map((virtualRow) => {
            const message = messages[virtualRow.index];
            const index = virtualRow.index;
            const isOwnMessage = message.senderId !== conversation.otherUser.id;
            const showAvatar =
              index === 0 || messages[index - 1].senderId !== message.senderId;
            const showTimestamp =
              index === messages.length - 1 ||
              new Date(message.timestamp).getTime() -
                new Date(messages[index + 1].timestamp).getTime() >
                300000; // 5 minutes

            return (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -20, scale: 0.95 }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  transform: `translateY(${virtualRow.start}px)`,
                  display: 'flex',
                  justifyContent: isOwnMessage ? 'flex-end' : 'flex-start',
                  alignItems: 'flex-end',
                  padding: '8px 0',
                }}
              >
                <Box
                  sx={{
                    display: 'flex',
                    flexDirection: isOwnMessage ? 'row-reverse' : 'row',
                    alignItems: 'flex-end',
                    gap: 1,
                    maxWidth: '70%',
                  }}
                >
                  {/* Avatar (only for other user's messages) */}
                  {!isOwnMessage && (
                    <Avatar
                      src={conversation.otherUser.profilePicture}
                      alt={conversation.otherUser.name}
                      sx={{
                        width: showAvatar ? 32 : 0,
                        height: showAvatar ? 32 : 0,
                        opacity: showAvatar ? 1 : 0,
                        transition: 'all 0.2s ease',
                      }}
                    >
                      {conversation.otherUser.name.charAt(0)}
                    </Avatar>
                  )}

                  {/* Message Bubble */}
                  <Box sx={{ position: 'relative', maxWidth: '100%' }}>
                    <Paper
                      elevation={1}
                      sx={{
                        p: 1.5,
                        backgroundColor: isOwnMessage
                          ? 'primary.main'
                          : 'grey.100',
                        color: isOwnMessage
                          ? 'primary.contrastText'
                          : 'text.primary',
                        borderRadius: 2,
                        position: 'relative',
                        wordBreak: 'break-word',
                        maxWidth: '100%',
                      }}
                    >
                      {isOwnMessage &&
                        message.status !== 'deleted' &&
                        onEditMessage &&
                        onDeleteMessage && (
                          <Box
                            sx={{
                              position: 'absolute',
                              top: 4,
                              right: 4,
                              display: 'flex',
                              gap: 0.5,
                              opacity: 0.7,
                              '&:hover': { opacity: 1 },
                            }}
                          >
                            <IconButton
                              size="small"
                              onClick={() =>
                                handleEditClick(message.id, message.content)
                              }
                              sx={{
                                color: isOwnMessage
                                  ? 'primary.contrastText'
                                  : 'text.primary',
                                padding: '2px',
                              }}
                            >
                              <EditIcon sx={{ fontSize: 14 }} />
                            </IconButton>
                            <IconButton
                              size="small"
                              onClick={() => handleDeleteClick(message.id)}
                              sx={{
                                color: isOwnMessage
                                  ? 'primary.contrastText'
                                  : 'text.primary',
                                padding: '2px',
                              }}
                            >
                              <DeleteIcon sx={{ fontSize: 14 }} />
                            </IconButton>
                          </Box>
                        )}

                      <Typography
                        variant="body1"
                        sx={{
                          lineHeight: 1.4,
                          fontWeight:
                            message.isRead === false ? 'bold' : 'normal',
                          pr:
                            isOwnMessage && message.status !== 'deleted'
                              ? 5
                              : 0, // Space for buttons
                        }}
                      >
                        {message.content}
                        {message.status === 'deleted' && (
                          <em style={{ opacity: 0.7 }}> (deleted)</em>
                        )}
                      </Typography>

                      {/* Timestamp */}
                      {showTimestamp && (
                        <Typography
                          variant="caption"
                          sx={{
                            display: 'block',
                            mt: 0.5,
                            opacity: 0.7,
                            fontSize: '0.7rem',
                            textAlign: isOwnMessage ? 'right' : 'left',
                          }}
                        >
                          {formatDistanceToNow(new Date(message.timestamp), {
                            addSuffix: true,
                          })}
                        </Typography>
                      )}
                    </Paper>
                  </Box>

                  {/* ===== Message Status Component ===== */}
                  {isOwnMessage && message.status !== 'deleted' && (
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        minWidth: 20,
                      }}
                    >
                      <MessageStatus
                        status={message.status || 'sent'}
                        timestamp={message.readAt}
                      />
                    </Box>
                  )}
                </Box>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Scroll anchor */}
      <div ref={messagesEndRef} />

      {/* ===== Edit Message Dialog (Todo #11) ===== */}
      <Dialog
        open={!!editingMessageId}
        onClose={handleEditCancel}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Edit Message</DialogTitle>
        <DialogContent>
          <TextField
            margin="dense"
            label="Message"
            type="text"
            fullWidth
            multiline
            rows={3}
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleEditCancel}>Cancel</Button>
          <Button
            onClick={handleEditSave}
            variant="contained"
            disabled={!editContent.trim()}
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>

      {/* ===== Delete Message Dialog (Todo #12) ===== */}
      <Dialog open={!!deleteMessageId} onClose={handleDeleteCancel}>
        <DialogTitle>Delete Message</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this message? This action cannot be
            undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteCancel}>Cancel</Button>
          <Button
            onClick={handleDeleteConfirm}
            variant="contained"
            color="error"
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default MessageList;
