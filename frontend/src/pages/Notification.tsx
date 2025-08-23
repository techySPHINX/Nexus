import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemAvatar,
  Avatar,
  ListItemText,
  Badge,
  Chip,
  Button,
  Divider,
  Paper,
  IconButton,
  Menu,
  MenuItem,
  CircularProgress,
  Snackbar,
  Alert,
  Pagination,
  Tabs,
  Tab,
  Dialog,
  DialogTitle,
  DialogActions,
  DialogContent,
  DialogContentText,
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  Check as CheckIcon,
  MoreVert as MoreVertIcon,
  Refresh as RefreshIcon,
  Delete as DeleteIcon,
  Mail as MessageIcon,
  People as ConnectionIcon,
  Article as PostIcon,
  Settings as SystemIcon,
  Event as EventIcon,
  Markunread as UnreadIcon,
  PersonAdd as PersonAddIcon,
  PeopleAlt as PeopleAltIcon,
  Favorite as FavoriteIcon,
  ChatBubble as ChatBubbleIcon,
  Mail as MailIcon,
  Settings as SettingsIcon,
  EventAvailable as EventAvailableIcon,
  Info as InfoIcon,
} from '@mui/icons-material';
import { useNotification } from '@/contexts/NotificationContext';
import { NotificationType, NotificationCategory } from '@/types/notification';
import { formatDistanceToNow } from 'date-fns';

