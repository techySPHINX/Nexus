import React, { useState, useEffect } from 'react';
import {
  Badge,
  IconButton,
  Tooltip,
  Popover,
  List,
  ListItem,
  ListItemText,
  Typography,
  Box,
  Button,
  Divider,
  Chip,
  Snackbar,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  Check as CheckIcon,
} from '@mui/icons-material';
import { useNotification } from '@/contexts/NotificationContext';
import { useNavigate } from 'react-router-dom';
import useSound from 'use-sound';
import { formatDistanceToNow } from 'date-fns';
import axios from 'axios';

const NotificationIndicator = () => {
  const {
    unreadCount,
    notifications,
    markAsRead,
    markAllAsRead,
    fetchNotifications,
    loading,
    error,
  } = useNotification();

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const navigate = useNavigate();
  const [playSound] = useSound('/notification.wav');
  const [prevUnreadCount, setPrevUnreadCount] = useState(unreadCount);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error'>(
    'success'
  );

  // Filter to show only unread notifications
  const unreadNotifications = notifications.filter(
    (notification) => !notification.read
  );

  const handleOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleNotificationClick = async (id: string) => {
    try {
      await markAsRead(id);
      showSnackbar('Notification marked as read', 'success');
      fetchNotifications(); // Refresh the notifications
    } catch (err: unknown) {
      showSnackbar('Failed to mark notification as read', 'error');
      if (axios.isAxiosError(err)) {
        console.error(err.response?.data?.message || 'Axios error');
      } else if (err instanceof Error) {
        console.error(err.message);
      } else {
        console.error('Unknown error');
      }
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead();
      showSnackbar('All notifications marked as read', 'success');
      fetchNotifications(); // Refresh the notifications
    } catch (err: unknown) {
      showSnackbar('Failed to mark all as read', 'error');
      if (axios.isAxiosError(err)) {
        console.error(err.response?.data?.message || 'Axios error');
      } else if (err instanceof Error) {
        console.error(err.message);
      } else {
        console.error('Unknown error');
      }
    }
  };

  const showSnackbar = (message: string, severity: 'success' | 'error') => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
  };

  // Sound effect for new notifications
  useEffect(() => {
    if (unreadCount > prevUnreadCount) {
      playSound();
    }
    setPrevUnreadCount(unreadCount);
  }, [unreadCount, prevUnreadCount, playSound]);

  //Polling effect , 30 sec when user is active , stop when inactive
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;

    const startPolling = () => {
      if (!interval) {
        interval = setInterval(fetchNotifications, 60000);
      }
    };

    const stopPolling = () => {
      if (interval) {
        clearInterval(interval);
        interval = null;
      }
    };

    window.addEventListener('focus', startPolling);
    window.addEventListener('blur', stopPolling);

    startPolling(); // start immediately when mounted

    return () => {
      stopPolling();
      window.removeEventListener('focus', startPolling);
      window.removeEventListener('blur', stopPolling);
    };
  }, [fetchNotifications]);

  return (
    <>
      <Tooltip title="Notifications">
        <IconButton color="inherit" onClick={handleOpen}>
          <Badge badgeContent={unreadCount} color="error" max={99}>
            <NotificationsIcon />
          </Badge>
        </IconButton>
      </Tooltip>

      <Popover
        open={Boolean(anchorEl)}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        sx={{
          '& .MuiPaper-root': {
            width: 350,
            maxHeight: '80vh',
            display: 'flex',
            flexDirection: 'column',
          },
        }}
      >
        <Box sx={{ p: 2, bgcolor: 'primary.main', color: 'white' }}>
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
          >
            <Typography variant="h6">
              Notifications
              {unreadCount > 0 && (
                <Chip
                  label={`${unreadCount} unread`}
                  color="secondary"
                  size="small"
                  sx={{ ml: 1, color: 'white' }}
                />
              )}
            </Typography>
            {unreadCount > 0 && (
              <Button
                startIcon={<CheckIcon />}
                onClick={handleMarkAllAsRead}
                size="small"
                sx={{ color: 'white' }}
              >
                Mark all
              </Button>
            )}
          </Box>
        </Box>

        <Box sx={{ flex: 1, overflow: 'auto' }}>
          {loading ? (
            <Box display="flex" justifyContent="center" p={3}>
              <CircularProgress size={24} />
            </Box>
          ) : error ? (
            <Alert severity="error" sx={{ m: 2 }}>
              {error}
            </Alert>
          ) : unreadNotifications.length === 0 ? (
            <Box p={3} textAlign="center">
              <Typography color="text.secondary">
                No unread notifications
              </Typography>
            </Box>
          ) : (
            <List disablePadding>
              {unreadNotifications.slice(0, 5).map((notification) => (
                <React.Fragment key={notification.id}>
                  <ListItem
                    button
                    onClick={() => handleNotificationClick(notification.id)}
                    sx={{
                      bgcolor: 'action.hover',
                      '&:hover': { bgcolor: 'action.selected' },
                    }}
                  >
                    <ListItemText
                      primary={notification.message}
                      secondary={formatDistanceToNow(
                        new Date(notification.createdAt),
                        { addSuffix: true }
                      )}
                      primaryTypographyProps={{
                        fontWeight: 'bold',
                        noWrap: false,
                        textOverflow: 'ellipsis',
                      }}
                    />
                  </ListItem>
                  <Divider />
                </React.Fragment>
              ))}
            </List>
          )}
        </Box>

        <Box sx={{ p: 1.5, borderTop: '1px solid', borderColor: 'divider' }}>
          <Button
            fullWidth
            variant="outlined"
            onClick={() => {
              navigate('/notifications');
              handleClose();
            }}
          >
            View all
          </Button>
        </Box>
      </Popover>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={() => setSnackbarOpen(false)}
          severity={snackbarSeverity}
          sx={{ width: '100%' }}
          elevation={6}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </>
  );
};

export default NotificationIndicator;
