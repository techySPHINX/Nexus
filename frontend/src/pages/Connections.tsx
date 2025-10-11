import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Tabs,
  Tab,
  CircularProgress,
  Alert,
  Paper,
  Chip,
  Grid,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TablePagination,
} from '@mui/material';
import {
  People as PeopleIcon,
  Schedule as TimeIcon,
  Send as MessageIcon,
  Star as StarIcon,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

// Import modular components
import ConnectionsGridView from '../components/Connections/ConnectionsGridView';
import ConnectionTableRow from '../components/Connections/ConnectionTableRow';
import StatsCards from '../components/Connections/StatsCards';
import SearchAndFilters from '../components/Connections/SearchAndFilters';
import ViewControls from '../components/Connections/ViewControls';

// Import hooks and types
import useConnections from '../hooks/useConnections';
import type {
  Connection,
  PendingRequest,
  ConnectionSuggestion,
} from '../types/connections';

const EnhancedConnections: React.FC = () => {
  const navigate = useNavigate();
  const [tabValue, setTabValue] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showSearchAndFilters, setShowSearchAndFilters] = useState(true);

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

  // Event handlers
  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
    setPage(0);
  };

  const handleRoleFilterChange = (role: string) => {
    setRoleFilter(role);
    setPage(0);
  };

  const handleStatusFilterChange = (status: string) => {
    setStatusFilter(status);
    setPage(0);
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

  const handleRefresh = () => {
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
  };

  const getRoleColor = (
    role: string
  ): 'primary' | 'secondary' | 'error' | 'default' => {
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

  // Data management functions
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
        return ['User', 'Role', 'Reason', 'Match Score', 'Actions'];
      default:
        return [];
    }
  };

  // Loading state
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

  // Error state
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
  const paginatedData = currentData.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

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
          {stats && <StatsCards stats={stats} />}
        </Box>
      </motion.div>

      {/* Enhanced Search and Filter Section */}
      <SearchAndFilters
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        statusFilter={statusFilter}
        onStatusFilterChange={handleStatusFilterChange}
        roleFilter={roleFilter}
        onRoleFilterChange={handleRoleFilterChange}
        showSearchAndFilters={showSearchAndFilters}
        onToggleSearchAndFilters={() =>
          setShowSearchAndFilters(!showSearchAndFilters)
        }
      />

      {/* View Controls */}
      <ViewControls
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        onRefresh={handleRefresh}
        loading={connectionsLoading}
      />

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
          {/* Grid View */}
          {viewMode === 'grid' ? (
            <motion.div
              key="grid"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3 }}
            >
              <Grid container spacing={3}>
                <ConnectionsGridView
                  paginatedData={paginatedData}
                  tabValue={tabValue}
                  onSendMessage={handleSendMessage}
                  onRemoveConnection={handleRemoveConnection}
                  onAcceptRequest={handleAcceptRequest}
                  onRejectRequest={handleRejectRequest}
                  onConnect={handleConnect}
                />
              </Grid>
            </motion.div>
          ) : (
            /* List View */
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
                        paginatedData.map((item) => (
                          <ConnectionTableRow
                            key={
                              tabValue === 0
                                ? (item as Connection).id
                                : tabValue === 1 || tabValue === 2
                                  ? (item as PendingRequest).id
                                  : (item as ConnectionSuggestion).user.id
                            }
                            item={item}
                            tabValue={tabValue}
                            getRoleColor={getRoleColor}
                            onSendMessage={handleSendMessage}
                            onRemoveConnection={handleRemoveConnection}
                            onAcceptRequest={handleAcceptRequest}
                            onRejectRequest={handleRejectRequest}
                            onConnect={handleConnect}
                          />
                        ))
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
                    {Math.min(page * rowsPerPage + 1, currentData.length)} -{' '}
                    {Math.min((page + 1) * rowsPerPage, currentData.length)} of{' '}
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

export default EnhancedConnections;
