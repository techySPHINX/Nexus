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
  Stack,
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
  Badge,
  alpha,
  useTheme,
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
  PendingActions as PendingIcon,
  Send as SendIcon,
  Lightbulb as SuggestionIcon,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import useConnections from '../hooks/useConnections';
import type {
  Connection,
  PendingRequest,
  ConnectionSuggestion,
} from '../types/connections';

const Connections: React.FC = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const [tabValue, setTabValue] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

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

  // Fetch data when component mounts
  useEffect(() => {
    fetchAll({
      page: 1,
      limit: 100, // Fetch all data for client-side filtering
    });
  }, [fetchAll]);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
    setPage(0); // Reset pagination when switching tabs
    setSearchTerm(''); // Reset search when switching tabs
    setRoleFilter(''); // Reset role filter when switching tabs
  };

  const handleSearch = (event: React.FormEvent) => {
    event.preventDefault();
    setPage(0); // Reset to first page when searching
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
    let data: Row[] = [];
    
    switch (tabValue) {
      case 0:
        data = connections;
        break;
      case 1:
        data = pendingReceived;
        break;
      case 2:
        data = pendingSent;
        break;
      case 3:
        data = suggestions;
        break;
      default:
        data = [];
    }

    // Apply client-side filtering
    return data.filter((item) => {
      // Determine the user object based on tab
      let user;
      if (tabValue === 0) {
        // Connections tab
        user = (item as Connection).user;
      } else if (tabValue === 1) {
        // Pending Received tab
        user = (item as PendingRequest).requester;
      } else if (tabValue === 2) {
        // Pending Sent tab
        user = (item as PendingRequest).recipient;
      } else if (tabValue === 3) {
        // Suggestions tab
        user = (item as ConnectionSuggestion).user;
      }

      if (!user) return false;

      // Apply role filter
      if (roleFilter && roleFilter !== '' && user.role !== roleFilter) {
        return false;
      }

      // Apply search filter
      if (searchTerm && searchTerm.trim() !== '') {
        const searchLower = searchTerm.toLowerCase();
        const nameMatch = user.name?.toLowerCase().includes(searchLower);
        const emailMatch = user.email?.toLowerCase().includes(searchLower);
        
        if (!nameMatch && !emailMatch) {
          return false;
        }
      }

      return true;
    });
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
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          <Box
            display="flex"
            justifyContent="center"
            alignItems="center"
            minHeight="400px"
            flexDirection="column"
            gap={2}
          >
            <CircularProgress 
              size={60} 
              thickness={4}
              sx={{
                color: theme.palette.primary.main,
              }}
            />
            <Typography variant="body2" color="text.secondary">
              Loading connections...
            </Typography>
          </Box>
        </motion.div>
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
      {/* Header */}
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          flexWrap="wrap"
          mb={4}
          gap={2}
        >
          <Box>
            <Typography
              variant="h3"
              component="h1"
              sx={{ 
                fontWeight: 700,
                background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                mb: 1,
              }}
            >
              My Network
            </Typography>
            <Typography variant="h6" color="text.secondary" sx={{ fontWeight: 400 }}>
              Manage and grow your professional network
            </Typography>
          </Box>
        </Box>
      </motion.div>

      {/* Stats Cards */}
      {stats && (
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <Stack 
            direction={{ xs: 'column', sm: 'row' }} 
            spacing={2} 
            sx={{ mb: 4 }}
          >
            <Paper
              elevation={3}
              sx={{
                flex: 1,
                p: 3,
                textAlign: 'center',
                borderRadius: 3,
                background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)} 0%, ${alpha(theme.palette.primary.main, 0.05)} 100%)`,
                border: `2px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: `0 8px 24px ${alpha(theme.palette.primary.main, 0.25)}`,
                  border: `2px solid ${theme.palette.primary.main}`,
                },
              }}
            >
              <Box
                sx={{
                  width: 56,
                  height: 56,
                  borderRadius: '50%',
                  background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto',
                  mb: 2,
                  boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.4)}`,
                }}
              >
                <PeopleIcon sx={{ color: 'white', fontSize: 28 }} />
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 700, color: theme.palette.primary.main, mb: 0.5 }}>
                {stats.total}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                Total Connections
              </Typography>
            </Paper>

            <Paper
              elevation={3}
              sx={{
                flex: 1,
                p: 3,
                textAlign: 'center',
                borderRadius: 3,
                background: `linear-gradient(135deg, ${alpha(theme.palette.info.main, 0.1)} 0%, ${alpha(theme.palette.info.main, 0.05)} 100%)`,
                border: `2px solid ${alpha(theme.palette.info.main, 0.2)}`,
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: `0 8px 24px ${alpha(theme.palette.info.main, 0.25)}`,
                  border: `2px solid ${theme.palette.info.main}`,
                },
              }}
            >
              <Box
                sx={{
                  width: 56,
                  height: 56,
                  borderRadius: '50%',
                  background: `linear-gradient(135deg, ${theme.palette.info.main} 0%, ${theme.palette.info.dark} 100%)`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto',
                  mb: 2,
                  boxShadow: `0 4px 12px ${alpha(theme.palette.info.main, 0.4)}`,
                }}
              >
                <SchoolIcon sx={{ color: 'white', fontSize: 28 }} />
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 700, color: theme.palette.info.main, mb: 0.5 }}>
                {stats.byRole.students}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                Students
              </Typography>
            </Paper>

            <Paper
              elevation={3}
              sx={{
                flex: 1,
                p: 3,
                textAlign: 'center',
                borderRadius: 3,
                background: `linear-gradient(135deg, ${alpha(theme.palette.secondary.main, 0.1)} 0%, ${alpha(theme.palette.secondary.main, 0.05)} 100%)`,
                border: `2px solid ${alpha(theme.palette.secondary.main, 0.2)}`,
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: `0 8px 24px ${alpha(theme.palette.secondary.main, 0.25)}`,
                  border: `2px solid ${theme.palette.secondary.main}`,
                },
              }}
            >
              <Box
                sx={{
                  width: 56,
                  height: 56,
                  borderRadius: '50%',
                  background: `linear-gradient(135deg, ${theme.palette.secondary.main} 0%, ${theme.palette.secondary.dark} 100%)`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto',
                  mb: 2,
                  boxShadow: `0 4px 12px ${alpha(theme.palette.secondary.main, 0.4)}`,
                }}
              >
                <WorkIcon sx={{ color: 'white', fontSize: 28 }} />
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 700, color: theme.palette.secondary.main, mb: 0.5 }}>
                {stats.byRole.alumni}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                Alumni
              </Typography>
            </Paper>

            <Paper
              elevation={3}
              sx={{
                flex: 1,
                p: 3,
                textAlign: 'center',
                borderRadius: 3,
                background: `linear-gradient(135deg, ${alpha(theme.palette.warning.main, 0.1)} 0%, ${alpha(theme.palette.warning.main, 0.05)} 100%)`,
                border: `2px solid ${alpha(theme.palette.warning.main, 0.2)}`,
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: `0 8px 24px ${alpha(theme.palette.warning.main, 0.25)}`,
                  border: `2px solid ${theme.palette.warning.main}`,
                },
              }}
            >
              <Box
                sx={{
                  width: 56,
                  height: 56,
                  borderRadius: '50%',
                  background: `linear-gradient(135deg, ${theme.palette.warning.main} 0%, ${theme.palette.warning.dark} 100%)`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto',
                  mb: 2,
                  boxShadow: `0 4px 12px ${alpha(theme.palette.warning.main, 0.4)}`,
                }}
              >
                <PendingIcon sx={{ color: 'white', fontSize: 28 }} />
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 700, color: theme.palette.warning.main, mb: 0.5 }}>
                {stats.pendingReceived}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                Pending Requests
              </Typography>
            </Paper>
          </Stack>
        </motion.div>
      )}

      {/* Search + Filters */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <Paper 
          elevation={2} 
          sx={{ 
            p: 3, 
            mb: 3, 
            borderRadius: 3,
            border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
          }}
        >
          <Box component="form" onSubmit={handleSearch}>
            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              spacing={2}
              alignItems={{ xs: 'stretch', sm: 'center' }}
            >
              <TextField
                fullWidth
                placeholder="Search connections by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon color="primary" />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      boxShadow: `0 0 0 2px ${alpha(theme.palette.primary.main, 0.1)}`,
                    },
                    '&.Mui-focused': {
                      boxShadow: `0 0 0 2px ${alpha(theme.palette.primary.main, 0.2)}`,
                    },
                  },
                }}
              />
              <FormControl sx={{ minWidth: { xs: '100%', sm: 180 } }}>
                <InputLabel>Filter by Role</InputLabel>
                <Select
                  value={roleFilter}
                  label="Filter by Role"
                  onChange={handleRoleFilterChange}
                  sx={{
                    borderRadius: 2,
                  }}
                >
                  <MenuItem value="">All Roles</MenuItem>
                  <MenuItem value="STUDENT">Students</MenuItem>
                  <MenuItem value="ALUM">Alumni</MenuItem>
                  <MenuItem value="ADMIN">Administrators</MenuItem>
                </Select>
              </FormControl>
              <Button
                type="submit"
                variant="contained"
                size="large"
                sx={{
                  minWidth: { xs: '100%', sm: 120 },
                  borderRadius: 2,
                  textTransform: 'none',
                  fontWeight: 600,
                  boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.3)}`,
                  '&:hover': {
                    boxShadow: `0 6px 16px ${alpha(theme.palette.primary.main, 0.4)}`,
                  },
                }}
              >
                Search
              </Button>
            </Stack>
            
            {/* Filter indicator */}
            {(searchTerm || roleFilter) && (
              <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  Showing <strong>{currentData.length}</strong> filtered result{currentData.length !== 1 ? 's' : ''}
                  {searchTerm && ` matching "${searchTerm}"`}
                  {roleFilter && ` for ${roleFilter === 'STUDENT' ? 'Students' : roleFilter === 'ALUM' ? 'Alumni' : 'Administrators'}`}
                </Typography>
                <Button
                  size="small"
                  onClick={() => {
                    setSearchTerm('');
                    setRoleFilter('');
                    setPage(0);
                  }}
                  sx={{ 
                    textTransform: 'none',
                    fontSize: '0.75rem',
                  }}
                >
                  Clear filters
                </Button>
              </Box>
            )}
          </Box>
        </Paper>
      </motion.div>

      {/* Tabs */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        <Paper 
          elevation={2} 
          sx={{ 
            mb: 3, 
            borderRadius: 3,
            overflow: 'hidden',
            border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
          }}
        >
          <Tabs
            value={tabValue}
            onChange={handleTabChange}
            variant="fullWidth"
            sx={{
              '& .MuiTab-root': {
                fontWeight: 600,
                fontSize: '0.95rem',
                textTransform: 'none',
                py: 2,
                transition: 'all 0.3s ease',
                '&:hover': {
                  background: alpha(theme.palette.primary.main, 0.05),
                },
              },
              '& .Mui-selected': {
                color: `${theme.palette.primary.main} !important`,
              },
              '& .MuiTabs-indicator': {
                height: 3,
                borderRadius: '3px 3px 0 0',
                background: `linear-gradient(90deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
              },
            }}
          >
            <Tab 
              label={
                <Badge badgeContent={connections.length} color="primary" max={999}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, px: 1 }}>
                    <PeopleIcon sx={{ fontSize: 20 }} />
                    <span>Connections</span>
                  </Box>
                </Badge>
              }
            />
            <Tab 
              label={
                <Badge badgeContent={pendingReceived.length} color="error" max={999}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, px: 1 }}>
                    <PendingIcon sx={{ fontSize: 20 }} />
                    <span>Requests</span>
                  </Box>
                </Badge>
              }
            />
            <Tab 
              label={
                <Badge badgeContent={pendingSent.length} color="warning" max={999}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, px: 1 }}>
                    <SendIcon sx={{ fontSize: 20 }} />
                    <span>Sent</span>
                  </Box>
                </Badge>
              }
            />
            <Tab 
              label={
                <Badge badgeContent={suggestions.length} color="success" max={999}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, px: 1 }}>
                    <SuggestionIcon sx={{ fontSize: 20 }} />
                    <span>Suggestions</span>
                  </Box>
                </Badge>
              }
            />
          </Tabs>
        </Paper>
      </motion.div>

      {/* Table */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.4 }}
      >
        <Paper 
          elevation={2}
          sx={{ 
            borderRadius: 3,
            overflow: 'hidden',
            border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
          }}
        >
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow 
                  sx={{ 
                    background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.08)} 0%, ${alpha(theme.palette.secondary.main, 0.08)} 100%)`,
                  }}
                >
                  {getTableHeaders().map((header) => (
                    <TableCell 
                      key={header} 
                      sx={{ 
                        fontWeight: 700,
                        fontSize: '0.95rem',
                        color: theme.palette.text.primary,
                        py: 2.5,
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
                      sx={{ py: 8 }}
                    >
                      <Box>
                        <PeopleIcon 
                          sx={{ 
                            fontSize: 64, 
                            color: alpha(theme.palette.text.secondary, 0.3),
                            mb: 2 
                          }} 
                        />
                        <Typography variant="h6" color="text.secondary" gutterBottom>
                          No {['connections', 'pending requests', 'sent requests', 'suggestions'][tabValue]} yet
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {tabValue === 0 && 'Start connecting with your peers and alumni!'}
                          {tabValue === 1 && 'No pending connection requests at the moment.'}
                          {tabValue === 2 && 'You haven\'t sent any connection requests yet.'}
                          {tabValue === 3 && 'Check back later for personalized connection suggestions.'}
                        </Typography>
                      </Box>
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedData.map((item: Row, index) => {
                  if (tabValue === 0) {
                    // Connections tab
                    const connection = item as Connection;
                    return (
                      <TableRow 
                        key={connection.id} 
                        component={motion.tr}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.05 }}
                        hover
                        sx={{
                          '&:hover': {
                            bgcolor: alpha(theme.palette.primary.main, 0.04),
                            transform: 'scale(1.002)',
                            transition: 'all 0.2s ease-in-out',
                          },
                        }}
                      >
                        <TableCell>
                          <Box
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 2,
                            }}
                          >
                            <Avatar 
                              sx={{ 
                                bgcolor: 'primary.main',
                                width: 48,
                                height: 48,
                                fontSize: '1.2rem',
                                fontWeight: 600,
                                boxShadow: `0 4px 14px ${alpha(theme.palette.primary.main, 0.3)}`,
                              }}
                            >
                              {connection.user?.name?.charAt(0) || '?'}
                            </Avatar>
                            <Box>
                              <Typography
                                variant="subtitle2"
                                sx={{ fontWeight: 600 }}
                              >
                                {connection.user?.name || 'Unknown User'}
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
                            color={getRoleColor(connection.user?.role || '')}
                            size="small"
                            sx={{
                              fontWeight: 600,
                              borderRadius: 2,
                            }}
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
                            sx={{
                              fontWeight: 600,
                              borderRadius: 2,
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" color="text.secondary">
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
                                sx={{ 
                                  color: 'primary.main',
                                  transition: 'all 0.2s ease-in-out',
                                  '&:hover': {
                                    transform: 'scale(1.15)',
                                    bgcolor: alpha(theme.palette.primary.main, 0.1),
                                    boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.3)}`,
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
                                  handleRemoveConnection(connection.id)
                                }
                                sx={{ 
                                  color: 'error.main',
                                  transition: 'all 0.2s ease-in-out',
                                  '&:hover': {
                                    transform: 'scale(1.15)',
                                    bgcolor: alpha(theme.palette.error.main, 0.1),
                                    boxShadow: `0 4px 12px ${alpha(theme.palette.error.main, 0.3)}`,
                                  },
                                }}
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
                      <TableRow 
                        key={pendingRequest.id} 
                        component={motion.tr}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.05 }}
                        hover
                        sx={{
                          '&:hover': {
                            bgcolor: alpha(theme.palette.warning.main, 0.04),
                            transform: 'scale(1.002)',
                            transition: 'all 0.2s ease-in-out',
                          },
                        }}
                      >
                        <TableCell>
                          <Box
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 2,
                            }}
                          >
                            <Avatar 
                              sx={{ 
                                bgcolor: 'warning.main',
                                width: 48,
                                height: 48,
                                fontSize: '1.2rem',
                                fontWeight: 600,
                                boxShadow: `0 4px 14px ${alpha(theme.palette.warning.main, 0.3)}`,
                              }}
                            >
                              {pendingRequest.requester?.name?.charAt(0) || '?'}
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
                                {pendingRequest.requester?.email || 'No email'}
                              </Typography>
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={pendingRequest.requester?.role || 'Unknown'}
                            color={getRoleColor(
                              pendingRequest.requester?.role || ''
                            )}
                            size="small"
                            sx={{
                              fontWeight: 600,
                              borderRadius: 2,
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" color="text.secondary">
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
                                minHeight: '32px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                borderRadius: 2,
                                fontWeight: 600,
                                transition: 'all 0.2s ease-in-out',
                                boxShadow: `0 4px 12px ${alpha(theme.palette.success.main, 0.3)}`,
                                '&:hover': {
                                  transform: 'translateY(-2px)',
                                  boxShadow: `0 6px 16px ${alpha(theme.palette.success.main, 0.4)}`,
                                },
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
                                minHeight: '32px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                borderRadius: 2,
                                fontWeight: 600,
                                transition: 'all 0.2s ease-in-out',
                                '&:hover': {
                                  transform: 'translateY(-2px)',
                                  boxShadow: `0 4px 12px ${alpha(theme.palette.error.main, 0.3)}`,
                                },
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
                      <TableRow 
                        key={pendingSent.id} 
                        component={motion.tr}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.05 }}
                        hover
                        sx={{
                          '&:hover': {
                            bgcolor: alpha(theme.palette.info.main, 0.04),
                            transform: 'scale(1.002)',
                            transition: 'all 0.2s ease-in-out',
                          },
                        }}
                      >
                        <TableCell>
                          <Box
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 2,
                            }}
                          >
                            <Avatar 
                              sx={{ 
                                bgcolor: 'info.main',
                                width: 48,
                                height: 48,
                                fontSize: '1.2rem',
                                fontWeight: 600,
                                boxShadow: `0 4px 14px ${alpha(theme.palette.info.main, 0.3)}`,
                              }}
                            >
                              {pendingSent.recipient?.name?.charAt(0) || '?'}
                            </Avatar>
                            <Box>
                              <Typography
                                variant="subtitle2"
                                sx={{ fontWeight: 600 }}
                              >
                                {pendingSent.recipient?.name || 'Unknown User'}
                              </Typography>
                              <Typography
                                variant="caption"
                                color="text.secondary"
                              >
                                {pendingSent.recipient?.email || 'No email'}
                              </Typography>
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={pendingSent.recipient?.role || 'Unknown'}
                            color={getRoleColor(
                              pendingSent.recipient?.role || ''
                            )}
                            size="small"
                            sx={{
                              fontWeight: 600,
                              borderRadius: 2,
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" color="text.secondary">
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
                            sx={{
                              fontWeight: 600,
                              borderRadius: 2,
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          <Tooltip title="Cancel Request">
                            <IconButton
                              size="small"
                              onClick={() =>
                                handleRejectRequest(pendingSent.id)
                              }
                              sx={{ 
                                color: 'error.main',
                                transition: 'all 0.2s ease-in-out',
                                '&:hover': {
                                  transform: 'scale(1.15)',
                                  bgcolor: alpha(theme.palette.error.main, 0.1),
                                  boxShadow: `0 4px 12px ${alpha(theme.palette.error.main, 0.3)}`,
                                },
                              }}
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
                      <TableRow 
                        key={suggestion.user.id} 
                        component={motion.tr}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.05 }}
                        hover
                        sx={{
                          '&:hover': {
                            bgcolor: alpha(theme.palette.success.main, 0.04),
                            transform: 'scale(1.002)',
                            transition: 'all 0.2s ease-in-out',
                          },
                        }}
                      >
                        <TableCell>
                          <Box
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 2,
                            }}
                          >
                            <Avatar 
                              sx={{ 
                                bgcolor: 'success.main',
                                width: 48,
                                height: 48,
                                fontSize: '1.2rem',
                                fontWeight: 600,
                                boxShadow: `0 4px 14px ${alpha(theme.palette.success.main, 0.3)}`,
                              }}
                            >
                              {suggestion.user?.name?.charAt(0) || '?'}
                            </Avatar>
                            <Box>
                              <Typography
                                variant="subtitle2"
                                sx={{ fontWeight: 600 }}
                              >
                                {suggestion.user?.name || 'Unknown User'}
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
                            color={getRoleColor(suggestion.user?.role || '')}
                            size="small"
                            sx={{
                              fontWeight: 600,
                              borderRadius: 2,
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" color="text.secondary">
                            {suggestion.reasons.join(', ')}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Box
                              sx={{
                                width: 8,
                                height: 8,
                                borderRadius: '50%',
                                bgcolor: 
                                  suggestion.matchScore >= 80 ? 'success.main' :
                                  suggestion.matchScore >= 60 ? 'info.main' :
                                  suggestion.matchScore >= 40 ? 'warning.main' :
                                  'error.main',
                              }}
                            />
                            <Typography 
                              variant="body2" 
                              sx={{ 
                                fontWeight: 600,
                                color: 
                                  suggestion.matchScore >= 80 ? 'success.main' :
                                  suggestion.matchScore >= 60 ? 'info.main' :
                                  suggestion.matchScore >= 40 ? 'warning.main' :
                                  'error.main',
                              }}
                            >
                              {suggestion.matchScore}%
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Button
                            size="small"
                            startIcon={<PersonAddIcon />}
                            onClick={() => handleConnect(suggestion.user.id)}
                            variant="contained"
                            color="primary"
                            sx={{
                              minHeight: '32px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              borderRadius: 2,
                              fontWeight: 600,
                              transition: 'all 0.2s ease-in-out',
                              boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.3)}`,
                              '&:hover': {
                                transform: 'translateY(-2px)',
                                boxShadow: `0 6px 16px ${alpha(theme.palette.primary.main, 0.4)}`,
                              },
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
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={currentData.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Paper>
      </motion.div>
    </Container>
  );
};

export default Connections;
