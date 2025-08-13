import React, { useState } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  IconButton,
  Menu,
  MenuItem,
  Avatar,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  useTheme,
  Stack
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard,
  People,
  Message,
  Work,
  Folder,
  Person,
  Logout,
  Login,
  PersonAdd
} from '@mui/icons-material';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useNavbar } from '../contexts/NavbarContext';
import AppleNotification from './AppleNotification';
import ThemeToggle from './ThemeToggle';
import NavbarToggle from './NavbarToggle';

const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const { position } = useNavbar();
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  // Mock notifications for demo - replace with real data
  const [notifications, setNotifications] = useState([
    {
      id: '1',
      type: 'message' as const,
      title: 'New Message',
      message: 'You have a new message from John Doe',
      timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 minutes ago
      isRead: false
    },
    {
      id: '2',
      type: 'connection' as const,
      title: 'Connection Request',
      message: 'Sarah Wilson wants to connect with you',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
      isRead: false
    },
    {
      id: '3',
      type: 'referral' as const,
      title: 'New Job Referral',
      message: 'A new job referral has been posted in your field',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
      isRead: true
    }
  ]);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleUserMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleUserMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    logout();
    handleUserMenuClose();
    navigate('/');
  };

  const handleMarkAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, isRead: true } : n)
    );
  };

  const handleDeleteNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const handleNotificationClick = (notification: any) => {
    // Handle notification click - navigate to appropriate page
    switch (notification.type) {
      case 'message':
        navigate('/messages');
        break;
      case 'connection':
        navigate('/connections');
        break;
      case 'referral':
        navigate('/referrals');
        break;
      default:
        break;
    }
  };

  const navigationItems = [
    { text: 'Dashboard', icon: <Dashboard />, path: '/dashboard' },
    { text: 'Connections', icon: <People />, path: '/connections' },
    { text: 'Messages', icon: <Message />, path: '/messages' },
    { text: 'Referrals', icon: <Work />, path: '/referrals' },
    { text: 'Files', icon: <Folder />, path: '/files' },
  ];

  const isActive = (path: string) => location.pathname === path;

  // Top Navbar Component
  const TopNavbar = () => (
    <AppBar 
      position="fixed" 
      sx={{ 
        zIndex: theme.zIndex.drawer + 1,
        bgcolor: 'primary.main',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
      }}
    >
      <Toolbar sx={{ justifyContent: 'space-between' }}>
        {/* Left side - Logo and Navigation */}
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Typography
            variant="h6"
            component={Link}
            to="/"
            sx={{
              fontWeight: 700,
              color: 'white',
              textDecoration: 'none',
              mr: 4,
              '&:hover': { opacity: 0.8 }
            }}
          >
            Nexus
          </Typography>

          {user && (
            <Box sx={{ display: { xs: 'none', md: 'flex' }, gap: 1 }}>
              {navigationItems.map((item) => (
                <Button
                  key={item.text}
                  component={Link}
                  to={item.path}
                  startIcon={item.icon}
                  sx={{
                    color: 'white',
                    textTransform: 'none',
                    fontWeight: isActive(item.path) ? 600 : 400,
                    bgcolor: isActive(item.path) ? 'rgba(255,255,255,0.1)' : 'transparent',
                    borderRadius: 2,
                    px: 2,
                    '&:hover': {
                      bgcolor: 'rgba(255,255,255,0.2)'
                    }
                  }}
                >
                  {item.text}
                </Button>
              ))}
            </Box>
          )}
        </Box>

        {/* Right side - Actions and User Menu */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                     {user ? (
             <>
               <AppleNotification 
                 notifications={notifications} 
                 onMarkAsRead={handleMarkAsRead} 
                 onDelete={handleDeleteNotification} 
                 onNotificationClick={handleNotificationClick} 
               />
               <ThemeToggle />
               <NavbarToggle />
              
              <IconButton
                onClick={handleUserMenuOpen}
                sx={{ color: 'white' }}
              >
                <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.light' }}>
                  {user.name?.charAt(0) || 'U'}
                </Avatar>
              </IconButton>

              <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleUserMenuClose}
                PaperProps={{
                  sx: {
                    mt: 1,
                    minWidth: 200,
                    borderRadius: 2
                  }
                }}
              >
                <MenuItem component={Link} to="/profile" onClick={handleUserMenuClose}>
                  <ListItemIcon>
                    <Person />
                  </ListItemIcon>
                  Profile
                </MenuItem>
                <Divider />
                <MenuItem onClick={handleLogout}>
                  <ListItemIcon>
                    <Logout />
                  </ListItemIcon>
                  Logout
                </MenuItem>
              </Menu>
            </>
          ) : (
            <>
              <NavbarToggle />
              <Button
                component={Link}
                to="/login"
                variant="outlined"
                startIcon={<Login />}
                sx={{
                  color: 'white',
                  borderColor: 'white',
                  textTransform: 'none',
                  '&:hover': {
                    borderColor: 'white',
                    bgcolor: 'rgba(255,255,255,0.1)'
                  }
                }}
              >
                Login
              </Button>
              <Button
                component={Link}
                to="/register"
                variant="contained"
                startIcon={<PersonAdd />}
                sx={{
                  bgcolor: 'white',
                  color: 'primary.main',
                  textTransform: 'none',
                  '&:hover': {
                    bgcolor: 'grey.100'
                  }
                }}
              >
                Register
              </Button>
            </>
          )}

          {/* Mobile menu button */}
          {user && (
            <IconButton
              color="inherit"
              aria-label="open drawer"
              edge="start"
              onClick={handleDrawerToggle}
              sx={{ display: { md: 'none' } }}
            >
              <MenuIcon />
            </IconButton>
          )}
        </Box>
      </Toolbar>
    </AppBar>
  );

  // Left Sidebar Component
  const LeftSidebar = () => (
    <>
      <AppBar
        position="fixed"
        sx={{
          width: 280,
          height: '100vh',
          left: 0,
          top: 0,
          bgcolor: 'primary.main',
          boxShadow: '2px 0 10px rgba(0,0,0,0.1)',
          zIndex: theme.zIndex.drawer + 1
        }}
      >
        <Box sx={{ p: 3, borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
          <Typography
            variant="h5"
            component={Link}
            to="/"
            sx={{
              fontWeight: 700,
              color: 'white',
              textDecoration: 'none',
              display: 'block',
              textAlign: 'center',
              '&:hover': { opacity: 0.8 }
            }}
          >
            Nexus
          </Typography>
        </Box>

        {user ? (
          <Box sx={{ flex: 1, overflow: 'auto' }}>
            <List sx={{ px: 2 }}>
              {navigationItems.map((item) => (
                <ListItem
                  key={item.text}
                  component={Link}
                  to={item.path}
                  button
                  sx={{
                    mb: 1,
                    borderRadius: 2,
                    bgcolor: isActive(item.path) ? 'rgba(255,255,255,0.1)' : 'transparent',
                    color: 'white',
                    '&:hover': {
                      bgcolor: 'rgba(255,255,255,0.2)'
                    }
                  }}
                >
                  <ListItemIcon sx={{ color: 'white', minWidth: 40 }}>
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText 
                    primary={item.text}
                    primaryTypographyProps={{
                      fontWeight: isActive(item.path) ? 600 : 400
                    }}
                  />
                </ListItem>
              ))}
            </List>

            <Divider sx={{ borderColor: 'rgba(255,255,255,0.1)', mx: 2, my: 2 }} />

                         <Box sx={{ p: 2 }}>
               <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
                 <ThemeToggle />
                 <NavbarToggle />
               </Stack>
               
               <AppleNotification 
                 notifications={notifications} 
                 onMarkAsRead={handleMarkAsRead} 
                 onDelete={handleDeleteNotification} 
                 onNotificationClick={handleNotificationClick} 
               />
             </Box>
          </Box>
        ) : (
          <Box sx={{ p: 3, mt: 4 }}>
            <Stack spacing={2}>
              <Button
                component={Link}
                to="/login"
                variant="outlined"
                startIcon={<Login />}
                fullWidth
                sx={{
                  color: 'white',
                  borderColor: 'white',
                  textTransform: 'none',
                  '&:hover': {
                    borderColor: 'white',
                    bgcolor: 'rgba(255,255,255,0.1)'
                  }
                }}
              >
                Login
              </Button>
              <Button
                component={Link}
                to="/register"
                variant="contained"
                startIcon={<PersonAdd />}
                fullWidth
                sx={{
                  bgcolor: 'white',
                  color: 'primary.main',
                  textTransform: 'none',
                  '&:hover': {
                    bgcolor: 'grey.100'
                  }
                }}
              >
                Register
              </Button>
            </Stack>
          </Box>
        )}

        {user && (
          <Box sx={{ p: 3, borderTop: '1px solid rgba(255,255,255,0.1)' }}>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 2,
                p: 2,
                borderRadius: 2,
                bgcolor: 'rgba(255,255,255,0.1)',
                cursor: 'pointer',
                '&:hover': {
                  bgcolor: 'rgba(255,255,255,0.2)'
                }
              }}
              onClick={handleUserMenuOpen}
            >
              <Avatar sx={{ width: 40, height: 40, bgcolor: 'primary.light' }}>
                {user.name?.charAt(0) || 'U'}
              </Avatar>
              <Box sx={{ flex: 1 }}>
                <Typography variant="body2" sx={{ color: 'white', fontWeight: 600 }}>
                  {user.name || 'User'}
                </Typography>
                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                  {user.role || 'Member'}
                </Typography>
              </Box>
            </Box>
          </Box>
        )}

        {/* User Menu for Left Sidebar */}
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleUserMenuClose}
          PaperProps={{
            sx: {
              mt: 1,
              minWidth: 200,
              borderRadius: 2,
              ml: 2
            }
          }}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'right',
          }}
          transformOrigin={{
            vertical: 'top',
            horizontal: 'right',
          }}
        >
          <MenuItem component={Link} to="/profile" onClick={handleUserMenuClose}>
            <ListItemIcon>
              <Person />
            </ListItemIcon>
            Profile
          </MenuItem>
          <Divider />
          <MenuItem onClick={handleLogout}>
            <ListItemIcon>
              <Logout />
            </ListItemIcon>
            Logout
          </MenuItem>
        </Menu>
      </AppBar>

      {/* Mobile drawer */}
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={handleDrawerToggle}
        ModalProps={{
          keepMounted: true,
        }}
        sx={{
          display: { xs: 'block', md: 'none' },
          '& .MuiDrawer-paper': { 
            width: 280,
            bgcolor: 'primary.main',
            color: 'white'
          },
        }}
      >
        <Box sx={{ p: 3, borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
          <Typography variant="h5" sx={{ fontWeight: 700, textAlign: 'center' }}>
            Nexus
          </Typography>
        </Box>
        
        <List sx={{ px: 2 }}>
          {navigationItems.map((item) => (
            <ListItem
              key={item.text}
              component={Link}
              to={item.path}
              button
              onClick={handleDrawerToggle}
              sx={{
                mb: 1,
                borderRadius: 2,
                bgcolor: isActive(item.path) ? 'rgba(255,255,255,0.1)' : 'transparent',
                color: 'white',
                '&:hover': {
                  bgcolor: 'rgba(255,255,255,0.2)'
                }
              }}
            >
              <ListItemIcon sx={{ color: 'white', minWidth: 40 }}>
                {item.icon}
              </ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItem>
          ))}
        </List>

        {/* User Menu for Mobile Drawer */}
        {user && (
          <Box sx={{ p: 2, borderTop: '1px solid rgba(255,255,255,0.1)' }}>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 2,
                p: 2,
                borderRadius: 2,
                bgcolor: 'rgba(255,255,255,0.1)',
                cursor: 'pointer',
                '&:hover': {
                  bgcolor: 'rgba(255,255,255,0.2)'
                }
              }}
              onClick={() => {
                handleUserMenuOpen({ currentTarget: document.body } as any);
                handleDrawerToggle();
              }}
            >
              <Avatar sx={{ width: 40, height: 40, bgcolor: 'primary.light' }}>
                {user.name?.charAt(0) || 'U'}
              </Avatar>
              <Box sx={{ flex: 1 }}>
                <Typography variant="body2" sx={{ color: 'white', fontWeight: 600 }}>
                  {user.name || 'User'}
                </Typography>
                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                  {user.role || 'Member'}
                </Typography>
              </Box>
            </Box>
          </Box>
        )}
      </Drawer>
    </>
  );

  // Render based on position
  if (position === 'left') {
    return <LeftSidebar />;
  }

  return <TopNavbar />;
};

export default Navbar; 