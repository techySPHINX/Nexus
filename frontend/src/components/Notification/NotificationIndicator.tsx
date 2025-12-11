import { useState, useEffect } from 'react';
import { Badge, IconButton, Tooltip } from '@mui/material';
import { Notifications as NotificationsIcon } from '@mui/icons-material';
import { useNotification } from '@/contexts/NotificationContext';
import NotificationMenu from './NotificationMenu';
import { useTheme } from '@/contexts/ThemeContext';

const NotificationIndicator = () => {
  const { unreadCount, fetchNotifications } = useNotification();

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const handleOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const { isDark } = useTheme();

  // Sound effect for new notifications
  // useEffect(() => {
  //   if (unreadCount > prevUnreadCount) {
  //     playSound();
  //   }
  //   setPrevUnreadCount(unreadCount);
  // }, [unreadCount, prevUnreadCount, playSound]);

  // Polling effect: 30 sec when user is active/visible, 90 sec when inactive/hidden
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;

    const startPolling = (isVisible: boolean = true) => {
      if (interval) {
        clearInterval(interval);
        interval = null;
      }

      const pollInterval = isVisible ? 60000 : 120000; // 60s vs 120s
      interval = setInterval(fetchNotifications, pollInterval);
    };

    const stopPolling = () => {
      if (interval) {
        clearInterval(interval);
        interval = null;
      }
    };

    // Handle visibility change (tab switching, minimize, etc.)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        startPolling(true); // 30s when visible
      } else {
        startPolling(false); // 90s when hidden
      }
    };

    // Handle window focus/blur (browser switching, etc.)
    const handleFocus = () => {
      startPolling(true); // 30s when focused
    };

    const handleBlur = () => {
      startPolling(false); // 90s when blurred
    };

    // Set up event listeners
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);
    window.addEventListener('blur', handleBlur);

    // Start with current visibility state
    startPolling(document.visibilityState === 'visible');

    return () => {
      stopPolling();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('blur', handleBlur);
    };
  }, [fetchNotifications]);

  return (
    <>
      <Tooltip title="Notifications">
        <IconButton
          color="inherit"
          onClick={handleOpen}
          sx={isDark ? { color: 'rgba(255,255,255,0.9)' } : undefined}
        >
          <Badge
            badgeContent={unreadCount}
            color="error"
            max={99}
            sx={
              isDark
                ? {
                    '& .MuiBadge-badge': {
                      backgroundColor: '#ef4444',
                      color: '#fff',
                    },
                  }
                : undefined
            }
          >
            <NotificationsIcon />
          </Badge>
        </IconButton>
      </Tooltip>

      <NotificationMenu anchorEl={anchorEl} handleClose={handleClose} />
    </>
  );
};

export default NotificationIndicator;
