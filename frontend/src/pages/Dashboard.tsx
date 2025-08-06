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
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { motion } from 'framer-motion';

interface DashboardStats {
  connections: number;
  messages: number;
  pendingRequests: number;
  profileCompletion: number;
}

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    connections: 0,
    messages: 0,
    pendingRequests: 0,
    profileCompletion: 0,
  });

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

  const recentActivities = [
    {
      id: 1,
      type: 'connection',
      message: 'John Doe accepted your connection request',
      time: '2 hours ago',
      avatar: 'J',
    },
    {
      id: 2,
      type: 'message',
      message: 'New message from Jane Smith',
      time: '4 hours ago',
      avatar: 'J',
    },
    {
      id: 3,
      type: 'profile',
      message: 'Profile updated successfully',
      time: '1 day ago',
      avatar: 'P',
    },
  ];

  const quickActions = [
    {
      title: 'Send Connection Request',
      description: 'Connect with other students and alumni',
      icon: <People />,
      color: 'primary',
    },
    {
      title: 'Send Message',
      description: 'Start a conversation with your connections',
      icon: <Message />,
      color: 'secondary',
    },
    {
      title: 'Update Profile',
      description: 'Keep your profile information current',
      icon: <Add />,
      color: 'success',
    },
  ];

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        {/* Welcome Section */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h3" component="h1" gutterBottom sx={{ fontWeight: 700 }}>
            Welcome back, {user?.email.split('@')[0]}!
          </Typography>
          <Typography variant="h6" color="text.secondary">
            Here's what's happening in your Nexus network
          </Typography>
        </Box>

        {/* Stats Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <Card sx={{ height: '100%' }}>
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
                    value={70}
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
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Avatar sx={{ bgcolor: 'secondary.main', mr: 2 }}>
                      <Message />
                    </Avatar>
                    <Box>
                      <Typography variant="h4" component="div" sx={{ fontWeight: 700 }}>
                        {stats.messages}
                      </Typography>
                      <Typography color="text.secondary">Messages</Typography>
                    </Box>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={45}
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
              <Card sx={{ height: '100%' }}>
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
                    value={30}
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
              <Card sx={{ height: '100%' }}>
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

        {/* Main Content */}
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
                          <Box sx={{ textAlign: 'left' }}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                              {action.title}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {action.description}
                            </Typography>
                          </Box>
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
                  <List>
                    {recentActivities.map((activity, index) => (
                      <React.Fragment key={activity.id}>
                        <ListItem alignItems="flex-start">
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
                        </ListItem>
                        {index < recentActivities.length - 1 && <Divider variant="inset" component="li" />}
                      </React.Fragment>
                    ))}
                  </List>
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