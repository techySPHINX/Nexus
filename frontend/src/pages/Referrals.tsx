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
  Avatar,
  Badge,
  Tooltip,
  Paper,
  InputAdornment,
  ToggleButton,
  ToggleButtonGroup,
  CardActions,
  Fab,
} from '@mui/material';
import {
  Add,
  LocationOn,
  Description,
  Person,
  School,
  Edit,
  Delete,
  Visibility,
  Send,
  Search as SearchIcon,
  Schedule as TimeIcon,
  ViewModule as GridViewIcon,
  ViewList as ListViewIcon,
  BusinessCenter as WorkIcon,
  People as PeopleIcon,
  Assessment as StatsIcon,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
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
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<'date' | 'company' | 'title'>('date');

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
  }, [user]);

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
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Modern Hero Section */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <Box
          sx={{
            background: 'linear-gradient(135deg, #4caf50 0%, #8bc34a 100%)',
            borderRadius: 4,
            p: 4,
            mb: 4,
            color: 'white',
            position: 'relative',
            overflow: 'hidden',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              right: 0,
              width: '200px',
              height: '200px',
              background: 'rgba(255,255,255,0.1)',
              borderRadius: '50%',
              transform: 'translate(50%, -50%)',
            },
          }}
        >
          <Grid container alignItems="center" spacing={3}>
            <Grid item xs={12} md={8}>
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                <Typography variant="h3" sx={{ fontWeight: 700, mb: 1 }}>
                  Job Referrals
                </Typography>
                <Typography variant="h6" sx={{ opacity: 0.9, mb: 2 }}>
                  Connect with opportunities through our alumni network
                </Typography>
                <Typography variant="body1" sx={{ opacity: 0.8 }}>
                  Discover exclusive job openings and get referred by
                  experienced alumni
                </Typography>
              </motion.div>
            </Grid>
            <Grid item xs={12} md={4}>
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                style={{ textAlign: 'center' }}
              >
                <WorkIcon sx={{ fontSize: 80, opacity: 0.3 }} />
              </motion.div>
            </Grid>
          </Grid>
        </Box>
      </motion.div>

      {/* Enhanced Stats Cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.4 }}
      >
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <motion.div whileHover={{ y: -4 }} transition={{ duration: 0.2 }}>
              <Card
                sx={{
                  background:
                    'linear-gradient(135deg, #e8f5e8 0%, #f1f8e9 100%)',
                  border: '1px solid',
                  borderColor: 'success.light',
                  borderRadius: 3,
                }}
              >
                <CardContent sx={{ textAlign: 'center', py: 3 }}>
                  <WorkIcon
                    sx={{ fontSize: 40, color: 'success.main', mb: 1 }}
                  />
                  <Typography
                    variant="h4"
                    sx={{ fontWeight: 700, color: 'success.dark' }}
                  >
                    {referrals.length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Referrals
                  </Typography>
                </CardContent>
              </Card>
            </motion.div>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <motion.div whileHover={{ y: -4 }} transition={{ duration: 0.2 }}>
              <Card
                sx={{
                  background:
                    'linear-gradient(135deg, #e3f2fd 0%, #f0f8ff 100%)',
                  border: '1px solid',
                  borderColor: 'info.light',
                  borderRadius: 3,
                }}
              >
                <CardContent sx={{ textAlign: 'center', py: 3 }}>
                  <StatsIcon sx={{ fontSize: 40, color: 'info.main', mb: 1 }} />
                  <Typography
                    variant="h4"
                    sx={{ fontWeight: 700, color: 'info.dark' }}
                  >
                    {referrals.filter((r) => r.status === 'APPROVED').length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Approved
                  </Typography>
                </CardContent>
              </Card>
            </motion.div>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <motion.div whileHover={{ y: -4 }} transition={{ duration: 0.2 }}>
              <Card
                sx={{
                  background:
                    'linear-gradient(135deg, #fff3e0 0%, #fdf4e3 100%)',
                  border: '1px solid',
                  borderColor: 'warning.light',
                  borderRadius: 3,
                }}
              >
                <CardContent sx={{ textAlign: 'center', py: 3 }}>
                  <TimeIcon
                    sx={{ fontSize: 40, color: 'warning.main', mb: 1 }}
                  />
                  <Typography
                    variant="h4"
                    sx={{ fontWeight: 700, color: 'warning.dark' }}
                  >
                    {referrals.filter((r) => r.status === 'PENDING').length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Pending
                  </Typography>
                </CardContent>
              </Card>
            </motion.div>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <motion.div whileHover={{ y: -4 }} transition={{ duration: 0.2 }}>
              <Card
                sx={{
                  background:
                    'linear-gradient(135deg, #f3e5f5 0%, #fce4ec 100%)',
                  border: '1px solid',
                  borderColor: 'secondary.light',
                  borderRadius: 3,
                }}
              >
                <CardContent sx={{ textAlign: 'center', py: 3 }}>
                  <PeopleIcon
                    sx={{ fontSize: 40, color: 'secondary.main', mb: 1 }}
                  />
                  <Typography
                    variant="h4"
                    sx={{ fontWeight: 700, color: 'secondary.dark' }}
                  >
                    {applications.length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    My Applications
                  </Typography>
                </CardContent>
              </Card>
            </motion.div>
          </Grid>
        </Grid>
      </motion.div>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Enhanced Search and Filter Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.6 }}
      >
        <Paper
          elevation={0}
          sx={{
            p: 3,
            mb: 4,
            borderRadius: 3,
            border: '1px solid',
            borderColor: 'divider',
            background: 'rgba(255,255,255,0.8)',
            backdropFilter: 'blur(10px)',
          }}
        >
          <Grid container spacing={3} alignItems="center">
            {/* Search */}
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                placeholder="Search by company, title, or location..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                size="medium"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon color="action" />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 3,
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'primary.main',
                    },
                  },
                }}
              />
            </Grid>

            {/* Status Filter */}
            <Grid item xs={12} sm={6} md={2}>
              <FormControl fullWidth size="medium">
                <InputLabel>Status</InputLabel>
                <Select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  label="Status"
                  sx={{
                    borderRadius: 3,
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'primary.main',
                    },
                  }}
                >
                  <MenuItem value="ALL">All Status</MenuItem>
                  <MenuItem value="PENDING">Pending</MenuItem>
                  <MenuItem value="APPROVED">Approved</MenuItem>
                  <MenuItem value="REJECTED">Rejected</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {/* Sort Filter */}
            <Grid item xs={12} sm={6} md={2}>
              <FormControl fullWidth size="medium">
                <InputLabel>Sort By</InputLabel>
                <Select
                  value={sortBy}
                  onChange={(e) =>
                    setSortBy(e.target.value as 'date' | 'company' | 'title')
                  }
                  label="Sort By"
                  sx={{
                    borderRadius: 3,
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'primary.main',
                    },
                  }}
                >
                  <MenuItem value="date">Latest First</MenuItem>
                  <MenuItem value="company">Company</MenuItem>
                  <MenuItem value="title">Job Title</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {/* View Mode Toggle */}
            <Grid item xs={12} sm={6} md={2}>
              <ToggleButtonGroup
                value={viewMode}
                exclusive
                onChange={(_, newMode) => newMode && setViewMode(newMode)}
                size="medium"
                sx={{
                  '& .MuiToggleButton-root': {
                    borderRadius: 2,
                    border: '1px solid',
                    borderColor: 'divider',
                    '&.Mui-selected': {
                      backgroundColor: 'primary.main',
                      color: 'white',
                      '&:hover': {
                        backgroundColor: 'primary.dark',
                      },
                    },
                  },
                }}
              >
                <ToggleButton value="grid" aria-label="grid view">
                  <Tooltip title="Grid View">
                    <GridViewIcon />
                  </Tooltip>
                </ToggleButton>
                <ToggleButton value="list" aria-label="list view">
                  <Tooltip title="List View">
                    <ListViewIcon />
                  </Tooltip>
                </ToggleButton>
              </ToggleButtonGroup>
            </Grid>

            {/* Create Button */}
            <Grid item xs={12} sm={6} md={2}>
              {user?.role === 'ALUM' && (
                <Button
                  fullWidth
                  variant="contained"
                  startIcon={<Add />}
                  onClick={() => setCreateDialogOpen(true)}
                  sx={{
                    borderRadius: 3,
                    background:
                      'linear-gradient(135deg, #4caf50 0%, #8bc34a 100%)',
                    boxShadow: '0 4px 15px rgba(76, 175, 80, 0.3)',
                    '&:hover': {
                      background:
                        'linear-gradient(135deg, #45a049 0%, #7cb342 100%)',
                      transform: 'translateY(-2px)',
                      boxShadow: '0 6px 20px rgba(76, 175, 80, 0.4)',
                    },
                    transition: 'all 0.3s ease',
                  }}
                >
                  Post Referral
                </Button>
              )}
            </Grid>
          </Grid>
        </Paper>
      </motion.div>

      {/* Enhanced Referrals Display */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.8 }}
      >
        <AnimatePresence mode="wait">
          {filteredReferrals.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
            >
              <Paper
                elevation={0}
                sx={{
                  p: 6,
                  textAlign: 'center',
                  borderRadius: 3,
                  border: '1px solid',
                  borderColor: 'divider',
                }}
              >
                <WorkIcon
                  sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }}
                />
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  No referrals found
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {user?.role === 'ALUM'
                    ? 'Start by posting your first job referral.'
                    : 'Check back later for new opportunities.'}
                </Typography>
              </Paper>
            </motion.div>
          ) : (
            <Grid container spacing={3}>
              {filteredReferrals.map((referral, index) => (
                <Grid
                  item
                  xs={12}
                  sm={viewMode === 'grid' ? 6 : 12}
                  md={viewMode === 'grid' ? 4 : 12}
                  lg={viewMode === 'grid' ? 4 : 12}
                  key={referral.id}
                >
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: index * 0.1 }}
                    whileHover={{ y: -8 }}
                  >
                    <Card
                      sx={{
                        height: '100%',
                        borderRadius: 3,
                        border: '1px solid',
                        borderColor: 'divider',
                        overflow: 'hidden',
                        transition: 'all 0.3s ease',
                        '&:hover': {
                          boxShadow: 6,
                          borderColor: 'primary.main',
                        },
                        display: 'flex',
                        flexDirection: viewMode === 'list' ? 'row' : 'column',
                      }}
                    >
                      <CardContent sx={{ flex: 1, p: 3 }}>
                        {/* Header */}
                        <Box
                          sx={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'flex-start',
                            mb: 2,
                          }}
                        >
                          <Box sx={{ flex: 1 }}>
                            <Typography
                              variant={viewMode === 'list' ? 'h6' : 'h6'}
                              sx={{ fontWeight: 600, mb: 0.5 }}
                            >
                              {referral.jobTitle}
                            </Typography>
                            <Box
                              sx={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 1,
                                mb: 1,
                              }}
                            >
                              <Avatar
                                sx={{
                                  width: 24,
                                  height: 24,
                                  fontSize: '0.75rem',
                                  background:
                                    'linear-gradient(135deg, #4caf50 0%, #8bc34a 100%)',
                                }}
                              >
                                {referral.company[0]}
                              </Avatar>
                              <Typography
                                variant="subtitle1"
                                color="primary"
                                sx={{ fontWeight: 500 }}
                              >
                                {referral.company}
                              </Typography>
                            </Box>
                          </Box>
                          <Chip
                            label={referral.status}
                            color={getStatusColor(referral.status)}
                            size="small"
                            sx={{ borderRadius: 2 }}
                          />
                        </Box>

                        {/* Details */}
                        <Stack spacing={1.5} sx={{ mb: 2 }}>
                          <Box
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 1,
                            }}
                          >
                            <LocationOn
                              sx={{ fontSize: 16, color: 'text.secondary' }}
                            />
                            <Typography variant="body2" color="text.secondary">
                              {referral.location}
                            </Typography>
                          </Box>
                          <Box
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 1,
                            }}
                          >
                            <Person
                              sx={{ fontSize: 16, color: 'text.secondary' }}
                            />
                            <Typography variant="body2" color="text.secondary">
                              Posted by {referral.postedBy.name}
                            </Typography>
                          </Box>
                          <Box
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 1,
                            }}
                          >
                            <TimeIcon
                              sx={{ fontSize: 16, color: 'text.secondary' }}
                            />
                            <Typography variant="body2" color="text.secondary">
                              {new Date(
                                referral.createdAt
                              ).toLocaleDateString()}
                            </Typography>
                          </Box>
                        </Stack>

                        {/* Description */}
                        <Typography
                          variant="body2"
                          sx={{
                            mb: 2,
                            color: 'text.secondary',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            display: '-webkit-box',
                            WebkitLineClamp: viewMode === 'list' ? 2 : 3,
                            WebkitBoxOrient: 'vertical',
                          }}
                        >
                          {referral.description}
                        </Typography>

                        {/* Applications Count (if any) */}
                        {referral.applications &&
                          referral.applications.length > 0 && (
                            <Box
                              sx={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 1,
                                mb: 2,
                              }}
                            >
                              <Badge
                                badgeContent={referral.applications.length}
                                color="primary"
                                sx={{
                                  '& .MuiBadge-badge': {
                                    backgroundColor: 'success.main',
                                    color: 'white',
                                  },
                                }}
                              >
                                <PeopleIcon
                                  sx={{ fontSize: 16, color: 'text.secondary' }}
                                />
                              </Badge>
                              <Typography
                                variant="caption"
                                color="text.secondary"
                              >
                                {referral.applications.length} application
                                {referral.applications.length !== 1 ? 's' : ''}
                              </Typography>
                            </Box>
                          )}
                      </CardContent>

                      {/* Actions */}
                      <CardActions
                        sx={{
                          p: 2,
                          pt: 0,
                          flexDirection: viewMode === 'list' ? 'column' : 'row',
                          justifyContent: 'space-between',
                          alignItems:
                            viewMode === 'list' ? 'stretch' : 'center',
                          gap: 1,
                        }}
                      >
                        <Box sx={{ display: 'flex', gap: 1, flex: 1 }}>
                          {user?.role === 'STUDENT' && (
                            <Button
                              fullWidth={viewMode === 'list'}
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
                              sx={{
                                borderRadius: 2,
                                textTransform: 'none',
                                background:
                                  'linear-gradient(135deg, #4caf50 0%, #8bc34a 100%)',
                                '&:hover': {
                                  background:
                                    'linear-gradient(135deg, #45a049 0%, #7cb342 100%)',
                                },
                              }}
                            >
                              Apply Now
                            </Button>
                          )}

                          <Tooltip title="View Details">
                            <IconButton
                              size="small"
                              onClick={() => {
                                setSelectedReferral(referral);
                                // Could open a details dialog here
                              }}
                              sx={{
                                color: 'primary.main',
                                backgroundColor: 'primary.light',
                                '&:hover': {
                                  backgroundColor: 'primary.main',
                                  color: 'white',
                                },
                              }}
                            >
                              <Visibility />
                            </IconButton>
                          </Tooltip>

                          {user?.id === referral.postedBy.id && (
                            <>
                              <Tooltip title="Edit">
                                <IconButton
                                  size="small"
                                  sx={{
                                    color: 'info.main',
                                    backgroundColor: 'info.light',
                                    '&:hover': {
                                      backgroundColor: 'info.main',
                                      color: 'white',
                                    },
                                  }}
                                >
                                  <Edit />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Delete">
                                <IconButton
                                  size="small"
                                  onClick={() =>
                                    handleDeleteReferral(referral.id)
                                  }
                                  sx={{
                                    color: 'error.main',
                                    backgroundColor: 'error.light',
                                    '&:hover': {
                                      backgroundColor: 'error.main',
                                      color: 'white',
                                    },
                                  }}
                                >
                                  <Delete />
                                </IconButton>
                              </Tooltip>
                            </>
                          )}
                        </Box>
                      </CardActions>
                    </Card>
                  </motion.div>
                </Grid>
              ))}
            </Grid>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Floating Action Button for Mobile */}
      {user?.role === 'ALUM' && (
        <Fab
          color="primary"
          onClick={() => setCreateDialogOpen(true)}
          sx={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            background: 'linear-gradient(135deg, #4caf50 0%, #8bc34a 100%)',
            '&:hover': {
              background: 'linear-gradient(135deg, #45a049 0%, #7cb342 100%)',
            },
            display: { xs: 'flex', md: 'none' },
          }}
        >
          <Add />
        </Fab>
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
