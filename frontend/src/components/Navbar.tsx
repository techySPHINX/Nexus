import { FC, useState, MouseEvent } from 'react';
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
  Stack,
  Tooltip,
} from '@mui/material';
import { Grow } from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard,
  People,
  Assignment,
  Message,
  Work,
  Folder,
  Article,
  Person,
  Logout,
  Login,
  PersonAdd,
  ChevronLeft,
  ChevronRight,
  LightMode,
  DarkMode,
  Event,
  Gamepad,
} from '@mui/icons-material';
import Brightness4 from '@mui/icons-material/Brightness4';
import Brightness7 from '@mui/icons-material/Brightness7';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useTheme as useAppTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { useNavbar } from '../contexts/NavbarContext';
// import NavbarToggle from './NavbarToggle';

const Navbar: FC = () => {
  const { user, logout } = useAuth();
  const { position, collapsed, toggleCollapsed } = useNavbar();
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const { toggleTheme, isDark } = useAppTheme();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleUserMenuOpen = (event: MouseEvent<HTMLElement>) => {
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

  const navigationItems = [
    { text: 'Dashboard', icon: <Dashboard />, path: '/dashboard' },
    { text: 'Connections', icon: <People />, path: '/connections' },
    { text: 'Messages', icon: <Message />, path: '/messages' },
    { text: 'Referrals', icon: <Work />, path: '/referrals' },
    { text: 'Community', icon: <People />, path: '/subcommunities' },
    { text: 'Project', icon: <Assignment />, path: '/projects' },
    { text: 'Startup', icon: <Folder />, path: '/startups' },
    { text: 'Events', icon: <Event />, path: '/events' },
    { text: 'News', icon: <Article />, path: '/news' },
  ];

  const isActive = (path: string) => location.pathname === path;

  // Top Navbar Component
  const TopNavbar = () => (
    <AppBar
      position="fixed"
      sx={{
        zIndex: theme.zIndex.drawer + 1,
        bgcolor: theme.palette.primary.main,
        color: theme.palette.primary.contrastText,
        boxShadow: '0 2px 12px rgba(2,8,23,0.08)',
      }}
    >
      <Toolbar sx={{ justifyContent: 'space-between' }}>
        {/* Left side - Logo and Navigation */}
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Box
            component={Link}
            to="/"
            sx={{
              display: 'flex',
              alignItems: 'center',
              textDecoration: 'none',
              color: 'inherit',
              mr: 4,
            }}
          >
            <Box
              component="img"
              src="/nexus.png"
              alt="Nexus"
              sx={{
                width: 32,
                height: 32,
                objectFit: 'contain',
                mr: 1,
                bgcolor: isDark ? 'transparent' : 'rgba(0,0,0,0.06)',
                p: isDark ? 0 : 0.4,
                borderRadius: '50%',
              }}
            />
            <Typography
              variant="h6"
              sx={{
                fontWeight: 700,
                color: 'inherit',
                textDecoration: 'none',
                '&:hover': { opacity: 0.8 },
              }}
            >
              Nexus
            </Typography>
          </Box>

          {user && (
            <Box sx={{ display: { xs: 'none', md: 'flex' }, gap: 1 }}>
              {navigationItems.map((item) => (
                <Button
                  key={item.text}
                  component={Link}
                  to={item.path}
                  startIcon={item.icon}
                  sx={{
                    color: 'inherit',
                    textTransform: 'none',
                    fontWeight: isActive(item.path) ? 600 : 400,
                    bgcolor: isActive(item.path)
                      ? 'rgba(255,255,255,0.06)'
                      : 'transparent',
                    borderRadius: 2,
                    px: 2,
                    '&:hover': {
                      bgcolor: 'rgba(255,255,255,0.08)',
                    },
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
              <Tooltip title="Account" placement="bottom">
                <IconButton
                  onClick={handleUserMenuOpen}
                  sx={{ color: 'inherit' }}
                  aria-label="Account menu"
                >
                  <Avatar
                    sx={{
                      width: 28,
                      height: 28,
                      bgcolor: theme.palette.primary.light,
                    }}
                  >
                    {user.name?.charAt(0) || 'U'}
                  </Avatar>
                </IconButton>
              </Tooltip>

              <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleUserMenuClose}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
                transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                PaperProps={{
                  sx: {
                    mt: 1,
                    minWidth: 200,
                    borderRadius: 2,
                  },
                }}
              >
                <MenuItem
                  component={Link}
                  to="/profile"
                  onClick={handleUserMenuClose}
                >
                  <ListItemIcon>
                    <Person />
                  </ListItemIcon>
                  Profile
                </MenuItem>
                <MenuItem
                  component={Link}
                  to="/notifications"
                  onClick={handleUserMenuClose}
                >
                  <ListItemIcon>
                    <Person />
                  </ListItemIcon>
                  Notification
                </MenuItem>
                <MenuItem
                  component={Link}
                  to="/gamification"
                  onClick={handleUserMenuClose}
                >
                  <ListItemIcon>
                    <Gamepad />
                  </ListItemIcon>
                  Gamification
                </MenuItem>
                <MenuItem
                  component={Link}
                  to="/feed"
                  onClick={handleUserMenuClose}
                >
                  <ListItemIcon>
                    <Person />
                  </ListItemIcon>
                  My Feed
                </MenuItem>
                {user && (
                  <MenuItem
                    component={Link}
                    to={`/users/${user.id}/posts`}
                    onClick={handleUserMenuClose}
                  >
                    <ListItemIcon>
                      <Person />
                    </ListItemIcon>
                    My Post
                  </MenuItem>
                )}
                {user?.role === 'ADMIN' && (
                  <>
                    <MenuItem
                      component={Link}
                      to="/admin/moderation"
                      onClick={handleUserMenuClose}
                    >
                      <ListItemIcon>
                        <Person />
                      </ListItemIcon>
                      Feed Moderation
                    </MenuItem>
                    <MenuItem
                      component={Link}
                      to="/admin/document-verification"
                      onClick={handleUserMenuClose}
                    >
                      <ListItemIcon>
                        <Assignment />
                      </ListItemIcon>
                      Document Verification
                    </MenuItem>
                    <MenuItem
                      component={Link}
                      to="/admin/moderation/subcommunities"
                      onClick={handleUserMenuClose}
                    >
                      <ListItemIcon>
                        <Person />
                      </ListItemIcon>
                      SubCommunity Moderation
                    </MenuItem>
                    <MenuItem
                      component={Link}
                      to="/admin/events/create"
                      onClick={handleUserMenuClose}
                    >
                      <ListItemIcon>
                        <Event />
                        Create Events
                      </ListItemIcon>
                    </MenuItem>
                  </>
                )}
                <MenuItem
                  component={Link}
                  to="/files"
                  onClick={handleUserMenuClose}
                >
                  <ListItemIcon>
                    <Folder />
                  </ListItemIcon>
                  Files
                </MenuItem>
                <MenuItem
                  onClick={() => {
                    toggleTheme();
                    handleUserMenuClose();
                  }}
                >
                  <ListItemIcon>
                    <Box
                      component="span"
                      sx={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'transform 300ms ease',
                        transform: isDark
                          ? 'rotate(20deg) scale(1.05)'
                          : 'rotate(0deg) scale(1)',
                      }}
                    >
                      {isDark ? (
                        <LightMode sx={{ color: 'gold' }} />
                      ) : (
                        <DarkMode sx={{ color: theme.palette.primary.main }} />
                      )}
                    </Box>
                  </ListItemIcon>
                  {isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
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
              {/* <NavbarToggle /> */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Button
                  component={Link}
                  to="/login"
                  variant="outlined"
                  startIcon={<Login />}
                  sx={{
                    color: 'inherit',
                    borderColor: isDark
                      ? 'rgba(255,255,255,0.6)'
                      : 'rgba(0,0,0,0.12)',
                    textTransform: 'none',
                    '&:hover': {
                      borderColor: isDark
                        ? 'rgba(255,255,255,0.8)'
                        : 'rgba(0,0,0,0.2)',
                      bgcolor: isDark
                        ? 'rgba(255,255,255,0.04)'
                        : 'rgba(0,0,0,0.04)',
                    },
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
                    textTransform: 'none',
                    bgcolor: isDark
                      ? 'rgba(126, 15, 15, 0.1)'
                      : theme.palette.common.white,
                    color: isDark
                      ? theme.palette.primary.main
                      : theme.palette.primary.main,
                    '&:hover': {
                      bgcolor: isDark ? theme.palette.action.hover : 'grey.100',
                    },
                    boxShadow: 'none',
                  }}
                >
                  Register
                </Button>

                <Tooltip
                  title={
                    isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'
                  }
                >
                  <IconButton
                    onClick={toggleTheme}
                    sx={{
                      color: 'inherit',
                      ml: 0.5,
                      transition: 'transform 250ms ease',
                      transform: isDark
                        ? 'rotate(20deg) scale(1.05)'
                        : 'rotate(0deg) scale(1)',
                    }}
                    aria-label="Toggle theme"
                  >
                    {isDark ? (
                      <LightMode sx={{ color: 'gold' }} />
                    ) : (
                      <DarkMode sx={{ color: theme.palette.primary.main }} />
                    )}
                  </IconButton>
                </Tooltip>
              </Box>
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
  const LeftSidebar = () => {
    const drawerWidth = collapsed ? 80 : 160;
    return (
      <>
        <AppBar
          position="fixed"
          sx={{
            width: drawerWidth,
            height: '100vh',
            left: 0,
            top: 0,
            borderRadius: '0',
            bgcolor: theme.palette.primary.main,
            color: theme.palette.primary.contrastText,
            boxShadow: '2px 0 12px rgba(2,8,23,0.06)',
            zIndex: theme.zIndex.drawer + 1,
            transition: 'width 300ms cubic-bezier(0.4,0,0.2,1)',
            overflowX: 'hidden',
            // Layout as column so header, scroll area and bottom controls are stacked
            display: 'flex',
            flexDirection: 'column',
            // Allow absolutely positioned bottom controls to be visible above the scroll area
            overflow: 'visible',
          }}
        >
          <Box
            sx={{
              p: 2,
              borderBottom: '1px solid rgba(255,255,255,0.06)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: collapsed ? 'center' : 'space-between',
              bgcolor: isDark ? 'transparent' : 'rgba(0, 0, 0, 0.06)',
            }}
          >
            <Tooltip title="Nexus" placement="right" arrow>
              <Box
                component={Link}
                to="/"
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  textDecoration: 'none',
                  color: 'inherit',
                }}
              >
                <Box
                  component="img"
                  src="/nexus.png"
                  alt="Nexus"
                  sx={{
                    width: collapsed ? 28 : 36,
                    height: collapsed ? 28 : 36,
                    objectFit: 'contain',
                    mr: collapsed ? 0 : 1,
                  }}
                />
                {!collapsed && (
                  <Typography
                    variant="h6"
                    sx={{
                      fontWeight: 700,
                      color: 'inherit',
                      textDecoration: 'none',
                      '&:hover': { opacity: 0.9 },
                    }}
                  >
                    Nexus
                  </Typography>
                )}
              </Box>
            </Tooltip>
          </Box>

          {user ? (
            <>
              <Box
                sx={{
                  flex: 1,
                  overflowY: 'auto',
                  // Ensure content doesn't get hidden behind the fixed bottom controls
                  pb: '120px',
                  // Custom scrollbar for the sidebar
                  '&::-webkit-scrollbar': {
                    width: '8px',
                  },
                  '&::-webkit-scrollbar-track': {
                    background: 'transparent',
                  },
                  '&::-webkit-scrollbar-thumb': {
                    backgroundColor: 'rgba(255,255,255,0.12)',
                    borderRadius: 4,
                  },
                  scrollbarWidth: 'thin',
                  scrollbarColor: 'rgba(255,255,255,0.12) transparent',
                }}
              >
                <List sx={{ px: 1 }}>
                  {navigationItems.map((item) => {
                    if (collapsed) {
                      return (
                        <Tooltip
                          key={item.text}
                          title={item.text}
                          placement="right"
                          arrow
                        >
                          <ListItem
                            component={Link}
                            to={item.path}
                            button
                            sx={{
                              mb: 0.5,
                              borderRadius: 2,
                              bgcolor: isActive(item.path)
                                ? 'rgba(255,255,255,0.06)'
                                : 'transparent',
                              color: 'inherit',
                              '&:hover': { bgcolor: 'rgba(255,255,255,0.08)' },
                              px: 1,
                              justifyContent: 'flex-start',
                              alignItems: 'center',
                              minHeight: 36,
                            }}
                          >
                            <ListItemIcon
                              sx={{
                                color: 'inherit',
                                minWidth: 32,
                                justifyContent: 'center',
                                mr: 1,
                              }}
                            >
                              {item.icon}
                            </ListItemIcon>
                          </ListItem>
                        </Tooltip>
                      );
                    }

                    return (
                      <ListItem
                        key={item.text}
                        component={Link}
                        to={item.path}
                        button
                        sx={{
                          mb: 0.7,
                          borderRadius: 2,
                          bgcolor: isActive(item.path)
                            ? 'rgba(255,255,255,0.06)'
                            : 'transparent',
                          color: 'inherit',
                          '&:hover': {
                            bgcolor: 'rgba(255,255,255,0.08)',
                          },
                          px: 0.5,
                          justifyContent: 'flex-start',
                          alignItems: 'center',
                          minHeight: 36,
                        }}
                      >
                        <ListItemIcon
                          sx={{
                            color: 'inherit',
                            minWidth: 32,
                            justifyContent: 'center',
                            mr: 1,
                          }}
                        >
                          {item.icon}
                        </ListItemIcon>
                        <ListItemText
                          primary={item.text}
                          primaryTypographyProps={{
                            fontWeight: isActive(item.path) ? 600 : 400,
                            sx: { fontSize: '0.85rem', color: 'inherit' },
                          }}
                          sx={{
                            opacity: collapsed ? 0 : 1,
                            maxWidth: collapsed ? 0 : 160,
                            transition:
                              'opacity 300ms ease, max-width 320ms ease, transform 300ms ease',
                            transform: collapsed
                              ? 'translateX(-6px)'
                              : 'translateX(0)',
                            overflow: 'hidden',
                            whiteSpace: 'nowrap',
                          }}
                        />
                      </ListItem>
                    );
                  })}
                  {user?.role === 'ADMIN' && (
                    <ListItem
                      component={Link}
                      to="/admin/document-verification"
                      button
                      sx={{
                        mb: 1,
                        borderRadius: 2,
                        bgcolor: isActive('/admin/document-verification')
                          ? 'rgba(255,255,255,0.06)'
                          : 'transparent',
                        color: 'inherit',
                        px: 1,
                        justifyContent: 'flex-start',
                        alignItems: 'center',
                        minHeight: 36,
                      }}
                    >
                      <ListItemIcon
                        sx={{
                          minWidth: 32,
                          justifyContent: 'center',
                          mr: 1,
                        }}
                      >
                        <Assignment />
                      </ListItemIcon>
                      {!collapsed && (
                        <ListItemText
                          primary="Document Verification"
                          primaryTypographyProps={{
                            fontWeight: isActive('/admin/document-verification')
                              ? 600
                              : 400,
                          }}
                          sx={{
                            opacity: collapsed ? 0 : 1,
                            maxWidth: collapsed ? 0 : 160,
                            transition:
                              'opacity 300ms ease, max-width 320ms ease, transform 300ms ease',
                            transform: collapsed
                              ? 'translateX(-6px)'
                              : 'translateX(0)',
                            overflow: 'hidden',
                            whiteSpace: 'nowrap',
                          }}
                        />
                      )}
                    </ListItem>
                  )}
                </List>
              </Box>
            </>
          ) : (
            <Box
              sx={{
                p: 2,
                mt: 2,
                display: 'flex',
                justifyContent: 'center',
                flexDirection: 'column',
                gap: 2,
              }}
            >
              {!collapsed ? (
                <Stack spacing={2}>
                  <Button
                    component={Link}
                    to="/login"
                    variant="outlined"
                    startIcon={<Login />}
                    fullWidth
                    sx={{
                      color: 'inherit',
                      borderColor: isDark
                        ? 'rgba(255,255,255,0.6)'
                        : 'rgba(0,0,0,0.12)',
                      textTransform: 'none',
                      '&:hover': {
                        borderColor: isDark
                          ? 'rgba(255,255,255,0.8)'
                          : 'rgba(0,0,0,0.2)',
                        bgcolor: isDark
                          ? 'rgba(255,255,255,0.04)'
                          : 'rgba(0,0,0,0.04)',
                      },
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
                      color: 'inherit',
                      borderColor: isDark
                        ? 'rgba(255,255,255,0.6)'
                        : 'rgba(0,0,0,0.12)',
                      textTransform: 'none',
                      '&:hover': {
                        borderColor: isDark
                          ? 'rgba(255,255,255,0.8)'
                          : 'rgba(0,0,0,0.2)',
                        bgcolor: isDark
                          ? 'rgba(255,255,255,0.04)'
                          : 'rgba(0,0,0,0.04)',
                      },
                    }}
                  >
                    Register
                  </Button>
                </Stack>
              ) : (
                <Box>
                  <Tooltip title="Login" placement="right" arrow>
                    <IconButton
                      component={Link}
                      to="/login"
                      sx={{ color: 'inherit', mb: 3 }}
                      aria-label="Login"
                    >
                      <Login />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Register" placement="right" arrow>
                    <IconButton
                      component={Link}
                      to="/register"
                      sx={{ color: 'inherit' }}
                      aria-label="Register"
                    >
                      <PersonAdd />
                    </IconButton>
                  </Tooltip>
                </Box>
              )}
              {/* Collapse control also present when no user */}
              <Box sx={{ p: 1, mt: 2 }}>
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: collapsed ? 'center' : 'flex-end',
                  }}
                >
                  {collapsed ? (
                    <Tooltip title="Expand" placement="right">
                      <IconButton
                        onClick={toggleCollapsed}
                        sx={{ color: 'inherit' }}
                        aria-label="Expand sidebar"
                      >
                        <ChevronRight />
                      </IconButton>
                    </Tooltip>
                  ) : (
                    <Tooltip title="Collapse" placement="right">
                      <IconButton
                        onClick={toggleCollapsed}
                        sx={{ color: 'inherit' }}
                        aria-label="Collapse sidebar"
                      >
                        <ChevronLeft />
                      </IconButton>
                    </Tooltip>
                  )}
                </Box>
              </Box>
            </Box>
          )}

          {user && (
            // Anchor the bottom controls absolutely so collapse stays fixed at the bottom
            <Box
              sx={{
                position: 'absolute',
                left: 0,
                right: 0,
                bottom: 10,
                px: 2,
                background: 'rgba(0,0,0,0.0)',
                bgcolor: isDark ? 'transparent' : 'rgba(0,0,0,0.06)',
                // Keep above the scrollable content
                zIndex: theme.zIndex.drawer + 3,
                // Ensure it captures pointer events
                pointerEvents: 'auto',
              }}
            >
              {/* Collapse control sits above the user card */}
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: collapsed ? 'center' : 'flex-end',
                  mb: 1,
                }}
              >
                {collapsed ? (
                  <Tooltip title="Expand" placement="right">
                    <IconButton
                      onClick={toggleCollapsed}
                      sx={{ color: 'inherit' }}
                      aria-label="Expand sidebar"
                    >
                      <ChevronRight />
                    </IconButton>
                  </Tooltip>
                ) : (
                  <Tooltip title="Collapse" placement="right">
                    <IconButton
                      onClick={toggleCollapsed}
                      sx={{ color: 'inherit' }}
                      aria-label="Collapse sidebar"
                    >
                      <ChevronLeft />
                    </IconButton>
                  </Tooltip>
                )}
              </Box>

              <Box
                onClick={handleUserMenuOpen}
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: collapsed ? 0 : 1,
                  p: 1,
                  borderRadius: 2,
                  bgcolor: 'rgba(255,255,255,0.04)',
                  cursor: 'pointer',
                  justifyContent: 'center',
                }}
              >
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: collapsed ? 0 : 2,
                  }}
                >
                  <Avatar
                    src={user.profile?.avatarUrl}
                    alt={user.name?.charAt(0)}
                    sx={{
                      width: 28,
                      height: 28,
                      bgcolor: theme.palette.primary.light,
                    }}
                  >
                    {user.name?.charAt(0)}
                  </Avatar>

                  {!collapsed && (
                    <Box>
                      <Typography
                        variant="body2"
                        sx={{ color: 'inherit', fontWeight: 800 }}
                      >
                        {user.name?.trim().split(/\s+/)[0] || 'User'}
                      </Typography>
                    </Box>
                  )}
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
              sx: { mt: 1, minWidth: 200, borderRadius: 2, ml: 2 },
            }}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            transformOrigin={{ vertical: 'top', horizontal: 'right' }}
          >
            <MenuItem
              component={Link}
              to="/profile"
              onClick={handleUserMenuClose}
            >
              <ListItemIcon>
                <Person />
              </ListItemIcon>
              Profile
            </MenuItem>
            <MenuItem
              component={Link}
              to="/notifications"
              onClick={handleUserMenuClose}
            >
              <ListItemIcon>
                <Person />
              </ListItemIcon>
              Notification
            </MenuItem>
            <MenuItem
              component={Link}
              to="/gamification"
              onClick={handleUserMenuClose}
            >
              <ListItemIcon>
                <Gamepad />
              </ListItemIcon>
              Gamification
            </MenuItem>
            <MenuItem component={Link} to="/feed" onClick={handleUserMenuClose}>
              <ListItemIcon>
                <Person />
              </ListItemIcon>
              My Feed
            </MenuItem>
            {user && (
              <MenuItem
                component={Link}
                to={`/users/${user.id}/posts`}
                onClick={handleUserMenuClose}
              >
                <ListItemIcon>
                  <Person />
                </ListItemIcon>
                My Post
              </MenuItem>
            )}
            {user?.role === 'ADMIN' && (
              <>
                <MenuItem
                  component={Link}
                  to="/admin/moderation"
                  onClick={handleUserMenuClose}
                >
                  <ListItemIcon>
                    <Person />
                  </ListItemIcon>
                  Feed Moderation
                </MenuItem>
                <MenuItem
                  component={Link}
                  to="/admin/document-verification"
                  onClick={handleUserMenuClose}
                >
                  <ListItemIcon>
                    <Assignment />
                  </ListItemIcon>
                  Document Verification
                </MenuItem>
                <MenuItem
                  component={Link}
                  to="/admin/moderation/subcommunities"
                  onClick={handleUserMenuClose}
                >
                  <ListItemIcon>
                    <Person />
                  </ListItemIcon>
                  SubCommunity Moderation
                </MenuItem>
                <MenuItem
                  component={Link}
                  to="/admin/events/create"
                  onClick={handleUserMenuClose}
                >
                  <ListItemIcon>
                    <Event />
                    Create Events
                  </ListItemIcon>
                </MenuItem>
              </>
            )}
            <MenuItem
              component={Link}
              to="/files"
              onClick={handleUserMenuClose}
            >
              <ListItemIcon>
                <Folder />
              </ListItemIcon>
              Files
            </MenuItem>
            <Divider />
            {/* Theme toggle: animated icon swap */}
            <MenuItem
              onClick={() => {
                toggleTheme();
                handleUserMenuClose();
              }}
            >
              <ListItemIcon>
                <Box sx={{ position: 'relative', width: 24, height: 24 }}>
                  <Grow in={!isDark} timeout={300}>
                    <Brightness7
                      sx={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        color: 'warning.main',
                      }}
                    />
                  </Grow>
                  <Grow in={isDark} timeout={300}>
                    <Brightness4
                      sx={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        color: 'primary.main',
                      }}
                    />
                  </Grow>
                </Box>
              </ListItemIcon>
              Toggle theme
            </MenuItem>
            <MenuItem onClick={handleLogout}>
              <ListItemIcon>
                <Logout />
              </ListItemIcon>
              Logout
            </MenuItem>
          </Menu>
        </AppBar>
      </>
    );
  };

  const MobileDrawer = () => (
    <Drawer
      variant="temporary"
      open={mobileOpen}
      onClose={handleDrawerToggle}
      ModalProps={{ keepMounted: true }}
      sx={{
        display: { xs: 'block', md: 'none' },
        '& .MuiDrawer-paper': {
          width: 280,
          bgcolor: 'primary.main',
          color: 'white',
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
              bgcolor: isActive(item.path)
                ? 'rgba(255,255,255,0.1)'
                : 'transparent',
              color: 'white',
              '&:hover': {
                bgcolor: 'rgba(255,255,255,0.2)',
              },
            }}
          >
            <ListItemIcon sx={{ color: 'white', minWidth: 40 }}>
              {item.icon}
            </ListItemIcon>
            <ListItemText primary={item.text} />
          </ListItem>
        ))}
      </List>

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
              '&:hover': { bgcolor: 'rgba(255,255,255,0.2)' },
            }}
            onClick={() => {
              handleUserMenuOpen({
                currentTarget: document.body,
              } as React.MouseEvent<HTMLElement>);
              handleDrawerToggle();
            }}
          >
            <Avatar sx={{ width: 36, height: 36, bgcolor: 'primary.light' }}>
              {user.name?.charAt(0) || 'U'}
            </Avatar>
            <Box sx={{ flex: 1 }}>
              <Typography
                variant="body2"
                sx={{ color: 'white', fontWeight: 600 }}
              >
                {user.name || 'User'}
              </Typography>
              <Typography
                variant="caption"
                sx={{ color: 'rgba(255,255,255,0.7)' }}
              >
                {user.role || 'Member'}
              </Typography>
            </Box>
          </Box>
        </Box>
      )}
    </Drawer>
  );

  // Render based on position but always include the mobile drawer
  // Use navbar position from context only
  const NavbarUI = position === 'left' ? <LeftSidebar /> : <TopNavbar />;
  return (
    <>
      {NavbarUI}
      <MobileDrawer />
    </>
  );
};

export default Navbar;
