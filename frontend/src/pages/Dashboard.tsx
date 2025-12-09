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
  Badge,
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

  // Create SVG icon element from hex color code
  const renderSkillIcon = (skillName: string): React.ReactNode => {
    // Map skills to unicode/emoji icons
    const skillEmojis: { [key: string]: string } = {
      typescript: '⌨️',
      javascript: 'JS',
      python: '🐍',
      java: '☕',
      'c++': '++',
      'c#': '#',
      ruby: '💎',
      php: 'PHP',
      go: 'Go',
      rust: '🦀',
      react: '⚛️',
      vue: 'Vue',
      angular: 'ng',
      'next.js': 'N→',
      svelte: 'S',
      tailwind: '🎨',
      'node.js': 'Node',
      express: 'Ex',
      django: 'DJ',
      postgresql: 'PG',
      mongodb: 'M',
      mysql: 'My',
      sql: 'SQL',
      firebase: '🔥',
      git: 'Git',
      docker: '🐳',
      aws: 'AWS',
      kubernetes: 'K8',
      graphql: 'GQ',
      rest: 'REST',
      testing: '✓',
      'ui/ux': 'UI',
      leadership: '👑',
      writing: '✍️',
      community: '🤝',
      apis: 'API',
      design: '🎭',
    };

    const lowerSkill = skillName.toLowerCase();
    const emoji =
      skillEmojis[lowerSkill] || skillName.slice(0, 2).toUpperCase();

    return emoji;
  };

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

      {/* Hero Welcome Card */}
      <Card
        sx={{
          mb: 4,
          backgroundColor: alpha(theme.palette.background.paper, 0.5),
          backdropFilter: 'blur(8px)',
          borderRadius: 2,
          border: `1px solid ${alpha(theme.palette.divider, 0.15)}`,
          overflow: 'visible',
          position: 'relative',
          boxShadow: `0 2px 8px ${alpha(theme.palette.common.black, 0.05)}`,
        }}
      >
        <CardContent
          sx={{ position: 'relative', zIndex: 2, p: { xs: 2, md: 2 } }}
        >
          <Grid container spacing={2} alignItems="stretch">
            {/* Left side - Avatar and Message */}
            <Grid item xs={12} md={8}>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: { xs: 'center', sm: 'flex-start' },
                  flexDirection: { xs: 'column', sm: 'row' },
                  gap: 2,
                  textAlign: { xs: 'center', sm: 'left' },
                }}
              >
                <Badge
                  overlap="circular"
                  anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                  badgeContent={
                    <Box
                      sx={{
                        bgcolor: '#22c55e',
                        borderRadius: '50%',
                        p: 0.4,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: '2px solid white',
                      }}
                    >
                      <Star sx={{ fontSize: 14, color: 'white' }} />
                    </Box>
                  }
                >
                  <Avatar
                    src={user?.profile?.avatarUrl || undefined}
                    alt={user?.name}
                    sx={{
                      width: 75,
                      height: 75,
                      border: `2px solid ${alpha(theme.palette.primary.main, 0.3)}`,
                      boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.2)}`,
                    }}
                  />
                </Badge>

                <Box sx={{ flex: 1 }}>
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                      mb: 0.5,
                    }}
                  >
                    <Celebration
                      sx={{
                        color:
                          theme.palette.mode === 'dark' ? '#a7f3d0' : '#059669',
                        fontSize: '1.3rem',
                      }}
                    />
                    <Typography
                      variant="overline"
                      sx={{
                        color: 'text.primary',
                        fontWeight: 700,
                        letterSpacing: 1.2,
                        fontSize: '0.7rem',
                      }}
                    >
                      WELCOME BACK!
                    </Typography>
                  </Box>

                  <Typography
                    variant="h4"
                    sx={{
                      fontWeight: 800,
                      mb: 1.5,
                      color: 'text.primary',
                      fontSize: { xs: '1.4rem', md: '1.8rem' },
                      lineHeight: 1.1,
                    }}
                  >
                    {user?.name?.split(' ')[0] || 'Friend'}, your momentum is
                    <Box
                      component="span"
                      sx={{
                        display: 'block',
                        color:
                          theme.palette.mode === 'dark' ? '#a7f3d0' : '#059669',
                        fontWeight: 800,
                      }}
                    >
                      {progress}% rising
                    </Box>
                  </Typography>

                  {/* Progress bar - Compact */}
                  <Box sx={{ maxWidth: 280 }}>
                    <Box
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        mb: 0.5,
                        alignItems: 'center',
                      }}
                    >
                      <Typography
                        variant="caption"
                        sx={{
                          color: 'rgba(255, 255, 255, 0.85)',
                          fontWeight: 600,
                        }}
                      >
                        Weekly Goal
                      </Typography>
                      <Typography
                        variant="caption"
                        sx={{
                          fontWeight: 700,
                          color: '#a7f3d0',
                          fontSize: '0.8rem',
                        }}
                      >
                        {progress}%
                      </Typography>
                    </Box>
                    <Box
                      sx={{
                        height: 6,
                        bgcolor: alpha(theme.palette.divider, 0.3),
                        borderRadius: 3,
                        overflow: 'hidden',
                        border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                      }}
                    >
                      <Box
                        sx={{
                          height: '100%',
                          width: `${progress}%`,
                          borderRadius: 3,
                          transition:
                            'width 1.2s cubic-bezier(0.34, 1.56, 0.64, 1)',
                          background: `linear-gradient(90deg, ${theme.palette.primary.light} 0%, ${theme.palette.secondary.light} 100%)`,
                          boxShadow: `0 0 12px ${alpha(theme.palette.primary.main, 0.55)}`,
                        }}
                      />
                    </Box>
                  </Box>
                </Box>
              </Box>
            </Grid>
            {/* Right side - Skills Visualization */}
            <Grid item xs={12} md={4}>
              <Box
                sx={{
                  position: 'relative',
                  height: { xs: 160, md: 180 },
                  width: '100%',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  overflow: 'visible',
                }}
              >
                {/* Animated Background Glow */}
                <Box
                  sx={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: { xs: 160, md: 200 },
                    height: { xs: 160, md: 200 },
                    borderRadius: '50%',
                    background: `radial-gradient(circle at center, ${alpha(theme.palette.primary.main, 0.05)} 0%, transparent 70%)`,
                    filter: 'blur(20px)',
                    animation: 'pulseGlow 6s ease-in-out infinite',
                    '@keyframes pulseGlow': {
                      '0%, 100%': {
                        opacity: 0.2,
                        transform: 'translate(-50%, -50%) scale(0.9)',
                      },
                      '50%': {
                        opacity: 0.4,
                        transform: 'translate(-50%, -50%) scale(1.1)',
                      },
                    },
                    zIndex: 0,
                  }}
                />

                {/* Main Container */}
                <Box
                  sx={{
                    position: 'relative',
                    width: '100%',
                    height: '100%',
                    zIndex: 1,
                  }}
                >
                  {/* SKILL BUBBLES - Smaller, strategically spaced, high z-index */}
                  {displayedSkills.map((skill, index) => {
                    // Strategic grid positions to avoid overlaps - MORE horizontal spacing
                    const positions = [
                      { x: -200, y: -50 }, // Top-left
                      { x: -50, y: -65 }, // Top-center
                      { x: 100, y: -50 }, // Top-right
                      { x: -160, y: -5 }, // Mid-left
                      { x: 150, y: -5 }, // Mid-right
                      { x: -120, y: 50 }, // Bottom-left
                      { x: 0, y: 65 }, // Bottom-center
                      { x: 85, y: 50 }, // Bottom-right
                      { x: -70, y: -10 }, // Inner top-left
                      { x: 45, y: -20 }, // Inner top-right
                    ];

                    const pos = positions[index % positions.length];
                    const randomX = pos.x;
                    const randomY = pos.y;

                    const colorPair = skillPalette[index % skillPalette.length];
                    const randomDelay = Math.random() * 300;

                    return (
                      <Box
                        key={skill.name}
                        sx={{
                          position: 'absolute',
                          top: `calc(50% + ${randomY}px)`,
                          left: `calc(50% + ${randomX}px)`,
                          transform: 'translate(-50%, -50%) scale(0)',
                          zIndex: 20 + index,
                          animation: `
                skillPop${index} 500ms cubic-bezier(0.68, -0.55, 0.265, 1.55) ${randomDelay}ms forwards
              `,
                          willChange: 'transform, opacity',
                        }}
                      >
                        {/* Individual pop animation for each skill */}
                        <style>
                          {`
                @keyframes skillPop${index} {
                  0% {
                    opacity: 0;
                    transform: translate(-50%, -50%) scale(0) rotate(-20deg);
                    filter: blur(4px);
                  }
                  50% {
                    opacity: 1;
                    transform: translate(-50%, -50%) scale(1.15) rotate(5deg);
                    filter: blur(1px);
                  }
                  100% {
                    opacity: 1;
                    transform: translate(-50%, -50%) scale(1) rotate(0deg);
                    filter: blur(0px);
                  }
                }
              `}
                        </style>

                        {/* Skill Bubble - Small and rounded */}
                        <Box
                          sx={{
                            width: 48,
                            height: 48,
                            borderRadius: '12px',
                            background: colorPair.bg,
                            color: 'white',
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            fontWeight: 600,
                            boxShadow: `
                  0 6px 16px ${alpha(colorPair.glow, 0.4)},
                  inset 0 1px 0 rgba(255,255,255,0.25)
                `,
                            fontSize: '0.65rem',
                            textAlign: 'center',
                            px: 0.8,
                            cursor: 'pointer',
                            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                            border: `1px solid ${alpha('#ffffff', 0.2)}`,
                            position: 'relative',
                            overflow: 'hidden',
                            '&:hover': {
                              transform: 'scale(1.15)',
                              boxShadow: `
                    0 10px 24px ${alpha(colorPair.glow, 0.6)},
                    inset 0 1px 0 rgba(255,255,255,0.3)
                  `,
                            },
                          }}
                          title={skill.name}
                        >
                          {/* Skill Content - Icon or text fallback */}
                          <Box
                            sx={{
                              position: 'relative',
                              zIndex: 2,
                              textShadow: '0 0.5px 1px rgba(0,0,0,0.3)',
                              fontSize: '1.5rem',
                              fontWeight: 700,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              width: '100%',
                              height: '100%',
                            }}
                          >
                            {(() => {
                              const icon = renderSkillIcon(skill.name);
                              const iconStr = icon as string;
                              // Show skill name if icon is just 1-2 letter abbreviation
                              if (
                                iconStr.length <= 2 &&
                                /^[A-Z0-9]{1,2}$/.test(iconStr)
                              ) {
                                return (
                                  <span
                                    style={{
                                      fontSize: '0.75rem',
                                      fontWeight: 700,
                                    }}
                                  >
                                    {skill.name.slice(0, 6)}
                                  </span>
                                );
                              }
                              // Otherwise show the icon/emoji
                              return icon;
                            })()}
                          </Box>
                        </Box>
                      </Box>
                    );
                  })}
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
