import React, { useEffect, useState, useRef } from 'react';
import { Container, Grid, Typography, Box, Chip } from '@mui/material';
import { Message } from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { useDashboardContext } from '@/contexts/DashBoardContext';
import { useNotification } from '@/contexts/NotificationContext';
import { apiService } from '../services/api';
import { improvedWebSocketService } from '../services/websocket.improved';
import type { WebSocketMessage } from '../services/websocket.improved';

import NetworkOverview from '../components/DashBoard/NetworkOverview';
import ProfileStrength from '../components/DashBoard/ProfileStrength';
import RecommendedProjects from '../components/DashBoard/RecommendedProjects';
import RecentPosts from '../components/DashBoard/RecentPosts';
import RecommendedConnection from '../components/DashBoard/RecommendedConnection';
import UpcomingEvents from '../components/DashBoard/UpcomingEvents';
import NotificationIndicator from '@/components/Notification/NotificationIndicator';
import ThemeToggle from '@/components/ThemeToggle';
import { getErrorMessage } from '@/utils/errorHandler';

type ConnectionStats = {
  total?: number;
  recent30Days?: number;
  pendingReceived?: number;
  byRole?: { alumni?: number; students?: number };
};

interface RecentActivity {
  id: string;
  type: 'connection' | 'message' | 'event' | 'post';
  title: string;
  description: string;
  timestamp: string;
  user?: { name: string; avatar: string };
}

const OnView: React.FC<{
  children: React.ReactNode;
  placeholderHeight?: number;
  rootMargin?: string;
  once?: boolean;
  threshold?: number;
}> = ({
  children,
  placeholderHeight = 180,
  rootMargin = '200px',
  once = true,
  threshold = 0,
}) => {
  const ref = useRef<HTMLDivElement | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (visible) return;

    if (typeof IntersectionObserver === 'undefined') {
      setVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry.isIntersecting) {
          setVisible(true);
          if (once && observer) observer.disconnect();
        }
      },
      { root: null, rootMargin, threshold }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [visible, rootMargin, once, threshold]);

  return (
    <div ref={ref}>
      {visible ? (
        children
      ) : (
        <Box sx={{ minHeight: placeholderHeight, width: '100%' }} />
      )}
    </div>
  );
};

