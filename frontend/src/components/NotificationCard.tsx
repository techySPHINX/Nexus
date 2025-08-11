import React from 'react';
import {
  Card,
  CardContent,
  Box,
  Typography,
  Avatar,
  IconButton,
  Chip,
  Button,
  ListItemIcon,
} from '@mui/material';
import {
  Notifications,
  PersonAdd,
  Message,
  ThumbUp,
  Comment,
  School,
  Work,
  Check,
  Close,
  MarkEmailRead,
  MarkEmailUnread,
} from '@mui/icons-material';
import { motion } from 'framer-motion';

interface Notification {
  id: string;
  type: 'connection_request' | 'connection_accepted' | 'message' | 'like' | 'comment' | 'system';
  title: string;
  message: string;
  userId?: string;
  userName?: string;
  userRole?: string;
  createdAt: string;
  isRead: boolean;
  actionRequired?: boolean;
}

interface NotificationCardProps {
  notification: Notification;
  onMarkAsRead: (id: string) => void;
  onMarkAsUnread: (id: string) => void;
  onAcceptConnection?: (userId: string) => void;
  onRejectConnection?: (userId: string) => void;
  onDelete: (id: string) => void;
}

const NotificationCard: React.FC<NotificationCardProps> = ({
  notification,
  onMarkAsRead,
  onMarkAsUnread,
  onAcceptConnection,
  onRejectConnection,
  onDelete,
}) => {
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'connection_request':
        return <PersonAdd color="primary" />;
      case 'connection_accepted':
        return <PersonAdd color="success" />;
      case 'message':
        return <Message color="info" />;
      case 'like':
        return <ThumbUp color="secondary" />;
      case 'comment':
        return <Comment color="secondary" />;
      case 'system':
        return <Notifications color="action" />;
      default:
        return <Notifications color="action" />;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'connection_request':
        return 'primary';
      case 'connection_accepted':
        return 'success';
      case 'message':
        return 'info';
      case 'like':
        return 'secondary';
      case 'comment':
        return 'secondary';
      case 'system':
        return 'default';
      default:
        return 'default';
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'STUDENT':
        return <School fontSize="small" />;
      case 'ALUM':
        return <Work fontSize="small" />;
      default:
        return <School fontSize="small" />;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'STUDENT':
        return 'primary';
      case 'ALUM':
        return 'secondary';
      default:
        return 'default';
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInHours < 168) return `${Math.floor(diffInHours / 24)}d ago`;
    return date.toLocaleDateString();
  };

  const renderActionButtons = () => {
    if (notification.type === 'connection_request' && notification.userId) {
      return (
        <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
          <Button
            variant="contained"
            size="small"
            startIcon={<Check />}
            onClick={() => onAcceptConnection?.(notification.userId!)}
            sx={{ minWidth: 100 }}
          >
            Accept
          </Button>
          <Button
            variant="outlined"
            size="small"
            startIcon={<Close />}
            onClick={() => onRejectConnection?.(notification.userId!)}
            sx={{ minWidth: 100 }}
          >
            Decline
          </Button>
        </Box>
      );
    }
    return null;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card 
        sx={{ 
          mb: 2, 
          borderLeft: notification.isRead ? 'none' : '4px solid',
          borderLeftColor: getNotificationColor(notification.type),
          backgroundColor: notification.isRead ? 'background.paper' : 'action.hover',
        }}
      >
        <CardContent>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
            <Avatar
              sx={{
                width: 48,
                height: 48,
                bgcolor: 'background.paper',
                color: 'text.secondary',
              }}
            >
              {getNotificationIcon(notification.type)}
            </Avatar>

            <Box sx={{ flexGrow: 1 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                <Box sx={{ flexGrow: 1 }}>
                  <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                    {notification.title}
                  </Typography>
                  
                  {notification.userName && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <Typography variant="body2" color="text.secondary">
                        from
                      </Typography>
                      <Chip
                        icon={getRoleIcon(notification.userRole || 'STUDENT')}
                        label={notification.userName}
                        size="small"
                        color={getRoleColor(notification.userRole || 'STUDENT')}
                        variant="outlined"
                      />
                    </Box>
                  )}

                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    {notification.message}
                  </Typography>

                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <Typography variant="caption" color="text.secondary">
                      {formatTime(notification.createdAt)}
                    </Typography>
                    {notification.actionRequired && (
                      <Chip
                        label="Action Required"
                        size="small"
                        color="warning"
                        variant="outlined"
                      />
                    )}
                  </Box>
                </Box>

                <Box sx={{ display: 'flex', gap: 0.5 }}>
                  <IconButton
                    size="small"
                    onClick={() => notification.isRead 
                      ? onMarkAsUnread(notification.id)
                      : onMarkAsRead(notification.id)
                    }
                    color={notification.isRead ? 'default' : 'primary'}
                  >
                    {notification.isRead ? <MarkEmailUnread /> : <MarkEmailRead />}
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={() => onDelete(notification.id)}
                    color="error"
                  >
                    <Close />
                  </IconButton>
                </Box>
              </Box>

              {renderActionButtons()}
            </Box>
          </Box>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default NotificationCard;
