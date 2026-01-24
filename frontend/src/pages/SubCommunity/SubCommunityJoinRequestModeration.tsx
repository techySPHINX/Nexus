import { FC, useState, useEffect } from 'react';
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
  Alert,
  Container,
  Grid,
  TextField,
  Divider,
  IconButton,
  Tooltip,
  Snackbar,
} from '@mui/material';
import {
  CheckCircle,
  Cancel,
  Person,
  CalendarToday,
  Visibility,
  ArrowBack,
} from '@mui/icons-material';
import { useParams, Link } from 'react-router-dom';
import { format } from 'date-fns'; // Import date-fns
import { useSubCommunity } from '../../contexts/SubCommunityContext';
import { useAuth } from '../../contexts/AuthContext';
import { getErrorMessage } from '@/utils/errorHandler';
import { JoinRequest, RequestStatus } from '../../types/subCommunity';
import { ProfileNameLink } from '@/utils/ProfileNameLink';

// Move getStatusChip function outside the component
const getStatusChip = (status: string | RequestStatus) => {
  // normalize backend/status variants (some endpoints return 'ACCEPTED' instead of 'APPROVED')
  const normalized = (status || '').toString().toUpperCase();
  const key = normalized === 'ACCEPTED' ? 'APPROVED' : normalized;

  const statusConfig: Record<string, { color: string; label: string }> = {
    PENDING: { color: 'warning', label: 'Pending' },
    APPROVED: { color: 'success', label: 'Approved' },
    REJECTED: { color: 'error', label: 'Rejected' },
  };

  const config = statusConfig[key] || {
    color: 'default',
    label: String(status),
  };

  return (
    <Chip
      label={config.label}
      color={
        (config.color as
          | 'default'
          | 'primary'
          | 'secondary'
          | 'error'
          | 'info'
          | 'success'
          | 'warning') || 'default'
      }
      size="small"
      variant="outlined"
    />
  );
};

export const SubCommunityJoinRequestModeration: FC = () => {
  const { id: subCommunityId } = useParams<{ id: string }>();
  //   const navigate = useNavigate();
  const { user } = useAuth();
  const {
    joinRequests,
    getPendingJoinRequests,
    approveJoinRequest,
    loading,
    error,
    clearError,
    currentSubCommunity,
    getSubCommunity,
  } = useSubCommunity();

  const [selectedRequest, setSelectedRequest] = useState<JoinRequest | null>(
    null
  );
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error',
  });

  useEffect(() => {
    if (subCommunityId) {
      getPendingJoinRequests(subCommunityId);
      getSubCommunity(subCommunityId);
    }
  }, [subCommunityId, getPendingJoinRequests, getSubCommunity]);

  const showSnackbar = (message: string, severity: 'success' | 'error') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
    clearError();
  };

  const handleViewDetails = (request: JoinRequest) => {
    setSelectedRequest(request);
    setDetailDialogOpen(true);
  };

  const handleApprove = async (requestId: string) => {
    if (!subCommunityId) return;

    setActionLoading(requestId);
    try {
      await approveJoinRequest(subCommunityId, requestId, { approved: true });
      showSnackbar('Join request approved successfully!', 'success');
      // Refresh the list
      getPendingJoinRequests(subCommunityId);
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      showSnackbar(errorMessage, 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (requestId: string) => {
    if (!subCommunityId) return;

    setActionLoading(requestId);
    try {
      await approveJoinRequest(subCommunityId, requestId, {
        approved: false,
        reason: rejectionReason || 'Request rejected by moderator',
      });
      showSnackbar('Join request rejected successfully!', 'success');
      setRejectionReason('');
      setDetailDialogOpen(false);
      // Refresh the list
      getPendingJoinRequests(subCommunityId);
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      showSnackbar(errorMessage, 'error');
    } finally {
      setActionLoading(null);
    }
  };

  // Use date-fns for formatting
  const formatDate = (date: Date) => {
    return format(new Date(date), 'MMM dd, yyyy h:mm a');
  };

  if (!subCommunityId) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Alert severity="error">Invalid community ID</Alert>
      </Container>
    );
  }

  if (user?.role !== 'ADMIN' && currentSubCommunity?.ownerId !== user?.id) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Alert severity="error">
          You don&apos;t have permission to moderate join requests for this
          community.
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Button
          component={Link}
          to={`/subcommunities/${subCommunityId}`}
          startIcon={<ArrowBack />}
          sx={{ mb: 2 }}
          variant="outlined"
        >
          Back to Community
        </Button>

        <Typography
          variant="h4"
          component="h1"
          gutterBottom
          sx={{ fontWeight: 700 }}
        >
          Join Requests Moderation
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 1 }}>
          {currentSubCommunity?.name || 'Community'} - Pending Join Requests
        </Typography>
        <Chip
          label={`${joinRequests.length} pending requests`}
          color="primary"
          variant="outlined"
        />
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={clearError}>
          {error}
        </Alert>
      )}

      {loading && joinRequests.length === 0 ? (
        <div className="flex justify-center py-8">
          <div className="bg-white rounded-xl border border-emerald-100 p-6 shadow-sm w-full max-w-2xl">
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className="flex items-center gap-4 p-3 rounded-lg border border-gray-200 animate-pulse"
                >
                  <div className="w-12 h-12 bg-emerald-100 rounded-full" />
                  <div className="flex-1">
                    <div className="h-4 bg-emerald-100 rounded w-1/3 mb-2" />
                    <div className="h-3 bg-emerald-100 rounded w-1/2" />
                  </div>
                  <div className="w-20 h-4 bg-emerald-100 rounded" />
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : joinRequests.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <CheckCircle sx={{ fontSize: 48, color: 'success.main', mb: 2 }} />
          <Typography variant="h6" color="text.secondary">
            No pending join requests
          </Typography>
          <Typography variant="body2" color="text.secondary">
            All join requests have been processed.
          </Typography>
        </Box>
      ) : (
        <Grid container spacing={3}>
          {joinRequests.map((request) => (
            <Grid item xs={12} md={6} key={request.id}>
              <JoinRequestCard
                request={request}
                onViewDetails={handleViewDetails}
                onApprove={handleApprove}
                onReject={() => {
                  setSelectedRequest(request);
                  setDetailDialogOpen(true);
                }}
                loading={actionLoading === request.id}
                formatDate={formatDate}
              />
            </Grid>
          ))}
        </Grid>
      )}

      {/* Request Detail Dialog */}
      <RequestDetailDialog
        open={detailDialogOpen}
        request={selectedRequest}
        onClose={() => {
          setDetailDialogOpen(false);
          setRejectionReason('');
        }}
        onApprove={handleApprove}
        onReject={handleReject}
        loading={actionLoading}
        rejectionReason={rejectionReason}
        onRejectionReasonChange={setRejectionReason}
        formatDate={formatDate}
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