const Dashboard: React.FC = () => {
  const { user, token } = useAuth();
  const { connectionStats } = useDashboardContext();
  const { showNotification } = useNotification();
  const showNotificationRef = useRef(showNotification);

  useEffect(() => {
    showNotificationRef.current = showNotification;
  }, [showNotification]);

  const [stats, setStats] = useState<{
    messages: number;
    pendingRequests: number;
  }>({ messages: 0, pendingRequests: 0 });
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>(
    []
  );

  const fetchMessageCount = async () => {
    try {
      const response = await apiService.messages.getAllConversations();
      if (response?.data) {
        let totalMessages = 0;
        (response.data as Array<{ latestMessage?: unknown }>).forEach(
          (conv) => {
            if (conv.latestMessage) totalMessages++;
          }
        );
        setStats((prev) => ({ ...prev, messages: totalMessages }));
      }
    } catch {
      // noop
    }
  };

  useEffect(() => {
    if (!user?.id || !token) return;

    // Handler functions
    const handleNewMessage = (message: WebSocketMessage) => {
      const newMessage = message.data as {
        id: string;
        sender?: { name?: string };
        receiverId: string;
      };
      if (newMessage.receiverId === user.id) {
        setStats((prev) => ({ ...prev, messages: prev.messages + 1 }));
        showNotificationRef.current?.(
          `${newMessage.sender?.name || 'Someone'} sent you a message`,
          'info'
        );
      }
    };

    const handleConnectionRequest = (message: WebSocketMessage) => {
      const data = message.data as {
        id: string;
        sender?: { name?: string };
      };
      showNotificationRef.current?.(
        `${data.sender?.name || 'Someone'} wants to connect with you`,
        'info'
      );
      setStats((prev) => ({
        ...prev,
        pendingRequests: prev.pendingRequests + 1,
      }));
    };

    const initializeWebSocket = async () => {
      try {
        await improvedWebSocketService.connect(user.id, token);

        // Register event listeners
        improvedWebSocketService.on('NEW_MESSAGE', handleNewMessage);
        improvedWebSocketService.on(
          'CONNECTION_REQUEST',
          handleConnectionRequest
        );
      } catch (error) {
        console.error('Failed to initialize WebSocket for dashboard:', error);
      }
    };

    void initializeWebSocket();

    // Cleanup: Remove event listeners and disconnect
    return () => {
      improvedWebSocketService.off('NEW_MESSAGE');
      improvedWebSocketService.off('CONNECTION_REQUEST');
      // Only disconnect if this is the last component using the service
      // In a real app, you might want to check if other components are using it
      // For now, we'll keep the connection alive for other components
      // improvedWebSocketService.disconnect();
    };
  }, [user?.id, token]);

  const hasInitRef = useRef(false);
  const connectionStatsRef = useRef<ConnectionStats | undefined>(
    connectionStats as ConnectionStats | undefined
  );
  useEffect(() => {
    connectionStatsRef.current = connectionStats as ConnectionStats | undefined;
  }, [connectionStats]);

  useEffect(() => {
    if (!user?.id) return;
    if (hasInitRef.current) return;
    hasInitRef.current = true;

    const init = async () => {
      try {
        await fetchMessageCount();
        try {
          const activitiesResponse =
            await apiService.messages.getAllConversations();
          const activities: RecentActivity[] = [];

          type Conversation = {
            id: string;
            participant?: { name?: string };
            updatedAt: string;
          };

          if (activitiesResponse.data?.conversations) {
            (activitiesResponse.data.conversations as Conversation[])
              .slice(0, 3)
              .forEach((conv) =>
                activities.push({
                  id: conv.id,
                  type: 'message',
                  title: 'New Message',
                  description: `You have a conversation with ${conv.participant?.name || 'Unknown'}`,
                  timestamp: new Date(conv.updatedAt).toLocaleDateString(),
                  user: {
                    name: conv.participant?.name || 'Unknown',
                    avatar: '',
                  },
                })
              );
          }

          const statsSnapshot = connectionStatsRef.current;
          if (
            statsSnapshot &&
            typeof statsSnapshot.total === 'number' &&
            statsSnapshot.total > 0
          ) {
            activities.push({
              id: `connections-${Date.now()}`,
              type: 'connection',
              title: 'Network Update',
              description: `You have ${statsSnapshot.total} total connections`,
              timestamp: new Date().toLocaleDateString(),
            });
          }

          setRecentActivities(activities);
        } catch (err) {
          showNotificationRef.current?.(getErrorMessage(err), 'error');
        }
      } catch (err) {
        showNotificationRef.current?.(getErrorMessage(err), 'error');
      }
    };

    void init();
  }, [user?.id]);

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      <Box sx={{ mb: 6 }}>
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          mb={2}
          sx={{ flexWrap: 'wrap', gap: 1 }}
        >
          <Typography
            variant="h3"
            component="h1"
            sx={{
              fontWeight: 700,
              color: 'text.primary',
              background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            Welcome back, {user?.name?.split(' ')[0] || 'User'}!
          </Typography>

          <Box display="flex" alignItems="center" gap={1.5}>
            <Chip
              icon={<Message sx={{ fontSize: 16 }} />}
              label={`${stats.messages} Messages`}
              color="primary"
              variant="outlined"
              size="small"
            />
            <ThemeToggle />
            <NotificationIndicator />
          </Box>
        </Box>

        <Typography
          variant="h6"
          color="text.secondary"
          sx={{ fontWeight: 400 }}
        >
          Here's your alumni network overview
        </Typography>

        {recentActivities.length > 0 && (
          <Box sx={{ mt: 2 }}>
            <div className="rounded-lg border p-3 bg-transparent">
              <h4 className="text-sm font-semibold mb-2">Recent Activity</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                {recentActivities.slice(0, 4).map((a) => (
                  <li key={a.id} className="flex items-start justify-between">
                    <div>
                      <div className="font-medium text-gray-900">{a.title}</div>
                      <div className="text-xs text-gray-500">
                        {a.description}
                      </div>
                    </div>
                    <div className="text-xs text-gray-400 ml-4">
                      {a.timestamp}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </Box>
        )}
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} lg={8}>
          <Box sx={{ mb: 3 }}>
            <OnView placeholderHeight={280}>
              <NetworkOverview />
            </OnView>
          </Box>

          <Box sx={{ mb: 3 }}>
            <OnView placeholderHeight={280} threshold={0.5}>
              <RecommendedProjects />
            </OnView>
          </Box>

          <Box sx={{ mb: 3 }}>
            <OnView placeholderHeight={280} threshold={0.3}>
              <RecentPosts />
            </OnView>
          </Box>
        </Grid>

        <Grid item xs={12} lg={4}>
          <Box sx={{ mb: 3 }}>
            <OnView placeholderHeight={280}>
              <ProfileStrength />
            </OnView>
          </Box>

          <Box sx={{ mb: 3 }}>
            <OnView placeholderHeight={280} threshold={0.5}>
              <RecommendedConnection />
            </OnView>
          </Box>

          <Box sx={{ mb: 3 }}>
            <OnView placeholderHeight={280} threshold={0.3}>
              <UpcomingEvents />
            </OnView>
          </Box>
        </Grid>
      </Grid>
    </Container>
  );
};

export default Dashboard;
