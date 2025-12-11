import { FC, useEffect, useState, useRef } from 'react';
import {
  Container,
  Grid,
  Typography,
  Box,
  Chip,
  Card,
  CardContent,
  Avatar,
} from '@mui/material';
import { Message, Star, Celebration } from '@mui/icons-material';
import { useTheme, alpha } from '@mui/material/styles';
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
  const theme = useTheme();

  const skillPalette = [
    {
      bg: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.light} 100%)`,
      glow: alpha(theme.palette.primary.main, 0.32),
    },
    {
      bg: `linear-gradient(135deg, ${theme.palette.secondary.main} 0%, ${alpha(theme.palette.secondary.light, 0.9)} 100%)`,
      glow: alpha(theme.palette.secondary.main, 0.3),
    },
    {
      bg: `linear-gradient(135deg, ${theme.palette.info.main} 0%, ${theme.palette.info.light} 100%)`,
      glow: alpha(theme.palette.info.main, 0.32),
    },
    {
      bg: `linear-gradient(135deg, ${theme.palette.success.main} 0%, ${theme.palette.success.light} 100%)`,
      glow: alpha(theme.palette.success.main, 0.32),
    },
    {
      bg: `linear-gradient(135deg, ${theme.palette.warning.main} 0%, ${theme.palette.warning.light} 100%)`,
      glow: alpha(theme.palette.warning.main, 0.32),
    },
  ];
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

      {/* Hero Welcome Card with Integrated Skills Visualization */}
      <Card
        sx={{
          mb: 4,
          backgroundColor: alpha(theme.palette.background.paper, 0.8),
          backdropFilter: 'blur(12px)',
          borderRadius: '20px',
          border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
          overflow: 'hidden',
          position: 'relative',
          boxShadow:
            theme.palette.mode === 'dark'
              ? `0 8px 32px ${alpha(theme.palette.common.black, 0.3)}`
              : `0 8px 32px ${alpha(theme.palette.common.black, 0.08)}`,
          transition: 'all 0.3s ease',
          '&:hover': {
            boxShadow:
              theme.palette.mode === 'dark'
                ? `0 12px 40px ${alpha(theme.palette.common.black, 0.4)}`
                : `0 12px 40px ${alpha(theme.palette.common.black, 0.12)}`,
            transform: 'translateY(-2px)',
          },
        }}
      >
        {/* Decorative background elements */}
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background:
              theme.palette.mode === 'dark'
                ? `radial-gradient(circle at 20% 80%, ${alpha(theme.palette.primary.main, 0.08)} 0%, transparent 50%),
           radial-gradient(circle at 80% 20%, ${alpha(theme.palette.secondary.main, 0.08)} 0%, transparent 50%)`
                : `radial-gradient(circle at 20% 80%, ${alpha(theme.palette.primary.light, 0.06)} 0%, transparent 50%),
           radial-gradient(circle at 80% 20%, ${alpha(theme.palette.secondary.light, 0.06)} 0%, transparent 50%)`,
            zIndex: 0,
          }}
        />

        {/* Subtle grid pattern */}
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundImage:
              theme.palette.mode === 'dark'
                ? `linear-gradient(90deg, ${alpha(theme.palette.divider, 0.05)} 1px, transparent 1px),
           linear-gradient(${alpha(theme.palette.divider, 0.05)} 1px, transparent 1px)`
                : `linear-gradient(90deg, ${alpha(theme.palette.divider, 0.03)} 1px, transparent 1px),
           linear-gradient(${alpha(theme.palette.divider, 0.03)} 1px, transparent 1px)`,
            backgroundSize: '40px 40px',
            zIndex: 0,
          }}
        />

        <CardContent
          sx={{ position: 'relative', zIndex: 2, p: { xs: 3, md: 4 } }}
        >
          <Grid container spacing={3} alignItems="center">
            {/* Left Column - User Info */}
            <Grid item xs={12} md={6}>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  flexDirection: { xs: 'column', md: 'row' },
                  gap: 3,
                  textAlign: { xs: 'center', md: 'left' },
                }}
              >
                {/* Avatar with Status */}
                <Box sx={{ position: 'relative' }}>
                  <Avatar
                    src={user?.profile?.avatarUrl || undefined}
                    alt={user?.name}
                    sx={{
                      width: { xs: 80, md: 100 },
                      height: { xs: 80, md: 100 },
                      border:
                        theme.palette.mode === 'dark'
                          ? `3px solid ${alpha(theme.palette.primary.main, 0.4)}`
                          : `3px solid ${alpha(theme.palette.primary.light, 0.6)}`,
                      boxShadow:
                        theme.palette.mode === 'dark'
                          ? `0 8px 24px ${alpha(theme.palette.primary.main, 0.3)}`
                          : `0 8px 24px ${alpha(theme.palette.primary.main, 0.2)}`,
                      backgroundColor:
                        theme.palette.mode === 'dark'
                          ? alpha(theme.palette.background.paper, 0.9)
                          : alpha(theme.palette.background.paper, 0.95),
                    }}
                  />
                  <Box
                    sx={{
                      position: 'absolute',
                      bottom: 4,
                      right: 4,
                      width: 24,
                      height: 24,
                      borderRadius: '50%',
                      background:
                        theme.palette.mode === 'dark' ? '#059669' : '#10b981',
                      border: `2px solid ${theme.palette.background.paper}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      animation: 'pulse 2s ease-in-out infinite',
                      '@keyframes pulse': {
                        '0%, 100%': { transform: 'scale(1)' },
                        '50%': { transform: 'scale(1.1)' },
                      },
                    }}
                  >
                    <Star sx={{ fontSize: 12, color: 'white' }} />
                  </Box>
                </Box>

                {/* Welcome Message */}
                <Box sx={{ flex: 1 }}>
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1.5,
                      mb: 2,
                      justifyContent: { xs: 'center', md: 'flex-start' },
                    }}
                  >
                    <Celebration
                      sx={{
                        color:
                          theme.palette.mode === 'dark' ? '#10b981' : '#059669',
                        fontSize: '1.8rem',
                      }}
                    />
                    <Typography
                      variant="overline"
                      sx={{
                        color: theme.palette.text.primary,
                        fontWeight: 700,
                        letterSpacing: 1.5,
                        fontSize: '0.8rem',
                        textTransform: 'uppercase',
                      }}
                    >
                      Welcome Back!
                    </Typography>
                  </Box>

                  <Typography
                    variant="h4"
                    sx={{
                      fontWeight: 800,
                      mb: 2,
                      color: theme.palette.text.primary,
                      fontSize: { xs: '1.6rem', md: '2rem' },
                      lineHeight: 1.2,
                    }}
                  >
                    Hello, {user?.name?.split(' ')[0] || 'Friend'}
                    <Box
                      component="span"
                      sx={{
                        display: 'block',
                        color:
                          theme.palette.mode === 'dark' ? '#a7f3d0' : '#059669',
                        fontWeight: 800,
                        fontSize: { xs: '1.4rem', md: '1.8rem' },
                      }}
                    >
                      Momentum: {progress}%
                    </Box>
                  </Typography>

                  {/* Progress Bar */}
                  <Box sx={{ maxWidth: 320, mt: 3 }}>
                    <Box
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        mb: 1,
                        alignItems: 'center',
                      }}
                    >
                      <Typography
                        variant="body2"
                        sx={{
                          color: theme.palette.text.secondary,
                          fontWeight: 600,
                        }}
                      >
                        Weekly Progress
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{
                          fontWeight: 700,
                          color:
                            theme.palette.mode === 'dark'
                              ? '#a7f3d0'
                              : '#059669',
                        }}
                      >
                        {progress}% Complete
                      </Typography>
                    </Box>
                    <Box
                      sx={{
                        height: 8,
                        bgcolor:
                          theme.palette.mode === 'dark'
                            ? alpha(theme.palette.divider, 0.4)
                            : alpha(theme.palette.divider, 0.2),
                        borderRadius: 4,
                        overflow: 'hidden',
                        border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
                      }}
                    >
                      <Box
                        sx={{
                          height: '100%',
                          width: `${progress}%`,
                          borderRadius: 4,
                          transition:
                            'width 1.5s cubic-bezier(0.34, 1.56, 0.64, 1)',
                          background:
                            theme.palette.mode === 'dark'
                              ? `linear-gradient(90deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`
                              : `linear-gradient(90deg, ${theme.palette.primary.light} 0%, ${theme.palette.secondary.light} 100%)`,
                          boxShadow:
                            theme.palette.mode === 'dark'
                              ? `0 0 16px ${alpha(theme.palette.primary.main, 0.5)}`
                              : `0 0 16px ${alpha(theme.palette.primary.main, 0.3)}`,
                        }}
                      />
                    </Box>
                  </Box>
                </Box>
              </Box>
            </Grid>

            {/* Right Column - Skills Distribution */}
            <Grid item xs={12} md={6}>
              <Box
                sx={{
                  position: 'relative',
                  height: { xs: 280, md: 280 },
                  width: '100%',
                  borderRadius: '16px',
                  border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                  overflow: 'hidden',
                  padding: 2,
                }}
              >
                {/* Skills Distribution Container */}
                <Box
                  sx={{
                    position: 'relative',
                    width: '100%',
                    height: 'calc(100% - 50px)',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}
                >
                  {/* Skills distributed around the container */}
                  {displayedSkills.map((skill, index) => {
                    const colorPair = skillPalette[index % skillPalette.length];
                    const totalSkills = displayedSkills.length;

                    // Calculate positions around the container perimeter
                    const angle = (index * 2 * Math.PI) / totalSkills;
                    const distance = 0.8; // 80% from center

                    // Convert polar to Cartesian coordinates
                    const x = Math.cos(angle) * distance * 100; // Percentage from center
                    const y = Math.sin(angle) * distance * 100;

                    // Add slight randomness for natural look
                    const randomOffset = (Math.random() - 0.5) * 10;
                    const xPos = x + randomOffset;
                    const yPos = y + randomOffset;

                    const delay = index * 120;

                    return (
                      <Box
                        key={skill.name}
                        sx={{
                          position: 'absolute',
                          top: `calc(50% + ${yPos}px)`,
                          left: `calc(50% + ${xPos}px)`,
                          transform: 'translate(-50%, -50%)',
                          zIndex: 10,
                          opacity: 0,
                          animation: `skillFloatIn 800ms cubic-bezier(0.34, 1.56, 0.64, 1) ${delay}ms forwards`,
                          '@keyframes skillFloatIn': {
                            '0%': {
                              opacity: 0,
                              transform:
                                'translate(-50%, -50%) scale(0) rotate(-45deg)',
                            },
                            '60%': {
                              opacity: 1,
                              transform:
                                'translate(-50%, -50%) scale(1.1) rotate(10deg)',
                            },
                            '100%': {
                              opacity: 1,
                              transform:
                                'translate(-50%, -50%) scale(1) rotate(0deg)',
                            },
                          },
                        }}
                      >
                        {/* Skill Box - Simple hover animation only */}
                        <Box
                          sx={{
                            width: { xs: 48, md: 56 },
                            height: { xs: 48, md: 56 },
                            borderRadius: '12px',
                            backgroundColor: colorPair.bg,
                            color: 'white',
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            fontWeight: 600,
                            boxShadow:
                              theme.palette.mode === 'dark'
                                ? `0 6px 20px ${alpha(colorPair.glow, 0.4)}`
                                : `0 6px 20px ${alpha(colorPair.glow, 0.3)}`,
                            fontSize: { xs: '0.7rem', md: '0.8rem' },
                            padding: 1,
                            cursor: 'default',
                            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                            border: `1px solid ${alpha('#ffffff', 0.2)}`,
                            position: 'relative',
                            overflow: 'hidden',
                            '&:hover': {
                              transform: 'scale(1.15) translateY(-2px)',
                              boxShadow:
                                theme.palette.mode === 'dark'
                                  ? `0 10px 28px ${alpha(colorPair.glow, 0.6)}`
                                  : `0 10px 28px ${alpha(colorPair.glow, 0.4)}`,
                              '&::before': {
                                opacity: 0.2,
                              },
                            },
                            '&::before': {
                              content: '""',
                              position: 'absolute',
                              top: 0,
                              left: 0,
                              right: 0,
                              bottom: 0,
                              background: `linear-gradient(135deg, rgba(255,255,255,0.2), rgba(255,255,255,0.1) 50%, transparent)`,
                              opacity: 0.1,
                              transition: 'opacity 0.3s ease',
                            },
                          }}
                          title={skill.name}
                        >
                          {/* Skill Content - Simple text */}
                          <Box
                            sx={{
                              position: 'relative',
                              zIndex: 2,
                              textShadow: '0 1px 2px rgba(0,0,0,0.3)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              width: '100%',
                              height: '100%',
                            }}
                          >
                            {(() => {
                              // Show skill abbreviation
                              const words = skill.name.split(/[\s-_]+/);
                              if (words.length >= 2) {
                                return `${words[0].charAt(0)}${words[1].charAt(0)}`;
                              }
                              return skill.name.slice(0, 2).toUpperCase();
                            })()}
                          </Box>

                          {/* Corner accent */}
                          <Box
                            sx={{
                              position: 'absolute',
                              top: 4,
                              right: 4,
                              width: 4,
                              height: 4,
                              borderRadius: '50%',
                              background: alpha('#ffffff', 0.6),
                            }}
                          />
                        </Box>

                        {/* Subtle pulse on hover */}
                        <Box
                          sx={{
                            position: 'absolute',
                            top: '50%',
                            left: '50%',
                            transform: 'translate(-50%, -50%)',
                            width: { xs: 60, md: 70 },
                            height: { xs: 60, md: 70 },
                            borderRadius: '14px',
                            background: colorPair.glow,
                            opacity: 0,
                            transition: 'opacity 0.3s ease',
                            filter: 'blur(8px)',
                            zIndex: -1,
                            '&:hover + &': {
                              opacity: 0.2,
                            },
                          }}
                        />
                      </Box>
                    );
                  })}

                  {/* Central decorative element */}
                  <Box
                    sx={{
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
                      transform: 'translate(-50%, -50%)',
                      width: 60,
                      height: 60,
                      borderRadius: '16px',
                      background:
                        theme.palette.mode === 'dark'
                          ? alpha(theme.palette.primary.main, 0.1)
                          : alpha(theme.palette.primary.light, 0.15),
                      border: `2px dashed ${alpha(theme.palette.divider, 0.3)}`,
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      animation: 'rotateSlow 20s linear infinite',
                      '@keyframes rotateSlow': {
                        '0%': {
                          transform: 'translate(-50%, -50%) rotate(0deg)',
                        },
                        '100%': {
                          transform: 'translate(-50%, -50%) rotate(360deg)',
                        },
                      },
                      '&::after': {
                        content: '""',
                        position: 'absolute',
                        width: '80%',
                        height: '80%',
                        borderRadius: '12px',
                        background: alpha(theme.palette.divider, 0.05),
                      },
                    }}
                  >
                    <Typography
                      variant="caption"
                      sx={{
                        position: 'relative',
                        zIndex: 1,
                        fontWeight: 600,
                        color: theme.palette.text.secondary,
                        opacity: 0.8,
                        fontSize: '0.7rem',
                        textAlign: 'center',
                        lineHeight: 1.2,
                      }}
                    >
                      Skills
                    </Typography>
                  </Box>
                </Box>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

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
