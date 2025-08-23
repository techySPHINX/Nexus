import React, { useState, useEffect } from 'react';
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
  studentId: string;
  resumeUrl: string;
  coverLetter?: string;
  status: 'PENDING' | 'REVIEWED' | 'ACCEPTED' | 'REJECTED';
  createdAt: string;
  updatedAt: string;
  student: {
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
}

interface CreateApplicationDto {
  referralId: string;
  resumeUrl: string;
  coverLetter?: string;
}

const Referrals: React.FC = () => {
  const { user } = useAuth();
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [applications, setApplications] = useState<ReferralApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [applyDialogOpen, setApplyDialogOpen] = useState(false);
  const [selectedReferral, setSelectedReferral] = useState<Referral | null>(
    null
  );
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Form states
  const [createForm, setCreateForm] = useState<CreateReferralDto>({
    company: '',
    jobTitle: '',
    description: '',
    requirements: '',
    location: '',
  });

  const [applicationForm, setApplicationForm] = useState<CreateApplicationDto>({
    referralId: '',
    resumeUrl: '',
    coverLetter: '',
  });

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

    console.log('✅ User authenticated, fetching referrals...');
    fetchReferrals();

    if (user.role === 'STUDENT') {
      console.log('🎓 Student user, fetching applications...');
      fetchApplications();
    }
  }, [user]);

  const fetchReferrals = async () => {
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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      console.error('❌ Error fetching referrals:', err);
      if (err.response) {
        console.error('Response data:', err.response.data);
        console.error('Response status:', err.response.status);
        console.error('Response headers:', err.response.headers);
        setError(
          `Failed to load referrals: ${err.response.data?.message || err.response.statusText || 'Unknown error'}`
        );
      } else if (err.request) {
        console.error('Request error:', err.request);
        setError(
          'Failed to load referrals: Network error - no response received'
        );
      } else {
        console.error('Error message:', err.message);
        setError(`Failed to load referrals: ${err.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

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
      await apiService.referrals.create(createForm);
      setCreateDialogOpen(false);
      setCreateForm({
        company: '',
        jobTitle: '',
        description: '',
        requirements: '',
        location: '',
      });
      fetchReferrals();
    } catch (err) {
      console.error('Error creating referral:', err);
      setError('Failed to create referral');
    }
  };

  const handleApply = async () => {
    try {
      await apiService.referrals.apply(applicationForm);
      setApplyDialogOpen(false);
      setApplicationForm({
        referralId: '',
        resumeUrl: '',
        coverLetter: '',
      });
      fetchApplications();
    } catch (err) {
      console.error('Error applying:', err);
      setError('Failed to submit application');
    }
  };

  const handleDeleteReferral = async (referralId: string) => {
    if (window.confirm('Are you sure you want to delete this referral?')) {
      try {
        await apiService.referrals.delete(referralId);
        fetchReferrals();
      } catch (err) {
        console.error('Error deleting referral:', err);
        setError('Failed to delete referral');
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
      case 'REVIEWED':
        return 'warning';
      default:
        return 'default';
    }
  };

  const filteredReferrals = referrals.filter((referral) => {
    const matchesStatus =
      filterStatus === 'ALL' || referral.status === filterStatus;
    const matchesSearch =
      referral.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
      referral.jobTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      referral.location.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

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
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 700, mb: 1 }}>
          Job Referrals
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          Discover job opportunities and apply for positions
        </Typography>
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Actions Bar */}
      <Box
        sx={{
          mb: 3,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <TextField
            placeholder="Search referrals..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            size="small"
            sx={{ minWidth: 300 }}
          />
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Status</InputLabel>
            <Select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              label="Status"
            >
              <MenuItem value="ALL">All Status</MenuItem>
              <MenuItem value="PENDING">Pending</MenuItem>
              <MenuItem value="APPROVED">Approved</MenuItem>
              <MenuItem value="REJECTED">Rejected</MenuItem>
            </Select>
          </FormControl>
          <Button
            variant="outlined"
            size="small"
            onClick={() => {
              console.log('🧪 Testing API call...');
              fetchReferrals();
            }}
            sx={{ textTransform: 'none' }}
          >
            Test API
          </Button>
        </Box>

        {user?.role === 'ALUM' && (
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => setCreateDialogOpen(true)}
            sx={{ borderRadius: 2 }}
          >
            Post Referral
          </Button>
        )}
      </Box>

      {/* Referrals Grid */}
      <Grid container spacing={3}>
        {filteredReferrals.map((referral) => (
          <Grid item xs={12} md={6} lg={4} key={referral.id}>
            <motion.div whileHover={{ y: -5 }} transition={{ duration: 0.2 }}>
              <Card sx={{ height: '100%', borderRadius: 3 }}>
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

                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <Typography variant="caption" color="text.secondary">
                      {new Date(referral.createdAt).toLocaleDateString()}
                    </Typography>

                    <Box sx={{ display: 'flex', gap: 1 }}>
                      {user?.role === 'STUDENT' && (
                        <Button
                          size="small"
                          variant="contained"
                          startIcon={<Send />}
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
                          Apply
                        </Button>
                      )}

                      {user?.id === referral.alumniId && (
                        <>
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
                    </Box>
                  </Box>
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
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Resume URL"
                value={applicationForm.resumeUrl}
                onChange={(e) =>
                  setApplicationForm({
                    ...applicationForm,
                    resumeUrl: e.target.value,
                  })
                }
                placeholder="https://example.com/resume.pdf"
                required
                helperText="Provide a link to your resume"
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

      {/* My Applications Section (for students) */}
      {user?.role === 'STUDENT' && applications.length > 0 && (
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
                          {new Date(application.createdAt).toLocaleDateString()}
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
                      <School sx={{ fontSize: 16, color: 'text.secondary' }} />
                      <Typography variant="body2">
                        {application.student.name} ({application.student.role})
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