// Join Request Card Component
const JoinRequestCard: FC<{
  request: JoinRequest;
  onViewDetails: (request: JoinRequest) => void;
  onApprove: (requestId: string) => void;
  onReject: () => void;
  loading?: boolean;
  formatDate: (date: Date) => string;
}> = ({
  request,
  onViewDetails,
  onApprove,
  onReject,
  loading = false,
  formatDate,
}) => {
  return (
    <Card sx={{ '&:hover': { boxShadow: 3 }, height: '100%' }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, mb: 2 }}>
          <Avatar
            sx={{ width: 48, height: 48 }}
            src={request.user.profile?.avatarUrl || ''}
          >
            {request.user.profile?.avatarUrl ||
              request.user.name.charAt(0).toUpperCase()}
          </Avatar>
          <Box sx={{ flex: 1 }}>
            <ProfileNameLink
              user={{
                id: request.user.id,
                name: request.user.name,
                role: request.user.role,
              }}
              variant="h6"
            />
            <Typography variant="body2" color="text.secondary">
              {request.user.email}
            </Typography>
          </Box>
          {getStatusChip(request.status)}
        </Box>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <CalendarToday sx={{ fontSize: 16, color: 'text.secondary' }} />
            <Typography variant="body2" color="text.secondary">
              Requested {formatDate(request.createdAt)}
            </Typography>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <Tooltip title="View user details">
            <IconButton
              size="small"
              onClick={() => onViewDetails(request)}
              sx={{ border: 1, borderColor: 'divider' }}
            >
              <Visibility />
            </IconButton>
          </Tooltip>

          <Button
            variant="contained"
            size="small"
            startIcon={<CheckCircle />}
            onClick={() => onApprove(request.id)}
            disabled={loading}
            color="success"
            sx={{ flex: 1 }}
          >
            Approve
          </Button>

          <Button
            variant="outlined"
            size="small"
            startIcon={<Cancel />}
            onClick={onReject}
            disabled={loading}
            color="error"
            sx={{ flex: 1 }}
          >
            Reject
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
};

// Request Detail Dialog Component
const RequestDetailDialog: FC<{
  open: boolean;
  request: JoinRequest | null;
  onClose: () => void;
  onApprove: (requestId: string) => void;
  onReject: (requestId: string) => void;
  loading: string | null;
  rejectionReason: string;
  onRejectionReasonChange: (reason: string) => void;
  formatDate: (date: Date) => string;
}> = ({
  open,
  request,
  onClose,
  onApprove,
  onReject,
  loading,
  rejectionReason,
  onRejectionReasonChange,
  formatDate,
}) => {
  if (!request) return null;

  const isLoading = loading === request.id;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Join Request Details</DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, py: 1 }}>
          {/* User Information */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar sx={{ width: 64, height: 64 }}>
              {request.user.name.charAt(0).toUpperCase()}
            </Avatar>
            <Box>
              <Typography variant="h6">{request.user.name}</Typography>
              <Typography variant="body2" color="text.secondary">
                {request.user.email}
              </Typography>
            </Box>
          </Box>

          <Divider />

          {/* Request Details */}
          <Box>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              REQUEST DETAILS
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CalendarToday sx={{ fontSize: 16, color: 'text.secondary' }} />
                <Typography variant="body2">
                  Requested: {formatDate(request.createdAt)}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Person sx={{ fontSize: 16, color: 'text.secondary' }} />
                <Typography variant="body2">
                  Status: {getStatusChip(request.status)}
                </Typography>
              </Box>
            </Box>
          </Box>

          <Divider />

          {/* Rejection Reason (only show when rejecting) */}
          <Box>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              REJECTION REASON (OPTIONAL)
            </Typography>
            <TextField
              fullWidth
              multiline
              rows={3}
              placeholder="Enter reason for rejection..."
              value={rejectionReason}
              onChange={(e) => onRejectionReasonChange(e.target.value)}
              disabled={isLoading}
            />
          </Box>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={isLoading}>
          Cancel
        </Button>
        <Button
          variant="outlined"
          onClick={() => onReject(request.id)}
          disabled={isLoading}
          color="error"
          startIcon={<Cancel />}
        >
          {isLoading ? 'Processing...' : 'Reject'}
        </Button>
        <Button
          variant="contained"
          onClick={() => onApprove(request.id)}
          disabled={isLoading}
          color="success"
          startIcon={<CheckCircle />}
        >
          {isLoading ? 'Processing...' : 'Approve'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default SubCommunityJoinRequestModeration;
