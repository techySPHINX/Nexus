import { FC, useEffect, useState, useRef } from 'react';
import { Container, Grid, Typography, Box, Chip } from '@mui/material';
import { Message } from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { useDashboardContext } from '@/contexts/DashBoardContext';
import { useNotification } from '@/contexts/NotificationContext';
import { useEventContext } from '@/contexts/eventContext';
import { apiService } from '../services/api';
import { improvedWebSocketService } from '../services/websocket.improved';
import type { WebSocketMessage } from '../services/websocket.improved';

import NetworkOverview from '../components/DashBoard/NetworkOverview';
import ProfileStrength from '../components/DashBoard/ProfileStrength';
import RecommendedProjects from '../components/DashBoard/RecommendedProjects';
import RecentPosts from '../components/DashBoard/RecentPosts';
import RecommendedConnection from '../components/DashBoard/RecommendedConnection';
import UpcomingEvents from '../components/DashBoard/UpcomingEvents';
import Leaderboard from '../components/DashBoard/LeaderBoard';
import HeroWelcomeCard from '../components/DashBoard/HeroWelcomeCard';
import NotificationIndicator from '@/components/Notification/NotificationIndicator';
import ThemeToggle from '@/components/ThemeToggle';
import { getErrorMessage } from '@/utils/errorHandler';
import { useNavigate } from 'react-router-dom';

type ConnectionStats = {
  total?: number;
  recent30Days?: number;
  pendingReceived?: number;
  byRole?: { alumni?: number; students?: number };
  gender?: string;
};

interface RecentActivity {
  id: string;
  type: 'connection' | 'message' | 'event' | 'post';
  title: string;
  description: string;
  timestamp: string;
  user?: { name: string; avatar: string };
}

