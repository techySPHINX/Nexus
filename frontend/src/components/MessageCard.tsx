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
  isRead: boolean;
}

interface MessageCardProps {
  message: Message;
  isOwnMessage: boolean;
}

const MessageCard: React.FC<MessageCardProps> = ({ message, isOwnMessage }) => {
  const { user } = useAuth();

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    if (diffInHours < 168) return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    return date.toLocaleDateString();
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
        }}
      >
        {!isOwnMessage && (
          <Avatar
            sx={{
              width: 32,
              height: 32,
              bgcolor: 'primary.main',
              fontSize: '0.875rem',
              mr: 1,
            }}
          >
            {message.senderName.charAt(0).toUpperCase()}
          </Avatar>
        )}

        <Box sx={{ maxWidth: '70%' }}>
          {!isOwnMessage && (
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ ml: 1, mb: 0.5, display: 'block' }}
            >
              {message.senderName}
            </Typography>
          )}

          <Paper
            elevation={1}
            sx={{
              p: 1.5,
              backgroundColor: isOwnMessage ? 'primary.main' : 'background.paper',
              color: isOwnMessage ? 'white' : 'text.primary',
              borderRadius: 2,
              position: 'relative',
              '&::after': isOwnMessage ? {
                content: '""',
                position: 'absolute',
                right: -8,
                top: 12,
                width: 0,
                height: 0,
                borderLeft: '8px solid',
                borderLeftColor: 'primary.main',
                borderTop: '8px solid transparent',
                borderBottom: '8px solid transparent',
              } : {},
              '&::before': !isOwnMessage ? {
                content: '""',
                position: 'absolute',
                left: -8,
                top: 12,
                width: 0,
                height: 0,
                borderRight: '8px solid',
                borderRightColor: 'background.paper',
                borderTop: '8px solid transparent',
                borderBottom: '8px solid transparent',
              } : {},
            }}
          >
            <Typography variant="body2" sx={{ wordBreak: 'break-word' }}>
              {message.content}
            </Typography>
          </Paper>

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
              sx={{ fontSize: '0.75rem' }}
            >
              {formatTime(message.createdAt)}
            </Typography>
            
            {isOwnMessage && (
              <Chip
                label={message.isRead ? 'Read' : 'Delivered'}
                size="small"
                color={message.isRead ? 'success' : 'default'}
                variant="outlined"
                sx={{ height: 16, fontSize: '0.625rem' }}
              />
            )}
          </Box>
        </Box>
      </Box>
    </motion.div>
  );
};

export default MessageCard;
