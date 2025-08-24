import React, { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Avatar,
  Chip,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Divider,
  LinearProgress,
  Stack,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  People,
  Message,
  TrendingUp,
  Notifications,
  CalendarToday,
  LocationOn,
  Event,
  Forum,
  PersonAdd,
  Assignment,
  Groups,
  CheckCircle,
  Schedule,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import useConnections from '../hooks/useConnections';
import { apiService } from '../services/api';

interface DashboardStats {
  connections: number;
  messages: number;
  pendingRequests: number;
  profileCompletion: number;
  upcomingEvents: number;
  newAlumni: number;
}

interface RecentActivity {
  id: string;
  type: 'connection' | 'message' | 'event' | 'network';
  message: string;
  time: string;
  avatar: string;
  userId?: string;
}

interface UpcomingEvent {
  id: string;
  title: string;
  date: string;
  location: string;
  description?: string;
}

interface SuggestedConnection {
  id: string;
  name: string;
  role: string;
  avatar: string;
  matchScore?: number;
}

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats>({
    connections: 0,
    messages: 0,
    pendingRequests: 0,
    profileCompletion: 0,
    upcomingEvents: 0,
    newAlumni: 0,
  });
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>(
    []
  );
  const [upcomingEvents, setUpcomingEvents] = useState<UpcomingEvent[]>([]);
  const [suggestedConnections, setSuggestedConnections] = useState<
    SuggestedConnection[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Use the connections hook for real data
  const {
    connections,
    pendingReceived,
    suggestions,
    stats: connectionStats,
  } = useConnections();

  // Fetch dashboard data
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        console.log('🔄 Dashboard: Fetching dashboard data...');
        setLoading(true);
        setError(null);

        // Fetch messages count
        const messagesResponse =
          await apiService.messages.getAllConversations();
        const messagesCount = messagesResponse.data?.conversations?.length || 0;
        console.log('📊 Dashboard: Messages count:', messagesCount);

        // Calculate profile completion based on user data
        const profileCompletion = calculateProfileCompletion(user);
        console.log('👤 Dashboard: Profile completion:', profileCompletion);

        // Update stats with real data
        const newStats = {
          connections: connections.length,
          messages: messagesCount,
          pendingRequests: pendingReceived.length,
          profileCompletion,
          upcomingEvents: upcomingEvents.length,
          newAlumni: 0, // This would come from a separate API
        };
        setStats(newStats);
        console.log('📈 Dashboard: Stats updated:', newStats);

        // Generate recent activities from real data
        const activities = generateRecentActivities(
          connections,
          pendingReceived,
          messagesResponse.data?.conversations || []
        );
        setRecentActivities(activities);
        console.log(
          '📝 Dashboard: Recent activities generated:',
          activities.length
        );

        // Convert suggestions to dashboard format
        const dashboardSuggestions = suggestions
          .slice(0, 3)
          .map((suggestion) => ({
            id: suggestion.user.id,
            name: suggestion.user.name,
            role: suggestion.user.role,
            avatar: suggestion.user.name.charAt(0).toUpperCase(),
            matchScore: suggestion.matchScore,
          }));
        setSuggestedConnections(dashboardSuggestions);
        console.log(
          '🔗 Dashboard: Suggested connections:',
          dashboardSuggestions.length
        );

        // Mock upcoming events (in real app, this would come from events API)
        setUpcomingEvents([
          {
            id: '1',
            title: 'Alumni Meet 2024',
            date: 'Dec 15',
            location: 'College Campus',
            description: 'Annual alumni networking event',
          },
          {
            id: '2',
            title: 'Career Workshop',
            date: 'Dec 20',
            location: 'Online',
            description: 'Professional development session',
          },
        ]);

        console.log('✅ Dashboard: All data loaded successfully');
      } catch (err) {
        console.error('❌ Dashboard: Error fetching data:', err);
        setError('Failed to load dashboard data');
      } finally {
        setLoading(false);
        console.log('🏁 Dashboard: Data fetching completed');
      }
    };

    if (user) {
      fetchDashboardData();
    }
  }, [user, connections, pendingReceived, suggestions]);

  const calculateProfileCompletion = (user: any): number => {
    if (!user) return 0;

    let completed = 0;
    const total = 4; // Basic profile fields

    if (user.name) completed++;
    if (user.email) completed++;
    if (user.role) completed++;
    if (user.profile?.bio || user.profile?.location || user.profile?.skills)
      completed++;

    return Math.round((completed / total) * 100);
  };

  const generateRecentActivities = (
    connections: any[],
    pendingRequests: any[],
    conversations: any[]
  ): RecentActivity[] => {
    const activities: RecentActivity[] = [];

    // Add recent connection activities
    if (connections.length > 0) {
      const recentConnection = connections[0];
      activities.push({
        id: `conn-${recentConnection.id}`,
        type: 'connection',
        message: `Connected with ${recentConnection.user.name}`,
        time: '2h ago',
        avatar: recentConnection.user.name.charAt(0).toUpperCase(),
        userId: recentConnection.user.id,
      });
    }

    // Add pending request activities
    if (pendingRequests.length > 0) {
      const pendingRequest = pendingRequests[0];
      activities.push({
        id: `req-${pendingRequest.id}`,
        type: 'network',
        message: `New connection request from ${pendingRequest.requester?.name || 'Unknown'}`,
        time: '4h ago',
        avatar: pendingRequest.requester?.name?.charAt(0).toUpperCase() || '?',
        userId: pendingRequest.requester?.id,
      });
    }

    // Add message activities
    if (conversations && conversations.length > 0) {
      const recentMessage = conversations[0];
      activities.push({
        id: `msg-${recentMessage.id}`,
        type: 'message',
        message: `New message from ${recentMessage.participant?.name || 'Unknown'}`,
        time: '6h ago',
        avatar: recentMessage.participant?.name?.charAt(0).toUpperCase() || '?',
        userId: recentMessage.participant?.id,
      });
    }

    // Add default activities if none exist
    if (activities.length === 0) {
      activities.push(
        {
          id: 'default-1',
          type: 'network',
          message: 'Welcome to Nexus! Start building your network',
          time: 'Just now',
          avatar: 'N',
        },
        {
          id: 'default-2',
          type: 'event',
          message: 'Check out upcoming events and workshops',
          time: '1d ago',
          avatar: 'E',
        }
      );
    }

    return activities.slice(0, 4); // Limit to 4 activities
  };

  const handleQuickAction = (action: string) => {
    switch (action) {
      case 'Connect':
        navigate('/connections');
        break;
      case 'Message':
        navigate('/messages');
        break;
      case 'Events':
        // Navigate to events page when created
        break;
      case 'Resources':
        // Navigate to resources page when created
        break;
    }
  };

  const handleViewAll = (section: string) => {
    switch (section) {
      case 'activity':
        navigate('/connections');
        break;
      case 'events':
        // Navigate to events page when created
        break;
      case 'suggestions':
        navigate('/connections');
        break;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'STUDENT':
        return 'primary';
      case 'ALUM':
        return 'secondary';
      case 'ADMIN':
        return 'error';
      default:
        return 'default';
    }
  };

  const quickActions = [
    { title: 'Connect', icon: <PersonAdd />, color: 'primary' },
    { title: 'Message', icon: <Forum />, color: 'secondary' },
    { title: 'Events', icon: <Event />, color: 'warning' },
    { title: 'Resources', icon: <Assignment />, color: 'info' },
  ];

  if (loading) {
    return (
      <Container maxWidth="xl" sx={{ py: 3 }}>
        <Box
          display="flex"
          justifyContent="center"
          alignItems="center"
          minHeight="400px"
        >
          <CircularProgress size={60} />
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="xl" sx={{ py: 3 }}>
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      {/* Header Section */}
      <Box sx={{ mb: 4 }}>
        <Typography
          variant="h4"
          component="h1"
          sx={{
            fontWeight: 700,
            background: 'linear-gradient(45deg, #1976d2 30%, #4dabf5 90%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            display: 'inline-block',
          }}
        >
          Welcome back, {user?.name?.split(' ')[0] || 'User'}!
        </Typography>
        <Typography variant="subtitle1" color="text.secondary" sx={{ mt: 1 }}>
          Here's what's happening in your network today
        </Typography>
      </Box>

      {/* Stats Grid */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {[
          {
            icon: <People />,
            value: stats.connections,
            label: 'Connections',
            color: 'primary',
            progress: 70,
          },
          {
            icon: <Message />,
            value: stats.messages,
            label: 'Messages',
            color: 'secondary',
            progress: 45,
          },
          {
            icon: <Notifications />,
            value: stats.pendingRequests,
            label: 'Requests',
            color: 'warning',
            progress: 30,
          },
          {
            icon: <TrendingUp />,
            value: `${stats.profileCompletion}%`,
            label: 'Profile',
            color: 'success',
            progress: stats.profileCompletion,
          },
          {
            icon: <Event />,
            value: stats.upcomingEvents,
            label: 'Events',
            color: 'info',
            progress: 50,
          },
          {
            icon: <Groups />,
            value: stats.newAlumni,
            label: 'New Alumni',
            color: 'secondary',
            progress: 60,
          },
        ].map((stat, index) => (
          <Grid item xs={12} sm={6} md={4} lg={2} key={index}>
            <motion.div whileHover={{ y: -5 }} transition={{ duration: 0.2 }}>
              <Card
                sx={{
                  height: '100%',
                  borderLeft: `4px solid`,
                  borderColor: `${stat.color}.main`,
                  boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
                }}
              >
                <CardContent>
                  <Stack direction="row" alignItems="center" spacing={2}>
                    <Avatar
                      sx={{
                        bgcolor: `${stat.color}.light`,
                        color: `${stat.color}.dark`,
                        width: 48,
                        height: 48,
                      }}
                    >
                      {stat.icon}
                    </Avatar>
                    <Box>
                      <Typography variant="h5" sx={{ fontWeight: 700 }}>
                        {stat.value}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {stat.label}
                      </Typography>
                    </Box>
                  </Stack>
                </CardContent>
              </Card>
            </motion.div>
          </Grid>
        ))}
      </Grid>

      {/* Main Content */}
      <Grid container spacing={3}>
        {/* Left Column */}
        <Grid item xs={12} md={8}>
          {/* Quick Actions */}
          <Card sx={{ mb: 3, borderRadius: 3 }}>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                Quick Actions
              </Typography>
              <Grid container spacing={2}>
                {quickActions.map((action, index) => (
                  <Grid item xs={6} sm={3} key={index}>
                    <motion.div
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Button
                        fullWidth
                        variant="contained"
                        startIcon={action.icon}
                        onClick={() => handleQuickAction(action.title)}
                        sx={{
                          py: 2,
                          borderRadius: 2,
                          bgcolor: `${action.color}.main`,
                          '&:hover': { bgcolor: `${action.color}.dark` },
                        }}
                      >
                        {action.title}
                      </Button>
                    </motion.div>
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card sx={{ mb: 3, borderRadius: 3 }}>
            <CardContent>
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  mb: 2,
                }}
              >
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Recent Activity
                </Typography>
                <Button
                  size="small"
                  onClick={() => handleViewAll('activity')}
                  sx={{ textTransform: 'none' }}
                >
                  View All
                </Button>
              </Box>
              <List>
                {recentActivities.map((activity, index) => (
                  <React.Fragment key={activity.id}>
                    <ListItem alignItems="flex-start" sx={{ px: 0 }}>
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: 'primary.main' }}>
                          {activity.avatar}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={activity.message}
                        secondary={activity.time}
                        primaryTypographyProps={{
                          variant: 'body2',
                          fontWeight: 500,
                        }}
                        secondaryTypographyProps={{ variant: 'caption' }}
                      />
                      {activity.type === 'connection' && (
                        <CheckCircle color="success" />
                      )}
                      {activity.type === 'message' && (
                        <Message color="primary" />
                      )}
                      {activity.type === 'event' && (
                        <Schedule color="warning" />
                      )}
                      {activity.type === 'network' && (
                        <Notifications color="info" />
                      )}
                    </ListItem>
                    {index < recentActivities.length - 1 && (
                      <Divider variant="inset" component="li" />
                    )}
                  </React.Fragment>
                ))}
              </List>
            </CardContent>
          </Card>

          {/* Upcoming Events */}
          <Card sx={{ borderRadius: 3 }}>
            <CardContent>
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  mb: 2,
                }}
              >
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Upcoming Events
                </Typography>
                <Button
                  size="small"
                  onClick={() => handleViewAll('events')}
                  sx={{ textTransform: 'none' }}
                >
                  Create
                </Button>
              </Box>
              <List>
                {upcomingEvents.map((event, index) => (
                  <React.Fragment key={event.id}>
                    <ListItem alignItems="flex-start" sx={{ px: 0 }}>
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: 'warning.main' }}>
                          <CalendarToday />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={event.title}
                        secondary={
                          <React.Fragment>
                            <Box
                              sx={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 1,
                                mb: 0.5,
                              }}
                            >
                              <CalendarToday sx={{ fontSize: 16 }} />
                              {event.date}
                            </Box>
                            <Box
                              sx={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 1,
                              }}
                            >
                              <LocationOn sx={{ fontSize: 16 }} />
                              {event.location}
                            </Box>
                          </React.Fragment>
                        }
                        primaryTypographyProps={{
                          variant: 'body2',
                          fontWeight: 500,
                        }}
                        secondaryTypographyProps={{ variant: 'caption' }}
                      />
                    </ListItem>
                    {index < upcomingEvents.length - 1 && (
                      <Divider variant="inset" component="li" />
                    )}
                  </React.Fragment>
                ))}
              </List>
              <Box sx={{ mt: 2 }}>
                <Button
                  variant="outlined"
                  startIcon={<PersonAdd />}
                  fullWidth
                  sx={{ borderRadius: 2 }}
                >
                  + Add New Event
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Right Column */}
        <Grid item xs={12} md={4}>
          {/* Suggested Connections */}
          <Card sx={{ borderRadius: 3, mb: 3 }}>
            <CardContent>
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  mb: 2,
                }}
              >
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Suggested Connections
                </Typography>
                <Button
                  size="small"
                  onClick={() => handleViewAll('suggestions')}
                  sx={{ textTransform: 'none' }}
                >
                  View All
                </Button>
              </Box>
              <List>
                {suggestedConnections.map((connection, index) => (
                  <React.Fragment key={connection.id}>
                    <ListItem alignItems="flex-start" sx={{ px: 0 }}>
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: 'success.main' }}>
                          {connection.avatar}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={connection.name}
                        secondary={
                          <React.Fragment>
                            <Box
                              sx={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 1,
                                mb: 0.5,
                              }}
                            >
                              <Chip
                                label={connection.role}
                                size="small"
                                color={getRoleColor(connection.role)}
                                variant="outlined"
                              />
                            </Box>
                            {connection.matchScore && (
                              <Typography
                                variant="caption"
                                color="text.secondary"
                              >
                                Match Score: {connection.matchScore}%
                              </Typography>
                            )}
                          </React.Fragment>
                        }
                        primaryTypographyProps={{
                          variant: 'body2',
                          fontWeight: 500,
                        }}
                        secondaryTypographyProps={{ variant: 'caption' }}
                      />
                      <Button
                        size="small"
                        variant="contained"
                        startIcon={<PersonAdd />}
                        onClick={() => navigate('/connections')}
                        sx={{ borderRadius: 2, textTransform: 'none' }}
                      >
                        Connect
                      </Button>
                    </ListItem>
                    {index < suggestedConnections.length - 1 && (
                      <Divider variant="inset" component="li" />
                    )}
                  </React.Fragment>
                ))}
              </List>
              {suggestedConnections.length === 0 && (
                <Box sx={{ textAlign: 'center', py: 3 }}>
                  <Typography variant="body2" color="text.secondary">
                    No suggestions available
                  </Typography>
                  <Button
                    variant="outlined"
                    onClick={() => navigate('/connections')}
                    sx={{ mt: 2, borderRadius: 2 }}
                  >
                    Browse Connections
                  </Button>
                </Box>
              )}
            </CardContent>
          </Card>

          {/* Profile Completion */}
          <Card sx={{ borderRadius: 3 }}>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                Profile Completion
              </Typography>
              <Box
                sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}
              >
                <Avatar sx={{ bgcolor: 'success.main', width: 48, height: 48 }}>
                  <TrendingUp />
                </Avatar>
                <Box>
                  <Typography variant="h4" sx={{ fontWeight: 700 }}>
                    {stats.profileCompletion}%
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Complete
                  </Typography>
                </Box>
              </Box>
              <LinearProgress
                variant="determinate"
                value={stats.profileCompletion}
                sx={{ height: 8, borderRadius: 4 }}
              />
              <Button
                variant="outlined"
                fullWidth
                onClick={() => navigate('/profile')}
                sx={{ mt: 2, borderRadius: 2, textTransform: 'none' }}
              >
                Complete Profile
              </Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
};

export default Dashboard;
