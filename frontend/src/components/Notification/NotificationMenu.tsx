import { useNotification } from '@/contexts/NotificationContext';
import {
  Popover,
  Box,
  Typography,
  Button,
  CircularProgress,
  Alert,
  List,
  ListItemText,
  Divider,
  Snackbar,
  ClickAwayListener,
  Paper,
  Avatar,
  ListItemButton,
  ListItemAvatar,
} from '@mui/material';
import axios from 'axios';
import { formatDistanceToNow } from 'date-fns';
import CheckIcon from '@mui/icons-material/Check';
import NotificationsNoneOutlinedIcon from '@mui/icons-material/NotificationsNoneOutlined';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import PeopleAltIcon from '@mui/icons-material/PeopleAlt';
import FavoriteIcon from '@mui/icons-material/Favorite';
import ChatBubbleIcon from '@mui/icons-material/ChatBubble';
import MailIcon from '@mui/icons-material/Mail';
import SettingsIcon from '@mui/icons-material/Settings';
import EventAvailableIcon from '@mui/icons-material/EventAvailable';
import HandshakeIcon from '@mui/icons-material/Handshake';
import InfoIcon from '@mui/icons-material/Info';
import { FC, Fragment, useEffect, useState } from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { useNavigate } from 'react-router-dom';
import {
  Notification,
  NotificationType,
  getNotificationEmoji,
} from '@/types/notification';
import { fetchNotificationsService } from '@/services/notificationService';

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

