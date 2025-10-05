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
  Paper,
  IconButton,
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
  Business,
  School,
  Work,
  MoreVert,
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
  type: 'connection' | 'message' | 'event' | 'post';
  title: string;
  description: string;
  timestamp: string;
  user?: {
    name: string;
    avatar: string;
  };
}

interface UpcomingEvent {
  id: string;
  title: string;
  date: string;
  location: string;
  attendees: number;
}

interface SuggestedConnection {
  id: string;
  name: string;
  title: string;
  company: string;
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
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<UpcomingEvent[]>([]);
  const [suggestedConnections, setSuggestedConnections] = useState<SuggestedConnection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Use the connections hook for real data
  const {
    connections,
    pendingReceived,
    suggestions,
    stats: connectionStats,
    loading: connectionsLoading,
    error: connectionsError,
  } = useConnections();

  const calculateProfileCompletion = React.useCallback(
    (user: any): number => {
      if (!user) return 0;

      let completed = 0;
      const total = 6; // Profile completion fields

      if (user.name) completed++;
      if (user.email) completed++;
      if (user.role) completed++;
      if (user.profile?.bio) completed++;
      if (user.profile?.location) completed++;
      if (user.profile?.skills && user.profile.skills.length > 0) completed++;

      return Math.round((completed / total) * 100);
    },
    []
  );

  // Fetch dashboard data
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        
        // Update stats with real data from connections
        setStats(prev => ({
          ...prev,
          connections: connections.length,
          pendingRequests: pendingReceived.length,
          profileCompletion: calculateProfileCompletion(user),
        }));

        // Fetch recent activities from API
        try {
          const activitiesResponse = await apiService.messages.getAllConversations();
          const activities: RecentActivity[] = [];
          
          if (activitiesResponse.data?.conversations) {
            activitiesResponse.data.conversations.slice(0, 3).forEach((conv: any) => {
              activities.push({
                id: conv.id,
                type: 'message',
                title: 'New Message',
                description: `You have a conversation with ${conv.participant?.name || 'Unknown'}`,
                timestamp: new Date(conv.updatedAt).toLocaleDateString(),
                user: { name: conv.participant?.name || 'Unknown', avatar: '' }
              });
            });
          }
          
          // Add connection activities
          if (connections.length > 0) {
            connections.slice(0, 2).forEach((conn: any) => {
              activities.push({
                id: conn.id,
                type: 'connection',
                title: 'New Connection',
                description: `Connected with ${conn.user?.name || 'Unknown User'}`,
                timestamp: new Date(conn.createdAt).toLocaleDateString(),
                user: { name: conn.user?.name || 'Unknown', avatar: '' }
              });
            });
          }
          
          setRecentActivities(activities);
        } catch (err) {
          console.log('No recent activities available');
        }

        // Fetch upcoming events
        try {
          const eventsResponse = await apiService.events.getAll();
          const events: UpcomingEvent[] = [];
          
          if (eventsResponse.data?.events) {
            eventsResponse.data.events.slice(0, 2).forEach((event: any) => {
              events.push({
                id: event.id,
                title: event.title,
                date: new Date(event.date).toLocaleDateString(),
                location: event.location || 'TBA',
                attendees: event.attendees || 0
              });
            });
          }
          
          setUpcomingEvents(events);
        } catch (err) {
          console.log('No events available');
        }

        // Transform suggestions to dashboard format
        const dashboardSuggestions: SuggestedConnection[] = suggestions.slice(0, 3).map((suggestion: any) => ({
          id: suggestion.user.id,
          name: suggestion.user.name,
          title: suggestion.user.profile?.bio || 'Professional',
          company: suggestion.user.profile?.location || 'KIIT University',
          avatar: suggestion.user.profile?.avatarUrl || '',
          matchScore: Math.floor(Math.random() * 20) + 80 // Mock match score
        }));
        
