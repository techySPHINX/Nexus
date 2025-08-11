import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Avatar,
  Chip,
  Tabs,
  Tab,
  List,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Paper,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  DialogContentText,
} from '@mui/material';
import {
  PersonAdd as PersonAddIcon,
  Check as CheckIcon,
  Close as CloseIcon,
  Message as MessageIcon,
  Person as PersonIcon,
  Search as SearchIcon,
  TrendingUp as TrendingUpIcon,
  People as PeopleIcon,
  School as SchoolIcon,
  Work as WorkIcon,
  Block as BlockIcon,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { apiService, handleApiError } from '../services/api';
import { ErrorBoundary } from 'react-error-boundary';

interface Connection {
  id: string;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'BLOCKED';
  createdAt: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: 'STUDENT' | 'ALUM' | 'ADMIN';
    profile?: {
      bio?: string;
      location?: string;
      interests?: string;
      avatarUrl?: string;
      skills: string[];
    };
  };
}

interface PendingRequest {
  id: string;
  createdAt: string;
  requester?: {  // For received requests
    id: string;
    name: string;
    email: string;
    role: 'STUDENT' | 'ALUM' | 'ADMIN';
    profile?: {
      bio?: string;
      location?: string;
      interests?: string;
      avatarUrl?: string;
      skills: string[];
    };

  };
  recipient?: {  // For sent requests
    id: string;
    name: string;
    email: string;
    role: 'STUDENT' | 'ALUM' | 'ADMIN';
    profile?: {
      bio?: string;
      location?: string;
      interests?: string;
      avatarUrl?: string;
      skills: string[];
    };

  };
}

interface ConnectionSuggestion {
  user: {
    id: string;
    name: string;
    email: string;
    role: 'STUDENT' | 'ALUM' | 'ADMIN';
    profile?: {
      bio?: string;
      location?: string;
      interests?: string;
      avatarUrl?: string;
      skills: string[];
    };

  };
  matchScore: number;
  reasons: string[];
}

