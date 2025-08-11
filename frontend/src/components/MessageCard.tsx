import React from 'react';
import {
  Box,
  Typography,
  Avatar,
  Paper,
  Chip,
} from '@mui/material';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';

interface Message {
  id: string;
  content: string;
  senderId: string;
  senderName: string;
  createdAt: string;
  timestamp?: string;
  isRead: boolean;
}

interface MessageCardProps {
  message: Message;
  isOwnMessage: boolean;
  showAvatar?: boolean;
  showSenderName?: boolean;
}

const MessageCard: React.FC<MessageCardProps> = ({ 
  message, 
  isOwnMessage, 
  showAvatar = true, 
  showSenderName = true 
}) => {
  const { user } = useAuth();

  const formatTime = (dateString: string) => {
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

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
    >
      <Box
        sx={{
          display: 'flex',
          justifyContent: isOwnMessage ? 'flex-end' : 'flex-start',
          mb: 2,
          alignItems: 'flex-end',
        }}
      >
        {/* Avatar for received messages */}
        {!isOwnMessage && showAvatar && (
          <Avatar
            sx={{
              width: 28,
              height: 28,
              bgcolor: 'primary.main',
              fontSize: '0.75rem',
              mr: 1,
              mb: 0.5,
            }}
          >
            {message.senderName.charAt(0).toUpperCase()}
          </Avatar>
        )}
        
        {/* Spacer for sent messages to align properly */}
        {isOwnMessage && (
          <Box sx={{ width: 29, ml: 1 }} />
        )}

        <Box sx={{ maxWidth: '70%' }}>
          {/* Sender name for received messages */}
          {!isOwnMessage && showSenderName && (
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ ml: 1, mb: 0.5, display: 'block', fontWeight: 500 }}
            >
              {message.senderName}
            </Typography>
          )}

          {/* Message Bubble */}
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

          {/* Time stamp and read status */}
          <Box
            sx={{
              display: 'flex',
              justifyContent: isOwnMessage ? 'flex-end' : 'flex-start',
              alignItems: 'center',
              gap: 0.5,
              mt: 0.5,
            }}
          >
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ 
                fontSize: '0.75rem',
                ml: isOwnMessage ? 0 : 1,
                mr: isOwnMessage ? 1 : 0,
              }}
            >
              {formatTime(message.timestamp || message.createdAt)}
            </Typography>
            
            {isOwnMessage && (
              <Chip
                label={message.isRead ? 'Read' : 'Delivered'}
                size="small"
                color={message.isRead ? 'success' : 'default'}
                variant="outlined"
                sx={{ 
                  height: 16, 
                  fontSize: '0.625rem',
                  mr: 1,
                }}
              />
            )}
          </Box>
        </Box>
      </Box>
    </motion.div>
  );
};

export default MessageCard;
