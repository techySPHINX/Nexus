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
} from '@mui/icons-material';
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
    <Container maxWidth="xl" sx={{ py: 3 }}>
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
        <Stack direction="row" spacing={2} alignItems="center">
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
          <FormControl sx={{ minWidth: 120 }}>
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
          <Button type="submit" variant="contained" sx={{ minWidth: 100 }}>
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
        <TableContainer>
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
                          />
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={connection.status}
                            color={
                              connection.status === 'ACCEPTED' ? 'success' : 'default'
                            }
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" color="text.secondary">
                            {connection.createdAt
                              ? new Date(connection.createdAt).toLocaleDateString()
                              : 'N/A'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            <Tooltip title="Send Message">
                              <IconButton
                                size="small"
                                onClick={() => handleSendMessage(connection.user?.id)}
                                sx={{ color: 'primary.main' }}
                              >
                                <MessageIcon />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Remove Connection">
                              <IconButton
                                size="small"
                                onClick={() => handleRemoveConnection(connection.id)}
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
                              {pendingRequest.requester?.name?.charAt(0) || '?'}
                            </Avatar>
                            <Box>
                              <Typography
                                variant="subtitle2"
                                sx={{ fontWeight: 600 }}
                              >
                                {pendingRequest.requester?.name || 'Unknown User'}
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
                            color={getRoleColor(pendingRequest.requester?.role || '')}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" color="text.secondary">
                            {pendingRequest.createdAt
                              ? new Date(pendingRequest.createdAt).toLocaleDateString()
                              : 'N/A'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            <Button
                              size="small"
                              startIcon={<CheckIcon />}
                              onClick={() => handleAcceptRequest(pendingRequest.id)}
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
                              onClick={() => handleRejectRequest(pendingRequest.id)}
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
                            color={getRoleColor(pendingSent.recipient?.role || '')}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" color="text.secondary">
                            {pendingSent.createdAt
                              ? new Date(pendingSent.createdAt).toLocaleDateString()
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
                              onClick={() => handleRejectRequest(pendingSent.id)}
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
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" color="text.secondary">
                            {suggestion.reasons.join(', ')}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" color="text.secondary">
                            Match Score: {suggestion.matchScore}%
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Button
                            size="small"
                            startIcon={<PersonAddIcon />}
                            onClick={() => handleConnect(suggestion.user.id)}
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
    </Container>
  );
};

export default Connections;