        setSuggestedConnections(dashboardSuggestions);

      } catch (err) {
        setError('Failed to load dashboard data');
        console.error('Dashboard error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [connections, pendingReceived, suggestions, user, calculateProfileCompletion]);

  const quickActions = [
    { title: 'Post Update', icon: <Forum />, color: 'primary', action: () => navigate('/feed') },
    { title: 'Find People', icon: <PersonAdd />, color: 'secondary', action: () => navigate('/connections') },
    { title: 'Join Community', icon: <Groups />, color: 'info', action: () => navigate('/community') },
    { title: 'Resources', icon: <Assignment />, color: 'success', action: () => navigate('/resources') },
  ];

  if (loading || connectionsLoading) {
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

  if (error || connectionsError) {
    return (
      <Container maxWidth="xl" sx={{ py: 3 }}>
        <Alert severity="error" sx={{ mb: 3 }}>
          {error || connectionsError}
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      {/* Professional Header */}
      <Box sx={{ mb: 4 }}>
        <Typography
          variant="h4"
          component="h1"
          sx={{
            fontWeight: 600,
            color: 'text.primary',
            mb: 1,
          }}
        >
          Welcome back, {user?.name?.split(' ')[0] || 'User'}
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Here's what's happening in your professional network
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {/* Left Column */}
        <Grid item xs={12} md={8}>
          {/* Stats Overview */}
          <Paper sx={{ p: 3, mb: 3, background: 'linear-gradient(135deg, #f8faf8 0%, #ffffff 100%)' }}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
              Network Overview
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={6} sm={3}>
                <Box textAlign="center">
                  <Typography variant="h4" sx={{ fontWeight: 700, color: 'primary.main' }}>
                    {stats.connections}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Connections
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Box textAlign="center">
                  <Typography variant="h4" sx={{ fontWeight: 700, color: 'secondary.main' }}>
                    {stats.messages}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Messages
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Box textAlign="center">
                  <Typography variant="h4" sx={{ fontWeight: 700, color: 'warning.main' }}>
                    {stats.pendingRequests}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Pending
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Box textAlign="center">
                  <Typography variant="h4" sx={{ fontWeight: 700, color: 'success.main' }}>
                    {stats.profileCompletion}%
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Profile Complete
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </Paper>

          {/* Quick Actions */}
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
              Quick Actions
            </Typography>
            <Grid container spacing={2}>
              {quickActions.map((action, index) => (
                <Grid item xs={6} sm={3} key={index}>
                  <Button
                    fullWidth
                    variant="outlined"
                    startIcon={action.icon}
                    onClick={action.action}
                    sx={{
                      py: 2,
                      minHeight: '64px', // Fixed height for all buttons
                      borderColor: 'divider',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      textAlign: 'center',
                      whiteSpace: 'normal', // Allow text wrapping
                      lineHeight: 1.2,
                      '&:hover': {
                        borderColor: 'primary.main',
                        backgroundColor: 'rgba(76, 175, 80, 0.04)',
                      },
                    }}
                  >
                    {action.title}
                  </Button>
                </Grid>
              ))}
            </Grid>
          </Paper>

          {/* Recent Activity */}
          <Paper sx={{ p: 3 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Recent Activity
              </Typography>
              <Button variant="text" size="small" onClick={() => navigate('/messages')}>
                View All
              </Button>
            </Box>
            <List>
              {recentActivities.length === 0 ? (
                <ListItem>
                  <ListItemText
                    primary="No recent activity"
                    secondary="Start connecting with people to see activity here"
                  />
                </ListItem>
              ) : (
                recentActivities.map((activity, index) => (
                  <React.Fragment key={activity.id}>
                    <ListItem sx={{ px: 0 }}>
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: 'primary.main' }}>
                          {activity.type === 'connection' && <PersonAdd />}
                          {activity.type === 'message' && <Message />}
                          {activity.type === 'event' && <Event />}
                          {activity.type === 'post' && <Forum />}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={activity.title}
                        secondary={
                          <Box>
                            <Typography variant="body2" color="text.secondary">
                              {activity.description}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {activity.timestamp}
                            </Typography>
                          </Box>
                        }
                      />
                    </ListItem>
                    {index < recentActivities.length - 1 && <Divider />}
                  </React.Fragment>
                ))
              )}
            </List>
          </Paper>
        </Grid>

        {/* Right Column */}
        <Grid item xs={12} md={4}>
          {/* Profile Completion */}
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
              Profile Strength
            </Typography>
            <Box sx={{ mb: 2 }}>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                <Typography variant="body2" color="text.secondary">
                  {stats.profileCompletion}% Complete
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {stats.profileCompletion}/100
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={stats.profileCompletion}
                sx={{ height: 6, borderRadius: 3 }}
              />
            </Box>
            <Button
              variant="contained"
              fullWidth
              onClick={() => navigate('/profile')}
              sx={{ mt: 2 }}
            >
              Complete Profile
            </Button>
          </Paper>

          {/* Upcoming Events */}
          <Paper sx={{ p: 3, mb: 3 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Upcoming Events
              </Typography>
              <IconButton size="small">
                <MoreVert />
              </IconButton>
            </Box>
            <List>
              {upcomingEvents.length === 0 ? (
                <ListItem>
                  <ListItemText
                    primary="No upcoming events"
                    secondary="Check back later for new events"
                  />
                </ListItem>
              ) : (
                upcomingEvents.map((event, index) => (
                  <React.Fragment key={event.id}>
                    <ListItem sx={{ px: 0 }}>
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: 'secondary.main' }}>
                          <Event />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={event.title}
                        secondary={
                          <Box>
                            <Typography variant="body2" color="text.secondary">
                              <Schedule sx={{ fontSize: 14, mr: 0.5, verticalAlign: 'middle' }} />
                              {event.date}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              <LocationOn sx={{ fontSize: 14, mr: 0.5, verticalAlign: 'middle' }} />
                              {event.location}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {event.attendees} attendees
                            </Typography>
                          </Box>
                        }
                      />
                    </ListItem>
                    {index < upcomingEvents.length - 1 && <Divider />}
                  </React.Fragment>
                ))
              )}
            </List>
          </Paper>

          {/* Suggested Connections */}
          <Paper sx={{ p: 3 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                People You May Know
              </Typography>
              <Button variant="text" size="small" onClick={() => navigate('/connections')}>
                View All
              </Button>
            </Box>
            <List>
              {suggestedConnections.length === 0 ? (
                <ListItem>
                  <ListItemText
                    primary="No suggestions available"
                    secondary="Complete your profile to get better suggestions"
                  />
                </ListItem>
              ) : (
                suggestedConnections.map((person, index) => (
                  <React.Fragment key={person.id}>
                    <ListItem sx={{ px: 0 }}>
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: 'primary.main' }}>
                          {person.name.charAt(0)}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={person.name}
                        secondary={
                          <Box>
                            <Typography variant="body2" color="text.secondary">
                              {person.title}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              <Business sx={{ fontSize: 14, mr: 0.5, verticalAlign: 'middle' }} />
                              {person.company}
                            </Typography>
                            {person.matchScore && (
                              <Chip
                                label={`${person.matchScore}% match`}
                                size="small"
                                color="primary"
                                sx={{ mt: 0.5 }}
                              />
                            )}
                          </Box>
                        }
                      />
                      <Button
                        variant="outlined"
                        size="small"
                        sx={{ ml: 1 }}
                        onClick={() => navigate('/connections')}
                      >
                        Connect
                      </Button>
                    </ListItem>
                    {index < suggestedConnections.length - 1 && <Divider />}
                  </React.Fragment>
                ))
              )}
            </List>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default Dashboard;