const OnView: FC<{
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

const Dashboard: FC = () => {
  const { user, token } = useAuth();
  const {
    connectionStats,
    profileCompletionStats,
    getProfileCompletionStats,
    getConnectionStats,
    loading: { profileCompletion: loadingProfileCompletion },
  } = useDashboardContext();
  const { upcoming, fetchUpcoming, loading: eventsLoading } = useEventContext();
  const { showNotification } = useNotification();
  const showNotificationRef = useRef(showNotification);
  const navigate = useNavigate();

  const [stats, setStats] = useState<{
    messages: number;
    pendingRequests: number;
  }>({ messages: 0, pendingRequests: 0 });
  const [progress, setProgress] = useState(0);
  const fallbackSkills = [
    'Leadership',
    'UI/UX',
    'TypeScript',
    'Node.js',
    'React',
    'SQL',
    'APIs',
    'Testing',
    'Writing',
    'Community',
  ].map((name, idx) => ({ id: `fallback-${idx}`, name }));

  useEffect(() => {
    showNotificationRef.current = showNotification;
  }, [showNotification]);

  // Sync progress with backend stats (profile completion preferred)
  useEffect(() => {
    const target = Math.max(
      0,
      Math.min(
        100,
        Math.round(
          profileCompletionStats?.completionPercentage ??
            connectionStats?.recent30Days ??
            0
        )
      )
    );
    const timer = setTimeout(() => setProgress(target), 250);
    return () => clearTimeout(timer);
  }, [
    profileCompletionStats?.completionPercentage,
    connectionStats?.recent30Days,
  ]);

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
    if (!user?.id || !token) {
      navigate('/login');
      return;
    }

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
    };
  }, [user?.id, token, navigate]);

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
        void getConnectionStats();
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
        } catch (err) {
          showNotificationRef.current?.(getErrorMessage(err), 'error');
        }

        // fetch profile stats (for ProfileStrength component) and upcoming events
        try {
          void getProfileCompletionStats();
        } catch (err) {
          console.debug(
            'Profile stats fetch failed during dashboard init',
            err
          );
        }
        try {
          void fetchUpcoming(3);
        } catch (err) {
          console.debug(
            'Upcoming events fetch failed during dashboard init',
            err
          );
        }
      } catch (err) {
        showNotificationRef.current?.(getErrorMessage(err), 'error');
      }
    };

    void init();
  }, [user?.id, getProfileCompletionStats, getConnectionStats, fetchUpcoming]);

  const displayedSkills = (
    user?.profile?.skills && user.profile.skills.length > 0
      ? user.profile.skills
      : fallbackSkills
  ).slice(0, 10);

  return (
    <Container maxWidth="xl" sx={{ py: 3, px: { xs: 2, md: 3 } }}>
      {/* Top Controls */}
      <Box
        sx={{
          mb: 4,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: { xs: 'flex-start', sm: 'center' },
          flexDirection: { xs: 'column', sm: 'row' },
          flexWrap: 'wrap',
          gap: 2,
        }}
      >
        <Box sx={{ width: '100%', maxWidth: 640 }}>
          <Typography
            variant="h5"
            sx={{
              fontWeight: 600,
              color: 'text.primary',
              background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            Your Network Dashboard
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Track your progress and stay connected
          </Typography>
        </Box>

        <Box
          display="flex"
          alignItems="center"
          gap={1.5}
          sx={{
            width: { xs: '100%', sm: 'auto' },
            justifyContent: { xs: 'flex-start', sm: 'flex-end' },
          }}
        >
          <Chip
            icon={<Message sx={{ fontSize: 16 }} />}
            label={`${stats.messages} Messages`}
            color="primary"
            variant="outlined"
            size="small"
            sx={{ fontWeight: 500 }}
          />
          <ThemeToggle />
          <NotificationIndicator />
        </Box>
      </Box>

      <HeroWelcomeCard
        user={user ?? undefined}
        progress={progress}
        displayedSkills={displayedSkills}
      />

      {/* Main Content Grid - Reordered for mobile */}
      <Grid container spacing={3}>
        {/* Mobile Order: Network, Profile, Connection, Events, Projects, Posts, Leaderboard */}

        {/* Network Overview - Always first */}
        <Grid item xs={12}>
          <OnView placeholderHeight={280}>
            <NetworkOverview />
          </OnView>
        </Grid>

        {/* For Desktop: Left Column (66%) */}
        <Grid item xs={12} lg={8}>
          {/* Mobile Order: Profile Strength */}
          <Box sx={{ mb: 3, display: { xs: 'block', lg: 'none' } }}>
            {!loadingProfileCompletion && profileCompletionStats ? (
              <OnView placeholderHeight={280}>
                <ProfileStrength />
              </OnView>
            ) : null}
          </Box>

          {/* Mobile Order: Recommended Connection */}
          <Box sx={{ mb: 3, display: { xs: 'block', lg: 'none' } }}>
            <OnView placeholderHeight={280} threshold={0.5}>
              <RecommendedConnection />
            </OnView>
          </Box>

          {/* Mobile Order: Upcoming Events */}
          <Box sx={{ mb: 3, display: { xs: 'block', lg: 'none' } }}>
            {!eventsLoading && upcoming && upcoming.length > 0 ? (
              <OnView placeholderHeight={280} threshold={0.3}>
                <UpcomingEvents />
              </OnView>
            ) : null}
          </Box>

          {/* Desktop Order: Projects */}
          <Box sx={{ mb: 3 }}>
            <OnView placeholderHeight={280} threshold={0.5}>
              <RecommendedProjects />
            </OnView>
          </Box>

          {/* Desktop Order: Recent Posts */}
          <Box sx={{ mb: 3 }}>
            <OnView placeholderHeight={280} threshold={0.3}>
              <RecentPosts />
            </OnView>
          </Box>
        </Grid>

        {/* For Desktop: Right Column (33%) */}
        <Grid item xs={12} lg={4}>
          {/* Desktop Order: Profile Strength */}
          <Box sx={{ mb: 3, display: { xs: 'none', lg: 'block' } }}>
            {!loadingProfileCompletion && profileCompletionStats ? (
              <OnView placeholderHeight={280}>
                <ProfileStrength />
              </OnView>
            ) : null}
          </Box>

          {/* Desktop Order: Recommended Connection */}
          <Box sx={{ mb: 3, display: { xs: 'none', lg: 'block' } }}>
            <OnView placeholderHeight={280} threshold={0.5}>
              <RecommendedConnection />
            </OnView>
          </Box>

          {/* Desktop Order: Upcoming Events */}
          <Box sx={{ mb: 3, display: { xs: 'none', lg: 'block' } }}>
            {!eventsLoading && upcoming && upcoming.length > 0 ? (
              <OnView placeholderHeight={280} threshold={0.3}>
                <UpcomingEvents />
              </OnView>
            ) : null}
          </Box>

          {/* Leaderboard - Always last in sidebar */}
          <OnView placeholderHeight={280} threshold={0.3}>
            <Leaderboard currentUserId={user?.id} maxItems={6} compact={true} />
          </OnView>
        </Grid>
      </Grid>
    </Container>
  );
};

export default Dashboard;
