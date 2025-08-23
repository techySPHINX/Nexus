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
  Stack,
  Divider,
} from '@mui/material';
import {
  Search as SearchIcon,
  TrendingUp as TrendingUpIcon,
  People as PeopleIcon,
  School as SchoolIcon,
  Work as WorkIcon,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { apiService, handleApiError } from '../services/api';
import { ErrorBoundary } from 'react-error-boundary';
import useConnections from '../hooks/useConnections';
import { StatsCard } from '@/components/Connections/StatsCard';
import { LoadingIndicator } from '@/components/Connections/LoadingIndicator';
import { TabPanel } from '@/components/Connections/TabPanel';
import { ErrorFallback } from '@/components/Connections/ErrorFallback';
import ConnectionTab from '@/components/Connections/ConnectionTab';
import PendingReceivedTab from '@/components/Connections/PendingReceivedTab';
import PendingSentTab from '@/components/Connections/PendingSentTab';
import SuggestionTab from '@/components/Connections/SuggestionTab';

// interface Connection {
//   id: string;
//   status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'BLOCKED';
//   createdAt: string;
//   user: {
//     id: string;
//     name: string;
//     email: string;
//     role: 'STUDENT' | 'ALUM' | 'ADMIN';
//     profile?: {
//       bio?: string;
//       location?: string;
//       interests?: string;
//       avatarUrl?: string;
//       skills: string[];
//     };
//   };
// }

// interface PendingRequest {
//   id: string;
//   createdAt: string;
//   requester?: {
//     id: string;
//     name: string;
//     email: string;
//     role: 'STUDENT' | 'ALUM' | 'ADMIN';
//     profile?: {
//       bio?: string;
//       location?: string;
//       interests?: string;
//       avatarUrl?: string;
//       skills: string[];
//     };
//   };
//   recipient?: {
//     id: string;
//     name: string;
//     email: string;
//     role: 'STUDENT' | 'ALUM' | 'ADMIN';
//     profile?: {
//       bio?: string;
//       location?: string;
//       interests?: string;
//       avatarUrl?: string;
//       skills: string[];
//     };
//   };
// }

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

// interface ConnectionResponse {
//   connections?: Connection[];
//   requests?: PendingRequest[];
//   suggestions?: ConnectionSuggestion[];
//   pagination?: {
//     page: number;
//     limit: number;
//     total: number;
//     totalPages: number;
//     hasNext: boolean;
//     hasPrev: boolean;
//   };
// }

// interface ConnectionStats {
//   total: number;
//   pendingReceived: number;
//   pendingSent: number;
//   byRole: {
//     students: number;
//     alumni: number;
//   };
//   recent30Days: number;
//}

// interface TabPanelProps {
//   children?: React.ReactNode;
//   index: number;
//   value: number;
// }

const Connections: React.FC = () => {
  const { token } = useAuth();
  const [tabValue, setTabValue] = useState(0);
  const [blockDialogOpen, setBlockDialogOpen] = useState(false);
  const [connectionToBlock, setConnectionToBlock] = useState<string | null>(
    null
  );
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<
    ConnectionSuggestion['user'] | null
  >(null);
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
    setError,
  } = useConnections();

  useEffect(() => {
    if (token) {
      fetchAll(hookFilters);
    }
  }, [token, filters.page, filters.limit, filters.role, searchTerm, fetchAll]);

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
    } catch (error: unknown) {
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
    } catch (error: unknown) {
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
    } catch (error: unknown) {
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

  // const handlePageChange = (newPage: number) => {
  //   setFilters((prev) => ({ ...prev, page: newPage }));
  // };

  // const handleLimitChange = (newLimit: number) => {
  //   setFilters((prev) => ({ ...prev, limit: newLimit, page: 1 }));
  // };

  const handleRoleFilter = (role: '' | 'STUDENT' | 'ALUM' | 'ADMIN') => {
    setFilters((prev) => ({ ...prev, role, page: 1 }));
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

  if (
    loading &&
    connections.length === 0 &&
    pendingReceived.length === 0 &&
    pendingSent.length === 0
  ) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box
          display="flex"
          justifyContent="center"
          alignItems="center"
          minHeight="400px"
        >
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  return (
    <ErrorBoundary
      FallbackComponent={ErrorFallback}
      onReset={() => setError(null)}
    >
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
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
                sx={{ fontWeight: 700 }}
                gutterBottom
              >
                Connections
              </Typography>
              <Typography variant="subtitle1" color="text.secondary">
                Manage and grow your network
              </Typography>
            </Box>

            {/* Stats Cards */}
            {stats && (
              <Stack direction="row" spacing={1} alignItems="center">
                <StatsCard
                  icon={<PeopleIcon color="info" />}
                  value={stats.total}
                  label="Total"
                />
                <StatsCard
                  icon={<TrendingUpIcon color="warning" />}
                  value={stats.pendingReceived}
                  label="Pending"
                />
                <StatsCard
                  icon={<SchoolIcon color="primary" />}
                  value={stats.byRole.students}
                  label="Students"
                />
                <StatsCard
                  icon={<WorkIcon color="secondary" />}
                  value={stats.byRole.alumni}
                  label="Alumni"
                />
              </Stack>
            )}
          </Box>

          <Divider sx={{ mb: 3 }} />

          {/* Search + Filters */}
          <Box component="form" onSubmit={handleSearch} sx={{ mb: 3 }}>
            <Paper
              sx={{
                display: 'flex',
                gap: 2,
                alignItems: 'center',
                p: 1.25,
                borderRadius: 3,
              }}
              elevation={1}
            >
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
                    onChange={(e) =>
                      handleRoleFilter(
                        e.target.value as '' | 'STUDENT' | 'ALUM' | 'ADMIN'
                      )
                    }
                  >
                    <MenuItem value="">All</MenuItem>
                    <MenuItem value="STUDENT">Student</MenuItem>
                    <MenuItem value="ALUM">Alum</MenuItem>
                    <MenuItem value="ADMIN">Admin</MenuItem>
                  </Select>
                </FormControl>
              )}

              <Button
                type="submit"
                variant="contained"
                sx={{ whiteSpace: 'nowrap' }}
              >
                Search
              </Button>
            </Paper>
          </Box>

          <Paper sx={{ mb: 4 }}>
            {/* Tabs */}
            <Box sx={{ mb: 2 }}>
              <Tabs
                value={tabValue}
                onChange={(_, newValue) => setTabValue(newValue)}
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

            {/* Alerts */}
            {error && (
              <Alert
                severity="error"
                sx={{ mb: 2 }}
                onClose={() => setError(null)}
              >
                {error}
              </Alert>
            )}
            {success && (
              <Alert
                severity="success"
                sx={{ mb: 2 }}
                onClose={() => setSuccess(null)}
              >
                {success}
              </Alert>
            )}

            {/* Tab Panels */}
            <TabPanel value={tabValue} index={0}>
              {/* Connections Tab */}
              {loading && <LoadingIndicator />}
              <ConnectionTab
                connections={connections}
                setSelectedUser={setSelectedUser}
                setMessageDialog={setMessageDialog}
                setConnectionToBlock={setConnectionToBlock}
                setBlockDialogOpen={setBlockDialogOpen}
                getRoleColor={getRoleColor}
              />
            </TabPanel>

            <TabPanel value={tabValue} index={1}>
              {/* Pending Received Tab */}
              {loading && <LoadingIndicator />}
              <PendingReceivedTab
                pendingReceived={pendingReceived}
                respondToRequest={respondToRequest}
                getRoleColor={getRoleColor}
                actionLoading={actionLoading}
              />
            </TabPanel>

            <TabPanel value={tabValue} index={2}>
              {/* Pending Sent Tab */}
              {loading && <LoadingIndicator />}
              <PendingSentTab
                pendingSent={pendingSent}
                handleCancelConnection={handleCancelConnection}
                getRoleColor={getRoleColor}
                actionLoading={actionLoading}
              />
            </TabPanel>

            <TabPanel value={tabValue} index={3}>
              {/* Suggestions Tab */}
              {loading && <LoadingIndicator />}
              <SuggestionTab
                suggestions={suggestions}
                sendRequest={sendRequest}
                setSelectedUser={setSelectedUser}
                setMessageDialog={setMessageDialog}
                getRoleColor={getRoleColor}
                actionLoading={actionLoading}
              />
            </TabPanel>
          </Paper>

          {/* Message Dialog */}
          <Dialog
            open={messageDialog}
            onClose={() => setMessageDialog(false)}
            maxWidth="sm"
            fullWidth
          >
            <DialogTitle>Send Message</DialogTitle>
            <DialogContent>
              <DialogContentText sx={{ mb: 2 }}>
                Send a message to {selectedUser?.name}
              </DialogContentText>
              <TextField
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
                onClick={sendMessage}
                variant="contained"
                disabled={!messageContent.trim() || messageLoading}
              >
                {messageLoading ? 'Sending...' : 'Send'}
              </Button>
            </DialogActions>
          </Dialog>

          {/* Block/Remove Dialog */}
          <Dialog
            open={blockDialogOpen}
            onClose={() => setBlockDialogOpen(false)}
          >
            <DialogTitle>Remove Connection</DialogTitle>
            <DialogContent>
              <DialogContentText>
                Are you sure you want to remove this connection? This action
                cannot be undone.
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
        </motion.div>
      </Container>
    </ErrorBoundary>
  );
};

export default Connections;
