import React, { useState } from 'react';
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
    Avatar,
    ListItemAvatar,
    Chip,
    Snackbar,
    Alert,
    CircularProgress
} from '@mui/material';
import {
    Notifications as NotificationsIcon,
    Check as CheckIcon,
    People as ConnectionIcon,
    Article as PostIcon,
    Mail as MessageIcon,
    Settings as SystemIcon,
    Event as EventIcon,
    Info as InfoIcon
} from '@mui/icons-material';
import { useNotification } from '@/contexts/NotificationContext';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';

enum NotificationType {
    CONNECTION_REQUEST = 'CONNECTION_REQUEST',
    CONNECTION_ACCEPTED = 'CONNECTION_ACCEPTED',
    POST_LIKE = 'POST_LIKE',
    POST_COMMENT = 'POST_COMMENT',
    MESSAGE = 'MESSAGE',
    SYSTEM = 'SYSTEM',
    EVENT = 'EVENT',
}

const NotificationIndicator: React.FC = () => {
    const {
        unreadCount,
        notifications,
        markAsRead,
        markAllAsRead,
        loading,
        error
    } = useNotification();
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const [snackbarOpen, setSnackbarOpen] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState('');
    const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error'>('success');
    const navigate = useNavigate();

    const handleOpen = (event: React.MouseEvent<HTMLElement>) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    const handleNotificationClick = async (id: string) => {
        try {
            await markAsRead(id);
            showSnackbar('Notifications marked as read', 'success');
        } catch (err) {
            showSnackbar('Failed to mark notification as read', 'error');
        }
    };

    const handleMarkAllAsRead = async () => {
        try {
            await markAllAsRead();
            showSnackbar('All notifications marked as read', 'success');
        } catch (err) {
            showSnackbar('Failed to mark all as read', 'error');
        }
    };

    const showSnackbar = (message: string, severity: 'success' | 'error') => {
        setSnackbarMessage(message);
        setSnackbarSeverity(severity);
        setSnackbarOpen(true);
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

    const open = Boolean(anchorEl);
    const id = open ? 'notification-popover' : undefined;

    return (
        <>
            <Tooltip title="Notifications">
                <IconButton
                    color="inherit"
                    onClick={handleOpen}
                    aria-describedby={id}
                    sx={{
                        position: 'relative',
                        '&:hover': {
                            backgroundColor: 'rgba(255, 255, 255, 0.08)'
                        }
                    }}
                >
                    <Badge
                        badgeContent={unreadCount}
                        color="error"
                        max={99}
                        overlap="circular"
                        sx={{
                            '& .MuiBadge-badge': {
                                right: 5,
                                top: 5,
                                border: '2px solid',
                                borderColor: 'background.paper'
                            }
                        }}
                    >
                        <NotificationsIcon sx={{ fontSize: 26 }} />
                    </Badge>
                </IconButton>
            </Tooltip>

            <Popover
                id={id}
                open={open}
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
                        borderRadius: 2,
                        boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.12)',
                        overflow: 'hidden'
                    }
                }}
            >
                <Box sx={{ width: 380 }}>
                    <Box sx={{
                        p: 2,
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        backgroundColor: 'primary.main',
                        color: 'primary.contrastText'
                    }}>
                        <Typography variant="h6" component="div">
                            Notifications
                            {unreadCount > 0 && (
                                <Chip
                                    label={`${unreadCount} unread`}
                                    color="secondary"
                                    size="small"
                                    sx={{ ml: 1.5, color: 'white', fontWeight: 'bold' }}
                                />
                            )}
                        </Typography>
                        {unreadCount > 0 && (
                            <Button
                                variant="text"
                                startIcon={<CheckIcon />}
                                onClick={handleMarkAllAsRead}
                                size="small"
                                disabled={loading}
                                sx={{ color: 'primary.contrastText' }}
                            >
                                Mark all
                            </Button>
                        )}
                    </Box>

                    {loading && (
                        <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                            <CircularProgress size={24} />
                        </Box>
                    )}

                    {error && (
                        <Alert severity="error" sx={{ m: 2 }}>
                            {error}
                        </Alert>
                    )}

                    {!loading && notifications.length === 0 ? (
                        <Box sx={{ p: 3, textAlign: 'center' }}>
                            <Typography variant="body1" color="text.secondary">
                                No new notifications
                            </Typography>
                        </Box>
                    ) : (
                        <>
                            <List sx={{ maxHeight: 400, overflow: 'auto' }}>
                                {notifications.slice(0, 5).map((notification) => (
                                    <React.Fragment key={notification.id}>
                                        <ListItem
                                            button
                                            onClick={() => handleNotificationClick(notification.id)}
                                            sx={{
                                                backgroundColor: notification.read ? 'inherit' : 'action.hover',
                                                transition: 'background-color 0.2s ease',
                                                '&:hover': {
                                                    backgroundColor: notification.read ? 'action.selected' : 'action.hover'
                                                }
                                            }}
                                        >
                                            <ListItemAvatar>
                                                <Badge
                                                    color="primary"
                                                    variant="dot"
                                                    invisible={notification.read}
                                                    overlap="circular"
                                                    anchorOrigin={{
                                                        vertical: 'top',
                                                        horizontal: 'left'
                                                    }}
                                                >
                                                    <Avatar sx={{
                                                        bgcolor: 'background.paper',
                                                        color: 'text.primary'
                                                    }}>
                                                        {getNotificationIcon(notification.type)}
                                                    </Avatar>
                                                </Badge>
                                            </ListItemAvatar>
                                            <ListItemText
                                                primary={
                                                    <Typography
                                                        component="span"
                                                        variant="body1"
                                                        sx={{
                                                            fontWeight: notification.read ? 'normal' : 'bold',
                                                            display: '-webkit-box',
                                                            WebkitLineClamp: 2,
                                                            WebkitBoxOrient: 'vertical',
                                                            overflow: 'hidden',
                                                            textOverflow: 'ellipsis'
                                                        }}
                                                    >
                                                        {notification.message}
                                                    </Typography>
                                                }
                                                secondary={dayjs(notification.timestamp).fromNow()}
                                                secondaryTypographyProps={{
                                                    color: 'text.secondary',
                                                    sx: { mt: 0.5 }
                                                }}
                                            />
                                        </ListItem>
                                        <Divider variant="inset" component="li" />
                                    </React.Fragment>
                                ))}
                            </List>
                            <Box sx={{ p: 1.5 }}>
                                <Button
                                    fullWidth
                                    variant="outlined"
                                    onClick={() => {
                                        navigate('/notifications');
                                        handleClose();
                                    }}
                                    sx={{
                                        borderRadius: 2,
                                        py: 1,
                                        textTransform: 'none',
                                        fontWeight: 'medium'
                                    }}
                                >
                                    View all notifications
                                </Button>
                            </Box>
                        </>
                    )}
                </Box>
            </Popover>

            <Snackbar
                open={snackbarOpen}
                autoHideDuration={4000}
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