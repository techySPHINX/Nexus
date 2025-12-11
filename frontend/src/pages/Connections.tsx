import { FC, useState, useEffect } from 'react';
import {
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
  Divider,
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
  Snackbar,
  Link,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from '@mui/material';
import type { SelectChangeEvent } from '@mui/material/Select';
import {
  Search as SearchIcon,
  People as PeopleIcon,
  School as SchoolIcon,
  Work as WorkIcon,
  Check as CheckIcon,
  Close as CloseIcon,
  Block as BlockIcon,
  Message as MessageIcon,
  PersonAdd as PersonAddIcon,
  Refresh as RefreshIcon,
  Visibility as VisibilityIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import useConnections from '../hooks/useConnections';
import type {
  Connection,
  PendingRequest,
  ConnectionSuggestion,
} from '../types/connections';
import { apiService } from '../services/api';
import { LocationOn, School, Email } from '@mui/icons-material';

const Connections: FC = () => {
  const navigate = useNavigate();
  const [tabValue, setTabValue] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'info';
  }>({ open: false, message: '', severity: 'success' });
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({ open: false, title: '', message: '', onConfirm: () => {} });
  const [profileModal, setProfileModal] = useState<{
    open: boolean;
    userId: string | null;
    loading: boolean;
    profile: {
      name?: string;
      email?: string;
      role?: string;
      bio?: string;
      location?: string;
      dept?: string;
      interests?: string;
      avatarUrl?: string;
      skills?: Array<{ name: string } | string>;
      user?: {
        name?: string;
        email?: string;
        role?: string;
        profile?: {
          bio?: string;
          location?: string;
          dept?: string;
          interests?: string;
          avatarUrl?: string;
          skills?: Array<{ name: string } | string>;
        };
      };
    } | null;
  }>({ open: false, userId: null, loading: false, profile: null });

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
    cancelConnection,
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
    setPage(0); // Reset pagination when switching tabs
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

  const showSnackbar = (
    message: string,
    severity: 'success' | 'error' | 'info' = 'success'
  ) => {
    setSnackbar({ open: true, message, severity });
  };

  const handleAcceptRequest = async (requestId: string) => {
    try {
      const success = await respondToRequest(requestId, 'ACCEPTED');
      if (success) {
        showSnackbar('Connection request accepted successfully!', 'success');
        await fetchAll({
          page: page + 1,
          limit: rowsPerPage,
          role: roleFilter
            ? (roleFilter as 'STUDENT' | 'ALUM' | 'ADMIN')
            : undefined,
          search: searchTerm,
        });
      }
    } catch {
      showSnackbar('Failed to accept connection request', 'error');
    }
  };

  const handleRejectRequest = async (requestId: string) => {
    try {
      const success = await respondToRequest(requestId, 'REJECTED');
      if (success) {
        showSnackbar('Connection request rejected', 'info');
        await fetchAll({
          page: page + 1,
          limit: rowsPerPage,
          role: roleFilter
            ? (roleFilter as 'STUDENT' | 'ALUM' | 'ADMIN')
            : undefined,
          search: searchTerm,
        });
      }
    } catch {
      showSnackbar('Failed to reject connection request', 'error');
    }
  };

  const handleCancelRequest = async (connectionId: string) => {
    try {
      const success = await cancelConnection(connectionId);
      if (success) {
        showSnackbar('Connection request cancelled', 'info');
        await fetchAll({
          page: page + 1,
          limit: rowsPerPage,
          role: roleFilter
            ? (roleFilter as 'STUDENT' | 'ALUM' | 'ADMIN')
            : undefined,
          search: searchTerm,
        });
      }
    } catch {
      showSnackbar('Failed to cancel connection request', 'error');
    }
  };

  const handleConnect = async (userId: string) => {
    try {
      const success = await sendRequest(userId);
      if (success) {
        showSnackbar('Connection request sent!', 'success');
        // Remove from suggestions and refresh data
        await fetchAll({
          page: page + 1,
          limit: rowsPerPage,
          role: roleFilter
            ? (roleFilter as 'STUDENT' | 'ALUM' | 'ADMIN')
            : undefined,
          search: searchTerm,
        });
      }
    } catch (err: unknown) {
      // Extract user-friendly error message from axios error response
      let errorMessage = 'Failed to send connection request';

      if (err && typeof err === 'object' && 'response' in err) {
        const axiosError = err as {
          response?: { data?: { message?: string } };
          message?: string;
        };
        if (axiosError.response?.data?.message) {
          errorMessage = axiosError.response.data.message;
        } else if (axiosError.message) {
          errorMessage = axiosError.message;
        }
      } else if (err instanceof Error) {
        errorMessage = err.message;
      }

      // Handle specific error cases with appropriate messages
      if (
        errorMessage.toLowerCase().includes('already pending') ||
        errorMessage.toLowerCase().includes('pending')
      ) {
        showSnackbar('Connection request is already pending', 'info');
        // Refresh to update the UI
        await fetchAll({
          page: page + 1,
          limit: rowsPerPage,
          role: roleFilter
            ? (roleFilter as 'STUDENT' | 'ALUM' | 'ADMIN')
            : undefined,
          search: searchTerm,
        });
      } else if (
        errorMessage.toLowerCase().includes('already connected') ||
        errorMessage.toLowerCase().includes('connected')
      ) {
        showSnackbar('You are already connected with this user', 'info');
        // Refresh to update the UI
        await fetchAll({
          page: page + 1,
          limit: rowsPerPage,
          role: roleFilter
            ? (roleFilter as 'STUDENT' | 'ALUM' | 'ADMIN')
            : undefined,
          search: searchTerm,
        });
      } else if (errorMessage.toLowerCase().includes('blocked')) {
        showSnackbar('This connection is blocked', 'error');
      } else if (errorMessage.toLowerCase().includes('yourself')) {
        showSnackbar('Cannot connect to yourself', 'error');
      } else {
        showSnackbar(errorMessage, 'error');
      }
    }
  };

  const handleRemoveConnection = async (connectionId: string) => {
    setConfirmDialog({
      open: true,
      title: 'Remove Connection',
      message:
        'Are you sure you want to remove this connection? This action cannot be undone.',
      onConfirm: async () => {
        setConfirmDialog((prev) => ({ ...prev, open: false }));
        try {
          const success = await removeConnection(connectionId);
          if (success) {
            showSnackbar('Connection removed successfully', 'info');
            await fetchAll({
              page: page + 1,
              limit: rowsPerPage,
              role: roleFilter
                ? (roleFilter as 'STUDENT' | 'ALUM' | 'ADMIN')
                : undefined,
              search: searchTerm,
            });
          }
        } catch {
          showSnackbar('Failed to remove connection', 'error');
        }
      },
    });
  };

  const handleRefresh = async () => {
    await fetchAll({
      page: page + 1,
      limit: rowsPerPage,
      role: roleFilter
        ? (roleFilter as 'STUDENT' | 'ALUM' | 'ADMIN')
        : undefined,
      search: searchTerm,
    });
    showSnackbar('Connections refreshed', 'success');
  };

  const handleSendMessage = (userId: string) => {
    // Navigate to messages page with user ID to auto-start conversation
    if (userId) {
      navigate(`/messages?user=${userId}`);
    }
  };

  const handleViewProfile = async (userId: string) => {
    setProfileModal({ open: true, userId, loading: true, profile: null });
    try {
      const response = await apiService.profile.get(userId);
      setProfileModal({
        open: true,
        userId,
        loading: false,
        profile: response.data as NonNullable<typeof profileModal.profile>,
      });
    } catch (err) {
      console.error('Failed to load profile:', err);
      setProfileModal({ open: true, userId, loading: false, profile: null });
    }
  };

  const handleCloseProfileModal = () => {
    setProfileModal({
      open: false,
      userId: null,
      loading: false,
      profile: null,
    });
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
        return ['User', 'Role', 'Match Details', 'Actions'];
      default:
        return [];
    }
  };

  if (connectionsLoading) {
    return (
      <Box
        className="w-full mx-auto"
        sx={{ py: 3, maxWidth: '1280px', px: { xs: 2, md: 3 } }}
      >
        <Box
          display="flex"
          justifyContent="center"
          alignItems="center"
          minHeight="400px"
        >
          <CircularProgress size={60} />
        </Box>
      </Box>
    );
  }

  if (connectionsError) {
    return (
      <Box
        className="w-full mx-auto"
        sx={{ py: 3, maxWidth: '1280px', px: { xs: 2, md: 3 } }}
      >
        <Alert severity="error" sx={{ mb: 3 }}>
          {connectionsError}
        </Alert>
      </Box>
    );
  }

  const currentData = getCurrentData();
  type Row = Connection | PendingRequest | ConnectionSuggestion;
  const paginatedData = currentData.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  ) as Row[];

  return (
    <Box
      className="w-full mx-auto"
      sx={{ py: 4, maxWidth: '1280px', px: { xs: 2, md: 3 } }}
    >
      {/* Header */}
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        flexWrap="wrap"
        mb={3}
        gap={2}
      >
        <Box>
          <Typography
            variant="h4"
            component="h1"
            sx={{ fontWeight: 600 }}
            gutterBottom
          >
            Connections
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            Manage and grow your professional network
          </Typography>
        </Box>
        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={handleRefresh}
          disabled={connectionsLoading}
          sx={{ minWidth: { xs: '100%', sm: 'auto' } }}
        >
          Refresh
        </Button>

        {/* Stats Cards */}
        {stats && (
          <Stack direction="row" spacing={1} alignItems="center">
            <Paper
              sx={{
                p: 2,
                textAlign: 'center',
                minWidth: 80,
                minHeight: '100px', // Fixed height for uniform appearance
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <PeopleIcon color="primary" sx={{ mb: 1 }} />
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                {stats.total}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Total
              </Typography>
            </Paper>
            <Paper
              sx={{
                p: 2,
                textAlign: 'center',
                minWidth: 80,
                minHeight: '100px', // Fixed height for uniform appearance
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <SchoolIcon color="info" sx={{ mb: 1 }} />
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                {stats.byRole.students}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Students
              </Typography>
            </Paper>
            <Paper
              sx={{
                p: 2,
                textAlign: 'center',
                minWidth: 80,
                minHeight: '100px', // Fixed height for uniform appearance
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <WorkIcon color="secondary" sx={{ mb: 1 }} />
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                {stats.byRole.alumni}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Alumni
              </Typography>
            </Paper>
            <Paper
              sx={{
                p: 2,
                textAlign: 'center',
                minWidth: 80,
                minHeight: '100px', // Fixed height for uniform appearance
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <BlockIcon color="warning" sx={{ mb: 1 }} />
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                {stats.pendingReceived}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Pending
              </Typography>
            </Paper>
          </Stack>
        )}
      </Box>

      <Divider sx={{ mb: 3 }} />

      {/* Search + Filters */}
      <Box component="form" onSubmit={handleSearch} sx={{ mb: 3 }}>
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={2}
          alignItems={{ xs: 'stretch', sm: 'center' }}
        >
          <TextField
            fullWidth
            placeholder="Search connections..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
            sx={{ maxWidth: 400 }}
          />
          <FormControl sx={{ minWidth: { xs: '100%', sm: 140 } }}>
            <InputLabel>Role</InputLabel>
            <Select
              value={roleFilter}
              label="Role"
              onChange={handleRoleFilterChange}
            >
              <MenuItem value="">All Roles</MenuItem>
              <MenuItem value="STUDENT">Student</MenuItem>
              <MenuItem value="ALUM">Alumni</MenuItem>
              <MenuItem value="ADMIN">Admin</MenuItem>
            </Select>
          </FormControl>
          <Button
            type="submit"
            variant="contained"
            sx={{ minWidth: { xs: '100%', sm: 100 } }}
          >
            Search
          </Button>
        </Stack>
      </Box>

      {/* Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab label={`Connections (${connections.length})`} />
          <Tab label={`Pending Received (${pendingReceived.length})`} />
          <Tab label={`Pending Sent (${pendingSent.length})`} />
          <Tab label={`Suggestions (${suggestions.length})`} />
        </Tabs>
      </Paper>

      {/* Table */}
      <Paper>
        <TableContainer sx={{ overflowX: 'auto' }}>
          <Table>
            <TableHead>
              <TableRow>
                {getTableHeaders().map((header) => (
                  <TableCell key={header} sx={{ fontWeight: 600 }}>
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
                    sx={{ py: 6 }}
                  >
                    <Box sx={{ textAlign: 'center' }}>
                      <PeopleIcon
                        sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }}
                      />
                      <Typography
                        variant="h6"
                        color="text.secondary"
                        gutterBottom
                      >
                        {tabValue === 0 && 'No connections yet'}
                        {tabValue === 1 && 'No pending requests'}
                        {tabValue === 2 && 'No sent requests'}
                        {tabValue === 3 && 'No suggestions available'}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {tabValue === 0 &&
                          'Start connecting with others to build your network'}
                        {tabValue === 1 &&
                          'You have no pending connection requests'}
                        {tabValue === 2 &&
                          'You have not sent any connection requests'}
                        {tabValue === 3 &&
                          'Try updating your profile to get better suggestions'}
                      </Typography>
                    </Box>
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
                            <Avatar
                              sx={{
                                bgcolor: 'primary.main',
                                cursor: 'pointer',
                              }}
                              onClick={() =>
                                connection.user?.id &&
                                handleViewProfile(connection.user.id)
                              }
                            >
                              {connection.user?.name?.charAt(0) || '?'}
                            </Avatar>
                            <Box>
                              <Link
                                component="button"
                                variant="subtitle2"
                                sx={{
                                  fontWeight: 600,
                                  textDecoration: 'none',
                                  cursor: 'pointer',
                                }}
                                onClick={() =>
                                  connection.user?.id &&
                                  handleViewProfile(connection.user.id)
                                }
                              >
                                {connection.user?.name || 'Unknown User'}
                              </Link>
                              <Typography
                                variant="caption"
                                color="text.secondary"
                                display="block"
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
                          <Typography variant="body2" color="text.secondary">
                            {('connectedAt' in connection
                              ? (
                                  connection as Connection & {
                                    connectedAt?: string;
                                  }
                                ).connectedAt
                              : null) || connection.createdAt
                              ? new Date(
                                  ('connectedAt' in connection
                                    ? (
                                        connection as Connection & {
                                          connectedAt?: string;
                                        }
                                      ).connectedAt
                                    : null) || connection.createdAt
                                ).toLocaleDateString()
                              : 'N/A'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            <Tooltip title="View Profile">
                              <IconButton
                                size="small"
                                onClick={() =>
                                  connection.user?.id &&
                                  handleViewProfile(connection.user.id)
                                }
                                sx={{ color: 'primary.main' }}
                              >
                                <VisibilityIcon />
                              </IconButton>
                            </Tooltip>
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
                            <Avatar
                              sx={{
                                bgcolor: 'secondary.main',
                                cursor: 'pointer',
                              }}
                              onClick={() =>
                                pendingRequest.requester?.id &&
                                handleViewProfile(pendingRequest.requester.id)
                              }
                            >
                              {pendingRequest.requester?.name?.charAt(0) || '?'}
                            </Avatar>
                            <Box>
                              <Link
                                component="button"
                                variant="subtitle2"
                                sx={{
                                  fontWeight: 600,
                                  textDecoration: 'none',
                                  cursor: 'pointer',
                                }}
                                onClick={() =>
                                  pendingRequest.requester?.id &&
                                  handleViewProfile(pendingRequest.requester.id)
                                }
                              >
                                {pendingRequest.requester?.name ||
                                  'Unknown User'}
                              </Link>
                              <Typography
                                variant="caption"
                                color="text.secondary"
                                display="block"
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
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" color="text.secondary">
                            {('requestedAt' in pendingRequest
                              ? (
                                  pendingRequest as PendingRequest & {
                                    requestedAt?: string;
                                  }
                                ).requestedAt
                              : null) || pendingRequest.createdAt
                              ? new Date(
                                  ('requestedAt' in pendingRequest
                                    ? (
                                        pendingRequest as PendingRequest & {
                                          requestedAt?: string;
                                        }
                                      ).requestedAt
                                    : null) || pendingRequest.createdAt
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
                            <Avatar
                              sx={{ bgcolor: 'info.main', cursor: 'pointer' }}
                              onClick={() =>
                                pendingSent.recipient?.id &&
                                handleViewProfile(pendingSent.recipient.id)
                              }
                            >
                              {pendingSent.recipient?.name?.charAt(0) || '?'}
                            </Avatar>
                            <Box>
                              <Link
                                component="button"
                                variant="subtitle2"
                                sx={{
                                  fontWeight: 600,
                                  textDecoration: 'none',
                                  cursor: 'pointer',
                                }}
                                onClick={() =>
                                  pendingSent.recipient?.id &&
                                  handleViewProfile(pendingSent.recipient.id)
                                }
                              >
                                {pendingSent.recipient?.name || 'Unknown User'}
                              </Link>
                              <Typography
                                variant="caption"
                                color="text.secondary"
                                display="block"
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
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" color="text.secondary">
                            {('sentAt' in pendingSent
                              ? (
                                  pendingSent as PendingRequest & {
                                    sentAt?: string;
                                  }
                                ).sentAt
                              : null) || pendingSent.createdAt
                              ? new Date(
                                  ('sentAt' in pendingSent
                                    ? (
                                        pendingSent as PendingRequest & {
                                          sentAt?: string;
                                        }
                                      ).sentAt
                                    : null) || pendingSent.createdAt
                                ).toLocaleDateString()
                              : 'N/A'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip label="Pending" color="warning" size="small" />
                        </TableCell>
                        <TableCell>
                          <Tooltip title="Cancel Request">
                            <IconButton
                              size="small"
                              onClick={() =>
                                handleCancelRequest(pendingSent.id)
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
                            <Avatar
                              sx={{
                                bgcolor: 'success.main',
                                cursor: 'pointer',
                              }}
                              onClick={() =>
                                suggestion.user?.id &&
                                handleViewProfile(suggestion.user.id)
                              }
                            >
                              {suggestion.user?.name?.charAt(0) || '?'}
                            </Avatar>
                            <Box>
                              <Link
                                component="button"
                                variant="subtitle2"
                                sx={{
                                  fontWeight: 600,
                                  textDecoration: 'none',
                                  cursor: 'pointer',
                                }}
                                onClick={() =>
                                  suggestion.user?.id &&
                                  handleViewProfile(suggestion.user.id)
                                }
                              >
                                {suggestion.user?.name || 'Unknown User'}
                              </Link>
                              <Typography
                                variant="caption"
                                color="text.secondary"
                                display="block"
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
                          />
                        </TableCell>
                        <TableCell>
                          <Box>
                            <Typography
                              variant="body2"
                              color="text.secondary"
                              gutterBottom
                            >
                              <strong>Score: {suggestion.matchScore}%</strong>
                            </Typography>
                            {suggestion.reasons.length > 0 && (
                              <Typography
                                variant="caption"
                                color="text.secondary"
                              >
                                {suggestion.reasons.slice(0, 3).join(', ')}
                                {suggestion.reasons.length > 3 && '...'}
                              </Typography>
                            )}
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            <Tooltip title="View Profile">
                              <IconButton
                                size="small"
                                onClick={() =>
                                  suggestion.user?.id &&
                                  handleViewProfile(suggestion.user.id)
                                }
                                sx={{ color: 'primary.main' }}
                              >
                                <VisibilityIcon />
                              </IconButton>
                            </Tooltip>
                            <Button
                              size="small"
                              startIcon={<PersonAddIcon />}
                              onClick={() => handleConnect(suggestion.user.id)}
                              variant="contained"
                              color="primary"
                              disabled={connectionsLoading}
                              sx={{
                                minHeight: '32px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                              }}
                            >
                              Connect
                            </Button>
                          </Box>
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

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>

      {/* Confirmation Dialog */}
      <Dialog
        open={confirmDialog.open}
        onClose={() => setConfirmDialog({ ...confirmDialog, open: false })}
        aria-labelledby="confirm-dialog-title"
        aria-describedby="confirm-dialog-description"
      >
        <DialogTitle id="confirm-dialog-title">
          {confirmDialog.title}
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="confirm-dialog-description">
            {confirmDialog.message}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setConfirmDialog({ ...confirmDialog, open: false })}
            color="inherit"
          >
            Cancel
          </Button>
          <Button
            onClick={confirmDialog.onConfirm}
            color="error"
            variant="contained"
          >
            Confirm
          </Button>
        </DialogActions>
      </Dialog>

      {/* Profile Preview Modal */}
      <Dialog
        open={profileModal.open}
        onClose={handleCloseProfileModal}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
            maxHeight: '90vh',
          },
        }}
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
          >
            <Typography variant="h6">Profile</Typography>
            <IconButton
              size="small"
              onClick={handleCloseProfileModal}
              sx={{ color: 'text.secondary' }}
            >
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          {profileModal.loading ? (
            <Box
              display="flex"
              justifyContent="center"
              alignItems="center"
              py={4}
            >
              <CircularProgress />
            </Box>
          ) : profileModal.profile ? (
            <Box>
              {/* Profile Header */}
              <Box
                display="flex"
                flexDirection="column"
                alignItems="center"
                mb={3}
              >
                <Avatar
                  src={
                    profileModal.profile.avatarUrl ||
                    profileModal.profile.user?.profile?.avatarUrl
                  }
                  sx={{
                    width: 100,
                    height: 100,
                    mb: 2,
                    bgcolor: 'primary.main',
                    fontSize: '2.5rem',
                  }}
                >
                  {profileModal.profile.name?.charAt(0) ||
                    profileModal.profile.user?.name?.charAt(0) ||
                    '?'}
                </Avatar>
                <Typography variant="h5" fontWeight={600} gutterBottom>
                  {profileModal.profile.name ||
                    profileModal.profile.user?.name ||
                    'Unknown User'}
                </Typography>
                <Chip
                  label={
                    profileModal.profile.role ||
                    profileModal.profile.user?.role ||
                    'Unknown'
                  }
                  color={getRoleColor(
                    profileModal.profile.role ||
                      profileModal.profile.user?.role ||
                      ''
                  )}
                  size="small"
                  sx={{ mb: 1 }}
                />
              </Box>

              <Divider sx={{ my: 2 }} />

              {/* Profile Details */}
              <Stack spacing={2}>
                {profileModal.profile.email ||
                profileModal.profile.user?.email ? (
                  <Box display="flex" alignItems="center" gap={1}>
                    <Email fontSize="small" color="action" />
                    <Typography variant="body2">
                      {profileModal.profile.email ||
                        profileModal.profile.user?.email}
                    </Typography>
                  </Box>
                ) : null}

                {profileModal.profile.bio ||
                profileModal.profile.user?.profile?.bio ? (
                  <Box>
                    <Typography
                      variant="subtitle2"
                      color="text.secondary"
                      gutterBottom
                    >
                      Bio
                    </Typography>
                    <Typography variant="body2">
                      {profileModal.profile.bio ||
                        profileModal.profile.user?.profile?.bio}
                    </Typography>
                  </Box>
                ) : null}

                {profileModal.profile.location ||
                profileModal.profile.user?.profile?.location ? (
                  <Box display="flex" alignItems="center" gap={1}>
                    <LocationOn fontSize="small" color="action" />
                    <Typography variant="body2">
                      {profileModal.profile.location ||
                        profileModal.profile.user?.profile?.location}
                    </Typography>
                  </Box>
                ) : null}

                {profileModal.profile.dept ||
                profileModal.profile.user?.profile?.dept ? (
                  <Box display="flex" alignItems="center" gap={1}>
                    <School fontSize="small" color="action" />
                    <Typography variant="body2">
                      {profileModal.profile.dept ||
                        profileModal.profile.user?.profile?.dept}
                    </Typography>
                  </Box>
                ) : null}

                {profileModal.profile.user?.profile?.skills &&
                profileModal.profile.user.profile.skills.length > 0 ? (
                  <Box>
                    <Typography
                      variant="subtitle2"
                      color="text.secondary"
                      gutterBottom
                    >
                      Skills
                    </Typography>
                    <Box display="flex" flexWrap="wrap" gap={1}>
                      {profileModal.profile.user.profile.skills.map(
                        (skill, index: number) => (
                          <Chip
                            key={index}
                            label={
                              typeof skill === 'string' ? skill : skill.name
                            }
                            size="small"
                            variant="outlined"
                          />
                        )
                      )}
                    </Box>
                  </Box>
                ) : profileModal.profile.skills &&
                  profileModal.profile.skills.length > 0 ? (
                  <Box>
                    <Typography
                      variant="subtitle2"
                      color="text.secondary"
                      gutterBottom
                    >
                      Skills
                    </Typography>
                    <Box display="flex" flexWrap="wrap" gap={1}>
                      {profileModal.profile.skills.map(
                        (skill, index: number) => (
                          <Chip
                            key={index}
                            label={
                              typeof skill === 'string' ? skill : skill.name
                            }
                            size="small"
                            variant="outlined"
                          />
                        )
                      )}
                    </Box>
                  </Box>
                ) : null}

                {profileModal.profile.interests ||
                profileModal.profile.user?.profile?.interests ? (
                  <Box>
                    <Typography
                      variant="subtitle2"
                      color="text.secondary"
                      gutterBottom
                    >
                      Interests
                    </Typography>
                    <Typography variant="body2">
                      {profileModal.profile.interests ||
                        profileModal.profile.user?.profile?.interests}
                    </Typography>
                  </Box>
                ) : null}
              </Stack>
            </Box>
          ) : (
            <Box textAlign="center" py={4}>
              <Typography variant="body2" color="text.secondary">
                Failed to load profile information
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            onClick={() => {
              if (profileModal.userId) {
                navigate(`/profile/${profileModal.userId}`);
                handleCloseProfileModal();
              }
            }}
            variant="outlined"
            fullWidth
          >
            View Full Profile
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Connections;
