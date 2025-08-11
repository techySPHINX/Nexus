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
  InputAdornment,
  IconButton,
  Stack,
  Divider,
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
  NavigateBefore as PrevIcon,
  NavigateNext as NextIcon,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { apiService, handleApiError } from '../services/api';
import { ErrorBoundary } from 'react-error-boundary';
import useConnections from '../hooks/useConnections';

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
  requester?: {
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
  recipient?: {
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
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const Connections: React.FC = () => {
  const { token } = useAuth();
  const [tabValue, setTabValue] = useState(0);
  const [blockDialogOpen, setBlockDialogOpen] = useState(false);
  const [connectionToBlock, setConnectionToBlock] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<ConnectionSuggestion['user'] | null>(null);
  const [messageDialog, setMessageDialog] = useState(false);
  const [messageContent, setMessageContent] = useState('');
  const [messageLoading, setMessageLoading] = useState(false);
  const [filters, setFilters] = useState({
    page: 1,
    limit: 20,
    role: '' as '' | 'STUDENT' | 'ALUM' | 'ADMIN',
  });

  // Convert filters to the format expected by the hook
  const hookFilters = {
    page: filters.page,
    limit: filters.limit,
    role: filters.role || undefined,
    search: searchTerm || undefined,
  };

  // Use the custom hook for all connection logic
  const {
    connections,
    pendingReceived,
    pendingSent,
    suggestions,
    stats,
    loading,
    error,
    fetchAll,
    sendRequest,
    respondToRequest,
    cancelConnection,
    removeConnection,
    setError
  } = useConnections();

  useEffect(() => {
    if (token) {
      fetchAll(hookFilters);
    }
  }, [token, filters.page, filters.limit, filters.role, searchTerm, fetchAll]);

  function ErrorFallback({ error, resetErrorBoundary }: any) {
    return (
      <div role="alert">
        <p>Something went wrong:</p>
        <pre>{error.message}</pre>
        <button onClick={resetErrorBoundary}>Try again</button>
      </div>
    );
  }

  // Wrapper functions that use the hook functions with loading states
  const handleCancelConnection = async (connectionId: string) => {
    try {
      setActionLoading(`cancel-${connectionId}`);
      const success = await cancelConnection(connectionId);
      if (success) {
        setSuccess('Connection request cancelled.');
      setError(null);
        // Refresh data
        fetchAll(hookFilters);
      }
    } catch (error: any) {
      console.error('Error canceling connection:', error);
      setError(handleApiError(error) || 'Failed to cancel connection request');
    } finally {
      setActionLoading(null);
    }
  };

  const handleRemoveConnection = async (connectionId: string) => {
    try {
      setActionLoading(`remove-${connectionId}`);
      const success = await removeConnection(connectionId);
      if (success) {
        setSuccess('Connection removed.');
      setError(null);
        // Refresh data
        fetchAll(hookFilters);
      }
    } catch (error: any) {
      console.error('Error removing connection:', error);
      setError(handleApiError(error) || 'Failed to remove connection');
    } finally {
      setActionLoading(null);
    }
  };

  const sendMessage = async () => {
    if (!selectedUser || !messageContent.trim()) return;

    try {
      setMessageLoading(true);
      await apiService.messages.send(messageContent.trim(), selectedUser.id);
      
      setSuccess(`Message sent to ${selectedUser.name} successfully!`);
      setMessageDialog(false);
      setMessageContent('');
      setSelectedUser(null);
      
      // Navigate to Messages page to show the new conversation
      window.location.href = '/messages';
    } catch (error: any) {
      console.error('Error sending message:', error);
      setError(handleApiError(error) || 'Failed to send message');
    } finally {
      setMessageLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchAll(hookFilters);
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
    <ErrorBoundary FallbackComponent={ErrorFallback}>
    <Container maxWidth="lg" sx={{ py: 4 }}>
        {/* Header */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" gutterBottom sx={{ fontWeight: 600 }}>
          Connections
        </Typography>
          <Typography variant="body1" color="text.secondary">
            Manage your professional network and discover new connections
        </Typography>
        </Box>

        {/* Stats Cards */}
        {stats && (
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ textAlign: 'center', py: 2 }}>
                <CardContent>
                  <PeopleIcon sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
                  <Typography variant="h4" component="div" sx={{ fontWeight: 600 }}>
                    {stats.total}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Connections
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ textAlign: 'center', py: 2 }}>
                <CardContent>
                  <TrendingUpIcon sx={{ fontSize: 40, color: 'warning.main', mb: 1 }} />
                  <Typography variant="h4" component="div" sx={{ fontWeight: 600 }}>
                    {stats.pendingReceived}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Pending Requests
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ textAlign: 'center', py: 2 }}>
                <CardContent>
                  <SchoolIcon sx={{ fontSize: 40, color: 'info.main', mb: 1 }} />
                  <Typography variant="h4" component="div" sx={{ fontWeight: 600 }}>
                    {stats.byRole.students}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Students
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ textAlign: 'center', py: 2 }}>
                <CardContent>
                  <WorkIcon sx={{ fontSize: 40, color: 'success.main', mb: 1 }} />
                  <Typography variant="h4" component="div" sx={{ fontWeight: 600 }}>
                    {stats.byRole.alumni}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Alumni
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}

        {/* Search and Filters */}
        <Paper sx={{ p: 3, mb: 4 }}>
          <form onSubmit={handleSearch}>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} md={6}>
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
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <FormControl fullWidth>
                  <InputLabel>Role Filter</InputLabel>
                  <Select
                    value={filters.role}
                    label="Role Filter"
                    onChange={(e) => handleRoleFilter(e.target.value as '' | 'STUDENT' | 'ALUM' | 'ADMIN')}
                  >
                    <MenuItem value="">All Roles</MenuItem>
                    <MenuItem value="STUDENT">Students</MenuItem>
                    <MenuItem value="ALUM">Alumni</MenuItem>
                    <MenuItem value="ADMIN">Admins</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={3}>
                <Button
                  type="submit"
                  variant="contained"
                  fullWidth
                  startIcon={<SearchIcon />}
                >
                  Search
                </Button>
              </Grid>
            </Grid>
          </form>
        </Paper>

        {/* Tabs */}
        <Paper sx={{ mb: 4 }}>
          <Tabs
            value={tabValue}
            onChange={(_, newValue) => setTabValue(newValue)}
            sx={{ borderBottom: 1, borderColor: 'divider' }}
          >
            <Tab label={`Connections (${connections.length})`} />
            <Tab label={`Pending Received (${pendingReceived.length})`} />
            <Tab label={`Pending Sent (${pendingSent.length})`} />
            <Tab label={`Suggestions (${suggestions.length})`} />
          </Tabs>

          {/* Error Alert */}
          {error && (
            <Alert severity="error" sx={{ m: 2 }}>
              {error}
            </Alert>
          )}

          {/* Success Alert */}
          {success && (
            <Alert severity="success" sx={{ m: 2 }}>
              {success}
            </Alert>
          )}

          {/* Tab Panels */}
          <TabPanel value={tabValue} index={0}>
        {/* Connections Tab */}
          <Grid container spacing={3}>
              {connections.map((connection) => (
              <Grid item xs={12} sm={6} md={4} key={connection.id}>
                <Card>
                  <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <Avatar sx={{ mr: 2, bgcolor: 'primary.main' }}>
                          {connection.user.name.charAt(0).toUpperCase()}
                      </Avatar>
                      <Box>
                          <Typography variant="h6" component="div">
                          {connection.user.name}
                        </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {connection.user.email}
                          </Typography>
                        </Box>
                      </Box>
                        <Chip
                          label={connection.user.role}
                        color={getRoleColor(connection.user.role)}
                        size="small"
                        sx={{ mb: 2 }}
                      />
                      {connection.user.profile?.skills && (
                        <Box sx={{ mb: 2 }}>
                          <Typography variant="body2" color="text.secondary" gutterBottom>
                            Skills:
                          </Typography>
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                            {connection.user.profile.skills.slice(0, 3).map((skill, index) => (
                              <Chip
                                key={index}
                                label={skill}
                          size="small"
                                variant="outlined"
                        />
                            ))}
                      </Box>
                    </Box>
                    )}
                  </CardContent>
                  <CardActions>
                    <Button
                      size="small"
                      startIcon={<MessageIcon />}
                      onClick={() => {
                          setSelectedUser(connection.user);
                        setMessageDialog(true);
                      }}
                    >
                      Message
                    </Button>
                    <Button
                      size="small"
                      color="error"
                        onClick={() => {
                          setConnectionToBlock(connection.id);
                          setBlockDialogOpen(true);
                        }}
                    >
                      Remove
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
        </TabPanel>

          <TabPanel value={tabValue} index={1}>
        {/* Pending Received Tab */}
          <List>
              {pendingReceived.map((request) => (
                <Card key={request.id} sx={{ mb: 2 }}>
                <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <Avatar sx={{ mr: 2, bgcolor: 'secondary.main' }}>
                        {request.requester?.name?.charAt(0).toUpperCase() || '?'}
                      </Avatar>
                      <Box>
                        <Typography variant="h6" component="div">
                          {request.requester?.name || 'Unknown User'}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {request.requester?.email || 'No email'}
                        </Typography>
                      </Box>
                    </Box>
                    <Chip
                      label={request.requester?.role || 'Unknown'}
                      color={getRoleColor(request.requester?.role || '')}
                      size="small"
                      sx={{ mb: 2 }}
                    />
                  </CardContent>
                  <CardActions>
                      <Button
                      size="small"
                      color="success"
                        startIcon={<CheckIcon />}
                      onClick={() => respondToRequest(request.id, 'ACCEPTED')}
                      disabled={actionLoading === `accept-${request.id}`}
                      >
                        Accept
                      </Button>
                      <Button
                      size="small"
                        color="error"
                        startIcon={<CloseIcon />}
                      onClick={() => respondToRequest(request.id, 'REJECTED')}
                      disabled={actionLoading === `reject-${request.id}`}
                      >
                        Reject
                      </Button>
                  </CardActions>
              </Card>
            ))}
          </List>
        </TabPanel>

          <TabPanel value={tabValue} index={2}>
        {/* Pending Sent Tab */}
          <List>
              {pendingSent.map((request) => (
                <Card key={request.id} sx={{ mb: 2 }}>
                <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <Avatar sx={{ mr: 2, bgcolor: 'info.main' }}>
                        {request.recipient?.name?.charAt(0).toUpperCase() || '?'}
                      </Avatar>
                      <Box>
                        <Typography variant="h6" component="div">
                          {request.recipient?.name || 'Unknown User'}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {request.recipient?.email || 'No email'}
                        </Typography>
                      </Box>
                    </Box>
                    <Chip
                      label={request.recipient?.role || 'Unknown'}
                      color={getRoleColor(request.recipient?.role || '')}
                      size="small"
                      sx={{ mb: 2 }}
                    />
                  </CardContent>
                  <CardActions>
                    <Button
                      size="small"
                      color="warning"
                      onClick={() => handleCancelConnection(request.id)}
                      disabled={actionLoading === `cancel-${request.id}`}
                    >
                      Cancel Request
                    </Button>
                  </CardActions>
              </Card>
            ))}
          </List>
        </TabPanel>

          <TabPanel value={tabValue} index={3}>
        {/* Suggestions Tab */}
          <Grid container spacing={3}>
              {suggestions.map((suggestion) => (
                <Grid item xs={12} sm={6} md={4} key={suggestion.user.id}>
                <Card>
                  <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <Avatar sx={{ mr: 2, bgcolor: 'success.main' }}>
                          {suggestion.user.name.charAt(0).toUpperCase()}
                      </Avatar>
                      <Box>
                          <Typography variant="h6" component="div">
                            {suggestion.user.name}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {suggestion.user.email}
                        </Typography>
                        </Box>
                      </Box>
                      <Chip
                        label={suggestion.user.role}
                        color={getRoleColor(suggestion.user.role)}
                        size="small"
                        sx={{ mb: 2 }}
                      />
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        Match Score: {suggestion.matchScore}%
                      </Typography>
                      {suggestion.reasons.length > 0 && (
                        <Box sx={{ mb: 2 }}>
                          <Typography variant="body2" color="text.secondary" gutterBottom>
                            Why we think you'd connect:
                      </Typography>
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                            {suggestion.reasons.slice(0, 2).map((reason, index) => (
                              <Chip
                                key={index}
                                label={reason}
                                size="small"
                                variant="outlined"
                                color="info"
                              />
                            ))}
                          </Box>
                        </Box>
                    )}
                  </CardContent>
                  <CardActions>
                    <Button
                        size="small"
                        color="primary"
                      startIcon={<PersonAddIcon />}
                        onClick={() => sendRequest(suggestion.user.id)}
                        disabled={actionLoading === `send-${suggestion.user.id}`}
                    >
                      Connect
                    </Button>
                      <Button
                        size="small"
                        startIcon={<MessageIcon />}
                        onClick={() => {
                          setSelectedUser(suggestion.user);
                          setMessageDialog(true);
                        }}
                      >
                        Message
                      </Button>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
        </TabPanel>
        </Paper>

        {/* Message Dialog */}
        <Dialog open={messageDialog} onClose={() => setMessageDialog(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Send Message</DialogTitle>
          <DialogContent>
            <DialogContentText sx={{ mb: 2 }}>
              Send a message to {selectedUser?.name}
            </DialogContentText>
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
            <Button onClick={sendMessage} variant="contained" disabled={!messageContent.trim() || messageLoading}>
              {messageLoading ? 'Sending...' : 'Send'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Block/Remove Dialog */}
        <Dialog open={blockDialogOpen} onClose={() => setBlockDialogOpen(false)}>
          <DialogTitle>Remove Connection</DialogTitle>
          <DialogContent>
            <DialogContentText>
              Are you sure you want to remove this connection? This action cannot be undone.
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setBlockDialogOpen(false)}>Cancel</Button>
            <Button
              onClick={() => {
                if (connectionToBlock) {
                  handleRemoveConnection(connectionToBlock);
                  setBlockDialogOpen(false);
                  setConnectionToBlock(null);
                }
              }}
              color="error"
              variant="contained"
            >
              Remove
            </Button>
          </DialogActions>
        </Dialog>
    </Container>
    </ErrorBoundary>
  );
};

export default Connections; 