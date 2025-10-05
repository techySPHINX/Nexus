import React, { useEffect } from 'react';
import {
  Box,
  Typography,
  Avatar,
  Paper,
  Chip,
} from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';

interface Message {
  id: string;
  content: string;
  senderId: string;
  receiverId: string;
  timestamp: string;
  createdAt: string;
  isRead?: boolean;
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
  messagesEndRef: React.RefObject<HTMLDivElement>;
}

/**
 * MessageList Component
 * 
 * Features:
 * - Displays messages in chronological order
 * - Shows sender/receiver distinction
 * - Smooth animations for new messages
 * - Auto-scroll to bottom
 * - Message timestamps
 */
const MessageList: React.FC<MessageListProps> = ({
  messages,
  conversation,
  messagesEndRef,
}) => {
  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, messagesEndRef]);

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
      sx={{
        height: '100%',
        overflow: 'auto',
        p: 2,
        display: 'flex',
        flexDirection: 'column',
        gap: 1,
      }}
    >
      <AnimatePresence>
        {messages.map((message, index) => {
          const isOwnMessage = message.senderId !== conversation.otherUser.id;
          const showAvatar = index === 0 || messages[index - 1].senderId !== message.senderId;
          const showTimestamp = index === messages.length - 1 || 
            new Date(message.timestamp).getTime() - new Date(messages[index + 1].timestamp).getTime() > 300000; // 5 minutes

          return (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              style={{
                display: 'flex',
                justifyContent: isOwnMessage ? 'flex-end' : 'flex-start',
                alignItems: 'flex-end',
                marginBottom: showTimestamp ? 2 : 0.5,
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
                <Paper
                  elevation={1}
                  sx={{
                    p: 1.5,
                    backgroundColor: isOwnMessage ? 'primary.main' : 'grey.100',
                    color: isOwnMessage ? 'primary.contrastText' : 'text.primary',
                    borderRadius: 2,
                    position: 'relative',
                    wordBreak: 'break-word',
                    maxWidth: '100%',
                  }}
                >
                  <Typography 
                    variant="body1" 
                    sx={{ 
                      lineHeight: 1.4,
                      fontWeight: message.isRead === false ? 'bold' : 'normal',
                    }}
                  >
                    {message.content}
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
                      {formatDistanceToNow(new Date(message.timestamp), { addSuffix: true })}
                    </Typography>
                  )}
                </Paper>

                {/* Delivery Status (for own messages) */}
                {isOwnMessage && (
                  <Box sx={{ display: 'flex', alignItems: 'center', minWidth: 20 }}>
                    <Chip
                      label="✓"
                      size="small"
                      sx={{
                        height: 16,
                        fontSize: '0.7rem',
                        backgroundColor: 'success.main',
                        color: 'success.contrastText',
                      }}
                    />
                  </Box>
                )}
              </Box>
            </motion.div>
          );
        })}
      </AnimatePresence>
      
      {/* Scroll anchor */}
      <div ref={messagesEndRef} />
    </Box>
  );
};

export default MessageList;
