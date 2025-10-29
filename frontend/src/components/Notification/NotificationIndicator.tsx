import React, { useState, useEffect } from 'react';
import { Badge, IconButton, Tooltip } from '@mui/material';
import { Notifications as NotificationsIcon } from '@mui/icons-material';
import { useNotification } from '@/contexts/NotificationContext';
import NotificationMenu from './NotificationMenu';

const NotificationIndicator = () => {
  const { unreadCount, fetchNotifications } = useNotification();

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const handleOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

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

      const pollInterval = isVisible ? 30000 : 90000; // 30s vs 90s
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
        <IconButton color="inherit" onClick={handleOpen}>
          <Badge badgeContent={unreadCount} color="error" max={99}>
            <NotificationsIcon />
          </Badge>
        </IconButton>
      </Tooltip>

      <NotificationMenu anchorEl={anchorEl} handleClose={handleClose} />
    </>
  );
};

export default NotificationIndicator;
