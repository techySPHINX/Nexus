// pages/Connections.tsx
import React, { useState } from 'react';
import {
  Container,
  Typography,
  Box,
  Grid,
  Tabs,
  Tab,
  Paper,
  Stack,
  Divider,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  InputAdornment,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from '@mui/material';
import {
  PersonAdd as PersonAddIcon,
  Message as MessageIcon,
  Search as SearchIcon,
  People as PeopleIcon,
  TrendingUp as TrendingUpIcon,
  School as SchoolIcon,
  Work as WorkIcon,
  NavigateBefore as PrevIcon,
  NavigateNext as NextIcon,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { ErrorBoundary } from 'react-error-boundary';

import { UserCard } from '../components/Connections/UserCard';
import { StatsCard } from '../components/Connections/StatsCard';
import { ConnectionActionButtons } from '../components/Connections/ConnectionActionButtons';
import { TabPanel } from '../components/Connections/TabPanel';
import { ErrorFallback } from '../components/Connections/ErrorFallback';
import { LoadingIndicator } from '../components/Connections/LoadingIndicator';
import  useConnections  from '../hooks/useConnections';
import { apiService } from '../services/api';

const Connections: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<{ id: string; name: string } | null>(null);
  const [messageDialog, setMessageDialog] = useState(false);
  const [messageContent, setMessageContent] = useState('');
  const [filters, setFilters] = useState({
    page: 1,
    limit: 20,
    role: undefined as undefined | 'STUDENT' | 'ALUM' | 'ADMIN',
  });

  const {
    connections,
    pendingReceived,
    pendingSent,
    suggestions,
    stats,
    loading,
    error,
    fetchAll,
    setConnections,
    setPendingReceived,
    setPendingSent,
    setSuggestions,
    setError
  } = useConnections();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchAll({ ...filters, search: searchTerm });
  };

  const handlePageChange = (newPage: number) => {
    setFilters(prev => ({ ...prev, page: newPage }));
  };

  const handleRoleFilter = (role: string) => {
    const validRole = role === '' ? undefined : role as 'STUDENT' | 'ALUM' | 'ADMIN';
    setFilters(prev => ({ ...prev, role: validRole, page: 1 }));
  };

  const sendConnectionRequest = async (userId: string) => {
    try {
      setActionLoading(`send-${userId}`);
      await apiService.connections.send(userId);
      setSuggestions(prev => prev.filter(s => s.user.id !== userId));
      setSuccess('Connection request sent successfully!');
      setError(null);
      fetchAll(filters);
    } catch (err) {
      setError('Failed to send connection request');
      setSuccess(null);
    } finally {
      setActionLoading(null);
    }
  };

  const respondToConnection = async (connectionId: string, status: 'ACCEPTED' | 'REJECTED' | 'BLOCKED') => {
    try {
      setActionLoading(`respond-${connectionId}`);
      await apiService.connections.updateStatus(connectionId, status);
      setPendingReceived(prev => prev.filter(c => c.id !== connectionId));
      if (status === 'ACCEPTED') {
        fetchAll(filters);
      }
      setSuccess(`Connection request ${status.toLowerCase()} successfully!`);
      setError(null);
    } catch (err) {
      setError('Failed to respond to connection request');
      setSuccess(null);
    } finally {
      setActionLoading(null);
    }
  };

  const cancelConnection = async (connectionId: string) => {
    try {
      setActionLoading(`cancel-${connectionId}`);
      await apiService.connections.cancel(connectionId);
      setPendingSent(prev => prev.filter(c => c.id !== connectionId));
      setSuccess('Connection request cancelled.');
      setError(null);
    } catch (err) {
      setError('Failed to cancel connection request');
      setSuccess(null);
    } finally {
      setActionLoading(null);
    }
  };

  const removeConnection = async (connectionId: string) => {
    try {
      setActionLoading(`remove-${connectionId}`);
      await apiService.connections.remove(connectionId);
      setConnections(prev => prev.filter(c => c.id !== connectionId));
      setSuccess('Connection removed.');
      setError(null);
    } catch (err) {
      setError('Failed to remove connection');
      setSuccess(null);
    } finally {
      setActionLoading(null);
    }
  };

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  return (
    <ErrorBoundary FallbackComponent={ErrorFallback} onReset={() => fetchAll(filters)}>
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }}>
          {/* Header */}
          <Box display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" mb={3} gap={2}>
            <Box>
              <Typography variant="h4" component="h1" sx={{ fontWeight: 700 }} gutterBottom>
                Connections
              </Typography>
              <Typography variant="subtitle1" color="text.secondary">
                Manage and grow your network
              </Typography>
            </Box>

            {/* Stats Cards */}
            {stats && (
              <Stack direction="row" spacing={1} alignItems="center">
                <StatsCard icon={<PeopleIcon color="info" />} value={stats.total} label="Total" />
                <StatsCard icon={<TrendingUpIcon color="warning" />} value={stats.pendingReceived} label="Pending" />
                <StatsCard icon={<SchoolIcon color="primary" />} value={stats.byRole.students} label="Students" />
                <StatsCard icon={<WorkIcon color="secondary" />} value={stats.byRole.alumni} label="Alumni" />
              </Stack>
            )}
          </Box>

          <Divider sx={{ mb: 3 }} />

          {/* Tabs */}
          <Box sx={{ mb: 2 }}>
            <Tabs
              value={tabValue}
              onChange={handleTabChange}
              variant="scrollable"
              scrollButtons
              allowScrollButtonsMobile
            >
              <Tab label={`Connections (${connections.length})`} />
              <Tab label={`Pending Received (${pendingReceived.length})`} />
              <Tab label={`Pending Sent (${pendingSent.length})`} />
              <Tab label={`Suggestions (${suggestions.length})`} />
            </Tabs>
          </Box>

          {/* Search + Filters */}
          <Box component="form" onSubmit={handleSearch} sx={{ mb: 3 }}>
            <Paper sx={{ display: 'flex', gap: 2, alignItems: 'center', p: 1.25, borderRadius: 3 }} elevation={1}>
              <TextField
                size="small"
                variant="outlined"
                placeholder="Search connections..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                fullWidth
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon color="action" />
                    </InputAdornment>
                  ),
                }}
              />

              {tabValue === 0 && (
                <FormControl size="small" sx={{ minWidth: 140 }}>
                  <InputLabel>Role</InputLabel>
                  <Select
                    value={filters.role || ''}
                    label="Role"
                    onChange={(e) => handleRoleFilter(e.target.value)}
                  >
                    <MenuItem value="">All</MenuItem>
                    <MenuItem value="STUDENT">Student</MenuItem>
                    <MenuItem value="ALUM">Alum</MenuItem>
                    <MenuItem value="ADMIN">Admin</MenuItem>
                  </Select>
                </FormControl>
              )}

              <Button type="submit" variant="contained" sx={{ whiteSpace: 'nowrap' }}>
                Search
              </Button>
            </Paper>
          </Box>

          {/* Alerts */}
          {error && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
              {error}
            </Alert>
          )}
          {success && (
            <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>
              {success}
            </Alert>
          )}

          {/* Tab Panels */}
          <TabPanel value={tabValue} index={0}>
            {loading && <LoadingIndicator />}

            <Grid container spacing={3}>
              {connections.map((connection) => (
                <Grid item xs={12} sm={6} md={4} key={connection.id}>
                  <UserCard
                    user={connection.user}
                    actions={
                      <>
                        <Button
                          size="small"
                          startIcon={<MessageIcon />}
                          onClick={() => {
                            setSelectedUser({ id: connection.user.id, name: connection.user.name });
                            setMessageDialog(true);
                          }}
                        >
                          Message
                        </Button>
                        <ConnectionActionButtons
                          connectionId={connection.user.id}
                          status="PENDING"
                          onAccept={(id: string) => respondToConnection(id, 'ACCEPTED')}
                          onReject={(id: string) => respondToConnection(id, 'REJECTED')}
                          onBlock={(id: string) => respondToConnection(id, 'BLOCKED')}
                          loadingId={actionLoading}
                        />
                      </>
                    }
                  />
                </Grid>
              ))}

              {connections.length === 0 && !loading && (
                <Grid item xs={12}>
                  <Paper sx={{ p: 6, textAlign: 'center', borderRadius: 3 }}>
                    <Typography variant="h6" color="text.secondary">No connections found</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Start building your network by sending connection requests.
                    </Typography>
                  </Paper>
                </Grid>
              )}
            </Grid>

            {connections.length > 0 && (
              <Box display="flex" justifyContent="center" mt={3} gap={1}>
                <IconButton
                  onClick={() => handlePageChange(filters.page - 1)}
                  disabled={filters.page === 1}
                >
                  <PrevIcon />
                </IconButton>
                <Button
                  onClick={() => handlePageChange(filters.page + 1)}
                  disabled={connections.length < filters.limit}
                >
                  Next
                </Button>
              </Box>
            )}
          </TabPanel>

          {/* Other Tab Panels */}
          <TabPanel value={tabValue} index={1}>
            {loading && <LoadingIndicator />}

            <Grid container spacing={3}>
              {pendingReceived.map((request) => (
                <Grid item xs={12} sm={6} md={4} key={request.id}>
                  <UserCard
                    user={request.requester!}
                    actions={
                      <ConnectionActionButtons
                        connectionId={request.id}
                        status="PENDING"
                        onAccept={(id: string) => respondToConnection(id, 'ACCEPTED')}
                        onReject={(id: string) => respondToConnection(id, 'REJECTED')}
                        onBlock={(id: string) => respondToConnection(id, 'BLOCKED')}
                        loadingId={actionLoading}
                      />
                    }
                  />
                </Grid>
              ))}

              {pendingReceived.length === 0 && !loading && (
                <Grid item xs={12}>
                  <Paper sx={{ p: 6, textAlign: 'center', borderRadius: 3 }}>
                    <Typography variant="h6" color="text.secondary">No pending requests</Typography>
                  </Paper>
                </Grid>
              )}
            </Grid>
          </TabPanel>

          <TabPanel value={tabValue} index={2}>
            {loading && <LoadingIndicator />}

            <Grid container spacing={3}>
              {pendingSent.map((request) => (
                <Grid item xs={12} sm={6} md={4} key={request.id}>
                  <UserCard
                    user={request.recipient!}
                    actions={
                      <ConnectionActionButtons
                        connectionId={request.id}
                        status="PENDING"
                        onAccept={(id: string) => respondToConnection(id, 'ACCEPTED')}
                        onReject={(id: string) => respondToConnection(id, 'REJECTED')}
                        onBlock={(id: string) => respondToConnection(id, 'BLOCKED')}
                        loadingId={actionLoading}
                      />
                    }
                  />
                </Grid>
              ))}

              {pendingSent.length === 0 && !loading && (
                <Grid item xs={12}>
                  <Paper sx={{ p: 6, textAlign: 'center', borderRadius: 3 }}>
                    <Typography variant="h6" color="text.secondary">No pending sent requests</Typography>
                  </Paper>
                </Grid>
              )}
            </Grid>
          </TabPanel>

          <TabPanel value={tabValue} index={3}>
            {loading && <LoadingIndicator />}

            <Grid container spacing={3}>
              {suggestions.map((suggestion) => (
                <Grid item xs={12} sm={6} md={4} key={suggestion.user.id}>
                  <UserCard
                    user={suggestion.user}
                    actions={
                      <Button
                        fullWidth
                        variant="contained"
                        startIcon={<PersonAddIcon />}
                        onClick={() => sendConnectionRequest(suggestion.user.id)}
                        disabled={actionLoading === `send-${suggestion.user.id}`}
                      >
                        Connect
                      </Button>
                    }
                  >
                    {suggestion.reasons.length > 0 && (
                      <Box sx={{ mt: 2 }}>
                        <Typography variant="caption" color="text.secondary">
                          Suggested because:
                        </Typography>
                        <Box component="ul" sx={{ pl: 2, mt: 0.5 }}>
                          {suggestion.reasons.map((reason, i) => (
                            <Typography
                              key={i}
                              variant="caption"
                              component="li"
                              color="text.secondary"
                            >
                              {reason}
                            </Typography>
                          ))}
                        </Box>
                      </Box>
                    )}
                  </UserCard>
                </Grid>
              ))}

              {suggestions.length === 0 && !loading && (
                <Grid item xs={12}>
                  <Paper sx={{ p: 6, textAlign: 'center', borderRadius: 3 }}>
                    <Typography variant="h6" color="text.secondary">No suggestions available</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Check back later for new connection suggestions
                    </Typography>
                  </Paper>
                </Grid>
              )}
            </Grid>
          </TabPanel>

          {/* Message Dialog */}
          <Dialog open={messageDialog} onClose={() => setMessageDialog(false)} maxWidth="sm" fullWidth>
            <DialogTitle>Send Message to {selectedUser?.name}</DialogTitle>
            <DialogContent>
              <TextField
                autoFocus
                margin="dense"
                label="Message"
                fullWidth
                multiline
                rows={4}
                value={messageContent}
                onChange={(e) => setMessageContent(e.target.value)}
                placeholder="Type your message here..."
              />
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setMessageDialog(false)}>Cancel</Button>
              <Button
                variant="contained"
                disabled={!messageContent.trim()}
                onClick={() => {
                  setMessageDialog(false);
                  setMessageContent('');
                  setSuccess('Message sent successfully!');
                }}
              >
                Send
              </Button>
            </DialogActions>
          </Dialog>
        </motion.div>
      </Container>
    </ErrorBoundary>
  );
};

export default Connections;