const Notification: React.FC = () => {
  const {
    notifications,
    pagination,
    markAsRead,
    markAsUnread,
    markAllAsRead,
    unreadCountsByCategory,
    deleteNotification,
    deleteReadNotifications,
    unreadCount,
    fetchNotifications,
    loading,
    error,
  } = useNotification();

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedNotification, setSelectedNotification] = useState<
    string | null
  >(null);
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    mode: 'single' | 'all' | null;
    notificationId?: string;
  }>({ open: false, mode: null });
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [currentTab, setCurrentTab] = useState<NotificationCategory | 'ALL'>(
    'ALL'
  );
  const [currentPage, setCurrentPage] = useState(1);

  // Map for category to types (same as in context for consistency)
  const categoryToTypes: Record<string, string[]> = {
    CONNECTION: ['CONNECTION_REQUEST', 'CONNECTION_ACCEPTED'],
    POST: ['POST_LIKE', 'POST_COMMENT'],
    MESSAGE: ['MESSAGE'],
    SYSTEM: ['SYSTEM'],
    EVENT: ['EVENT'],
    ALL: [],
  };

  const openMenu = (event: React.MouseEvent<HTMLElement>, id: string) => {
    setAnchorEl(event.currentTarget);
    setSelectedNotification(id);
  };

  const closeMenu = () => {
    setAnchorEl(null);
    setSelectedNotification(null);
  };

  const handleRefresh = async () => {
    await fetchNotifications(currentPage, pagination.limit, currentTab);
    setSnackbarMessage('Notifications refreshed');
    setSnackbarOpen(true);
  };

  const handleMarkAllAsRead = async () => {
    await markAllAsRead();
    setSnackbarMessage('All notifications marked as read');
    setSnackbarOpen(true);
  };

  const handleMarkTabAsRead = async () => {
    let notificationsToMark: string[] = [];

    if (currentTab === 'ALL') {
      notificationsToMark = notifications
        .filter((n) => !n.read)
        .map((n) => n.id);
    } else {
      const typesForTab = categoryToTypes[currentTab] || [];
      notificationsToMark = notifications
        .filter((n) => !n.read && typesForTab.includes(n.type))
        .map((n) => n.id);
    }

    if (notificationsToMark.length === 0) {
      setSnackbarMessage('No unread notifications to mark as read');
      setSnackbarOpen(true);
      return;
    }

    for (const id of notificationsToMark) {
      await markAsRead(id);
    }

    setSnackbarMessage(
      `All ${currentTab === 'ALL' ? '' : currentTab.toLowerCase()} notifications marked as read`
    );
    setSnackbarOpen(true);
  };

  const handleMarkAsRead = async (id: string) => {
    await markAsRead(id);
    closeMenu();
    setSnackbarMessage('Notification marked as read');
    setSnackbarOpen(true);
  };

  const handleMarkAsUnread = async (id: string) => {
    await markAsUnread(id);
    closeMenu();
    setSnackbarMessage('Notification marked as unread');
    setSnackbarOpen(true);
  };

  const handleDeleteNotification = async (id: string): Promise<void> => {
    closeMenu();
    setConfirmDialog({ open: true, mode: 'single', notificationId: id });
  };

  const handleDeleteAllClick = () => {
    closeMenu();
    setConfirmDialog({ open: true, mode: 'all' });
  };

  const handleConfirmForDelete = async () => {
    try {
      if (confirmDialog.mode === 'single' && confirmDialog.notificationId) {
        await deleteNotification(confirmDialog.notificationId);
        setSnackbarMessage('Notification deleted');
      } else if (confirmDialog.mode === 'all') {
        await deleteReadNotifications();
        setSnackbarMessage('All read notifications deleted');
      }
      setSnackbarOpen(true);
    } catch {
      setSnackbarMessage('Failed to delete notifications');
      setSnackbarOpen(true);
    } finally {
      setConfirmDialog({ open: false, mode: null });
    }
  };

  const handleCancel = () => {
    setConfirmDialog({ open: false, mode: null });
  };

  const handleTabChange = (
    _event: React.SyntheticEvent,
    newValue: NotificationCategory | 'ALL'
  ) => {
    setCurrentTab(newValue);
    setCurrentPage(1);
    fetchNotifications(1, pagination.limit, newValue);
  };

  const handlePageChange = (
    _event: React.ChangeEvent<unknown>,
    value: number
  ) => {
    setCurrentPage(value);
    fetchNotifications(value, pagination.limit, currentTab);
  };

  const getNotificationIcon = (type: NotificationType) => {
    switch (type) {
      case NotificationType.CONNECTION_REQUEST:
        return <PersonAddIcon sx={{ color: '#1976d2' }} />;
      case NotificationType.CONNECTION_ACCEPTED:
        return <PeopleAltIcon sx={{ color: '#2e7d32' }} />;
      case NotificationType.POST_LIKE:
        return <FavoriteIcon sx={{ color: '#d32f2f' }} />;
      case NotificationType.POST_COMMENT:
        return <ChatBubbleIcon sx={{ color: '#0288d1' }} />;
      case NotificationType.MESSAGE:
        return <MailIcon sx={{ color: '#7b1fa2' }} />;
      case NotificationType.SYSTEM:
        return <SettingsIcon sx={{ color: '#f9a825' }} />;
      case NotificationType.EVENT:
        return <EventAvailableIcon sx={{ color: '#388e3c' }} />;
      default:
        return <InfoIcon sx={{ color: '#757575' }} />;
    }
  };

  // Filter notifications for the current tab display
  const filteredNotifications =
    currentTab === 'ALL'
      ? notifications
      : notifications.filter((n) =>
          categoryToTypes[currentTab]?.includes(n.type)
        );

  useEffect(() => {
    fetchNotifications(currentPage, pagination.limit, currentTab);
  }, [currentTab, currentPage, fetchNotifications, pagination.limit]);

  const tabConfig: {
    category: NotificationCategory | 'ALL';
    label: string;
    icon: React.ReactNode;
  }[] = [
    {
      category: 'ALL',
      label: 'All',
      icon: <NotificationsIcon sx={{ mr: 1 }} />,
    },
    {
      category: NotificationCategory.CONNECTION,
      label: 'Connections',
      icon: <ConnectionIcon sx={{ mr: 1 }} />,
    },
    {
      category: NotificationCategory.POST,
      label: 'Posts',
      icon: <PostIcon sx={{ mr: 1 }} />,
    },
    {
      category: NotificationCategory.MESSAGE,
      label: 'Messages',
      icon: <MessageIcon sx={{ mr: 1 }} />,
    },
    {
      category: NotificationCategory.SYSTEM,
      label: 'System',
      icon: <SystemIcon sx={{ mr: 1 }} />,
    },
    {
      category: NotificationCategory.EVENT,
      label: 'Events',
      icon: <EventIcon sx={{ mr: 1 }} />,
    },
  ];

  return (
    <Box sx={{ maxWidth: 1000, mx: 'auto', p: 3 }}>
      <Paper elevation={3} sx={{ p: 3 }}>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: 3,
          }}
        >
          <Typography variant="h4" component="h1">
            <NotificationsIcon sx={{ verticalAlign: 'middle', mr: 1 }} />
            Notifications
            {unreadCount > 0 && (
              <Chip
                label={`${unreadCount} unread`}
                color="primary"
                size="small"
                sx={{ ml: 2 }}
              />
            )}
          </Typography>

          <Box>
            <IconButton onClick={handleRefresh} disabled={loading}>
              <RefreshIcon />
            </IconButton>
            {unreadCount > 0 && (
              <Button
                variant="outlined"
                startIcon={<CheckIcon />}
                onClick={handleMarkAllAsRead}
                size="small"
                sx={{ ml: 1 }}
                disabled={loading}
              >
                Mark all as read
              </Button>
            )}
          </Box>
        </Box>

        <Tabs
          value={currentTab}
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
        >
          {tabConfig.map(({ category, label, icon }) => (
            <Tab
              key={category}
              value={category}
              label={
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  {icon}
                  <span style={{ marginLeft: 8 }}>{label}</span>
                  {unreadCountsByCategory[category] > 0 && (
                    <Chip
                      label={unreadCountsByCategory[category]}
                      size="small"
                      color="primary"
                      sx={{ ml: 1 }}
                    />
                  )}
                </Box>
              }
            />
          ))}
        </Tabs>

        <Box sx={{ display: 'flex', justifyContent: 'space-between', my: 2 }}>
          <Button
            variant="outlined"
            startIcon={<CheckIcon />}
            onClick={handleMarkTabAsRead}
            size="small"
            disabled={unreadCountsByCategory[currentTab] === 0 || loading}
          >
            Mark this tab as read
          </Button>
          {currentTab === 'ALL' && (
            <Button
              variant="outlined"
              startIcon={<DeleteIcon />}
              color="error"
              size="small"
              onClick={handleDeleteAllClick}
              disabled={!notifications.some((n) => n.read)}
            >
              Delete All Read Notifications
            </Button>
          )}
        </Box>

        <Divider sx={{ mb: 3 }} />

        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {!loading && filteredNotifications.length === 0 && (
          <Box sx={{ textAlign: 'center', p: 4 }}>
            <Typography variant="body1" color="text.secondary">
              No{' '}
              {currentTab === 'ALL'
                ? ''
                : currentTab.toLowerCase().replace('_', ' ')}{' '}
              notifications
            </Typography>
          </Box>
        )}

        {!loading && filteredNotifications.length > 0 && (
          <>
            <List sx={{ width: '100%' }}>
              {filteredNotifications.map((notification) => (
                <React.Fragment key={notification.id}>
                  <ListItem
                    alignItems="flex-start"
                    sx={{
                      backgroundColor: notification.read
                        ? 'inherit'
                        : 'action.hover',
                      borderRadius: 1,
                      mb: 1,
                    }}
                    secondaryAction={
                      <IconButton
                        edge="end"
                        onClick={(e) => openMenu(e, notification.id)}
                      >
                        <MoreVertIcon />
                      </IconButton>
                    }
                  >
                    <ListItemAvatar>
                      <Badge
                        color="primary"
                        variant="dot"
                        invisible={notification.read}
                      >
                        <Avatar sx={{ bgcolor: 'background.paper' }}>
                          {getNotificationIcon(notification.type)}
                        </Avatar>
                      </Badge>
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <Typography
                          component="span"
                          variant="body1"
                          color="text.primary"
                          sx={{
                            fontWeight: notification.read ? 'normal' : 'bold',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            maxWidth: '60ch',
                          }}
                        >
                          {notification.message.length > 100
                            ? `${notification.message.substring(0, 100)}...`
                            : notification.message}
                        </Typography>
                      }
                      secondary={
                        <Typography
                          component="span"
                          variant="body2"
                          color="text.secondary"
                        >
                          {formatDistanceToNow(
                            new Date(notification.createdAt),
                            {
                              addSuffix: true,
                            }
                          )}
                        </Typography>
                      }
                    />
                  </ListItem>
                  <Divider variant="inset" component="li" />
                </React.Fragment>
              ))}
            </List>

            {pagination?.totalPages > 1 && (
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
                <Pagination
                  count={pagination.totalPages}
                  page={pagination.page}
                  onChange={handlePageChange}
                  color="primary"
                />
              </Box>
            )}
          </>
        )}
      </Paper>

      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={closeMenu}>
        <MenuItem
          onClick={() =>
            selectedNotification && handleMarkAsRead(selectedNotification)
          }
        >
          <CheckIcon sx={{ mr: 1 }} /> Mark as read
        </MenuItem>
        <MenuItem
          onClick={() =>
            selectedNotification && handleMarkAsUnread(selectedNotification)
          }
        >
          <UnreadIcon sx={{ mr: 1 }} /> Mark as unread
        </MenuItem>
        <Divider />
        <MenuItem
          onClick={() =>
            selectedNotification &&
            handleDeleteNotification(selectedNotification)
          }
        >
          <DeleteIcon sx={{ mr: 1 }} /> Delete
        </MenuItem>
      </Menu>

      <Dialog open={confirmDialog.open} onClose={handleCancel}>
        <DialogTitle>
          {confirmDialog.mode === 'single'
            ? 'Delete Notification?'
            : 'Delete All Read Notifications?'}
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            {confirmDialog.mode === 'single'
              ? 'Are you sure you want to delete this notification? This action cannot be undone.'
              : 'Are you sure you want to delete all read notifications? This action cannot be undone.'}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancel}>Cancel</Button>
          <Button color="error" onClick={handleConfirmForDelete}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={() => setSnackbarOpen(false)}
          severity="success"
          sx={{ width: '100%' }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Notification;
