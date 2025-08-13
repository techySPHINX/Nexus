import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  IconButton,
  Paper,
  Stack,
  useTheme,
  Badge
} from '@mui/material';
import {
  Notifications,
  Close,
  Check,
  Work,
  Message,
  Person
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';

interface NotificationItem {
  id: string;
  type: 'message' | 'connection' | 'referral' | 'general';
  title: string;
  message: string;
  timestamp: string;
  avatar?: string;
  isRead: boolean;
  actionUrl?: string;
}

interface AppleNotificationProps {
  notifications: NotificationItem[];
  onMarkAsRead: (id: string) => void;
  onDelete: (id: string) => void;
  onNotificationClick: (notification: NotificationItem) => void;
}

const AppleNotification: React.FC<AppleNotificationProps> = ({
  notifications,
  onMarkAsRead,
  onDelete,
  onNotificationClick
}) => {
  const theme = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    setUnreadCount(notifications.filter(n => !n.isRead).length);
  }, [notifications]);

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'message':
        return <Message sx={{ fontSize: 20, color: '#007AFF' }} />;
      case 'connection':
        return <Person sx={{ fontSize: 20, color: '#34C759' }} />;
      case 'referral':
        return <Work sx={{ fontSize: 20, color: '#FF9500' }} />;
      default:
        return <Notifications sx={{ fontSize: 20, color: '#AF52DE' }} />;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'message':
        return '#007AFF';
      case 'connection':
        return '#34C759';
      case 'referral':
        return '#FF9500';
      default:
        return '#AF52DE';
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInHours = (now.getTime() - time.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`;
    } else if (diffInHours < 48) {
      return 'Yesterday';
    } else {
      return time.toLocaleDateString();
    }
  };

  const handleNotificationClick = (notification: NotificationItem) => {
    if (!notification.isRead) {
      onMarkAsRead(notification.id);
    }
    onNotificationClick(notification);
  };

  return (
    <Box sx={{ position: 'relative' }}>
      {/* Notification Bell with Badge */}
      <IconButton
        onClick={() => setIsOpen(!isOpen)}
        sx={{
          position: 'relative',
          color: theme.palette.mode === 'dark' ? 'white' : 'text.primary',
          '&:hover': {
            bgcolor: theme.palette.mode === 'dark' 
              ? 'rgba(255,255,255,0.1)' 
              : 'rgba(0,0,0,0.04)'
          }
        }}
      >
        <Notifications />
        {unreadCount > 0 && (
          <Badge
            badgeContent={unreadCount > 99 ? '99+' : unreadCount}
            sx={{
              '& .MuiBadge-badge': {
                bgcolor: '#FF3B30',
                color: 'white',
                fontSize: '0.7rem',
                fontWeight: 600,
                minWidth: 18,
                height: 18,
                borderRadius: 9,
                top: 4,
                right: 4,
                border: '2px solid',
                borderColor: theme.palette.background.paper
              }
            }}
          />
        )}
      </IconButton>

      {/* Notification Panel */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="notification-backdrop"
              style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                zIndex: 999,
                backgroundColor: 'rgba(0, 0, 0, 0.1)'
              }}
              onClick={() => setIsOpen(false)}
            />
            
            {/* Notification Panel */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, x: 20 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.95, x: 20 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="macos-notification"
              style={{
                position: 'fixed',
                top: '80px', // Fixed distance from top
                right: '20px', // Fixed distance from right edge
                zIndex: 1000,
                width: '380px'
              }}
            >
              <Paper
                elevation={8}
                className="notification-panel-glass"
                sx={{
                  width: '100%',
                  maxHeight: 600,
                  overflow: 'hidden',
                  borderRadius: 3,
                  transition: 'all 0.3s ease'
                }}
              >
                {/* Header */}
                <Box
                  sx={{
                    p: 2,
                    borderBottom: `1px solid ${theme.palette.mode === 'dark' ? '#38383A' : '#E5E5EA'}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}
                >
                  <Typography
                    variant="h6"
                    sx={{
                      fontWeight: 600,
                      color: theme.palette.mode === 'dark' ? 'white' : 'text.primary'
                    }}
                  >
                    Notifications
                  </Typography>
                  <IconButton
                    size="small"
                    onClick={() => setIsOpen(false)}
                    sx={{
                      color: theme.palette.mode === 'dark' ? '#8E8E93' : '#8E8E93',
                      '&:hover': {
                        bgcolor: theme.palette.mode === 'dark' 
                          ? 'rgba(255,255,255,0.1)' 
                          : 'rgba(0,0,0,0.04)'
                      }
                    }}
                  >
                    <Close fontSize="small" />
                  </IconButton>
                </Box>

                {/* Notifications List */}
                <Box sx={{ maxHeight: 500, overflow: 'auto' }}>
                  {notifications.length === 0 ? (
                    <Box
                      sx={{
                        p: 4,
                        textAlign: 'center',
                        color: theme.palette.mode === 'dark' ? '#8E8E93' : '#8E8E93'
                      }}
                    >
                      <Notifications sx={{ fontSize: 48, mb: 2, opacity: 0.5 }} />
                      <Typography variant="body2">
                        No notifications yet
                      </Typography>
                    </Box>
                  ) : (
                    <Stack spacing={0}>
                      {notifications.map((notification, index) => (
                        <motion.div
                          key={notification.id}
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05 }}
                        >
                          <Box
                            onClick={() => handleNotificationClick(notification)}
                            sx={{
                              p: 2,
                              cursor: 'pointer',
                              borderBottom: `1px solid ${theme.palette.mode === 'dark' ? '#38383A' : '#E5E5EA'}`,
                              bgcolor: notification.isRead 
                                ? 'transparent' 
                                : theme.palette.mode === 'dark'
                                  ? 'rgba(0,122,255,0.1)'
                                  : 'rgba(0,122,255,0.05)',
                              '&:hover': {
                                bgcolor: theme.palette.mode === 'dark'
                                  ? 'rgba(255,255,255,0.05)'
                                  : 'rgba(0,0,0,0.02)'
                              },
                              transition: 'all 0.2s ease'
                            }}
                          >
                            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                              {/* Icon */}
                              <Box
                                sx={{
                                  width: 40,
                                  height: 40,
                                  borderRadius: 20,
                                  bgcolor: theme.palette.mode === 'dark' 
                                    ? 'rgba(255,255,255,0.1)' 
                                    : 'rgba(0,0,0,0.04)',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  flexShrink: 0
                                }}
                              >
                                {getNotificationIcon(notification.type)}
                              </Box>

                              {/* Content */}
                              <Box sx={{ flex: 1, minWidth: 0 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                                  <Typography
                                    variant="body2"
                                    sx={{
                                      fontWeight: 600,
                                      color: theme.palette.mode === 'dark' ? 'white' : 'text.primary',
                                      fontSize: '0.875rem'
                                    }}
                                  >
                                    {notification.title}
                                  </Typography>
                                  {!notification.isRead && (
                                    <Box
                                      sx={{
                                        width: 8,
                                        height: 8,
                                        borderRadius: '50%',
                                        bgcolor: getNotificationColor(notification.type)
                                      }}
                                    />
                                  )}
                                </Box>
                                
                                <Typography
                                  variant="body2"
                                  sx={{
                                    color: theme.palette.mode === 'dark' ? '#8E8E93' : '#8E8E93',
                                    fontSize: '0.8rem',
                                    lineHeight: 1.4,
                                    mb: 1
                                  }}
                                >
                                  {notification.message}
                                </Typography>

                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                  <Typography
                                    variant="caption"
                                    sx={{
                                      color: theme.palette.mode === 'dark' ? '#8E8E93' : '#8E8E93',
                                      fontSize: '0.75rem'
                                    }}
                                  >
                                    {formatTimestamp(notification.timestamp)}
                                  </Typography>

                                  <Box sx={{ display: 'flex', gap: 0.5 }}>
                                    {!notification.isRead && (
                                      <IconButton
                                        size="small"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          onMarkAsRead(notification.id);
                                        }}
                                        sx={{
                                          p: 0.5,
                                          color: '#34C759',
                                          '&:hover': {
                                            bgcolor: 'rgba(52,199,89,0.1)'
                                          }
                                        }}
                                      >
                                        <Check fontSize="small" />
                                      </IconButton>
                                    )}
                                    <IconButton
                                      size="small"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        onDelete(notification.id);
                                      }}
                                      sx={{
                                        p: 0.5,
                                        color: '#FF3B30',
                                        '&:hover': {
                                          bgcolor: 'rgba(255,59,48,0.1)'
                                        }
                                      }}
                                    >
                                      <Close fontSize="small" />
                                    </IconButton>
                                  </Box>
                                </Box>
                              </Box>
                            </Box>
                          </Box>
                        </motion.div>
                      ))}
                    </Stack>
                  )}
                </Box>

                {/* Footer */}
                {notifications.length > 0 && (
                  <Box
                    sx={{
                      p: 2,
                      borderTop: `1px solid ${theme.palette.mode === 'dark' ? '#38383A' : '#E5E5EA'}`,
                      textAlign: 'center'
                    }}
                  >
                    <Typography
                      variant="body2"
                      sx={{
                        color: getNotificationColor('general'),
                        fontWeight: 500,
                        cursor: 'pointer',
                        '&:hover': {
                          textDecoration: 'underline'
                        }
                      }}
                    >
                      View All Notifications
                    </Typography>
                  </Box>
                )}
              </Paper>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </Box>
  );
};

export default AppleNotification;
