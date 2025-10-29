import { useNotification } from '@/contexts/NotificationContext';
import {
  Popover,
  Box,
  Typography,
  Chip,
  Button,
  CircularProgress,
  Alert,
  List,
  ListItem,
  ListItemText,
  Divider,
  Snackbar,
  ClickAwayListener,
  Paper,
} from '@mui/material';
import axios from 'axios';
import { formatDistanceToNow } from 'date-fns';
import React, { useState } from 'react';
import CheckIcon from '@mui/icons-material/Check';
import { useNavigate } from 'react-router-dom';

interface NotificationMenuProps {
  // If provided, the menu will be rendered as a Popover anchored to this element.
  // If omitted, the menu can be shown using `open` and will render as a fixed panel
  // unless `inline` is set, in which case it renders as a regular div in the document flow.
  anchorEl?: HTMLElement | null;
  handleClose: () => void;
  // Only used when anchorEl is not provided
  open?: boolean;
  // When true and anchorEl is not provided, render as a regular div that takes space in the layout
  inline?: boolean;
}

const NotificationMenu: React.FC<NotificationMenuProps> = ({
  anchorEl = null,
  handleClose,
  open = false,
  inline = false,
}) => {
  const {
    markAsRead,
    markAllAsRead,
    fetchNotifications,
    unreadCount,
    notifications,
    loading,
    error,
  } = useNotification();
  const navigate = useNavigate();

  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error'>(
    'success'
  );

  const unreadNotifications = notifications.filter(
    (notification) => !notification.read
  );

  const handleNotificationClick = async (id: string) => {
    try {
      await markAsRead(id);
      showSnackbar('Notification marked as read', 'success');
      fetchNotifications();
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
      fetchNotifications();
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

  const isAnchored = Boolean(anchorEl);
  const isOpen = isAnchored ? Boolean(anchorEl) : open;

  // Inline-specific style adjustments per request
  const headerBg = inline ? 'white' : 'primary.main';
  const headerColor = inline ? 'text.primary' : 'white';
  const markAllSx = inline ? { color: 'primary.main' } : { color: 'white' };
  const unreadChipSx = inline
    ? { ml: 1, backgroundColor: 'primary.main', color: 'white' }
    : { ml: 1, color: 'white' };
  const contentFontSize = inline ? '0.9rem' : undefined;
  const titleFontSize = inline ? '1rem' : undefined;
  const primaryTextSx = inline
    ? { fontWeight: 'bold', fontSize: '0.9rem', color: 'text.primary' }
    : { fontWeight: 'bold' };
  const secondaryTextSx = inline ? { fontSize: '0.75rem' } : undefined;

  const content = (
    <Box
      sx={{
        width: 350,
        maxHeight: '80vh',
        display: 'flex',
        flexDirection: 'column',
        bgcolor: inline ? 'white' : undefined,
        color: inline ? 'text.primary' : undefined,
        fontSize: contentFontSize,
      }}
      role="dialog"
      aria-label="Notifications"
    >
      <Box sx={{ p: 2, bgcolor: headerBg, color: headerColor }}>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6" sx={{ fontSize: titleFontSize }}>
            Notifications
            {unreadCount > 0 && (
              <Chip
                label={`${unreadCount} unread`}
                size="small"
                sx={unreadChipSx}
              />
            )}
          </Typography>
          {unreadCount > 0 && (
            <Button
              startIcon={<CheckIcon />}
              onClick={handleMarkAllAsRead}
              size="small"
              sx={markAllSx}
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
                      {
                        addSuffix: true,
                      }
                    )}
                    primaryTypographyProps={{
                      sx: primaryTextSx,
                      noWrap: false,
                      textOverflow: 'ellipsis',
                    }}
                    secondaryTypographyProps={{ sx: secondaryTextSx }}
                  />
                </ListItem>
                <Divider />
              </React.Fragment>
            ))}
          </List>
        )}
      </Box>
      {!inline && (
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
      )}
    </Box>
  );

  return (
    <>
      {isAnchored ? (
        <Popover
          open={isOpen}
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
          {content}
        </Popover>
      ) : (
        isOpen &&
        (inline ? (
          // Inline variant: occupies space in the document flow
          <Box
            sx={{
              width: 350,
              maxHeight: '80vh',
              display: 'flex',
              flexDirection: 'column',
              // allow it to grow/shrink like a normal element
              mb: 2,
              bgcolor: 'white',
              color: 'text.primary',
              fontSize: contentFontSize,
              // border + shadow on all sides when inline
              border: '1px solid',
              borderColor: 'divider',
              boxShadow:
                '0 1px 3px rgba(0,0,0,0.12), 0 0 0 1px rgba(0,0,0,0.04)',
              borderRadius: 1,
            }}
            role="region"
            aria-label="Notifications (inline)"
          >
            {content}
          </Box>
        ) : (
          // Fixed floating panel variant (existing behavior)
          <ClickAwayListener onClickAway={handleClose}>
            <Paper
              elevation={6}
              sx={{
                position: 'fixed',
                top: 64,
                right: 16,
                width: 350,
                maxHeight: '80vh',
                display: 'flex',
                flexDirection: 'column',
                zIndex: (theme) => theme.zIndex.modal,
              }}
            >
              {content}
            </Paper>
          </ClickAwayListener>
        ))
      )}

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

export default NotificationMenu;
