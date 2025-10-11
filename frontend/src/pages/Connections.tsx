import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Button,
  Tabs,
  Tab,
  CircularProgress,
  Alert,
  TextField,
  Paper,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  InputAdornment,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Avatar,
  Chip,
  IconButton,
  Tooltip,
  TablePagination,
  Card,
  CardContent,
  CardActions,
  Badge,
  Grid,
} from '@mui/material';
import type { SelectChangeEvent } from '@mui/material/Select';
import {
  Search as SearchIcon,
  People as PeopleIcon,
  School as SchoolIcon,
  Work as WorkIcon,
  Check as CheckIcon,
  Close as CloseIcon,
  Message as MessageIcon,
  PersonAdd as PersonAddIcon,
  FilterList as FilterIcon,
  SortByAlpha as SortIcon,
  ViewModule as GridViewIcon,
  ViewList as ListViewIcon,
  TrendingUp as TrendingIcon,
  Star as StarIcon,
  LocationOn as LocationIcon,
  Schedule as TimeIcon,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import useConnections from '../hooks/useConnections';
import type {
  Connection,
  PendingRequest,
  ConnectionSuggestion,
} from '../types/connections';

const Connections: React.FC = () => {
  const navigate = useNavigate();
  const [tabValue, setTabValue] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<'name' | 'date' | 'role'>('name');

  // Use the connections hook for real data
  const {
    connections,
    pendingReceived,
    pendingSent,
    suggestions,
    stats,
    loading: connectionsLoading,
    error: connectionsError,
    fetchAll,
    respondToRequest,
    sendRequest,
    removeConnection,
  } = useConnections();

  // Fetch data when component mounts or filters change
  useEffect(() => {
    const filters = {
      page: page + 1,
      limit: rowsPerPage,
      role:
        roleFilter && roleFilter !== ''
          ? (roleFilter as 'STUDENT' | 'ALUM' | 'ADMIN')
          : undefined,
      search: searchTerm || undefined,
    };

    fetchAll(filters);
  }, [page, rowsPerPage, roleFilter, searchTerm, fetchAll]);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
    setPage(0);
  };

  const handleRoleFilterChange = (event: SelectChangeEvent<string>) => {
    setRoleFilter(event.target.value);
    setPage(0);
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

  const handleAcceptRequest = async (requestId: string) => {
    await respondToRequest(requestId, 'ACCEPTED');
  };

  const handleRejectRequest = async (requestId: string) => {
    await respondToRequest(requestId, 'REJECTED');
  };

  const handleConnect = async (userId: string) => {
    await sendRequest(userId);
  };

  const handleRemoveConnection = async (connectionId: string) => {
    await removeConnection(connectionId);
  };

  const handleSendMessage = (userId: string) => {
    // Navigate to messages page with user ID to auto-start conversation
    if (userId) {
      navigate(`/messages?user=${userId}`);
    }
  };

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const getCurrentData = () => {
    switch (tabValue) {
      case 0:
        return connections;
      case 1:
        return pendingReceived;
      case 2:
        return pendingSent;
      case 3:
        return suggestions;
      default:
        return [];
    }
  };

  const getTableHeaders = () => {
    switch (tabValue) {
      case 0:
        return ['User', 'Role', 'Status', 'Connected', 'Actions'];
      case 1:
        return ['Requester', 'Role', 'Requested', 'Actions'];
      case 2:
        return ['Recipient', 'Role', 'Sent', 'Status', 'Actions'];
      case 3:
        return ['User', 'Role', 'Reason', 'Mutual Connections', 'Actions'];
      default:
        return [];
    }
  };

  if (connectionsLoading) {
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

  if (connectionsError) {
    return (
      <Container maxWidth="xl" sx={{ py: 3 }}>
        <Alert severity="error" sx={{ mb: 3 }}>
          {connectionsError}
        </Alert>
      </Container>
    );
  }

  const currentData = getCurrentData();
  type Row = Connection | PendingRequest | ConnectionSuggestion;
  const paginatedData = currentData.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  ) as Row[];

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Enhanced Header with Hero Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <Box sx={{ mb: 6 }}>
          <Box
            sx={{
              background: 'linear-gradient(135deg, #e8f5e9 0%, #f1f8e9 100%)',
              borderRadius: 4,
              p: 4,
              mb: 4,
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            <Box
              sx={{
                position: 'absolute',
                top: -50,
                right: -50,
                width: 200,
                height: 200,
                background: 'linear-gradient(135deg, #4caf50 0%, #8bc34a 100%)',
                borderRadius: '50%',
                opacity: 0.1,
              }}
            />
            <Box sx={{ position: 'relative', zIndex: 1 }}>
              <Typography
                variant="h3"
                component="h1"
                sx={{
                  fontWeight: 800,
                  mb: 2,
                  background:
                    'linear-gradient(135deg, #2e7d32 0%, #4caf50 100%)',
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  color: 'transparent',
                }}
              >
                Professional Network
              </Typography>
              <Typography
                variant="h6"
                color="text.secondary"
                sx={{ mb: 3, maxWidth: '600px' }}
              >
                Connect with fellow students and alumni to build meaningful
                professional relationships and expand your network.
              </Typography>
            </Box>
          </Box>

          {/* Enhanced Stats Cards */}
          {stats && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid item xs={12} sm={6} md={3}>
                  <Card
                    sx={{
                      background:
                        'linear-gradient(135deg, #4caf50 0%, #66bb6a 100%)',
                      color: 'white',
                      borderRadius: 3,
                      overflow: 'hidden',
                      position: 'relative',
                    }}
                  >
                    <CardContent sx={{ p: 3 }}>
                      <Box
                        sx={{ display: 'flex', alignItems: 'center', mb: 2 }}
                      >
                        <Badge
                          badgeContent={<TrendingIcon sx={{ fontSize: 12 }} />}
                          color="warning"
                          sx={{ mr: 2 }}
                        >
                          <PeopleIcon sx={{ fontSize: 32 }} />
                        </Badge>
                        <Box>
                          <Typography variant="h4" sx={{ fontWeight: 700 }}>
                            {stats.total}
                          </Typography>
                          <Typography variant="body2" sx={{ opacity: 0.9 }}>
                            Total Connections
                          </Typography>
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                  <Card
                    sx={{
                      background:
                        'linear-gradient(135deg, #ff9800 0%, #ffb74d 100%)',
                      color: 'white',
                      borderRadius: 3,
                    }}
                  >
                    <CardContent sx={{ p: 3 }}>
                      <Box
                        sx={{ display: 'flex', alignItems: 'center', mb: 2 }}
                      >
                        <TimeIcon sx={{ fontSize: 32, mr: 2 }} />
                        <Box>
                          <Typography variant="h4" sx={{ fontWeight: 700 }}>
                            {stats.pendingReceived}
                          </Typography>
                          <Typography variant="body2" sx={{ opacity: 0.9 }}>
                            Pending Requests
                          </Typography>
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                  <Card
                    sx={{
                      background:
                        'linear-gradient(135deg, #2196f3 0%, #64b5f6 100%)',
                      color: 'white',
                      borderRadius: 3,
                    }}
                  >
                    <CardContent sx={{ p: 3 }}>
                      <Box
                        sx={{ display: 'flex', alignItems: 'center', mb: 2 }}
                      >
                        <SchoolIcon sx={{ fontSize: 32, mr: 2 }} />
                        <Box>
                          <Typography variant="h4" sx={{ fontWeight: 700 }}>
                            {stats.byRole?.students || 0}
                          </Typography>
                          <Typography variant="body2" sx={{ opacity: 0.9 }}>
                            Students
                          </Typography>
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                  <Card
                    sx={{
                      background:
                        'linear-gradient(135deg, #9c27b0 0%, #ba68c8 100%)',
                      color: 'white',
                      borderRadius: 3,
                    }}
                  >
                    <CardContent sx={{ p: 3 }}>
                      <Box
                        sx={{ display: 'flex', alignItems: 'center', mb: 2 }}
                      >
                        <WorkIcon sx={{ fontSize: 32, mr: 2 }} />
                        <Box>
                          <Typography variant="h4" sx={{ fontWeight: 700 }}>
                            {stats.byRole?.alumni || 0}
                          </Typography>
                          <Typography variant="body2" sx={{ opacity: 0.9 }}>
                            Alumni
                          </Typography>
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </motion.div>
          )}
        </Box>
      </motion.div>

      {/* Enhanced Search and Filter Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.4 }}
      >
        <Paper
          elevation={0}
          sx={{
            p: 3,
            mb: 4,
            borderRadius: 3,
            border: '1px solid',
            borderColor: 'divider',
            background: 'rgba(255, 255, 255, 0.8)',
            backdropFilter: 'blur(10px)',
          }}
        >
          <Box
            sx={{
              display: 'flex',
              flexDirection: { xs: 'column', md: 'row' },
              alignItems: { xs: 'stretch', md: 'center' },
              gap: 2,
              mb: 2,
            }}
          >
            <TextField
              fullWidth
              placeholder="Search by name, email, or skills..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon color="action" />
                  </InputAdornment>
                ),
              }}
              sx={{
                maxWidth: { md: 400 },
                '& .MuiOutlinedInput-root': {
                  borderRadius: 3,
                  backgroundColor: 'background.paper',
                },
              }}
            />

            <Box
              sx={{
                display: 'flex',
                gap: 2,
                alignItems: 'center',
                flexWrap: 'wrap',
              }}
            >
              <FormControl sx={{ minWidth: 140 }}>
                <InputLabel>
                  <FilterIcon sx={{ mr: 1, fontSize: 18 }} />
                  Role
                </InputLabel>
                <Select
                  value={roleFilter}
                  label="Role"
                  onChange={handleRoleFilterChange}
                  sx={{ borderRadius: 3 }}
                >
                  <MenuItem value="">All Roles</MenuItem>
                  <MenuItem value="STUDENT">
                    <SchoolIcon sx={{ mr: 1, fontSize: 18 }} />
                    Students
                  </MenuItem>
                  <MenuItem value="ALUM">
                    <WorkIcon sx={{ mr: 1, fontSize: 18 }} />
                    Alumni
                  </MenuItem>
                  <MenuItem value="ADMIN">
                    <PersonAddIcon sx={{ mr: 1, fontSize: 18 }} />
                    Admins
                  </MenuItem>
                </Select>
              </FormControl>

              <FormControl sx={{ minWidth: 140 }}>
                <InputLabel>
                  <SortIcon sx={{ mr: 1, fontSize: 18 }} />
                  Sort By
                </InputLabel>
                <Select
                  value={sortBy}
                  label="Sort By"
                  onChange={(e) =>
                    setSortBy(e.target.value as 'name' | 'date' | 'role')
                  }
                  sx={{ borderRadius: 3 }}
                >
                  <MenuItem value="name">Name</MenuItem>
                  <MenuItem value="date">Date</MenuItem>
                  <MenuItem value="role">Role</MenuItem>
                </Select>
              </FormControl>

              <Box
                sx={{
                  display: 'flex',
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 3,
                  overflow: 'hidden',
                }}
              >
                <IconButton
                  onClick={() => setViewMode('grid')}
                  sx={{
                    borderRadius: 0,
                    backgroundColor:
                      viewMode === 'grid' ? 'primary.main' : 'transparent',
                    color:
                      viewMode === 'grid'
                        ? 'primary.contrastText'
                        : 'text.secondary',
                    '&:hover': {
                      backgroundColor:
                        viewMode === 'grid' ? 'primary.dark' : 'action.hover',
                    },
                  }}
                >
                  <GridViewIcon />
                </IconButton>
                <IconButton
                  onClick={() => setViewMode('list')}
                  sx={{
                    borderRadius: 0,
                    backgroundColor:
                      viewMode === 'list' ? 'primary.main' : 'transparent',
                    color:
                      viewMode === 'list'
                        ? 'primary.contrastText'
                        : 'text.secondary',
                    '&:hover': {
                      backgroundColor:
                        viewMode === 'list' ? 'primary.dark' : 'action.hover',
                    },
                  }}
                >
                  <ListViewIcon />
                </IconButton>
              </Box>
            </Box>
          </Box>
        </Paper>
      </motion.div>

      {/* Enhanced Tabs */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.6 }}
      >
        <Paper
          elevation={0}
          sx={{
            mb: 4,
            borderRadius: 3,
            overflow: 'hidden',
            border: '1px solid',
            borderColor: 'divider',
          }}
        >
          <Tabs
            value={tabValue}
            onChange={handleTabChange}
            variant="fullWidth"
            sx={{
              '& .MuiTab-root': {
                fontWeight: 600,
                textTransform: 'none',
                fontSize: '1rem',
                py: 2,
                minHeight: 64,
              },
              '& .MuiTabs-indicator': {
                height: 3,
                borderRadius: '3px 3px 0 0',
                background: 'linear-gradient(135deg, #4caf50 0%, #8bc34a 100%)',
              },
            }}
          >
            <Tab
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <PeopleIcon />
                  <span>Connections</span>
                  <Chip
                    label={connections.length}
                    size="small"
                    color="primary"
                    variant="outlined"
                  />
                </Box>
              }
            />
            <Tab
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <TimeIcon />
                  <span>Pending Received</span>
                  <Chip
                    label={pendingReceived.length}
                    size="small"
                    color="warning"
                    variant="outlined"
                  />
                </Box>
              }
            />
            <Tab
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <MessageIcon />
                  <span>Pending Sent</span>
                  <Chip
                    label={pendingSent.length}
                    size="small"
                    color="info"
                    variant="outlined"
                  />
                </Box>
              }
            />
            <Tab
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <StarIcon />
                  <span>Suggestions</span>
                  <Chip
                    label={suggestions.length}
                    size="small"
                    color="success"
                    variant="outlined"
                  />
                </Box>
              }
            />
          </Tabs>
        </Paper>
      </motion.div>

      {/* Enhanced Content Area with Grid/List Views */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.8 }}
      >
        <AnimatePresence mode="wait">
          {viewMode === 'grid' ? (
            <motion.div
              key="grid"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3 }}
            >
              <Grid container spacing={3}>
                {paginatedData.length === 0 ? (
                  <Grid item xs={12}>
                    <Paper
                      elevation={0}
                      sx={{
                        p: 6,
                        textAlign: 'center',
                        borderRadius: 3,
                        border: '1px solid',
                        borderColor: 'divider',
                      }}
                    >
                      <PeopleIcon
                        sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }}
                      />
                      <Typography
                        variant="h6"
                        color="text.secondary"
                        gutterBottom
                      >
                        No connections found
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Try adjusting your search filters or connect with new
                        people.
                      </Typography>
                    </Paper>
                  </Grid>
                ) : (
                  paginatedData.map((item, index) => (
                    <Grid item xs={12} sm={6} md={4} lg={3} key={index}>
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: index * 0.1 }}
                        whileHover={{ y: -8 }}
                      >
                        {tabValue === 0 && (
                          <Card
                            sx={{
                              height: '100%',
                              borderRadius: 3,
                              border: '1px solid',
                              borderColor: 'divider',
                              overflow: 'hidden',
                              transition: 'all 0.3s ease',
                              '&:hover': {
                                boxShadow: 6,
                                borderColor: 'primary.main',
                              },
                            }}
                          >
                            <CardContent sx={{ p: 3 }}>
                              <Box
                                sx={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  mb: 2,
                                }}
                              >
                                <Badge
                                  overlap="circular"
                                  anchorOrigin={{
                                    vertical: 'bottom',
                                    horizontal: 'right',
                                  }}
                                  badgeContent={
                                    <Box
                                      sx={{
                                        width: 12,
                                        height: 12,
                                        borderRadius: '50%',
                                        backgroundColor: 'success.main',
                                        border: '2px solid white',
                                      }}
                                    />
                                  }
                                >
                                  <Avatar
                                    sx={{
                                      width: 48,
                                      height: 48,
                                      mr: 2,
                                      background:
                                        'linear-gradient(135deg, #4caf50 0%, #8bc34a 100%)',
                                    }}
                                  >
                                    {(
                                      item as Connection
                                    ).user?.name?.[0]?.toUpperCase() || 'U'}
                                  </Avatar>
                                </Badge>
                                <Box sx={{ flex: 1 }}>
                                  <Typography
                                    variant="subtitle1"
                                    sx={{ fontWeight: 600, mb: 0.5 }}
                                  >
                                    {(item as Connection).user?.name}
                                  </Typography>
                                  <Chip
                                    label={(item as Connection).user?.role}
                                    size="small"
                                    color={
                                      (item as Connection).user?.role ===
                                      'STUDENT'
                                        ? 'info'
                                        : 'secondary'
                                    }
                                    sx={{ borderRadius: 2 }}
                                  />
                                </Box>
                              </Box>
                              <Box sx={{ mb: 2 }}>
                                <Box
                                  sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    mb: 1,
                                  }}
                                >
                                  <LocationIcon
                                    sx={{
                                      fontSize: 16,
                                      color: 'text.secondary',
                                      mr: 1,
                                    }}
                                  />
                                  <Typography
                                    variant="body2"
                                    color="text.secondary"
                                  >
                                    KIIT University
                                  </Typography>
                                </Box>
                                <Box
                                  sx={{ display: 'flex', alignItems: 'center' }}
                                >
                                  <TimeIcon
                                    sx={{
                                      fontSize: 16,
                                      color: 'text.secondary',
                                      mr: 1,
                                    }}
                                  />
                                  <Typography
                                    variant="body2"
                                    color="text.secondary"
                                  >
                                    Connected{' '}
                                    {(item as Connection).createdAt
                                      ? new Date(
                                          (item as Connection).createdAt
                                        ).toLocaleDateString()
                                      : 'Recently'}
                                  </Typography>
                                </Box>
                              </Box>
                            </CardContent>
                            <CardActions
                              sx={{
                                p: 2,
                                pt: 0,
                                justifyContent: 'space-between',
                              }}
                            >
                              <Box sx={{ display: 'flex', gap: 1 }}>
                                <Tooltip title="Send Message">
                                  <IconButton
                                    size="small"
                                    onClick={() =>
                                      handleSendMessage(
                                        (item as Connection).user?.id
                                      )
                                    }
                                    sx={{
                                      color: 'primary.main',
                                      backgroundColor: 'primary.light',
                                      '&:hover': {
                                        backgroundColor: 'primary.main',
                                        color: 'white',
                                      },
                                    }}
                                  >
                                    <MessageIcon />
                                  </IconButton>
                                </Tooltip>
                                <Tooltip title="Remove Connection">
                                  <IconButton
                                    size="small"
                                    onClick={() =>
                                      handleRemoveConnection(
                                        (item as Connection).id
                                      )
                                    }
                                    sx={{
                                      color: 'error.main',
                                      backgroundColor: 'error.light',
                                      '&:hover': {
                                        backgroundColor: 'error.main',
                                        color: 'white',
                                      },
                                    }}
                                  >
                                    <CloseIcon />
                                  </IconButton>
                                </Tooltip>
                              </Box>
                            </CardActions>
                          </Card>
                        )}
                        {tabValue === 1 && (
                          <Card
                            sx={{
                              height: '100%',
                              borderRadius: 3,
                              border: '1px solid',
                              borderColor: 'divider',
                              overflow: 'hidden',
                              transition: 'all 0.3s ease',
                              '&:hover': {
                                boxShadow: 6,
                                borderColor: 'primary.main',
                              },
                            }}
                          >
                            <CardContent sx={{ p: 3 }}>
                              <Box
                                sx={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  mb: 2,
                                }}
                              >
                                <Avatar sx={{ width: 48, height: 48, mr: 2 }}>
                                  {(
                                    item as PendingRequest
                                  ).requester?.name?.[0]?.toUpperCase() || 'U'}
                                </Avatar>
                                <Box sx={{ flex: 1 }}>
                                  <Typography
                                    variant="subtitle1"
                                    sx={{ fontWeight: 600, mb: 0.5 }}
                                  >
                                    {(item as PendingRequest).requester?.name}
                                  </Typography>
                                  <Chip
                                    label={
                                      (item as PendingRequest).requester?.role
                                    }
                                    size="small"
                                    color={
                                      (item as PendingRequest).requester
                                        ?.role === 'STUDENT'
                                        ? 'info'
                                        : 'secondary'
                                    }
                                    sx={{ borderRadius: 2 }}
                                  />
                                </Box>
                              </Box>
                              <Box sx={{ mb: 2 }}>
                                <Box
                                  sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    mb: 1,
                                  }}
                                >
                                  <TimeIcon
                                    sx={{
                                      fontSize: 16,
                                      color: 'text.secondary',
                                      mr: 1,
                                    }}
                                  />
                                  <Typography
                                    variant="body2"
                                    color="text.secondary"
                                  >
                                    Requested{' '}
                                    {(item as PendingRequest).createdAt
                                      ? new Date(
                                          (item as PendingRequest).createdAt
                                        ).toLocaleDateString()
                                      : 'Recently'}
                                  </Typography>
                                </Box>
                              </Box>
                            </CardContent>
                            <CardActions
                              sx={{
                                p: 2,
                                pt: 0,
                                justifyContent: 'space-between',
                              }}
                            >
                              <Box sx={{ display: 'flex', gap: 1 }}>
                                <Button
                                  size="small"
                                  variant="contained"
                                  color="success"
                                  startIcon={<CheckIcon />}
                                  onClick={() =>
                                    handleAcceptRequest(
                                      (item as PendingRequest).id
                                    )
                                  }
                                  sx={{ borderRadius: 2 }}
                                >
                                  Accept
                                </Button>
                                <Button
                                  size="small"
                                  variant="outlined"
                                  color="error"
                                  startIcon={<CloseIcon />}
                                  onClick={() =>
                                    handleRejectRequest(
                                      (item as PendingRequest).id
                                    )
                                  }
                                  sx={{ borderRadius: 2 }}
                                >
                                  Reject
                                </Button>
                              </Box>
                            </CardActions>
                          </Card>
                        )}
                        {tabValue === 2 && (
                          <Card
                            sx={{
                              height: '100%',
                              borderRadius: 3,
                              border: '1px solid',
                              borderColor: 'divider',
                              overflow: 'hidden',
                              transition: 'all 0.3s ease',
                              '&:hover': {
                                boxShadow: 6,
                                borderColor: 'primary.main',
                              },
                            }}
                          >
                            <CardContent sx={{ p: 3 }}>
                              <Box
                                sx={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  mb: 2,
                                }}
                              >
                                <Avatar sx={{ width: 48, height: 48, mr: 2 }}>
                                  {(
                                    item as PendingRequest
                                  ).recipient?.name?.[0]?.toUpperCase() || 'U'}
                                </Avatar>
                                <Box sx={{ flex: 1 }}>
                                  <Typography
                                    variant="subtitle1"
                                    sx={{ fontWeight: 600, mb: 0.5 }}
                                  >
                                    {(item as PendingRequest).recipient?.name}
                                  </Typography>
                                  <Chip
                                    label={
                                      (item as PendingRequest).recipient?.role
                                    }
                                    size="small"
                                    color={
                                      (item as PendingRequest).recipient
                                        ?.role === 'STUDENT'
                                        ? 'info'
                                        : 'secondary'
                                    }
                                    sx={{ borderRadius: 2 }}
                                  />
                                </Box>
                              </Box>
                              <Box sx={{ mb: 2 }}>
                                <Box
                                  sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    mb: 1,
                                  }}
                                >
                                  <TimeIcon
                                    sx={{
                                      fontSize: 16,
                                      color: 'text.secondary',
                                      mr: 1,
                                    }}
                                  />
                                  <Typography
                                    variant="body2"
                                    color="text.secondary"
                                  >
                                    Sent{' '}
                                    {(item as PendingRequest).createdAt
                                      ? new Date(
                                          (item as PendingRequest).createdAt
                                        ).toLocaleDateString()
                                      : 'Recently'}
                                  </Typography>
                                </Box>
                              </Box>
                            </CardContent>
                            <CardActions
                              sx={{
                                p: 2,
                                pt: 0,
                                justifyContent: 'space-between',
                              }}
                            >
                              <Box sx={{ display: 'flex', gap: 1 }}>
                                <Chip
                                  label="Pending"
                                  size="small"
                                  color="info"
                                />
                              </Box>
                            </CardActions>
                          </Card>
                        )}
                        {tabValue === 3 && (
                          <Card
                            sx={{
                              height: '100%',
                              borderRadius: 3,
                              border: '1px solid',
                              borderColor: 'divider',
                              overflow: 'hidden',
                              transition: 'all 0.3s ease',
                              '&:hover': {
                                boxShadow: 6,
                                borderColor: 'primary.main',
                              },
                            }}
                          >
                            <CardContent sx={{ p: 3 }}>
                              <Box
                                sx={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  mb: 2,
                                }}
                              >
                                <Avatar sx={{ width: 48, height: 48, mr: 2 }}>
                                  {(
                                    item as ConnectionSuggestion
                                  ).user?.name?.[0]?.toUpperCase() || 'U'}
                                </Avatar>
                                <Box sx={{ flex: 1 }}>
                                  <Typography
                                    variant="subtitle1"
                                    sx={{ fontWeight: 600, mb: 0.5 }}
                                  >
                                    {(item as ConnectionSuggestion).user?.name}
                                  </Typography>
                                  <Chip
                                    label={
                                      (item as ConnectionSuggestion).user?.role
                                    }
                                    size="small"
                                    color={
                                      (item as ConnectionSuggestion).user
                                        ?.role === 'STUDENT'
                                        ? 'info'
                                        : 'secondary'
                                    }
                                    sx={{ borderRadius: 2 }}
                                  />
                                </Box>
                              </Box>
                              <Box sx={{ mb: 2 }}>
                                <Box
                                  sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    mb: 1,
                                  }}
                                >
                                  <StarIcon
                                    sx={{
                                      fontSize: 16,
                                      color: 'text.secondary',
                                      mr: 1,
                                    }}
                                  />
                                  <Typography
                                    variant="body2"
                                    color="text.secondary"
                                  >
                                    {(item as ConnectionSuggestion).matchScore}%
                                    match
                                  </Typography>
                                </Box>
                              </Box>
                            </CardContent>
                            <CardActions
                              sx={{
                                p: 2,
                                pt: 0,
                                justifyContent: 'space-between',
                              }}
                            >
                              <Box sx={{ display: 'flex', gap: 1 }}>
                                <Button
                                  size="small"
                                  variant="contained"
                                  startIcon={<PersonAddIcon />}
                                  onClick={() =>
                                    handleConnect(
                                      (item as ConnectionSuggestion).user?.id
                                    )
                                  }
                                  sx={{ borderRadius: 2 }}
                                >
                                  Connect
                                </Button>
                              </Box>
                            </CardActions>
                          </Card>
                        )}
                      </motion.div>
                    </Grid>
                  ))
                )}
              </Grid>
            </motion.div>
          ) : (
            <motion.div
              key="list"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3 }}
            >
              <Paper
                elevation={0}
                sx={{
                  borderRadius: 3,
                  border: '1px solid',
                  borderColor: 'divider',
                  overflow: 'hidden',
                }}
              >
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow
                        sx={{
                          backgroundColor: 'rgba(76, 175, 80, 0.08)',
                        }}
                      >
                        {getTableHeaders().map((header) => (
                          <TableCell
                            key={header}
                            sx={{
                              fontWeight: 700,
                              fontSize: '0.875rem',
                              color: 'primary.dark',
                              textTransform: 'uppercase',
                              letterSpacing: '0.05em',
                            }}
                          >
                            {header}
                          </TableCell>
                        ))}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {paginatedData.length === 0 ? (
                        <TableRow>
                          <TableCell
                            colSpan={getTableHeaders().length}
                            align="center"
                            sx={{ py: 4 }}
                          >
                            <Typography variant="body1" color="text.secondary">
                              No data available
                            </Typography>
                          </TableCell>
                        </TableRow>
                      ) : (
                        paginatedData.map((item: Row) => {
                          if (tabValue === 0) {
                            // Connections tab
                            const connection = item as Connection;
                            return (
                              <TableRow key={connection.id} hover>
                                <TableCell>
                                  <Box
                                    sx={{
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: 2,
                                    }}
                                  >
                                    <Avatar sx={{ bgcolor: 'primary.main' }}>
                                      {connection.user?.name?.charAt(0) || '?'}
                                    </Avatar>
                                    <Box>
                                      <Typography
                                        variant="subtitle2"
                                        sx={{ fontWeight: 600 }}
                                      >
                                        {connection.user?.name ||
                                          'Unknown User'}
                                      </Typography>
                                      <Typography
                                        variant="caption"
                                        color="text.secondary"
                                      >
                                        {connection.user?.email || 'No email'}
                                      </Typography>
                                    </Box>
                                  </Box>
                                </TableCell>
                                <TableCell>
                                  <Chip
                                    label={connection.user?.role || 'Unknown'}
                                    color={getRoleColor(
                                      connection.user?.role || ''
                                    )}
                                    size="small"
                                  />
                                </TableCell>
                                <TableCell>
                                  <Chip
                                    label={connection.status}
                                    color={
                                      connection.status === 'ACCEPTED'
                                        ? 'success'
                                        : 'default'
                                    }
                                    size="small"
                                  />
                                </TableCell>
                                <TableCell>
                                  <Typography
                                    variant="body2"
                                    color="text.secondary"
                                  >
                                    {connection.createdAt
                                      ? new Date(
                                          connection.createdAt
                                        ).toLocaleDateString()
                                      : 'N/A'}
                                  </Typography>
                                </TableCell>
                                <TableCell>
                                  <Box sx={{ display: 'flex', gap: 1 }}>
                                    <Tooltip title="Send Message">
                                      <IconButton
                                        size="small"
                                        onClick={() =>
                                          handleSendMessage(connection.user?.id)
                                        }
                                        sx={{ color: 'primary.main' }}
                                      >
                                        <MessageIcon />
                                      </IconButton>
                                    </Tooltip>
                                    <Tooltip title="Remove Connection">
                                      <IconButton
                                        size="small"
                                        onClick={() =>
                                          handleRemoveConnection(connection.id)
                                        }
                                        sx={{ color: 'error.main' }}
                                      >
                                        <CloseIcon />
                                      </IconButton>
                                    </Tooltip>
                                  </Box>
                                </TableCell>
                              </TableRow>
                            );
                          } else if (tabValue === 1) {
                            // Pending Received tab
                            const pendingRequest = item as PendingRequest;
                            return (
                              <TableRow key={pendingRequest.id} hover>
                                <TableCell>
                                  <Box
                                    sx={{
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: 2,
                                    }}
                                  >
                                    <Avatar sx={{ bgcolor: 'secondary.main' }}>
                                      {pendingRequest.requester?.name?.charAt(
                                        0
                                      ) || '?'}
                                    </Avatar>
                                    <Box>
                                      <Typography
                                        variant="subtitle2"
                                        sx={{ fontWeight: 600 }}
                                      >
                                        {pendingRequest.requester?.name ||
                                          'Unknown User'}
                                      </Typography>
                                      <Typography
                                        variant="caption"
                                        color="text.secondary"
                                      >
                                        {pendingRequest.requester?.email ||
                                          'No email'}
                                      </Typography>
                                    </Box>
                                  </Box>
                                </TableCell>
                                <TableCell>
                                  <Chip
                                    label={
                                      pendingRequest.requester?.role ||
                                      'Unknown'
                                    }
                                    color={getRoleColor(
                                      pendingRequest.requester?.role || ''
                                    )}
                                    size="small"
                                  />
                                </TableCell>
                                <TableCell>
                                  <Typography
                                    variant="body2"
                                    color="text.secondary"
                                  >
                                    {pendingRequest.createdAt
                                      ? new Date(
                                          pendingRequest.createdAt
                                        ).toLocaleDateString()
                                      : 'N/A'}
                                  </Typography>
                                </TableCell>
                                <TableCell>
                                  <Box sx={{ display: 'flex', gap: 1 }}>
                                    <Button
                                      size="small"
                                      startIcon={<CheckIcon />}
                                      onClick={() =>
                                        handleAcceptRequest(pendingRequest.id)
                                      }
                                      variant="contained"
                                      color="success"
                                      sx={{
                                        minWidth: 'auto',
                                        minHeight: '32px', // Fixed height for uniform appearance
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                      }}
                                    >
                                      Accept
                                    </Button>
                                    <Button
                                      size="small"
                                      startIcon={<CloseIcon />}
                                      onClick={() =>
                                        handleRejectRequest(pendingRequest.id)
                                      }
                                      variant="outlined"
                                      color="error"
                                      sx={{
                                        minWidth: 'auto',
                                        minHeight: '32px', // Fixed height for uniform appearance
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                      }}
                                    >
                                      Reject
                                    </Button>
                                  </Box>
                                </TableCell>
                              </TableRow>
                            );
                          } else if (tabValue === 2) {
                            // Pending Sent tab
                            const pendingSent = item as PendingRequest;
                            return (
                              <TableRow key={pendingSent.id} hover>
                                <TableCell>
                                  <Box
                                    sx={{
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: 2,
                                    }}
                                  >
                                    <Avatar sx={{ bgcolor: 'info.main' }}>
                                      {pendingSent.recipient?.name?.charAt(0) ||
                                        '?'}
                                    </Avatar>
                                    <Box>
                                      <Typography
                                        variant="subtitle2"
                                        sx={{ fontWeight: 600 }}
                                      >
                                        {pendingSent.recipient?.name ||
                                          'Unknown User'}
                                      </Typography>
                                      <Typography
                                        variant="caption"
                                        color="text.secondary"
                                      >
                                        {pendingSent.recipient?.email ||
                                          'No email'}
                                      </Typography>
                                    </Box>
                                  </Box>
                                </TableCell>
                                <TableCell>
                                  <Chip
                                    label={
                                      pendingSent.recipient?.role || 'Unknown'
                                    }
                                    color={getRoleColor(
                                      pendingSent.recipient?.role || ''
                                    )}
                                    size="small"
                                  />
                                </TableCell>
                                <TableCell>
                                  <Typography
                                    variant="body2"
                                    color="text.secondary"
                                  >
                                    {pendingSent.createdAt
                                      ? new Date(
                                          pendingSent.createdAt
                                        ).toLocaleDateString()
                                      : 'N/A'}
                                  </Typography>
                                </TableCell>
                                <TableCell>
                                  <Chip
                                    label="Pending"
                                    color="warning"
                                    size="small"
                                  />
                                </TableCell>
                                <TableCell>
                                  <Tooltip title="Cancel Request">
                                    <IconButton
                                      size="small"
                                      onClick={() =>
                                        handleRejectRequest(pendingSent.id)
                                      }
                                      sx={{ color: 'error.main' }}
                                    >
                                      <CloseIcon />
                                    </IconButton>
                                  </Tooltip>
                                </TableCell>
                              </TableRow>
                            );
                          } else if (tabValue === 3) {
                            // Suggestions tab
                            const suggestion = item as ConnectionSuggestion;
                            return (
                              <TableRow key={suggestion.user.id} hover>
                                <TableCell>
                                  <Box
                                    sx={{
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: 2,
                                    }}
                                  >
                                    <Avatar sx={{ bgcolor: 'success.main' }}>
                                      {suggestion.user?.name?.charAt(0) || '?'}
                                    </Avatar>
                                    <Box>
                                      <Typography
                                        variant="subtitle2"
                                        sx={{ fontWeight: 600 }}
                                      >
                                        {suggestion.user?.name ||
                                          'Unknown User'}
                                      </Typography>
                                      <Typography
                                        variant="caption"
                                        color="text.secondary"
                                      >
                                        {suggestion.user?.email || 'No email'}
                                      </Typography>
                                    </Box>
                                  </Box>
                                </TableCell>
                                <TableCell>
                                  <Chip
                                    label={suggestion.user?.role || 'Unknown'}
                                    color={getRoleColor(
                                      suggestion.user?.role || ''
                                    )}
                                    size="small"
                                  />
                                </TableCell>
                                <TableCell>
                                  <Typography
                                    variant="body2"
                                    color="text.secondary"
                                  >
                                    {suggestion.reasons.join(', ')}
                                  </Typography>
                                </TableCell>
                                <TableCell>
                                  <Typography
                                    variant="body2"
                                    color="text.secondary"
                                  >
                                    Match Score: {suggestion.matchScore}%
                                  </Typography>
                                </TableCell>
                                <TableCell>
                                  <Button
                                    size="small"
                                    startIcon={<PersonAddIcon />}
                                    onClick={() =>
                                      handleConnect(suggestion.user.id)
                                    }
                                    variant="contained"
                                    color="primary"
                                    sx={{
                                      minHeight: '32px', // Fixed height for uniform appearance
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                    }}
                                  >
                                    Connect
                                  </Button>
                                </TableCell>
                              </TableRow>
                            );
                          }
                          return null;
                        })
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>

                {/* Enhanced Table Pagination */}
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    p: 2,
                    borderTop: '1px solid',
                    borderColor: 'divider',
                    backgroundColor: 'rgba(76, 175, 80, 0.04)',
                  }}
                >
                  <Typography variant="body2" color="text.secondary">
                    Showing{' '}
                    {Math.min((page - 1) * rowsPerPage + 1, currentData.length)}{' '}
                    - {Math.min(page * rowsPerPage, currentData.length)} of{' '}
                    {currentData.length} results
                  </Typography>
                  <TablePagination
                    rowsPerPageOptions={[5, 10, 25]}
                    component="div"
                    count={currentData.length}
                    rowsPerPage={rowsPerPage}
                    page={page}
                    onPageChange={handleChangePage}
                    onRowsPerPageChange={handleChangeRowsPerPage}
                    sx={{
                      '& .MuiTablePagination-toolbar': {
                        paddingLeft: 0,
                        paddingRight: 0,
                      },
                      '& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows':
                        {
                          fontSize: '0.875rem',
                          color: 'text.secondary',
                        },
                      '& .MuiIconButton-root': {
                        borderRadius: 2,
                        '&:hover': {
                          backgroundColor: 'primary.light',
                          color: 'primary.main',
                        },
                      },
                    }}
                  />
                </Box>
              </Paper>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </Container>
  );
};

export default Connections;
