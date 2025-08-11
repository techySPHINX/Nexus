import React, { useState, useEffect } from 'react';
import {
  Badge,
  IconButton,
  Menu,
  MenuItem,
  Typography,
  Box,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Button,
  Chip,
  Paper,
  Tooltip,
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  Message as MessageIcon,
  PersonAdd as PersonAddIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  ClearAll as ClearAllIcon,
  Check as CheckIcon,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { notificationService, Notification, NotificationCounts } from '../services/notification';

interface NotificationBellProps {
  userId: string;
}

const NotificationBell: React.FC<NotificationBellProps> = ({ userId }) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [counts, setCounts] = useState<NotificationCounts>({ unread: 0, total: 0 });

  useEffect(() => {
    // Load initial data
    setNotifications(notificationService.getNotifications());
    setCounts(notificationService.getCounts());

    // Listen for updates
    const handleNotification = (notification: Notification) => {
      setNotifications(notificationService.getNotifications());
      setCounts(notificationService.getCounts());
    };

    const handleCountUpdate = (newCounts: NotificationCounts) => {
      setCounts(newCounts);
    };

    notificationService.on('notification', handleNotification);
    notificationService.on('countUpdate', handleCountUpdate);

    return () => {
      notificationService.off('notification', handleNotification);
      notificationService.off('countUpdate', handleCountUpdate);
    };
  }, []);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleNotificationClick = (notification: Notification) => {
    // Mark as read
    notificationService.markAsRead(notification.id);
    
    // Handle navigation based on notification type
    switch (notification.type) {
      case 'MESSAGE':
        // Navigate to messages page
        window.location.href = '/messages';
        break;
      case 'CONNECTION_REQUEST':
        // Navigate to connections page
        window.location.href = '/connections';
        break;
      case 'CONNECTION_ACCEPTED':
      case 'CONNECTION_REJECTED':
        // Navigate to connections page
        window.location.href = '/connections';
        break;
    }
    
    handleClose();
  };

  const handleMarkAllAsRead = () => {
    notificationService.markAllAsRead();
  };

  const handleClearAll = () => {
    notificationService.clearAllNotifications();
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'MESSAGE':
        return <MessageIcon color="primary" />;
      case 'CONNECTION_REQUEST':
        return <PersonAddIcon color="warning" />;
      case 'CONNECTION_ACCEPTED':
        return <CheckCircleIcon color="success" />;
      case 'CONNECTION_REJECTED':
        return <CancelIcon color="error" />;
      default:
        return <NotificationsIcon />;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'MESSAGE':
        return 'primary';
      case 'CONNECTION_REQUEST':
        return 'warning';
      case 'CONNECTION_ACCEPTED':
        return 'success';
      case 'CONNECTION_REJECTED':
        return 'error';
      default:
        return 'default';
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return date.toLocaleDateString();
  };

  const open = Boolean(anchorEl);

  return (
    <>
      <Tooltip title="Notifications">
        <IconButton
          onClick={handleClick}
          sx={{ color: 'inherit' }}
          aria-label="notifications"
          aria-controls={open ? 'notifications-menu' : undefined}
          aria-haspopup="true"
          aria-expanded={open ? 'true' : undefined}
        >
          <Badge badgeContent={counts.unread} color="error" max={99}>
            <NotificationsIcon />
          </Badge>
        </IconButton>
      </Tooltip>

      <Menu
        id="notifications-menu"
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        PaperProps={{
          sx: {
            width: 400,
            maxHeight: 500,
            overflow: 'auto',
          },
        }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h6">Notifications</Typography>
            <Box>
              {counts.unread > 0 && (
                <Button
                  size="small"
                  startIcon={<CheckIcon />}
                  onClick={handleMarkAllAsRead}
                  sx={{ mr: 1 }}
                >
                  Mark all read
                </Button>
              )}
              <Button
                size="small"
                startIcon={<ClearAllIcon />}
                onClick={handleClearAll}
                color="error"
              >
                Clear all
              </Button>
            </Box>
          </Box>
          {counts.unread > 0 && (
            <Chip
              label={`${counts.unread} unread`}
              color="primary"
              size="small"
              sx={{ mt: 1 }}
            />
          )}
        </Box>

        <AnimatePresence>
          {notifications.length === 0 ? (
            <Box sx={{ p: 3, textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                No notifications yet
              </Typography>
            </Box>
          ) : (
            <List sx={{ p: 0 }}>
              {notifications.map((notification, index) => (
                <motion.div
                  key={notification.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.2, delay: index * 0.05 }}
                >
                  <ListItem
                    button
                    onClick={() => handleNotificationClick(notification)}
                    sx={{
                      backgroundColor: notification.isRead ? 'transparent' : 'action.hover',
                      '&:hover': {
                        backgroundColor: 'action.selected',
                      },
                    }}
                  >
                    <ListItemIcon>
                      {getNotificationIcon(notification.type)}
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Box display="flex" justifyContent="space-between" alignItems="center">
                          <Typography
                            variant="subtitle2"
                            sx={{
                              fontWeight: notification.isRead ? 400 : 600,
                              color: notification.isRead ? 'text.secondary' : 'text.primary',
                            }}
                          >
                            {notification.title}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {formatTime(notification.createdAt)}
                          </Typography>
                        </Box>
                      }
                      secondary={
                        <Box>
                          <Typography
                            variant="body2"
                            sx={{
                              color: notification.isRead ? 'text.secondary' : 'text.primary',
                            }}
                          >
                            {notification.message}
                          </Typography>
                          <Chip
                            label={notification.type.replace('_', ' ')}
                            color={getNotificationColor(notification.type) as any}
                            size="small"
                            sx={{ mt: 0.5 }}
                          />
                        </Box>
                      }
                    />
                  </ListItem>
                  {index < notifications.length - 1 && <Divider />}
                </motion.div>
              ))}
            </List>
          )}
        </AnimatePresence>
      </Menu>
    </>
  );
};

export default NotificationBell;
