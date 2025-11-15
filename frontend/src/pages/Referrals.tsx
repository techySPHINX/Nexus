import React, { useState, useEffect, useRef, useMemo } from 'react';
import { io, Socket } from 'socket.io-client';
import {
  Container,
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Button,
  Chip,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Alert,
  CircularProgress,
  Stack,
  CardActions,
  DialogContentText,
} from '@mui/material';
import {
  Add,
  Work,
  LocationOn,
  Description,
  Person,
  School,
  Edit,
  Delete,
  Visibility,
  Send,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { motion } from 'framer-motion';
import { apiService } from '../services/api';

interface Referral {
  id: string;
  company: string;
  jobTitle: string;
  description: string;
  requirements: string;
  location: string;
  deadline: string;
  referralLink?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  postedBy: {
    id: string;
    name: string;
    email: string;
  };
  alumniId: string;
  createdAt: string;
  updatedAt: string;
  applications: ReferralApplication[];
}

interface ReferralApplication {
  id: string;
  referralId: string;
  applicantId: string;
  resumeUrl: string;
  coverLetter?: string;
  status: 'PENDING' | 'REVIEWED' | 'ACCEPTED' | 'REJECTED';
  createdAt: string;
  updatedAt: string;
  applicant: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
}

interface CreateReferralDto {
  company: string;
  jobTitle: string;
  description: string;
  requirements: string;
  location: string;
  deadline: string; // ISO string
  referralLink?: string;
}

interface CreateApplicationDto {
  referralId: string;
  resumeLink?: string;
  coverLetter?: string;
}

const Referrals: React.FC = () => {
  // Extract a human-friendly message from unknown errors
  const getErrorMessage = (err: unknown): string => {
    if (typeof err === 'string') return err;
    if (err && typeof err === 'object') {
      const e = err as {
        response?: { data?: { message?: string }; statusText?: string };
        message?: string;
      };
      return (
        e.response?.data?.message ||
        e.message ||
        e.response?.statusText ||
        'Unknown error'
      );
    }
    try {
      return String(err);
    } catch {
      return 'Unknown error';
    }
  };
  const { user } = useAuth();
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [applications, setApplications] = useState<ReferralApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [applyDialogOpen, setApplyDialogOpen] = useState(false);
  const [selectedReferral, setSelectedReferral] = useState<Referral | null>(
    null
  );
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [appsDialogOpen, setAppsDialogOpen] = useState(false);
  const [referralApps, setReferralApps] = useState<ReferralApplication[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const didInit = useRef(false);
  const socketRef = useRef<Socket | null>(null);
  const [analytics, setAnalytics] = useState<{
    totals: { referrals: number; applications: number };
    referralsByStatus: Record<string, number>;
    applicationsByStatus: Record<string, number>;
  } | null>(null);

  // Form states
  const [createForm, setCreateForm] = useState<CreateReferralDto>({
    company: '',
    jobTitle: '',
    description: '',
    requirements: '',
    location: '',
    deadline: '',
    referralLink: '',
  });

  const [applicationForm, setApplicationForm] = useState<CreateApplicationDto>({
    referralId: '',
    resumeLink: '',
    coverLetter: '',
  });

  const fetchReferrals = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('🔄 Fetching referrals...');
      console.log('🔑 Auth token:', localStorage.getItem('token'));
      console.log('👤 Current user in fetch:', user);

      const response = await apiService.referrals.getAll();
      console.log('📊 Referrals response:', response);

      setReferrals(response.data || []);
      console.log(
        '✅ Referrals loaded successfully:',
        response.data?.length || 0
      );
    } catch (err: unknown) {
      console.error('❌ Error fetching referrals:', err);
      setError(`Failed to load referrals: ${getErrorMessage(err)}`);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const openReferralApplications = async (referralId: string) => {
    try {
      const res = await apiService.referrals.getApplications(referralId);
      setReferralApps(res.data || []);
      setAppsDialogOpen(true);
    } catch {
      console.error('Failed to load applications');
      setError('Failed to load applications');
    }
  };

  const updateApplicationStatus = async (
    applicationId: string,
    status: 'REVIEWED' | 'ACCEPTED' | 'REJECTED'
  ) => {
    try {
      await apiService.referrals.updateApplicationStatus(applicationId, status);
      // refresh local list
      setReferralApps((prev) =>
        prev.map((a) => (a.id === applicationId ? { ...a, status } : a))
      );
    } catch {
      console.error('Failed to update application status');
      setError('Failed to update application status');
    }
  };

  // Fetch referrals and applications
  useEffect(() => {
    console.log('👤 Current user:', user);
    console.log('🔑 User role:', user?.role);
    console.log('🆔 User ID:', user?.id);

    if (!user) {
      console.log('❌ No user found, cannot fetch referrals');
      setError('User not authenticated');
      return;
    }

    if (!user.role) {
      console.log('❌ User has no role, cannot fetch referrals');
      setError('User role not found');
      return;
    }

    if (didInit.current) {
      return; // prevent double run in React StrictMode dev
    }
    didInit.current = true;

    console.log('✅ User authenticated, fetching referrals...');
    fetchReferrals();

<<<<<<< HEAD
    // If admin, load analytics
    if (user.role === 'ADMIN') {
      apiService.referrals
        .getAnalytics()
        .then((res) => setAnalytics(res.data))
        .catch(() => setAnalytics(null));
    }

    // Establish Socket.IO connection for real-time updates
    try {
      const base = 'http://localhost:3000';
      const socket = io(base, {
        transports: ['websocket'],
        withCredentials: true,
      });
      socketRef.current = socket;
      socket.on('referral.created', () => fetchReferrals());
      socket.on('referral.updated', () => fetchReferrals());
      socket.on('referral.deleted', () => fetchReferrals());
      socket.on('application.created', () => {
        if (user.role === 'STUDENT' || user.role === 'ALUM')
          fetchApplications();
      });
      socket.on('application.updated', () => {
        if (user.role === 'STUDENT' || user.role === 'ALUM')
          fetchApplications();
      });
    } catch {
      // ignore socket errors
    }

    if (user.role === 'STUDENT' || user.role === 'ALUM') {
      console.log('🎓 Applicant-capable user, fetching applications...');
      fetchApplications();
    }
    return () => {
      socketRef.current?.disconnect();
    };
  }, [fetchReferrals, user]);

  const fetchApplications = async () => {
    try {
      const response = await apiService.referrals.getMyApplications();
      setApplications(response.data || []);
    } catch (err) {
      console.error('Error fetching applications:', err);
    }
  };

  const handleCreateReferral = async () => {
    try {
      if (!createForm.deadline) {
        setError('Please provide an application deadline.');
        return;
      }

      // Validate referralLink (optional). Only include if valid absolute URL
      let safeReferralLink: string | undefined = undefined;
      if (
        createForm.referralLink &&
        createForm.referralLink.trim().length > 0
      ) {
        try {
          const url = new URL(createForm.referralLink.trim());
          if (url.protocol === 'http:' || url.protocol === 'https:') {
            safeReferralLink = url.toString();
          }
        } catch {
          // ignore invalid link; do not include in payload
        }
      }

      const body = {
        ...createForm,
        deadline: createForm.deadline
          ? new Date(createForm.deadline).toISOString()
          : undefined,
        referralLink: safeReferralLink,
      };

      await apiService.referrals.create(body);
      setError(null);
      setSuccessMessage(
        'Referral created successfully! It will be reviewed by an admin.'
      );
      setCreateDialogOpen(false);
      setCreateForm({
        company: '',
        jobTitle: '',
        description: '',
        requirements: '',
        location: '',
        deadline: '',
        referralLink: '',
      });
      fetchReferrals();
      // Clear success message after 5 seconds
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (err: unknown) {
      console.error('Error creating referral:', err);
      setError(getErrorMessage(err) || 'Failed to create referral');
      setSuccessMessage(null);
    }
  };

  const handleApply = async () => {
    try {
      if (!applicationForm.resumeLink || !applicationForm.resumeLink.trim()) {
        setError('Please provide a resume link (Google Drive or URL).');
        return;
      }

      // Validate and normalize URL format
      let resumeUrl = applicationForm.resumeLink.trim();

      // Check if it's a valid URL format
      try {
        new URL(resumeUrl);
      } catch {
        // If URL parsing fails, check if it might be a Google Drive ID or partial URL
        if (
          resumeUrl.includes('drive.google.com') ||
          resumeUrl.includes('docs.google.com')
        ) {
          // Try to fix common Google Drive URL issues
          if (
            !resumeUrl.startsWith('http://') &&
            !resumeUrl.startsWith('https://')
          ) {
            resumeUrl = 'https://' + resumeUrl;
          }
          // Validate again after adding protocol
          try {
            new URL(resumeUrl);
          } catch {
            setError(
              'Please provide a valid URL (must start with http:// or https://)'
            );
            return;
          }
        } else {
          setError(
            'Please provide a valid URL (must start with http:// or https://)'
          );
          return;
        }
      }

      await apiService.referrals.apply({
        referralId: applicationForm.referralId,
        resumeUrl: resumeUrl,
        coverLetter: applicationForm.coverLetter?.trim() || undefined,
      });

      // Success - show message and reset
      setError(null);
      setSuccessMessage('Application submitted successfully!');
      setApplyDialogOpen(false);
      setApplicationForm({
        referralId: '',
        resumeLink: '',
        coverLetter: '',
      });
      fetchApplications();
      fetchReferrals(); // Refresh to show updated application count
      // Clear success message after 5 seconds
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (err: unknown) {
      console.error('Error applying:', err);
      setError(getErrorMessage(err) || 'Failed to submit application');
      setSuccessMessage(null);
    }
  };

  const handleDeleteReferral = async (referralId: string) => {
    if (window.confirm('Are you sure you want to delete this referral?')) {
      try {
        await apiService.referrals.delete(referralId);
        setError(null);
        setSuccessMessage('Referral deleted successfully.');
        fetchReferrals();
        setTimeout(() => setSuccessMessage(null), 5000);
      } catch (err: unknown) {
        console.error('Error deleting referral:', err);
        setError(getErrorMessage(err) || 'Failed to delete referral');
        setSuccessMessage(null);
      }
    }
  };

  const getStatusColor = (
    status: string
  ):
    | 'default'
    | 'primary'
    | 'secondary'
    | 'error'
    | 'info'
    | 'success'
    | 'warning' => {
    switch (status) {
      case 'APPROVED':
      case 'ACCEPTED':
        return 'success';
      case 'REJECTED':
        return 'error';
      case 'PENDING':
        return 'warning';
      case 'REVIEWED':
        return 'info';
      default:
        return 'default';
    }
  };

  const handleApproveReferral = async (referralId: string) => {
    try {
      await apiService.referrals.approve(referralId);
      setError(null);
      setSuccessMessage('Referral approved successfully!');
      // Refresh referrals list
      await fetchReferrals();
      // Clear success message after 5 seconds
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (err: unknown) {
      console.error('Error approving referral:', err);
      setError(getErrorMessage(err) || 'Failed to approve referral');
      setSuccessMessage(null);
    }
  };

  const handleRejectReferral = async (referralId: string) => {
    if (window.confirm('Are you sure you want to reject this referral?')) {
      try {
        await apiService.referrals.reject(referralId);
        setError(null);
        setSuccessMessage('Referral rejected successfully.');
        // Refresh referrals list
        await fetchReferrals();
        // Clear success message after 5 seconds
        setTimeout(() => setSuccessMessage(null), 5000);
      } catch (err: unknown) {
        console.error('Error rejecting referral:', err);
        setError(getErrorMessage(err) || 'Failed to reject referral');
        setSuccessMessage(null);
      }
    }
  };

  const filteredReferrals = useMemo(
    () =>
      referrals.filter((referral) => {
        // Students and Alumni can only see APPROVED referrals (or their own if they created it)
        if (
          (user?.role === 'STUDENT' || user?.role === 'ALUM') &&
          referral.status !== 'APPROVED' &&
          referral.alumniId !== user?.id
        ) {
          return false;
        }

        const matchesStatus =
          filterStatus === 'ALL' || referral.status === filterStatus;
        const matchesSearch =
          referral.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
          referral.jobTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
          referral.location.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesStatus && matchesSearch;
      }),
    [referrals, user?.role, user?.id, filterStatus, searchQuery]
  );

  if (loading) {
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

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      {/* Admin Analytics */}
      {user?.role === 'ADMIN' && analytics && (
        <Box
          sx={{
            mb: 3,
            p: 2,
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 2,
          }}
        >
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={2}
            justifyContent="space-between"
          >
            <Stack direction="row" spacing={2}>
              <Chip
                label={`Total Referrals: ${analytics.totals.referrals}`}
                color="primary"
              />
              <Chip
                label={`Total Applications: ${analytics.totals.applications}`}
                color="secondary"
              />
            </Stack>
            <Stack direction="row" spacing={1}>
              <Chip
                label={`Approved: ${analytics.referralsByStatus.APPROVED || 0}`}
              />
              <Chip
                label={`Pending: ${analytics.referralsByStatus.PENDING || 0}`}
              />
              <Chip
                label={`Rejected: ${analytics.referralsByStatus.REJECTED || 0}`}
              />
            </Stack>
          </Stack>
        </Box>
      )}
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography
          variant="h4"
          component="h1"
          sx={{ fontWeight: 700, mb: 0.5 }}
        >
          Job Referrals
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Discover curated roles from KIIT alumni and apply directly
        </Typography>
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Success Alert */}
      {successMessage && (
        <Alert
          severity="success"
          sx={{ mb: 3 }}
          onClose={() => setSuccessMessage(null)}
        >
          {successMessage}
        </Alert>
      )}

      {/* Actions Bar */}
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        spacing={2}
        alignItems={{ xs: 'stretch', md: 'center' }}
        justifyContent="space-between"
        sx={{ mb: 3 }}
      >
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={2}
          sx={{ width: '100%' }}
        >
          <TextField
            fullWidth
            placeholder="Search referrals... (company, title, location)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            size="small"
            sx={{ maxWidth: { xs: '100%', sm: 420 } }}
          />
          <FormControl size="small" sx={{ minWidth: { xs: '100%', sm: 180 } }}>
            <InputLabel>Status</InputLabel>
            <Select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              label="Status"
            >
              <MenuItem value="ALL">All Status</MenuItem>
              {user?.role === 'ADMIN' && (
                <MenuItem value="PENDING">Pending</MenuItem>
              )}
              <MenuItem value="APPROVED">Approved</MenuItem>
              {user?.role === 'ADMIN' && (
                <MenuItem value="REJECTED">Rejected</MenuItem>
              )}
            </Select>
          </FormControl>
          <Button
            variant="outlined"
            size="small"
            onClick={() => {
              console.log('🧪 Testing API call...');
              fetchReferrals();
            }}
            disabled={loading}
            sx={{ textTransform: 'none', width: { xs: '100%', sm: 'auto' } }}
          >
            Refresh
          </Button>
        </Stack>

        {user?.role === 'ALUM' && (
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => setCreateDialogOpen(true)}
            sx={{ borderRadius: 2, width: { xs: '100%', md: 'auto' } }}
          >
            Post Referral
          </Button>
        )}
      </Stack>

      {/* Referrals Grid */}
      <Grid container spacing={3}>
        {filteredReferrals.map((referral) => (
          <Grid item xs={12} md={6} lg={4} key={referral.id}>
            <motion.div whileHover={{ y: -5 }} transition={{ duration: 0.2 }}>
              <Card
                sx={{
                  height: '100%',
                  borderRadius: 3,
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                <CardContent sx={{ flexGrow: 1 }}>
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      mb: 2,
                    }}
                  >
                    <Box>
                      <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                        {referral.jobTitle}
                      </Typography>
                      <Typography
                        variant="subtitle1"
                        color="primary"
                        sx={{ fontWeight: 500 }}
                      >
                        {referral.company}
                      </Typography>
                    </Box>
                    <Chip
                      label={referral.status}
                      color={getStatusColor(referral.status)}
                      size="small"
                    />
                  </Box>

                  <Stack spacing={1} sx={{ mb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <LocationOn
                        sx={{ fontSize: 16, color: 'text.secondary' }}
                      />
                      <Typography variant="body2" color="text.secondary">
                        {referral.location}
                      </Typography>
                    </Box>
                    {referral.deadline && (
                      <Box
                        sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
                      >
                        <Description
                          sx={{ fontSize: 16, color: 'text.secondary' }}
                        />
                        <Typography variant="body2" color="text.secondary">
                          Deadline:{' '}
                          {new Date(referral.deadline).toLocaleString()}
                        </Typography>
                      </Box>
                    )}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Person sx={{ fontSize: 16, color: 'text.secondary' }} />
                      <Typography variant="body2" color="text.secondary">
                        Posted by {referral.postedBy.name}
                      </Typography>
                    </Box>
                  </Stack>

                  <Typography
                    variant="body2"
                    sx={{ mb: 2, color: 'text.secondary' }}
                  >
                    {referral.description.length > 100
                      ? `${referral.description.substring(0, 100)}...`
                      : referral.description}
                  </Typography>

                  <CardActions sx={{ pt: 1, justifyContent: 'space-between' }}>
                    <Typography variant="caption" color="text.secondary">
                      {new Date(referral.createdAt).toLocaleDateString()}
                    </Typography>
                    <Stack direction="row" spacing={1}>
                      {referral.referralLink && (
                        <Button
                          size="small"
                          variant="text"
                          onClick={() =>
                            window.open(referral.referralLink, '_blank')
                          }
                        >
                          Job Link
                        </Button>
                      )}
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() => {
                          setSelectedReferral(referral);
                          setDetailsDialogOpen(true);
                        }}
                        sx={{ textTransform: 'none' }}
                      >
                        Details
                      </Button>
                      {(user?.role === 'STUDENT' || user?.role === 'ALUM') &&
                        referral.status === 'APPROVED' && (
                          <Button
                            size="small"
                            variant="contained"
                            startIcon={<Send />}
                            disabled={applications.some(
                              (app) =>
                                app.referralId === referral.id &&
                                app.applicantId === user?.id
                            )}
                            onClick={() => {
                              setSelectedReferral(referral);
                              setApplicationForm({
                                ...applicationForm,
                                referralId: referral.id,
                              });
                              setApplyDialogOpen(true);
                            }}
                            sx={{ borderRadius: 2, textTransform: 'none' }}
                          >
                            {applications.some(
                              (app) =>
                                app.referralId === referral.id &&
                                app.applicantId === user?.id
                            )
                              ? 'Already Applied'
                              : 'Apply'}
                          </Button>
                        )}
                      {user?.role === 'ADMIN' &&
                        referral.status === 'PENDING' && (
                          <>
                            <Button
                              size="small"
                              variant="contained"
                              color="success"
                              onClick={() => handleApproveReferral(referral.id)}
                            >
                              Approve
                            </Button>
                            <Button
                              size="small"
                              variant="outlined"
                              color="error"
                              onClick={() => handleRejectReferral(referral.id)}
                            >
                              Reject
                            </Button>
                          </>
                        )}
                      {user?.id === referral.alumniId && (
                        <>
                          <Button
                            size="small"
                            variant="outlined"
                            onClick={() =>
                              openReferralApplications(referral.id)
                            }
                          >
                            Applications ({referral.applications?.length ?? 0})
                          </Button>
                          <IconButton size="small" color="primary">
                            <Edit />
                          </IconButton>
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleDeleteReferral(referral.id)}
                          >
                            <Delete />
                          </IconButton>
                        </>
                      )}
                    </Stack>
                  </CardActions>
                </CardContent>
              </Card>
            </motion.div>
          </Grid>
        ))}
      </Grid>

      {filteredReferrals.length === 0 && !loading && (
        <Box sx={{ textAlign: 'center', py: 6 }}>
          <Work sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
            {user?.role === 'ALUM'
              ? 'No referrals posted yet'
              : 'No referrals available'}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            {user?.role === 'ALUM'
              ? 'Be the first to post a job referral and help students find opportunities!'
              : searchQuery || filterStatus !== 'ALL'
                ? 'Try adjusting your search or filters'
                : 'Check back later for new job opportunities'}
          </Typography>
          {user?.role === 'ALUM' && (
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => setCreateDialogOpen(true)}
              sx={{ borderRadius: 2, textTransform: 'none' }}
            >
              Post First Referral
            </Button>
          )}
        </Box>
      )}

      {/* Create Referral Dialog */}
      <Dialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Post New Job Referral</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Company"
                value={createForm.company}
                onChange={(e) =>
                  setCreateForm({ ...createForm, company: e.target.value })
                }
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Job Title"
                value={createForm.jobTitle}
                onChange={(e) =>
                  setCreateForm({ ...createForm, jobTitle: e.target.value })
                }
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Location"
                value={createForm.location}
                onChange={(e) =>
                  setCreateForm({ ...createForm, location: e.target.value })
                }
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                value={createForm.description}
                onChange={(e) =>
                  setCreateForm({ ...createForm, description: e.target.value })
                }
                multiline
                rows={3}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Application Deadline"
                type="datetime-local"
                value={createForm.deadline}
                onChange={(e) =>
                  setCreateForm({ ...createForm, deadline: e.target.value })
                }
                InputLabelProps={{ shrink: true }}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Referral Link (optional)"
                value={createForm.referralLink}
                onChange={(e) =>
                  setCreateForm({ ...createForm, referralLink: e.target.value })
                }
                placeholder="https://company.com/job/123"
                helperText="Leave blank if none. Must be a valid http(s) URL if provided."
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Requirements"
                value={createForm.requirements}
                onChange={(e) =>
                  setCreateForm({ ...createForm, requirements: e.target.value })
                }
                multiline
                rows={3}
                required
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleCreateReferral} variant="contained">
            Post Referral
          </Button>
        </DialogActions>
      </Dialog>

      {/* Apply Dialog */}
      <Dialog
        open={applyDialogOpen}
        onClose={() => setApplyDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Apply for Position</DialogTitle>
        <DialogContent>
          {selectedReferral && (
            <Box sx={{ mb: 3, p: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                {selectedReferral.jobTitle} at {selectedReferral.company}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {selectedReferral.location}
              </Typography>
            </Box>
          )}

          <Grid container spacing={2}>
            {/* Resume link only (no upload) */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Resume Link (Google Drive or URL)"
                value={applicationForm.resumeLink}
                onChange={(e) =>
                  setApplicationForm({
                    ...applicationForm,
                    resumeLink: e.target.value,
                  })
                }
                placeholder="https://drive.google.com/... or any accessible URL"
                helperText="Paste your resume link (Google Drive share link or any public URL)"
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Cover Letter (Optional)"
                value={applicationForm.coverLetter}
                onChange={(e) =>
                  setApplicationForm({
                    ...applicationForm,
                    coverLetter: e.target.value,
                  })
                }
                multiline
                rows={4}
                placeholder="Write a brief cover letter explaining why you're interested in this position..."
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setApplyDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleApply} variant="contained">
            Submit Application
          </Button>
        </DialogActions>
      </Dialog>

      {/* Details Dialog */}
      <Dialog
        open={detailsDialogOpen}
        onClose={() => setDetailsDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Job Details</DialogTitle>
        <DialogContent dividers>
          {selectedReferral && (
            <Stack spacing={2}>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  {selectedReferral.jobTitle}
                </Typography>
                <Typography variant="subtitle1" color="primary">
                  {selectedReferral.company}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  <LocationOn
                    sx={{ fontSize: 16, mr: 0.5, verticalAlign: 'middle' }}
                  />
                  {selectedReferral.location}
                </Typography>
                {selectedReferral.deadline && (
                  <Typography variant="body2" color="text.secondary">
                    Deadline:{' '}
                    {new Date(selectedReferral.deadline).toLocaleString()}
                  </Typography>
                )}
                {selectedReferral.referralLink && (
                  <Button
                    size="small"
                    sx={{ mt: 1 }}
                    onClick={() =>
                      window.open(selectedReferral.referralLink!, '_blank')
                    }
                  >
                    Open Job Link
                  </Button>
                )}
              </Box>
              <Box>
                <Typography
                  variant="subtitle2"
                  sx={{ fontWeight: 600, mb: 0.5 }}
                >
                  Description
                </Typography>
                <DialogContentText sx={{ whiteSpace: 'pre-wrap' }}>
                  {selectedReferral.description}
                </DialogContentText>
              </Box>
              <Box>
                <Typography
                  variant="subtitle2"
                  sx={{ fontWeight: 600, mb: 0.5 }}
                >
                  Requirements
                </Typography>
                <DialogContentText sx={{ whiteSpace: 'pre-wrap' }}>
                  {selectedReferral.requirements}
                </DialogContentText>
              </Box>
              <Typography variant="caption" color="text.secondary">
                Posted on{' '}
                {new Date(selectedReferral.createdAt).toLocaleDateString()}
              </Typography>
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailsDialogOpen(false)}>Close</Button>
          {(user?.role === 'STUDENT' || user?.role === 'ALUM') &&
            selectedReferral &&
            selectedReferral.status === 'APPROVED' && (
              <Button
                variant="contained"
                disabled={applications.some(
                  (app) =>
                    app.referralId === selectedReferral.id &&
                    app.applicantId === user?.id
                )}
                onClick={() => {
                  setApplicationForm({
                    ...applicationForm,
                    referralId: selectedReferral.id,
                  });
                  setDetailsDialogOpen(false);
                  setApplyDialogOpen(true);
                }}
              >
                {applications.some(
                  (app) =>
                    app.referralId === selectedReferral.id &&
                    app.applicantId === user?.id
                )
                  ? 'Already Applied'
                  : 'Apply'}
              </Button>
            )}
        </DialogActions>
      </Dialog>

      {/* Applications Dialog for Alumni */}
      <Dialog
        open={appsDialogOpen}
        onClose={() => setAppsDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Applications</DialogTitle>
        <DialogContent dividers>
          {referralApps.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              No applications yet.
            </Typography>
          ) : (
            <Stack spacing={2}>
              {referralApps.map((app) => (
                <Card key={app.id} variant="outlined">
                  <CardContent>
                    <Stack
                      direction="row"
                      justifyContent="space-between"
                      alignItems="center"
                    >
                      <Box>
                        <Typography
                          variant="subtitle1"
                          sx={{ fontWeight: 600 }}
                        >
                          {app.applicant?.name} ({app.applicant?.role})
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Applied {new Date(app.createdAt).toLocaleString()}
                        </Typography>
                      </Box>
                      <Chip
                        label={app.status}
                        color={getStatusColor(app.status)}
                        size="small"
                      />
                    </Stack>
                    <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={<Visibility />}
                        onClick={() => window.open(app.resumeUrl, '_blank')}
                      >
                        View Resume
                      </Button>
                      {app.coverLetter && (
                        <Button
                          size="small"
                          variant="outlined"
                          startIcon={<Description />}
                          onClick={() => alert(app.coverLetter)}
                        >
                          View Cover Letter
                        </Button>
                      )}
                      <Button
                        size="small"
                        onClick={() =>
                          updateApplicationStatus(app.id, 'REVIEWED')
                        }
                      >
                        Mark Reviewed
                      </Button>
                      <Button
                        size="small"
                        color="success"
                        onClick={() =>
                          updateApplicationStatus(app.id, 'ACCEPTED')
                        }
                      >
                        Accept
                      </Button>
                      <Button
                        size="small"
                        color="error"
                        onClick={() =>
                          updateApplicationStatus(app.id, 'REJECTED')
                        }
                      >
                        Reject
                      </Button>
                    </Stack>
                  </CardContent>
                </Card>
              ))}
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAppsDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* My Applications Section (for students and alumni) */}
      {(user?.role === 'STUDENT' || user?.role === 'ALUM') &&
        applications.length > 0 && (
          <Box sx={{ mt: 6 }}>
            <Typography variant="h5" sx={{ fontWeight: 600, mb: 3 }}>
              My Applications
            </Typography>
            <Grid container spacing={2}>
              {applications.map((application) => (
                <Grid item xs={12} md={6} key={application.id}>
                  <Card sx={{ borderRadius: 3 }}>
                    <CardContent>
                      <Box
                        sx={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'flex-start',
                          mb: 2,
                        }}
                      >
                        <Box>
                          <Typography variant="h6" sx={{ fontWeight: 600 }}>
                            Application #{application.id.slice(-8)}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Submitted{' '}
                            {new Date(
                              application.createdAt
                            ).toLocaleDateString()}
                          </Typography>
                        </Box>
                        <Chip
                          label={application.status}
                          color={
                            getStatusColor(application.status) as
                              | 'default'
                              | 'primary'
                              | 'secondary'
                              | 'error'
                              | 'info'
                              | 'success'
                              | 'warning'
                          }
                          size="small"
                        />
                      </Box>

                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1,
                          mb: 1,
                        }}
                      >
                        <School
                          sx={{ fontSize: 16, color: 'text.secondary' }}
                        />
                        <Typography variant="body2">
                          {application.applicant.name} (
                          {application.applicant.role})
                        </Typography>
                      </Box>

                      <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                        <Button
                          size="small"
                          variant="outlined"
                          startIcon={<Visibility />}
                          onClick={() =>
                            window.open(application.resumeUrl, '_blank')
                          }
                        >
                          View Resume
                        </Button>
                        {application.coverLetter && (
                          <Button
                            size="small"
                            variant="outlined"
                            startIcon={<Description />}
                          >
                            View Cover Letter
                          </Button>
                        )}
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Box>
        )}
    </Container>
  );
};

export default Referrals;