const NotificationMenu: FC<NotificationMenuProps> = ({
  anchorEl = null,
  handleClose,
  open = false,
}) => {
  const { markAsRead, markAllAsRead, refreshUnreadCounts, unreadCount } =
    useNotification();
  const navigate = useNavigate();
  const { isDark } = useTheme();
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error'>(
    'success'
  );
  const [unreadNotifications, setUnreadNotifications] = useState<
    Notification[]
  >([]);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);

  const loadUnreadPreview = async () => {
    setLoadingPreview(true);
    setPreviewError(null);
    try {
      const response = await fetchNotificationsService(1, 20, undefined, true);
      setUnreadNotifications(
        response.notification.filter((n: Notification) => !n.read)
      );
    } catch {
      setPreviewError('Failed to load unread notifications');
    } finally {
      setLoadingPreview(false);
    }
  };

  const handleNotificationClick = async (id: string) => {
    try {
      await markAsRead(id);
      showSnackbar('Notification marked as read', 'success');
      await refreshUnreadCounts();
      await loadUnreadPreview();
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
      await refreshUnreadCounts();
      await loadUnreadPreview();
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

  useEffect(() => {
    if (isOpen) {
      void loadUnreadPreview();
      void refreshUnreadCounts();
    }
  }, [isOpen, refreshUnreadCounts]);

  // Inline-specific style adjustments per request
  // Use theme-aware palette values so dark mode looks correct
  const headerBg = isDark ? 'primary.dark' : 'primary.main';
  const headerColor = 'primary.contrastText';
  const markAllSx = { color: 'primary.contrastText', fontSize: '0.8rem' };
  // const unreadChipSx = {
  //   ml: 1,
  //   color: 'primary.contrastText',
  //   bgcolor: 'primary.main',
  // };
  const contentFontSize = '0.95rem';
  const titleFontSize = '1rem';
  const primaryTextSx = {
    fontWeight: 'bold',
    fontSize: '0.95rem',
    color: 'text.primary',
  };
  const secondaryTextSx = { fontSize: '0.85rem' };

  const getNotificationIcon = (type: NotificationType) => {
    switch (type) {
      case NotificationType.CONNECTION_REQUEST:
        return <PersonAddIcon fontSize="small" />;
      case NotificationType.CONNECTION_ACCEPTED:
        return <PeopleAltIcon fontSize="small" />;
      case NotificationType.POST_VOTE:
        return <FavoriteIcon fontSize="small" />;
      case NotificationType.POST_COMMENT:
        return <ChatBubbleIcon fontSize="small" />;
      case NotificationType.MESSAGE:
        return <MailIcon fontSize="small" />;
      case NotificationType.SYSTEM:
        return <SettingsIcon fontSize="small" />;
      case NotificationType.EVENT:
        return <EventAvailableIcon fontSize="small" />;
      case NotificationType.REFERRAL_APPLICATION:
      case NotificationType.REFERRAL_STATUS_UPDATE:
      case NotificationType.REFERRAL_APPLICATION_STATUS_UPDATE:
        return <HandshakeIcon fontSize="small" />;
      default:
        return <InfoIcon fontSize="small" />;
    }
  };

  const content = (
    <Box
      sx={{
        width: '60vh',
        maxHeight: '70vh',
        display: 'flex',
        flexDirection: 'column',
        bgcolor: (theme) => theme.palette.background.paper,
        color: (theme) => theme.palette.text.primary,
        border: '1px solid',
        borderColor: 'divider',
        boxShadow: '0 1px 3px rgba(0,0,0,0.12), 0 0 0 1px rgba(0,0,0,0.04)',
        borderRadius: '16px',
        fontSize: contentFontSize,
      }}
      role="dialog"
      aria-label="Notifications"
    >
      <Box
        sx={{
          p: '0.7rem',
          bgcolor: headerBg,
          color: headerColor,
          borderRadius: '16px 16px 0 0',
        }}
      >
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography
            variant="h6"
            sx={{
              fontSize: titleFontSize,
              width: '30vh',
              paddingLeft: '1rem',
              color: 'inherit',
            }}
          >
            Notifications
            {/* {unreadCount > 0 && (
              <Chip
                label={`${unreadCount} unread`}
                size="small"
                sx={unreadChipSx}
              />
            )} */}
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

      <Box
        sx={{
          flex: 1,
          overflow: 'auto',
          // custom thin scrollbar that matches the theme
          '&::-webkit-scrollbar': { width: 8 },
          '&::-webkit-scrollbar-track': { background: 'transparent' },
          '&::-webkit-scrollbar-thumb': {
            backgroundColor: (theme) => theme.palette.divider,
            borderRadius: 8,
          },
        }}
      >
        {loadingPreview ? (
          <Box display="flex" justifyContent="center" p={3}>
            <CircularProgress size={24} />
          </Box>
        ) : previewError ? (
          <Alert severity="error" sx={{ m: 2 }}>
            {previewError}
          </Alert>
        ) : unreadNotifications.length === 0 ? (
          <Box
            p={1}
            textAlign="center"
            display="flex"
            flexDirection="column"
            alignItems="center"
            gap={1}
          >
            <Avatar
              sx={{
                bgcolor: 'transparent',
                color: 'primary.main',
                width: 56,
                height: 56,
                boxShadow: 'none',
              }}
            >
              <NotificationsNoneOutlinedIcon fontSize="large" />
            </Avatar>
            <Typography variant="subtitle1" sx={{ mt: 0.5 }}>
              You're all caught up
            </Typography>
            <Typography color="text.secondary" sx={{ fontSize: '0.9rem' }}>
              No unread notifications at the moment
            </Typography>
          </Box>
        ) : (
          <List disablePadding>
            {unreadNotifications.slice(0, 5).map((notification) => (
              <Fragment key={notification.id}>
                <ListItemButton
                  onClick={() => handleNotificationClick(notification.id)}
                  sx={{
                    alignItems: 'flex-start',
                    py: 1.25,
                    px: 2,
                    bgcolor: 'action.hover',
                    '&:hover': { bgcolor: 'action.selected' },
                  }}
                >
                  <ListItemAvatar sx={{ minWidth: 44 }}>
                    <Avatar
                      sx={{
                        bgcolor: 'primary.light',
                        color: 'primary.contrastText',
                        width: 40,
                        height: 40,
                      }}
                    >
                      {getNotificationIcon(notification.type)}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={`${getNotificationEmoji(notification.type)} ${notification.message}`}
                    secondary={formatDistanceToNow(
                      new Date(notification.createdAt),
                      {
                        addSuffix: true,
                      }
                    )}
                    primaryTypographyProps={{
                      sx: primaryTextSx,
                      noWrap: false,
                      style: { whiteSpace: 'normal' },
                    }}
                    secondaryTypographyProps={{
                      sx: {
                        color: 'text.secondary',
                        ...(secondaryTextSx || {}),
                      },
                    }}
                  />
                </ListItemButton>
                <Divider component="li" />
              </Fragment>
            ))}
          </List>
        )}
      </Box>
      <Box
        sx={{
          p: 0.5,
          justifyContent: 'center',
          display: 'flex',
          borderTop: '1px solid',
          borderColor: 'divider',
          minHeight: '45px',
          gap: 1,
        }}
      >
        {unreadCount > 0 && (
          <Button
            fullWidth
            size="small"
            sx={{ color: 'primary.main' }}
            onClick={() => {
              navigate('/notifications/unread');
              handleClose();
            }}
          >
            View unread
          </Button>
        )}
        <Button
          fullWidth
          size="small"
          sx={{ color: 'text.primary' }}
          onClick={() => {
            navigate('/notifications');
            handleClose();
          }}
        >
          View all
        </Button>
      </Box>
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
              width: '60vh',
              maxHeight: '70vh',
              display: 'flex',
              flexDirection: 'column',
            },
          }}
        >
          {content}
        </Popover>
      ) : (
        isOpen && (
          <ClickAwayListener onClickAway={handleClose}>
            <Paper
              elevation={6}
              sx={{
                position: 'fixed',
                top: 64,
                right: 16,
                width: '60vh',
                maxHeight: '70vh',
                display: 'flex',
                flexDirection: 'column',
                zIndex: (theme) => theme.zIndex.modal,
              }}
            >
              {content}
            </Paper>
          </ClickAwayListener>
        )
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
