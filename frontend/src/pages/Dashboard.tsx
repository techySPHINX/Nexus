import React from 'react';
import {
  Container,
  Grid,
  Typography,
  Box,
  // Chip,
  // Paper,
  // Alert,
  // CircularProgress,
} from '@mui/material';
// import { Message, Notifications } from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
// import { apiService } from '../services/api';
// import { improvedWebSocketService } from '../services/websocket.improved';
// import type { WebSocketMessage } from '../services/websocket.improved';

// Import the new components
import NetworkOverview from '../components/DashBoard/NetworkOverview';
import ProfileStrength from '../components/DashBoard/ProfileStrength';
import RecommendedProjects from '../components/DashBoard/RecommendedProjects';
import RecentPosts from '../components/DashBoard/RecentPosts';
import RecommendedConnection from '../components/DashBoard/RecommendedConnection';
import UpcomingEvents from '../components/DashBoard/UpcomingEvents';

// interface RecentActivity {
//   id: string;
//   type: 'connection' | 'message' | 'event' | 'post';
//   title: string;
//   description: string;
//   timestamp: string;
//   user?: {
//     name: string;
//     avatar: string;
//   };
// }

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  // const [notifications, setNotifications] = useState<
  //   Array<{
  //     id: string;
  //     type: 'message' | 'connection' | 'event';
  //     title: string;
  //     description: string;
  //     timestamp: string;
  //   }>
  // >([]);

  // const [recentActivities, setRecentActivities] = React.useState<
  //   RecentActivity[]
  // >([]);

  // // Fetch real message count
  // const fetchMessageCount = async () => {
  //   try {
  //     const response = await apiService.messages.getAllConversations();
  //     if (response.data) {
  //       let totalMessages = 0;
  //       (response.data as Array<{ latestMessage?: unknown }>).forEach(
  //         (conv) => {
  //           if (conv.latestMessage) {
  //             totalMessages++;
  //           }
  //         }
  //       );
  //       setStats((prev) => ({
  //         ...prev,
  //         messages: totalMessages,
  //       }));
  //     }
  //   } catch {
  //     console.log('Could not fetch message count');
  //   }
  // };

  // // Initialize WebSocket for real-time updates
  // useEffect(() => {
  //   if (!user?.id || !token) return;

  //   const initializeWebSocket = async () => {
  //     try {
  //       await improvedWebSocketService.connect(user.id, token);

  //       improvedWebSocketService.on(
  //         'NEW_MESSAGE',
  //         (message: WebSocketMessage) => {
  //           const newMessage = message.data as {
  //             id: string;
  //             sender?: { name?: string };
  //             receiverId: string;
  //           };
  //           if (newMessage.receiverId === user.id) {
  //             setStats((prev) => ({
  //               ...prev,
  //               messages: prev.messages + 1,
  //             }));

  //             const notification = {
  //               id: newMessage.id,
  //               type: 'message' as const,
  //               title: 'New Message',
  //               description: `${newMessage.sender?.name || 'Someone'} sent you a message`,
  //               timestamp: new Date().toISOString(),
  //             };

  //             setNotifications((prev) => [notification, ...prev.slice(0, 4)]);
  //           }
  //         }
  //       );

  //       improvedWebSocketService.on(
  //         'CONNECTION_REQUEST',
  //         (message: WebSocketMessage) => {
  //           const data = message.data as {
  //             id: string;
  //             sender?: { name?: string };
  //           };
  //           const notification = {
  //             id: data.id,
  //             type: 'connection' as const,
  //             title: 'New Connection Request',
  //             description: `${data.sender?.name || 'Someone'} wants to connect with you`,
  //             timestamp: new Date().toISOString(),
  //           };

  //           setNotifications((prev) => [notification, ...prev.slice(0, 4)]);
  //           setStats((prev) => ({
  //             ...prev,
  //             pendingRequests: prev.pendingRequests + 1,
  //           }));
  //         }
  //       );
  //     } catch (error) {
  //       console.error('Failed to initialize WebSocket for dashboard:', error);
  //     }
  //   };

  //   initializeWebSocket();

  //   return () => {
  //     improvedWebSocketService.disconnect();
  //   };
  // }, [user?.id, token]);

  // // fetch message count and recent activities once when user becomes available
  // useEffect(() => {
  //   if (!user?.id) return;

  //   let mounted = true;

  //   const init = async () => {
  //     try {
  //       setLoading(true);
  //       await fetchMessageCount();

  //       try {
  //         const activitiesResponse =
  //           await apiService.messages.getAllConversations();
  //         const activities: RecentActivity[] = [];

  //         type Conversation = {
  //           id: string;
  //           participant?: { name?: string };
  //           updatedAt: string;
  //         };

  //         if (activitiesResponse.data?.conversations) {
  //           (activitiesResponse.data.conversations as Conversation[])
  //             .slice(0, 3)
  //             .forEach((conv) => {
  //               activities.push({
  //                 id: conv.id,
  //                 type: 'message',
  //                 title: 'New Message',
  //                 description: `You have a conversation with ${conv.participant?.name || 'Unknown'}`,
  //                 timestamp: new Date(conv.updatedAt).toLocaleDateString(),
  //                 user: {
  //                   name: conv.participant?.name || 'Unknown',
  //                   avatar: '',
  //                 },
  //               });
  //             });
  //         }

  //         if (connections.length > 0) {
  //           type Conn = {
  //             id: string;
  //             user?: { name?: string };
  //             createdAt: string;
  //           };

  //           (connections as Conn[]).slice(0, 2).forEach((conn) => {
  //             activities.push({
  //               id: conn.id,
  //               type: 'connection',
  //               title: 'New Connection',
  //               description: `Connected with ${conn.user?.name || 'Unknown User'}`,
  //               timestamp: new Date(conn.createdAt).toLocaleDateString(),
  //               user: {
  //                 name: conn.user?.name || 'Unknown',
  //                 avatar: '',
  //               },
  //             });
  //           });
  //         }

  //         if (mounted) setRecentActivities(activities);
  //       } catch {
  //         // ignore activities errors
  //       }
  //     } catch {
  //       if (mounted) setError('Failed to load dashboard data');
  //     } finally {
  //       if (mounted) setLoading(false);
  //     }
  //   };

  //   init();

  //   return () => {
  //     mounted = false;
  //   };
  //   // re-run if connections length changes
  // }, [user?.id, connections]);

  // if (loading || connectionsLoading) {
  //   return (
  //     <Container maxWidth="xl" sx={{ py: 3 }}>
  //       <Box
  //         display="flex"
  //         justifyContent="center"
  //         alignItems="center"
  //         minHeight="400px"
  //       >
  //         <CircularProgress size={60} />
  //       </Box>
  //     </Container>
  //   );
  // }

  // if (error || connectionsError) {
  //   return (
  //     <Container maxWidth="xl" sx={{ py: 3 }}>
  //       <Alert severity="error" sx={{ mb: 3 }}>
  //         {error || connectionsError}
  //       </Alert>
  //     </Container>
  //   );
  // }

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      {/* Header Section */}
      <Box sx={{ mb: 6 }}>
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          mb={2}
          sx={{ flexWrap: 'wrap', gap: 1 }}
        >
          <Typography
            variant="h4"
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
          {/* <Box display="flex" alignItems="center" gap={1.5}>
            <Chip
              icon={<Message sx={{ fontSize: 16 }} />}
              label={`${stats.messages} Messages`}
              color="primary"
              variant="outlined"
              size="small"
            />
            {notifications.length > 0 && (
              <Chip
                icon={<Notifications sx={{ fontSize: 16 }} />}
                label={`${notifications.length} New`}
                color="secondary"
                variant="outlined"
                size="small"
              />
            )}
          </Box> */}
        </Box>
        <Typography
          variant="h6"
          color="text.secondary"
          sx={{ fontWeight: 400 }}
        >
          Here's your alumni network overview
        </Typography>
      </Box>

      {/* /* Main Dashboard Grid */}
      {/*
          OnView helper: renders children only after they enter the viewport.
          Uses IntersectionObserver with a small placeholder to preserve layout.
        */}
      {(() => {
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
          const ref = React.useRef<HTMLDivElement | null>(null);
          const [visible, setVisible] = React.useState(false);

          React.useEffect(() => {
            const el = ref.current;
            if (!el) return;
            if (visible) return;

            if (typeof IntersectionObserver === 'undefined') {
              // Fallback: immediately show if browser doesn't support IntersectionObserver
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

        return (
          <Grid container spacing={3}>
            {/* Left Column - Main Content */}
            <Grid item xs={12} lg={8}>
              <Box sx={{ mb: 3 }}>
                <OnView placeholderHeight={280} threshold={0.9}>
                  <NetworkOverview />
                </OnView>
              </Box>

              <Box sx={{ mb: 3 }}>
                <OnView placeholderHeight={360} threshold={0.9}>
                  <RecommendedProjects />
                </OnView>
              </Box>

              <Box sx={{ mb: 3 }}>
                <OnView placeholderHeight={460} threshold={0.9}>
                  <RecentPosts />
                </OnView>
              </Box>
            </Grid>

            {/* Right Column - Sidebar */}
            <Grid item xs={12} lg={4}>
              <Box sx={{ mb: 3 }}>
                <OnView placeholderHeight={280} threshold={0.9}>
                  <ProfileStrength />
                </OnView>
              </Box>

              <Box sx={{ mb: 3 }}>
                <OnView placeholderHeight={280} threshold={1}>
                  <RecommendedConnection />
                </OnView>
              </Box>

              <Box sx={{ mb: 3 }}>
                <OnView placeholderHeight={360} threshold={0.9}>
                  <UpcomingEvents />
                </OnView>
              </Box>
            </Grid>
          </Grid>
        );
      })()}
    </Container>
  );
};

export default Dashboard;