interface ConnectionResponse {
  connections?: Connection[];
  requests?: PendingRequest[];
  suggestions?: ConnectionSuggestion[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

interface ConnectionStats {
  total: number;
  pendingReceived: number;
  pendingSent: number;
  byRole: {
    students: number;
    alumni: number;
  };
  recent30Days: number;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`connections-tabpanel-${index}`}
      aria-labelledby={`connections-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

const Connections: React.FC = () => {
  const { token } = useAuth();
  const [tabValue, setTabValue] = useState(0);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [pendingReceived, setPendingReceived] = useState<PendingRequest[]>([]);
  const [blockDialogOpen, setBlockDialogOpen] = useState(false);
  const [connectionToBlock, setConnectionToBlock] = useState<string | null>(null);
  const [pendingSent, setPendingSent] = useState<PendingRequest[]>([]);
  const [suggestions, setSuggestions] = useState<ConnectionSuggestion[]>([]);
  const [stats, setStats] = useState<ConnectionStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<ConnectionSuggestion['user'] | null>(null);
  const [messageDialog, setMessageDialog] = useState(false);
  const [messageContent, setMessageContent] = useState('');
  const [filters, setFilters] = useState({
    page: 1,
    limit: 20,
    role: '' as '' | 'STUDENT' | 'ALUM' | 'ADMIN',
  });
  const [totalCounts, setTotalCounts] = useState({
    connections: 0,
    pendingReceived: 0,
    pendingSent: 0,
    suggestions: 0,
  });


  useEffect(() => {
    if (token) {
      fetchConnections();
      fetchSuggestions();
      fetchStats();
    }
  }, [token, filters.page, filters.limit, filters.role]);
  useEffect(() => {
    if (!token) return;

    // Load data for current tab on mount
    switch (tabValue) {
      case 0: fetchConnections(); break;
      case 1: fetchPendingReceived(); break;
      case 2: fetchPendingSent(); break;
      case 3: fetchSuggestions(); break;
    }

    // Always fetch stats
    fetchStats();
  }, [token, tabValue]); // Add tabValue to dependencies

  function ErrorFallback({ error, resetErrorBoundary }: any) {
    return (
      <div role="alert">
        <p>Something went wrong:</p>
        <pre>{error.message}</pre>
        <button onClick={resetErrorBoundary}>Try again</button>
      </div>
    );
  }

  // Update the fetchConnections function
  const fetchConnections = async () => {
    try {
      setLoading(true);
      const [connectionsRes, pendingReceivedRes, pendingSentRes] = await Promise.all([
        apiService.connections.getAll({
          page: filters.page,
          limit: filters.limit,
          role: filters.role || undefined,
          search: searchTerm || undefined,
        }),
        apiService.connections.getPendingReceived({
          page: filters.page,
          limit: filters.limit,
        }),
        apiService.connections.getPendingSent({
          page: filters.page,
          limit: filters.limit,
        }),
      ]);
      console.log("Connections:", connectionsRes.data);
      console.log("Pending Received:", pendingReceivedRes.data);
      console.log("Pending Sent:", pendingSentRes.data);

      setConnections(connectionsRes.data?.connections || []);
      setPendingReceived(pendingReceivedRes.data?.requests || []);
      setPendingSent(pendingSentRes.data?.requests || []);

      setTotalCounts({
        connections: connectionsRes.data?.pagination?.total || 0,
        pendingReceived: pendingReceivedRes.data?.pagination?.total || 0,
        pendingSent: pendingSentRes.data?.pagination?.total || 0,
        suggestions: suggestions.length,
      });
    } catch (error: any) {
      console.error('Error fetching connections:', error);
      setError(handleApiError(error) || 'Failed to load connections');
    } finally {
      setLoading(false);
    }
  };
  const fetchPendingReceived = async () => {
    try {
      setLoading(true);
      const response = await apiService.connections.getPendingReceived({
        page: 1,  // Default page
        limit: 10  // Default limit
      });
      setPendingReceived(response.data?.requests || []);
      setTotalCounts(prev => ({ ...prev, pendingReceived: response.data?.requests?.length || 0 }));
    } catch (error) {
      setError(handleApiError(error));
    } finally {
      setLoading(false);
    }
  };

  const fetchPendingSent = async () => {
    try {
      setLoading(true);
      const response = await apiService.connections.getPendingSent({
        page: 1,  // Default page
        limit: 10  // Default limit
      });
      setPendingSent(response.data?.requests || []);
      setTotalCounts(prev => ({ ...prev, pendingSent: response.data?.requests?.length || 0 }));
    } catch (error) {
      setError(handleApiError(error));
    } finally {
      setLoading(false);
    }
  };

  const fetchSuggestions = async () => {
    try {
      const response = await apiService.connections.getSuggestions({
        limit: filters.limit,
      });
      setSuggestions(response.data?.suggestions || []);
      setTotalCounts(prev => ({
        ...prev,
        suggestions: response.data?.suggestions?.length || 0,
      }));
    } catch (error: any) {
      console.error('Error fetching suggestions:', error);
    }
  };
  console.log("Suggestions:", suggestions);

  const fetchStats = async () => {
    try {
      const response = await apiService.connections.getStats();
      setStats(response.data);
    } catch (error: any) {
      console.error('Error fetching stats:', error);
    }
  };

  const sendConnectionRequest = async (userId: string) => {
    try {
      setActionLoading(`send-${userId}`);
      await apiService.connections.send(userId);
      setSuggestions(prev => prev.filter(s => s.user.id !== userId));
      setSuccess('Connection request sent successfully!');
      fetchStats(); // Refresh stats after sending request
      setError(null);
    } catch (error: any) {
      console.error('Error sending connection request:', error);
      setError(handleApiError(error) || 'Failed to send connection request');
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
        fetchConnections();
      }
      fetchStats();
      setSuccess(`Connection request ${status.toLowerCase()} successfully!`);
      setError(null);
    } catch (error: any) {
      console.error('Error responding to connection:', error);
      setError(handleApiError(error) || 'Failed to respond to connection request');
    } finally {
      setActionLoading(null);
    }
  };

  const cancelConnection = async (connectionId: string) => {
    try {
      setActionLoading(`cancel-${connectionId}`);
      await apiService.connections.cancel(connectionId);
      setPendingSent(prev => prev.filter(c => c.id !== connectionId));
      fetchStats();
      setSuccess('Connection request cancelled.');
      setError(null);
    } catch (error: any) {
      console.error('Error canceling connection:', error);
      setError(handleApiError(error) || 'Failed to cancel connection request');
    } finally {
      setActionLoading(null);
    }
  };

  const removeConnection = async (connectionId: string) => {
    try {
      setActionLoading(`remove-${connectionId}`);
      await apiService.connections.remove(connectionId);
      setConnections(prev => prev.filter(c => c.id !== connectionId));
      fetchStats();
      setSuccess('Connection removed.');
      setError(null);
    } catch (error: any) {
      console.error('Error removing connection:', error);
      setError(handleApiError(error) || 'Failed to remove connection');
    } finally {
      setActionLoading(null);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchConnections();
  };

  const handlePageChange = (newPage: number) => {
    setFilters(prev => ({ ...prev, page: newPage }));
  };

  const handleLimitChange = (newLimit: number) => {
    setFilters(prev => ({ ...prev, limit: newLimit, page: 1 }));
  };

  const handleRoleFilter = (role: '' | 'STUDENT' | 'ALUM' | 'ADMIN') => {
    setFilters(prev => ({ ...prev, role, page: 1 }));
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

  if (loading && connections.length === 0 && pendingReceived.length === 0 && pendingSent.length === 0) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  return (
    <ErrorBoundary
      FallbackComponent={ErrorFallback}
      onReset={() => {
        // Reset the state of your app
        fetchConnections();
      }}
    >
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <Typography variant="h3" component="h1" gutterBottom sx={{ fontWeight: 700 }}>
            Connections
          </Typography>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            Manage your network connections
          </Typography>

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

          {/* Connection Stats */}
          {stats && (
            <Box sx={{ mb: 3 }}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6} md={3}>
                  <Paper sx={{ p: 2, textAlign: 'center' }}>
                    <PeopleIcon color="primary" sx={{ fontSize: 40, mb: 1 }} />
                    <Typography variant="h4" fontWeight="bold" color="primary">
                      {stats.total}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Total Connections
                    </Typography>
                  </Paper>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Paper sx={{ p: 2, textAlign: 'center' }}>
                    <TrendingUpIcon color="warning" sx={{ fontSize: 40, mb: 1 }} />
                    <Typography variant="h4" fontWeight="bold" color="warning.main">
                      {stats.pendingReceived}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Pending Requests
                    </Typography>
                  </Paper>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Paper sx={{ p: 2, textAlign: 'center' }}>
                    <SchoolIcon color="info" sx={{ fontSize: 40, mb: 1 }} />
                    <Typography variant="h4" fontWeight="bold" color="info.main">
                      {stats.byRole.students}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Student Connections
                    </Typography>
                  </Paper>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Paper sx={{ p: 2, textAlign: 'center' }}>
                    <WorkIcon color="secondary" sx={{ fontSize: 40, mb: 1 }} />
                    <Typography variant="h4" fontWeight="bold" color="secondary.main">
                      {stats.byRole.alumni}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Alumni Connections
                    </Typography>
                  </Paper>
                </Grid>
              </Grid>
            </Box>
          )}

          <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
            <Tabs
              value={tabValue}
              onChange={(e, newValue) => {
                if (newValue !== tabValue) {
                  setTabValue(newValue);
                  // Trigger refresh based on selected tab
                  switch (newValue) {
                    case 0: // Connections tab
                      fetchConnections();
                      break;
                    case 1: // Pending Received tab
                      fetchPendingReceived();
                      break;
                    case 2: // Pending Sent tab
                      fetchPendingSent();
                      break;
                    case 3: // Suggestions tab
                      fetchSuggestions();
                      break;
                  }
                }
              }}
              aria-label="connections tabs"
            >
              <Tab label={`Connections (${totalCounts.connections})`} />
              <Tab label={`Pending Received (${totalCounts.pendingReceived})`} />
              <Tab label={`Pending Sent (${totalCounts.pendingSent})`} />
              <Tab label={`Suggestions (${totalCounts.suggestions})`} />
            </Tabs>
          </Box>

          <Box component="form" onSubmit={handleSearch} sx={{ mb: 3, display: 'flex', gap: 2 }}>
            <TextField
              fullWidth
              placeholder="Search connections..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />,
              }}
              size="small"
            />
            {tabValue === 0 && (
              <FormControl sx={{ minWidth: 120 }} size="small">
                <InputLabel>Role</InputLabel>
                <Select
                  value={filters.role}
                  onChange={(e) => handleRoleFilter(e.target.value as any)}
                  label="Role"
                >
                  <MenuItem value="">All</MenuItem>
                  <MenuItem value="STUDENT">Student</MenuItem>
                  <MenuItem value="ALUM">Alum</MenuItem>
                  <MenuItem value="ADMIN">Admin</MenuItem>
                </Select>
              </FormControl>
            )}
            <Button type="submit" variant="contained">Search</Button>
          </Box>

          {/* Connections Tab */}
          <TabPanel value={tabValue} index={0}>
            {loading && tabValue === 0 && ( // Only shows for this tab
              <Box display="flex" justifyContent="center" my={2}>
                <CircularProgress size={24} />
              </Box>
            )}
            <Grid container spacing={3}>
              {connections.map((connection) => (
                <Grid item xs={12} sm={6} md={4} key={connection.id}>
                  <Card>
                    <CardContent>
                      <Box display="flex" alignItems="center" mb={2}>
                        <Avatar
                          src={connection.user.profile?.avatarUrl}
                          sx={{ width: 56, height: 56, mr: 2 }}
                        >
                          <PersonIcon />
                        </Avatar>
                        <Box>
                          <Typography variant="h6" gutterBottom>
                            {connection.user.name}
                          </Typography>
                          <Chip
                            label={connection.user.role}
                            color={getRoleColor(connection.user.role) as any}
                            size="small"
                          />
                        </Box>
                      </Box>
                      {connection.user.profile?.bio && (
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          {connection.user.profile?.bio}
                        </Typography>
                      )}
                      {connection.user?.profile?.location && (
                        <Typography variant="body2" color="text.secondary">
                          📍 {connection.user.profile?.location}
                        </Typography>
                      )}
                      {connection.user.profile?.skills && connection.user.profile?.skills.length > 0 && (
                        <Box sx={{ mt: 1 }}>
                          <Typography variant="body2" color="text.secondary" gutterBottom>
                            Skills: {connection.user?.profile.skills.join(', ')}
                          </Typography>
                        </Box>
                      )}
                    </CardContent>
                    <CardActions>
                      <Button
                        size="small"
                        startIcon={<MessageIcon />}
                        onClick={() => {
                          setSelectedUser({
                            ...connection.user,
                          });
                          setMessageDialog(true);
                        }}
                      >
                        Message
                      </Button>
                      <Button
                        size="small"
                        color="error"
                        onClick={() => removeConnection(connection.id)}
                        disabled={actionLoading === `remove-${connection.id}`}
                      >
                        {actionLoading === `remove-${connection.id}` ? 'Processing...' : 'Remove'}
                      </Button>
                    </CardActions>
                  </Card>
                </Grid>
              ))}
              {connections.length === 0 && (
                <Grid item xs={12}>
                  <Box textAlign="center" py={4}>
                    <Typography variant="h6" color="text.secondary">
                      No connections found
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Start building your network by sending connection requests
                    </Typography>
                  </Box>
                </Grid>
              )}
            </Grid>
            {totalCounts.connections > filters.limit && (
              <Box display="flex" justifyContent="center" mt={3}>
                <Button
                  onClick={() => handlePageChange(filters.page - 1)}
                  disabled={filters.page === 1}
                  sx={{ mr: 2 }}
                >
                  Previous
                </Button>
                <Button
                  onClick={() => handlePageChange(filters.page + 1)}
                  disabled={filters.page * filters.limit >= totalCounts.connections}
                >
                  Next
                </Button>
              </Box>
            )}
          </TabPanel>

          {/* Pending Received Tab */}
          <TabPanel value={tabValue} index={1}>
            {loading && tabValue === 0 && ( // Only shows for this tab
              <Box display="flex" justifyContent="center" my={2}>
                <CircularProgress size={24} />
              </Box>
            )}
            <List>
              {pendingReceived.map((connection) => (
                <Card key={connection.id} sx={{ mb: 2 }}>
                  <CardContent>
                    <Box display="flex" alignItems="center" justifyContent="space-between">
                      <Box display="flex" alignItems="center">
                        <Avatar
                          src={connection.requester?.profile?.avatarUrl}
                          sx={{ mr: 2 }}
                        >
                          <PersonIcon />
                        </Avatar>
                        <Box>
                          <Typography variant="h6">{connection.requester?.name}</Typography>
                          <Typography variant="body2" color="text.secondary">
                            {connection.requester?.email}
                          </Typography>
                          <Chip
                            label={connection.requester?.role}
                            color={getRoleColor(connection.requester?.role || '') as any}
                            size="small"
                            sx={{ mt: 1 }}
                          />
                          {connection.requester?.profile?.bio && (
                            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                              {connection.requester?.profile.bio}
                            </Typography>
                          )}
                        </Box>
                      </Box>
                      <Box>
                        <Button
                          variant="contained"
                          color="primary"
                          startIcon={<CheckIcon />}
                          onClick={() => respondToConnection(connection.id, 'ACCEPTED')}
                          disabled={actionLoading === `respond-${connection.id}`}
                          sx={{ mr: 1 }}
                        >
                          Accept
                        </Button>
                        <Button
                          variant="outlined"
                          color="error"
                          startIcon={<CloseIcon />}
                          onClick={() => respondToConnection(connection.id, 'REJECTED')}
                          disabled={actionLoading === `respond-${connection.id}`}
                          sx={{ mr: 1 }}
                        >
                          Reject
                        </Button>
                        <Button
                          variant="outlined"
                          color="secondary"
                          startIcon={<BlockIcon />}
                          onClick={() => {
                            setConnectionToBlock(connection.id);
                            setBlockDialogOpen(true);
                          }}
                          disabled={actionLoading === `respond-${connection.id}`}
                        >
                          Block
                        </Button>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              ))}
              {/* Block Confirmation Dialog */}
              <Dialog
                open={blockDialogOpen}
                onClose={() => setBlockDialogOpen(false)}
              >
                <DialogTitle>Confirm Block</DialogTitle>
                <DialogContent>
                  <DialogContentText>
                    Are you sure you want to block this user? This action cannot be undone.
                  </DialogContentText>
                </DialogContent>
                <DialogActions>
                  <Button onClick={() => setBlockDialogOpen(false)}>Cancel</Button>
                  <Button
                    onClick={() => {
                      if (connectionToBlock) {
                        respondToConnection(connectionToBlock, 'BLOCKED');
                      }
                      setBlockDialogOpen(false);
                    }}
                    color="secondary"
                    autoFocus
                  >
                    Confirm Block
                  </Button>
                </DialogActions>
              </Dialog>


              {pendingReceived.length === 0 && (
                <Box textAlign="center" py={4}>
                  <Typography variant="h6" color="text.secondary">
                    No pending connection requests
                  </Typography>
                </Box>
              )}
            </List>
            {totalCounts.pendingReceived > filters.limit && (
              <Box display="flex" justifyContent="center" mt={3}>
                <Button
                  onClick={() => handlePageChange(filters.page - 1)}
                  disabled={filters.page === 1}
                  sx={{ mr: 2 }}
                >
                  Previous
                </Button>
                <Button
                  onClick={() => handlePageChange(filters.page + 1)}
                  disabled={filters.page * filters.limit >= totalCounts.pendingReceived}
                >
                  Next
                </Button>
              </Box>
            )}
          </TabPanel>

          {/* Pending Sent Tab */}
          <TabPanel value={tabValue} index={2}>
            {loading && tabValue === 0 && ( // Only shows for this tab
              <Box display="flex" justifyContent="center" my={2}>
                <CircularProgress size={24} />
              </Box>
            )}
            <List>
              {pendingSent.map((connection) => (
                <Card key={connection.id} sx={{ mb: 2 }}>
                  <CardContent>
                    <Box display="flex" alignItems="center" justifyContent="space-between">
                      <Box display="flex" alignItems="center">
                        <Avatar
                          src={connection.recipient?.profile?.avatarUrl}
                          sx={{ mr: 2 }}
                        >
                          <PersonIcon />
                        </Avatar>
                        <Box>
                          <Typography variant="h6">{connection.recipient?.name}</Typography>
                          <Typography variant="body2" color="text.secondary">
                            {connection.recipient?.email}
                          </Typography>
                          <Chip
                            label={connection.recipient?.role}
                            color={getRoleColor(connection.recipient?.role || '') as any}
                            size="small"
                            sx={{ mt: 1 }}
                          />
                          {connection.recipient?.profile?.bio && (
                            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                              {connection.recipient?.profile.bio}
                            </Typography>
                          )}
                        </Box>
                      </Box>
                      <Button
                        variant="outlined"
                        color="error"
                        onClick={() => cancelConnection(connection.id)}
                        disabled={actionLoading === `cancel-${connection.id}`}
                      >
                        {actionLoading === `cancel-${connection.id}` ? 'Processing...' : 'Cancel'}
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              ))}
              {pendingSent.length === 0 && (
                <Box textAlign="center" py={4}>
                  <Typography variant="h6" color="text.secondary">
                    No pending sent requests
                  </Typography>
                </Box>
              )}
            </List>
            {totalCounts.pendingSent > filters.limit && (
              <Box display="flex" justifyContent="center" mt={3}>
                <Button
                  onClick={() => handlePageChange(filters.page - 1)}
                  disabled={filters.page === 1}
                  sx={{ mr: 2 }}
                >
                  Previous
                </Button>
                <Button
                  onClick={() => handlePageChange(filters.page + 1)}
                  disabled={filters.page * filters.limit >= totalCounts.pendingSent}
                >
                  Next
                </Button>
              </Box>
            )}
          </TabPanel>

          {/* Suggestions Tab */}
          <TabPanel value={tabValue} index={3}>
            {loading && tabValue === 0 && ( // Only shows for this tab
              <Box display="flex" justifyContent="center" my={2}>
                <CircularProgress size={24} />
              </Box>
            )}
            <Grid container spacing={3}>
              {suggestions.map((suggestion) => (
                <Grid item xs={12} sm={6} md={4} key={suggestion.user.id}>
                  <Card>
                    <CardContent>
                      <Box display="flex" alignItems="center" mb={2}>
                        <Avatar
                          src={suggestion.user?.profile?.avatarUrl}
                          sx={{ width: 56, height: 56, mr: 2 }}
                        >
                          <PersonIcon />
                        </Avatar>
                        <Box>
                          <Typography variant="h6" gutterBottom>
                            {suggestion.user.name}
                          </Typography>
                          <Chip
                            label={suggestion.user.role}
                            color={getRoleColor(suggestion.user.role) as any}
                            size="small"
                          />
                          {suggestion.matchScore > 0 && (
                            <Chip
                              label={`${suggestion.matchScore} pts`}
                              color="success"
                              size="small"
                              sx={{ ml: 1 }}
                            />
                          )}
                        </Box>
                      </Box>
                      {suggestion.user?.profile?.bio && (
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          {suggestion.user?.profile.bio}
                        </Typography>
                      )}
                      {suggestion.reasons && suggestion.reasons.length > 0 && (
                        <Box sx={{ mb: 2 }}>
                          {suggestion.reasons.map((reason, index) => (
                            <Chip
                              key={index}
                              label={reason}
                              size="small"
                              variant="outlined"
                              sx={{ mr: 0.5, mb: 0.5 }}
                            />
                          ))}
                        </Box>
                      )}
                      {suggestion.user?.profile?.skills && suggestion.user?.profile.skills.length > 0 && (
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          Skills: {suggestion.user?.profile.skills.join(', ')}
                        </Typography>
                      )}
                    </CardContent>
                    <CardActions>
                      <Button
                        variant="contained"
                        startIcon={<PersonAddIcon />}
                        onClick={() => sendConnectionRequest(suggestion.user.id)}
                        disabled={actionLoading === `send-${suggestion.user.id}`}
                        fullWidth
                      >
                        Connect
                      </Button>
                    </CardActions>
                  </Card>
                </Grid>
              ))}
              {suggestions.length === 0 && (
                <Grid item xs={12}>
                  <Box textAlign="center" py={4}>
                    <Typography variant="h6" color="text.secondary">
                      No suggestions available
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Check back later for new connection suggestions
                    </Typography>
                  </Box>
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
              <Button /*onClick={sendMessage}*/ variant="contained" disabled={!messageContent.trim()}>
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