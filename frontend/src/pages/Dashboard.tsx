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
  Stack,
  Badge
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
  Event,
  Forum,
  ConnectWithoutContact,
  PersonAdd,
  Assignment,
  Groups,
  RocketLaunch
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { motion } from 'framer-motion';

interface DashboardStats {
  connections: number;
  messages: number;
  pendingRequests: number;
  profileCompletion: number;
  upcomingEvents: number;
  newAlumni: number;
}

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    connections: 24,
    messages: 5,
    pendingRequests: 3,
    profileCompletion: 75,
    upcomingEvents: 2,
    newAlumni: 8
  });

  // Simulate loading data
  useEffect(() => {
    // In a real app, you would fetch this data from your API
    const timer = setTimeout(() => {
      setStats({
        connections: 24,
        messages: 5,
        pendingRequests: 3,
        profileCompletion: 75,
        upcomingEvents: 2,
        newAlumni: 8
      });
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'STUDENT': return 'primary';
      case 'ALUM': return 'secondary';
      case 'ADMIN': return 'error';
      default: return 'default';
    }
  };

  const recentActivities = [
    { id: 1, type: 'connection', message: 'John Doe accepted your connection', time: '2h ago', avatar: 'J' },
    { id: 2, type: 'message', message: 'New message from Jane Smith', time: '4h ago', avatar: 'J' },
    { id: 3, type: 'event', message: 'Upcoming alumni meet on Friday', time: '1d ago', avatar: 'E' },
    { id: 4, type: 'network', message: '8 new alumni joined this week', time: '2d ago', avatar: 'N' },
  ];

  const quickActions = [
    { title: 'Connect', icon: <PersonAdd />, color: 'primary' },
    { title: 'Message', icon: <Forum />, color: 'secondary' },
    { title: 'Events', icon: <Event />, color: 'warning' },
    { title: 'Resources', icon: <Assignment />, color: 'info' },
  ];

  // Future features placeholder data
  const upcomingEvents = [
    { id: 1, title: 'Alumni Meet 2023', date: 'Oct 15', location: 'College Campus' },
    { id: 2, title: 'Career Workshop', date: 'Nov 5', location: 'Online' },
  ];

  const suggestedConnections = [
    { id: 1, name: 'Alex Johnson', role: 'Software Engineer', avatar: 'AJ' },
    { id: 2, name: 'Sarah Miller', role: 'Product Manager', avatar: 'SM' },
    { id: 3, name: 'David Wilson', role: 'Data Scientist', avatar: 'DW' },
  ];

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      {/* Header Section */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" sx={{ 
          fontWeight: 700,
          background: 'linear-gradient(45deg, #1976d2 30%, #4dabf5 90%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          display: 'inline-block'
        }}>
          Welcome back, {user?.name.split(' ')[0]}!
        </Typography>
        <Typography variant="subtitle1" color="text.secondary" sx={{ mt: 1 }}>
          Here's what's happening in your network today
        </Typography>
      </Box>

      {/* Stats Grid */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {[
          { icon: <People />, value: stats.connections, label: 'Connections', color: 'primary', progress: 70 },
          { icon: <Message />, value: stats.messages, label: 'Messages', color: 'secondary', progress: 45 },
          { icon: <Notifications />, value: stats.pendingRequests, label: 'Requests', color: 'warning', progress: 30 },
          { icon: <TrendingUp />, value: `${stats.profileCompletion}%`, label: 'Profile', color: 'success', progress: stats.profileCompletion },
          { icon: <Event />, value: stats.upcomingEvents, label: 'Events', color: 'info', progress: 50 },
          { icon: <Groups />, value: stats.newAlumni, label: 'New Alumni', color: 'secondary', progress: 60 },
        ].map((stat, index) => (
          <Grid item xs={12} sm={6} md={4} lg={2} key={index}>
            <motion.div whileHover={{ y: -5 }} transition={{ duration: 0.2 }}>
              <Card sx={{ 
                height: '100%',
                borderLeft: `4px solid`,
                borderColor: `${stat.color}.main`,
                boxShadow: '0 4px 20px rgba(0,0,0,0.05)'
              }}>
                <CardContent>
                  <Stack direction="row" alignItems="center" spacing={2}>
                    <Avatar sx={{ 
                      bgcolor: `${stat.color}.light`, 
                      color: `${stat.color}.dark`,
                      width: 48, 
                      height: 48 
                    }}>
                      {stat.icon}
                    </Avatar>
                    <Box>
                      <Typography variant="h5" sx={{ fontWeight: 700 }}>{stat.value}</Typography>
                      <Typography variant="body2" color="text.secondary">{stat.label}</Typography>
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
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>Quick Actions</Typography>
              <Grid container spacing={2}>
                {quickActions.map((action, index) => (
                  <Grid item xs={6} sm={3} key={index}>
                    <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }}>
                      <Button
                        fullWidth
                        variant="contained"
                        startIcon={action.icon}
                        sx={{
                          py: 2,
                          borderRadius: 2,
                          bgcolor: `${action.color}.main`,
                          '&:hover': { bgcolor: `${action.color}.dark` }
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
          <Card sx={{ borderRadius: 3 }}>
            <CardContent>
              <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>Recent Activity</Typography>
                <Button size="small" color="primary">View All</Button>
              </Stack>
              <List disablePadding>
                {recentActivities.map((activity, index) => (
                  <React.Fragment key={activity.id}>
                    <ListItem alignItems="flex-start" sx={{ py: 1.5 }}>
                      <ListItemAvatar>
                        <Badge
                          overlap="circular"
                          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                          badgeContent={
                            <Box sx={{ 
                              bgcolor: getRoleColor(user?.role || ''),
                              width: 12, 
                              height: 12,
                              borderRadius: '50%',
                              border: '2px solid white'
                            }} />
                          }
                        >
                          <Avatar sx={{ 
                            bgcolor: 'primary.light', 
                            color: 'primary.dark',
                            width: 40, 
                            height: 40 
                          }}>
                            {activity.avatar}
                          </Avatar>
                        </Badge>
                      </ListItemAvatar>
                      <ListItemText
                        primary={activity.message}
                        primaryTypographyProps={{ fontWeight: 500 }}
                        secondary={
                          <Stack direction="row" alignItems="center" spacing={0.5} mt={0.5}>
                            <CalendarToday sx={{ fontSize: 14, color: 'text.secondary' }} />
                            <Typography variant="caption" color="text.secondary">
                              {activity.time}
                            </Typography>
                          </Stack>
                        }
                      />
                    </ListItem>
                    {index < recentActivities.length - 1 && (
                      <Divider variant="inset" component="li" sx={{ ml: 7 }} />
                    )}
                  </React.Fragment>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Right Column */}
        <Grid item xs={12} md={4}>
          {/* Upcoming Events - Future Feature */}
          <Card sx={{ mb: 3, borderRadius: 3 }}>
            <CardContent>
              <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>Upcoming Events</Typography>
                <Button size="small" color="primary">Create</Button>
              </Stack>
              <List disablePadding>
                {upcomingEvents.map((event, index) => (
                  <React.Fragment key={event.id}>
                    <ListItem sx={{ py: 1.5 }}>
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: 'warning.light', color: 'warning.dark' }}>
                          <Event />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={event.title}
                        secondary={
                          <Stack direction="row" spacing={1} mt={0.5}>
                            <Chip 
                              label={event.date} 
                              size="small" 
                              variant="outlined" 
                              color="warning"
                              icon={<CalendarToday sx={{ fontSize: 14 }} />}
                            />
                            <Chip 
                              label={event.location} 
                              size="small" 
                              variant="outlined" 
                              color="info"
                              icon={<LocationOn sx={{ fontSize: 14 }} />}
                            />
                          </Stack>
                        }
                      />
                    </ListItem>
                    {index < upcomingEvents.length - 1 && <Divider variant="middle" />}
                  </React.Fragment>
                ))}
              </List>
              <Button fullWidth sx={{ mt: 1 }} startIcon={<Add />}>
                Add New Event
              </Button>
            </CardContent>
          </Card>

          {/* Suggested Connections - Future Feature */}
          <Card sx={{ borderRadius: 3 }}>
            <CardContent>
              <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>Suggested Connections</Typography>
                <Button size="small" color="primary">View All</Button>
              </Stack>
              <List disablePadding>
                {suggestedConnections.map((person, index) => (
                  <React.Fragment key={person.id}>
                    <ListItem sx={{ py: 1.5 }}>
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: 'primary.light', color: 'primary.dark' }}>
                          {person.avatar}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={person.name}
                        secondary={person.role}
                      />
                      <Button size="small" variant="outlined" color="primary">
                        Connect
                      </Button>
                    </ListItem>
                    {index < suggestedConnections.length - 1 && <Divider variant="middle" />}
                  </React.Fragment>
                ))}
              </List>
              <Button fullWidth sx={{ mt: 1 }} startIcon={<ConnectWithoutContact />}>
                Find More Connections
              </Button>
            </CardContent>
          </Card>

          {/* Profile Completion - Future Feature */}
          <Card sx={{ mt: 3, borderRadius: 3 }}>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>Profile Strength</Typography>
              <LinearProgress 
                variant="determinate" 
                value={stats.profileCompletion} 
                sx={{ 
                  height: 8, 
                  borderRadius: 4,
                  mb: 1.5 
                }} 
              />
              <Stack direction="row" justifyContent="space-between">
                <Typography variant="body2" color="text.secondary">
                  {stats.profileCompletion}% Complete
                </Typography>
                <Button size="small" endIcon={<RocketLaunch />}>
                  Boost Profile
                </Button>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
};

export default Dashboard;