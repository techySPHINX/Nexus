import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Chip,
  Avatar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Alert,
  Container,
  Tabs,
  Tab,
  Snackbar,
} from '@mui/material';
import { CheckCircle, Cancel, Visibility, Article } from '@mui/icons-material';
import { useSubCommunity } from '../../contexts/SubCommunityContext';
import { useAuth } from '../../contexts/AuthContext';
import {
  SubCommunityCreationRequest,
  RequestStatus,
} from '../../types/subCommunity';
import { getErrorMessage } from '@/utils/errorHandler';

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
      id={`requests-tabpanel-${index}`}
      aria-labelledby={`requests-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

// Move getStatusChip function outside to make it reusable
const getStatusChip = (status: RequestStatus) => {
  const statusConfig = {
    [RequestStatus.PENDING]: { color: 'warning', label: 'Pending' },
    [RequestStatus.APPROVED]: { color: 'success', label: 'Approved' },
    [RequestStatus.REJECTED]: { color: 'error', label: 'Rejected' },
  };

  const config = statusConfig[status];
  return (
    <Chip
      label={config.label}
      color={
        config.color as
          | 'default'
          | 'primary'
          | 'secondary'
          | 'error'
          | 'info'
          | 'success'
          | 'warning'
      }
      size="small"
      variant="outlined"
    />
  );
};

export const AdminSubCommunityModerationPage: React.FC = () => {
  const { user } = useAuth();
  const {
    creationRequests,
    getAllSubCommunityRequests,
    approveSubCommunityRequest,
    rejectSubCommunityRequest,
    loading,
    error,
    clearError,
  } = useSubCommunity();

  const [selectedTab, setSelectedTab] = useState(0);
  const [selectedRequest, setSelectedRequest] =
    useState<SubCommunityCreationRequest | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error',
  });

  // Load requests only when component mounts and tab changes
  useEffect(() => {
    if (user?.role === 'ADMIN') {
      getAllSubCommunityRequests();
    }
  }, [getAllSubCommunityRequests, user?.role]);

  const showSnackbar = (message: string, severity: 'success' | 'error') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
    clearError();
  };

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setSelectedTab(newValue);
  };

  const handleViewDetails = (request: SubCommunityCreationRequest) => {
    setSelectedRequest(request);
    setDetailDialogOpen(true);
  };

  const handleApprove = async (requestId: string) => {
    setActionLoading(requestId);
    try {
      await approveSubCommunityRequest(requestId);
      showSnackbar('Request approved successfully!', 'success');
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      showSnackbar(errorMessage, 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (requestId: string) => {
    setActionLoading(requestId);
    try {
      await rejectSubCommunityRequest(requestId);
      showSnackbar('Request rejected successfully!', 'success');
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      showSnackbar(errorMessage, 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const filteredRequests = creationRequests.filter((request) => {
    switch (selectedTab) {
      case 0:
        return request.status === RequestStatus.PENDING;
      case 1:
        return request.status === RequestStatus.APPROVED;
      case 2:
        return request.status === RequestStatus.REJECTED;
      default:
        return true;
    }
  });

  if (user?.role !== 'ADMIN') {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Alert severity="error" sx={{ textAlign: 'center' }}>
          You don&apos;t have permission to access this page.
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography
          variant="h4"
          component="h1"
          gutterBottom
          sx={{ fontWeight: 700 }}
        >
          Community Moderation
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Review and manage community creation requests
        </Typography>
      </Box>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={selectedTab} onChange={handleTabChange}>
          <Tab label="Pending" />
          <Tab label="Approved" />
          <Tab label="Rejected" />
        </Tabs>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={clearError}>
          {error}
        </Alert>
      )}

      {loading && creationRequests.length === 0 ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress size={60} />
        </Box>
      ) : (
        <>
          <TabPanel value={selectedTab} index={0}>
            <PendingRequestsTab
              requests={filteredRequests}
              onViewDetails={handleViewDetails}
              onApprove={handleApprove}
              onReject={handleReject}
              loading={actionLoading}
            />
          </TabPanel>

          <TabPanel value={selectedTab} index={1}>
            <ApprovedRequestsTab
              requests={filteredRequests}
              onViewDetails={handleViewDetails}
            />
          </TabPanel>

          <TabPanel value={selectedTab} index={2}>
            <RejectedRequestsTab
              requests={filteredRequests}
              onViewDetails={handleViewDetails}
            />
          </TabPanel>
        </>
      )}

      {/* Request Detail Dialog */}
      <RequestDetailDialog
        open={detailDialogOpen}
        request={selectedRequest}
        onClose={() => setDetailDialogOpen(false)}
        onApprove={handleApprove}
        onReject={handleReject}
        loading={actionLoading !== null} // Convert to boolean
      />

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

// Tab Components for better code splitting
const PendingRequestsTab: React.FC<{
  requests: SubCommunityCreationRequest[];
  onViewDetails: (request: SubCommunityCreationRequest) => void;
  onApprove: (requestId: string) => void;
  onReject: (requestId: string) => void;
  loading: string | null;
}> = ({ requests, onViewDetails, onApprove, onReject, loading }) => {
  if (requests.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 8 }}>
        <Article sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
        <Typography variant="h6" color="text.secondary">
          No pending requests
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {requests.map((request) => (
        <RequestCard
          key={request.id}
          request={request}
          onViewDetails={onViewDetails}
          onApprove={onApprove}
          onReject={onReject}
          loading={loading === request.id}
          showActions={true}
        />
      ))}
    </Box>
  );
};

const ApprovedRequestsTab: React.FC<{
  requests: SubCommunityCreationRequest[];
  onViewDetails: (request: SubCommunityCreationRequest) => void;
}> = ({ requests, onViewDetails }) => {
  if (requests.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 8 }}>
        <CheckCircle sx={{ fontSize: 48, color: 'success.main', mb: 2 }} />
        <Typography variant="h6" color="text.secondary">
          No approved requests
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {requests.map((request) => (
        <RequestCard
          key={request.id}
          request={request}
          onViewDetails={onViewDetails}
          showActions={false}
        />
      ))}
    </Box>
  );
};

const RejectedRequestsTab: React.FC<{
  requests: SubCommunityCreationRequest[];
  onViewDetails: (request: SubCommunityCreationRequest) => void;
}> = ({ requests, onViewDetails }) => {
  if (requests.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 8 }}>
        <Cancel sx={{ fontSize: 48, color: 'error.main', mb: 2 }} />
        <Typography variant="h6" color="text.secondary">
          No rejected requests
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {requests.map((request) => (
        <RequestCard
          key={request.id}
          request={request}
          onViewDetails={onViewDetails}
          showActions={false}
        />
      ))}
    </Box>
  );
};

// Request Card Component
const RequestCard: React.FC<{
  request: SubCommunityCreationRequest;
  onViewDetails: (request: SubCommunityCreationRequest) => void;
  onApprove?: (requestId: string) => void;
  onReject?: (requestId: string) => void;
  loading?: boolean;
  showActions: boolean;
}> = ({
  request,
  onViewDetails,
  onApprove,
  onReject,
  loading = false,
  showActions,
}) => {
  return (
    <Card sx={{ '&:hover': { boxShadow: 3 } }}>
      <CardContent>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            gap: 2,
          }}
        >
          <Box sx={{ flex: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
              <Avatar sx={{ width: 48, height: 48 }}>
                {request.name.charAt(0).toUpperCase()}
              </Avatar>
              <Box>
                <Typography variant="h6" component="h3">
                  {request.name}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Requested by {request.requester?.email}
                </Typography>
              </Box>
            </Box>

            <Typography variant="body2" sx={{ mb: 2 }}>
              {request.description}
            </Typography>

            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
              <Chip label={request.type} size="small" variant="outlined" />
              <Chip
                label={new Date(request.createdAt).toLocaleDateString('en-IN')}
                size="small"
                variant="outlined"
              />
              {getStatusChip(request.status)}
            </Box>
          </Box>

          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              gap: 1,
              minWidth: '120px',
            }}
          >
            <Button
              variant="outlined"
              size="small"
              startIcon={<Visibility />}
              onClick={() => onViewDetails(request)}
            >
              View
            </Button>

            {showActions && onApprove && onReject && (
              <>
                <Button
                  variant="contained"
                  size="small"
                  startIcon={<CheckCircle />}
                  onClick={() => onApprove(request.id)}
                  disabled={loading}
                  color="success"
                >
                  {loading ? '...' : 'Approve'}
                </Button>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<Cancel />}
                  onClick={() => onReject(request.id)}
                  disabled={loading}
                  color="error"
                >
                  {loading ? '...' : 'Reject'}
                </Button>
              </>
            )}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

// Request Detail Dialog Component
const RequestDetailDialog: React.FC<{
  open: boolean;
  request: SubCommunityCreationRequest | null;
  onClose: () => void;
  onApprove?: (requestId: string) => void;
  onReject?: (requestId: string) => void;
  loading?: boolean;
}> = ({ open, request, onClose, onApprove, onReject, loading = false }) => {
  if (!request) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Community Request Details</DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, py: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar sx={{ width: 64, height: 64 }}>
              {request.name.charAt(0).toUpperCase()}
            </Avatar>
            <Box>
              <Typography variant="h5">{request.name}</Typography>
              <Typography variant="body2" color="text.secondary">
                Type: {request.type} • Requested by {request.requester.email}
              </Typography>
            </Box>
          </Box>

          <Box>
            <Typography variant="h6" gutterBottom>
              Description
            </Typography>
            <Typography variant="body2">{request.description}</Typography>
          </Box>

          <Box>
            <Typography variant="h6" gutterBottom>
              Rules & Guidelines
            </Typography>
            <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
              {request.rules}
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            {getStatusChip(request.status)}
            <Chip
              label={`Created: ${new Date(request.createdAt).toLocaleDateString('en-IN')}`}
            />
          </Box>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
        {request.status === RequestStatus.PENDING && onApprove && onReject && (
          <>
            <Button
              variant="contained"
              onClick={() => onApprove(request.id)}
              disabled={loading}
              color="success"
              startIcon={<CheckCircle />}
            >
              {loading ? 'Processing...' : 'Approve'}
            </Button>
            <Button
              variant="outlined"
              onClick={() => onReject(request.id)}
              disabled={loading}
              color="error"
              startIcon={<Cancel />}
            >
              {loading ? 'Processing...' : 'Reject'}
            </Button>
          </>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default AdminSubCommunityModerationPage;
