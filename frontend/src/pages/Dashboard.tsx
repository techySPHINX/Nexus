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
  Paper,
  LinearProgress,
  CircularProgress,
  Alert,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  People,
  Message,
  TrendingUp,
  School,
  Work,
  AdminPanelSettings,
  Add,
  Notifications,
  CalendarToday,
  LocationOn,
  Refresh as RefreshIcon,
  NavigateNext as NavigateNextIcon,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

interface DashboardStats {
  connections: number;
  messages: number;
  pendingRequests: number;
  profileCompletion: number;
}

interface RecentActivity {
  id: string;
  type: 'connection' | 'message' | 'profile' | 'post';
  message: string;
  time: string;
  avatar: string;
  userId?: string;
}

const Dashboard: React.FC = () => {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats>({
    connections: 0,
    messages: 0,
    pendingRequests: 0,
    profileCompletion: 0,
  });
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (token) {
      fetchDashboardData();
    }
  }, [token]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch stats from multiple endpoints
      const [connectionsRes, messagesRes, notificationsRes] = await Promise.all([
        axios.get('/connection/stats'),
        axios.get('/messages/conversations/all'),
        axios.get('/notifications/stats'),
      ]);

      // Calculate profile completion
      const profileCompletion = user?.profileCompleted ? 100 : 
        (user?.profile ? 75 : 25);

      setStats({
        connections: connectionsRes.data.totalConnections || 0,
        messages: messagesRes.data.length || 0,
        pendingRequests: connectionsRes.data.pendingRequests || 0,
        profileCompletion,
      });

      // Generate recent activities based on real data
      const activities: RecentActivity[] = [];
      
      if (connectionsRes.data.recentConnections) {
        connectionsRes.data.recentConnections.forEach((conn: any) => {
          activities.push({
            id: conn.id,
            type: 'connection',
            message: `${conn.user.name} ${conn.status === 'ACCEPTED' ? 'accepted' : 'sent'} your connection request`,
            time: formatTime(conn.createdAt),
            avatar: conn.user.name.charAt(0),
            userId: conn.user.id,
          });
        });
      }

      if (messagesRes.data.length > 0) {
        const recentMessage = messagesRes.data[0];
        activities.push({
          id: recentMessage.id,
          type: 'message',
          message: `New message from ${recentMessage.otherUser?.name || 'a connection'}`,
          time: formatTime(recentMessage.lastMessage?.createdAt || new Date()),
          avatar: recentMessage.otherUser?.name?.charAt(0) || 'M',
          userId: recentMessage.otherUser?.id,
        });
      }

      // Add profile completion activity if incomplete
      if (profileCompletion < 100) {
        activities.push({
          id: 'profile',
          type: 'profile',
          message: 'Complete your profile to get better connection suggestions',
          time: 'Just now',
          avatar: 'P',
        });
      }

      setRecentActivities(activities.slice(0, 5));
    } catch (error: any) {
      console.error('Error fetching dashboard data:', error);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)} hours ago`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'STUDENT':
        return <School />;
      case 'ALUM':
        return <Work />;
      case 'ADMIN':
        return <AdminPanelSettings />;
      default:
        return <School />;
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
    {
      title: 'Send Connection Request',
      description: 'Connect with other students and alumni',
      icon: <People />,
      color: 'primary',
      action: () => navigate('/connections'),
    },
    {
      title: 'Send Message',
      description: 'Start a conversation with your connections',
      icon: <Message />,
      color: 'secondary',
      action: () => navigate('/messages'),
    },
    {
      title: 'Update Profile',
      description: 'Keep your profile information current',
      icon: <Add />,
      color: 'success',
      action: () => navigate('/profile'),
    },
  ];

  const handleActivityClick = (activity: RecentActivity) => {
    switch (activity.type) {
      case 'connection':
        navigate('/connections');
        break;
      case 'message':
        navigate('/messages');
        break;
      case 'profile':
        navigate('/profile');
        break;
      default:
        break;
    }
  };

  if (loading && stats.connections === 0) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        {/* Welcome Section */}
        <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Box>
            <Typography variant="h3" component="h1" gutterBottom sx={{ fontWeight: 700 }}>
              Welcome, {user?.name.split(' ')[0]}!
            </Typography>
            <Typography variant="h6" color="text.secondary">
              Here's what's happening in your Nexus network
            </Typography>
          </Box>
          <Box display="flex" alignItems="center" gap={1}>
            <Chip
              icon={getRoleIcon(user?.role || 'STUDENT')}
              label={user?.role}
              color={getRoleColor(user?.role || 'STUDENT') as any}
              variant="outlined"
            />
            <Tooltip title="Refresh dashboard">
              <IconButton onClick={fetchDashboardData} disabled={loading}>
                <RefreshIcon />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* Stats Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <Card sx={{ height: '100%', cursor: 'pointer' }} onClick={() => navigate('/connections')}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
                      <People />
                    </Avatar>
                    <Box>
                      <Typography variant="h4" component="div" sx={{ fontWeight: 700 }}>
                        {stats.connections}
                      </Typography>
                      <Typography color="text.secondary">Connections</Typography>
                    </Box>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={Math.min((stats.connections / 50) * 100, 100)}
                    sx={{ height: 6, borderRadius: 3 }}
                  />
                </CardContent>
              </Card>
            </motion.div>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <Card sx={{ height: '100%', cursor: 'pointer' }} onClick={() => navigate('/messages')}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Avatar sx={{ bgcolor: 'secondary.main', mr: 2 }}>
                      <Message />
                    </Avatar>
                    <Box>
                      <Typography variant="h4" component="div" sx={{ fontWeight: 700 }}>
                        {stats.messages}
                      </Typography>
                      <Typography color="text.secondary">Conversations</Typography>
                    </Box>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={Math.min((stats.messages / 20) * 100, 100)}
                    sx={{ height: 6, borderRadius: 3, bgcolor: 'secondary.light' }}
                    color="secondary"
                  />
                </CardContent>
              </Card>
            </motion.div>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <Card sx={{ height: '100%', cursor: 'pointer' }} onClick={() => navigate('/connections')}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Avatar sx={{ bgcolor: 'warning.main', mr: 2 }}>
                      <Notifications />
                    </Avatar>
                    <Box>
                      <Typography variant="h4" component="div" sx={{ fontWeight: 700 }}>
                        {stats.pendingRequests}
                      </Typography>
                      <Typography color="text.secondary">Pending Requests</Typography>
                    </Box>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={stats.pendingRequests > 0 ? 100 : 0}
                    sx={{ height: 6, borderRadius: 3, bgcolor: 'warning.light' }}
                    color="warning"
                  />
                </CardContent>
              </Card>
            </motion.div>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <Card sx={{ height: '100%', cursor: 'pointer' }} onClick={() => navigate('/profile')}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Avatar sx={{ bgcolor: 'success.main', mr: 2 }}>
                      <TrendingUp />
                    </Avatar>
                    <Box>
                      <Typography variant="h4" component="div" sx={{ fontWeight: 700 }}>
                        {stats.profileCompletion}%
                      </Typography>
                      <Typography color="text.secondary">Profile Complete</Typography>
                    </Box>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={stats.profileCompletion}
                    sx={{ height: 6, borderRadius: 3, bgcolor: 'success.light' }}
                    color="success"
                  />
                </CardContent>
              </Card>
            </motion.div>
          </Grid>
        </Grid>

        <Grid container spacing={3}>
          {/* Quick Actions */}
          <Grid item xs={12} md={4}>
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.5 }}
            >
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                    Quick Actions
                  </Typography>
                  <Box sx={{ mt: 2 }}>
                    {quickActions.map((action, index) => (
                      <motion.div
                        key={index}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <Button
                          fullWidth
                          variant="outlined"
                          startIcon={action.icon}
                          onClick={action.action}
                          sx={{
                            mb: 2,
                            justifyContent: 'flex-start',
                            textAlign: 'left',
                            py: 1.5,
                            borderColor: `${action.color}.main`,
                            color: `${action.color}.main`,
                            '&:hover': {
                              borderColor: `${action.color}.dark`,
                              backgroundColor: `${action.color}.50`,
                            },
                          }}
                        >
                          <Box sx={{ textAlign: 'left', flex: 1 }}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                              {action.title}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {action.description}
                            </Typography>
                          </Box>
                          <NavigateNextIcon />
                        </Button>
                      </motion.div>
                    ))}
                  </Box>
                </CardContent>
              </Card>
            </motion.div>
          </Grid>

          {/* Recent Activity */}
          <Grid item xs={12} md={8}>
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.6 }}
            >
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                    Recent Activity
                  </Typography>
                  {recentActivities.length > 0 ? (
                    <List>
                      {recentActivities.map((activity, index) => (
                        <React.Fragment key={activity.id}>
                          <ListItem 
                            alignItems="flex-start" 
                            button
                            onClick={() => handleActivityClick(activity)}
                            sx={{ borderRadius: 1, mb: 0.5 }}
                          >
                            <ListItemAvatar>
                              <Avatar sx={{ bgcolor: 'primary.main' }}>
                                {activity.avatar}
                              </Avatar>
                            </ListItemAvatar>
                            <ListItemText
                              primary={activity.message}
                              secondary={
                                <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                                  <CalendarToday sx={{ fontSize: 14, mr: 0.5 }} />
                                  {activity.time}
                                </Box>
                              }
                            />
                            <NavigateNextIcon color="action" />
                          </ListItem>
                          {index < recentActivities.length - 1 && <Divider variant="inset" component="li" />}
                        </React.Fragment>
                      ))}
                    </List>
                  ) : (
                    <Box textAlign="center" py={4}>
                      <Typography variant="body2" color="text.secondary">
                        No recent activity. Start connecting with people!
                      </Typography>
                    </Box>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </Grid>
        </Grid>
      </motion.div>
    </Container>
  );
};

export default Dashboard; 