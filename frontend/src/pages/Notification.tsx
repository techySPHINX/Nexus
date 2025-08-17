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
} from '@mui/material';
import {
    Notifications as NotificationsIcon,
    Info as InfoIcon,
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
} from '@mui/icons-material';
import { useNotification } from '@/contexts/NotificationContext';
import { formatDistanceToNow } from 'date-fns';
import relativeTime from 'dayjs/plugin/relativeTime';


enum NotificationType {
    CONNECTION_REQUEST = 'CONNECTION_REQUEST',
    CONNECTION_ACCEPTED = 'CONNECTION_ACCEPTED',
    POST_LIKE = 'POST_LIKE',
    POST_COMMENT = 'POST_COMMENT',
    MESSAGE = 'MESSAGE',
    SYSTEM = 'SYSTEM',
    EVENT = 'EVENT',
}

const Notification: React.FC = () => {
    const {
        notifications,
        markAsRead,
        markAsUnread,
        markAllAsRead,
        deleteNotification,
        unreadCount,
        fetchNotifications,
        loading,
        error,
        user,
    } = useNotification();

    const [page, setPage] = useState(1);
    const [itemsPerPage] = useState(10);
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const [selectedNotification, setSelectedNotification] = useState<string | null>(null);
    const [snackbarOpen, setSnackbarOpen] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState('');
    const [currentTab, setCurrentTab] = useState<NotificationType | 'ALL'>('ALL');

    // Calculate unread counts for each tab
    const getUnreadCountForTab = (tab: NotificationType | 'ALL') => {
        return notifications.filter(notification => {
            const matchesTab = tab === 'ALL' ||
                (tab === 'CONNECTION_REQUEST'
                    ? (notification.type === 'CONNECTION_REQUEST' ||
                        notification.type === 'CONNECTION_ACCEPTED')
                    : notification.type === tab);
            return matchesTab && !notification.read;
        }).length;
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
        await fetchNotifications();
        setSnackbarMessage('Notifications refreshed');
        setSnackbarOpen(true);
    };

    const handleMarkAllAsRead = async () => {
        await markAllAsRead();
        setSnackbarMessage('All notifications marked as read');
        setSnackbarOpen(true);
    };

    const handleMarkTabAsRead = async () => {
        const notificationsToMark = filteredNotifications
            .filter(n => !n.read)
            .map(n => n.id);

        // implement batch mark as read in your context
        // JoyBoy-00
        //future implementation could be like this:
        // await markAsReadBatch(notificationsToMark);
        // if (notificationsToMark.length === 0) {
        //     setSnackbarMessage('No unread notifications to mark as read');
        //     setSnackbarOpen(true);
        //     return;
        // }
        for (const id of notificationsToMark) {
            await markAsRead(id);
        }

        setSnackbarMessage(`All ${currentTab === 'ALL' ? '' : currentTab.toLowerCase()} notifications marked as read`);
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
        await deleteNotification(id);
        closeMenu();
        await fetchNotifications();
        setSnackbarMessage('Notification deleted');
        setSnackbarOpen(true);
    };

    const handlePageChange = (_event: React.ChangeEvent<unknown>, value: number) => {
        setPage(value);
    };

    // Reset to first page when changing tabs
    const handleTabChange = (_event: React.SyntheticEvent, newValue: NotificationType | 'ALL') => {
        setCurrentTab(newValue);
        setPage(1);
    };

    const getUnreadCount = (types: NotificationType[]) => {
        return notifications.filter(n => types.includes(n.type) && !n.read).length;
    };

    const getNotificationIcon = (type: NotificationType) => {
        switch (type) {
            case NotificationType.CONNECTION_REQUEST:
            case NotificationType.CONNECTION_ACCEPTED:
                return <ConnectionIcon color="primary" />;
            case NotificationType.POST_LIKE:
            case NotificationType.POST_COMMENT:
                return <PostIcon color="secondary" />;
            case NotificationType.MESSAGE:
                return <MessageIcon color="info" />;
            case NotificationType.SYSTEM:
                return <SystemIcon color="warning" />;
            case NotificationType.EVENT:
                return <EventIcon color="success" />;
            default:
                return <InfoIcon color="info" />;
        }
    };

    const filteredNotifications = notifications.filter(notification => {
        if (currentTab === 'ALL') return true;
        if (currentTab === NotificationType.CONNECTION_REQUEST) {
            return notification.type === NotificationType.CONNECTION_REQUEST ||
                notification.type === NotificationType.CONNECTION_ACCEPTED;
        }
        if (currentTab === NotificationType.POST_LIKE) {
            return notification.type === NotificationType.POST_LIKE ||
                notification.type === NotificationType.POST_COMMENT;
        }
        return notification.type === currentTab;
    });

    // Pagination logic
    const totalPages = Math.ceil(filteredNotifications.length / itemsPerPage);
    const paginatedNotifications = filteredNotifications.slice(
        (page - 1) * itemsPerPage,
        page * itemsPerPage
    );

    // Refetch when user changes
    useEffect(() => {
        fetchNotifications();
    }, [user]); 

    return (
        <Box sx={{ maxWidth: 1000, mx: 'auto', p: 3 }}>
            <Paper elevation={3} sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
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
                    <Tab
                        label={
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <NotificationsIcon sx={{ mr: 1 }} />
                                All
                                {unreadCount > 0 && (
                                    <Chip label={unreadCount} size="small" color="primary" sx={{ ml: 1 }} />
                                )}
                            </Box>
                        }
                        value="ALL"
                    />
                    <Tab
                        label={
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <ConnectionIcon sx={{ mr: 1 }} />
                                Connections
                                {getUnreadCount([NotificationType.CONNECTION_REQUEST, NotificationType.CONNECTION_ACCEPTED]) > 0 && (
                                    <Chip label={getUnreadCount([NotificationType.CONNECTION_REQUEST, NotificationType.CONNECTION_ACCEPTED])}
                                        size="small"
                                        color='primary'
                                        sx={{ ml: 1 }} />
                                )}
                            </Box>
                        }
                        value={NotificationType.CONNECTION_REQUEST}
                    />
                    <Tab
                        label={
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <PostIcon sx={{ mr: 1 }} />
                                Posts
                                {getUnreadCount([NotificationType.POST_LIKE, NotificationType.POST_COMMENT]) > 0 && (
                                    <Chip label={getUnreadCount([NotificationType.POST_LIKE, NotificationType.POST_COMMENT])}
                                        size="small"
                                        color='primary'
                                        sx={{ ml: 1 }} />
                                )}
                            </Box>
                        }
                        value={NotificationType.POST_LIKE}
                    />
                    <Tab
                        label={
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <MessageIcon sx={{ mr: 1 }} />
                                Messages
                                {getUnreadCountForTab(NotificationType.MESSAGE) > 0 && (
                                    <Chip
                                        label={getUnreadCountForTab(NotificationType.MESSAGE)}
                                        size="small"
                                        color="primary"
                                        sx={{ ml: 1 }}
                                    />
                                )}
                            </Box>
                        }
                        value={NotificationType.MESSAGE}
                    />
                    <Tab
                        label={
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <SystemIcon sx={{ mr: 1 }} />
                                System
                                {getUnreadCountForTab(NotificationType.SYSTEM) > 0 && (
                                    <Chip
                                        label={getUnreadCountForTab(NotificationType.SYSTEM)}
                                        size="small"
                                        color="primary"
                                        sx={{ ml: 1 }}
                                    />
                                )}
                            </Box>
                        }
                        value={NotificationType.SYSTEM}
                    />
                    <Tab
                        label={
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <EventIcon sx={{ mr: 1 }} />
                                Events
                                {getUnreadCountForTab(NotificationType.EVENT) > 0 && (
                                    <Chip
                                        label={getUnreadCountForTab(NotificationType.EVENT)}
                                        size="small"
                                        color="primary"
                                        sx={{ ml: 1 }}
                                    />
                                )}
                            </Box>
                        }
                        value={NotificationType.EVENT}
                    />
                </Tabs>

                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
                    <Button
                        variant="outlined"
                        startIcon={<CheckIcon />}
                        onClick={handleMarkTabAsRead}
                        size="small"
                        disabled={getUnreadCountForTab(currentTab) === 0 || loading}
                    >
                        Mark this tab as read
                    </Button>
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
                            No {currentTab === 'ALL' ? '' : currentTab.toLowerCase().replace('_', ' ')} notifications
                        </Typography>
                    </Box>
                )}

                {!loading && filteredNotifications.length > 0 && (
                    <>
                        <List sx={{ width: '100%' }}>
                            {paginatedNotifications.map((notification) => (
                                <React.Fragment key={notification.id}>
                                    <ListItem
                                        alignItems="flex-start"
                                        sx={{
                                            backgroundColor: notification.read ? 'inherit' : 'action.hover',
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
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                    <Typography
                                                        component="span"
                                                        variant="body1"
                                                        color="text.primary"
                                                        sx={{
                                                            fontWeight: notification.read ? 'normal' : 'bold',
                                                            overflow: 'hidden',
                                                            textOverflow: 'ellipsis',
                                                            whiteSpace: 'nowrap',
                                                            maxWidth: '60ch'
                                                        }}
                                                    >
                                                        {notification.message.length > 100
                                                            ? `${notification.message.substring(0, 100)}...`
                                                            : notification.message}
                                                    </Typography>
                                                </Box>
                                            }
                                            secondary={
                                                <Typography
                                                    component="span"
                                                    variant="body2"
                                                    color="text.secondary"
                                                >
                                                    {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                                                </Typography>
                                            }
                                            sx={{
                                                '& .MuiListItemText-primary': { display: 'flex', alignItems: 'center' },
                                                '& .MuiListItemText-secondary': { mt: 0.5 }
                                            }}
                                        />
                                    </ListItem>
                                    <Divider variant="inset" component="li" />
                                </React.Fragment>
                            ))}
                        </List>

                        {totalPages > 1 && (
                            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
                                <Pagination
                                    count={totalPages}
                                    page={page}
                                    onChange={handlePageChange}
                                    color="primary"
                                />
                            </Box>
                        )}
                    </>
                )}
            </Paper>

            {/* Notification menu */}
            <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={closeMenu}
            >
                <MenuItem onClick={() => selectedNotification && handleMarkAsRead(selectedNotification)}>
                    <CheckIcon sx={{ mr: 1 }} /> Mark as read
                </MenuItem>
                <MenuItem onClick={() => selectedNotification && handleMarkAsUnread(selectedNotification)}>
                    <UnreadIcon sx={{ mr: 1 }} /> Mark as unread
                </MenuItem>
                <Divider />
                <MenuItem onClick={() => selectedNotification && handleDeleteNotification(selectedNotification)}>
                    <DeleteIcon sx={{ mr: 1 }} /> Delete
                </MenuItem>
            </Menu>

            {/* Snackbar for feedback - positioned on the right */}
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
        </Box >
    );
};

export default Notification;