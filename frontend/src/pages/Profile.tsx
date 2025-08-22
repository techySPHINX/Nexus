import React, { useEffect, useState, useMemo } from 'react';
import {
  Container,
  Paper,
  TextField,
  Typography,
  Box,
  Button,
  Avatar,
  InputAdornment,
  Alert,
  Stack,
  Chip,
  Grid,
  CircularProgress,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Badge,
} from '@mui/material';
import { motion } from 'framer-motion';
import {
  useProfile,
  Role,
  ProfileBadge, // Import the renamed interface
} from '../contexts/ProfileContext';
import {
  LocationOn,
  Info,
  Interests,
  Upload as UploadIcon,
  Work,
  Email,
  Score,
  Edit,
  ThumbUp,
  MilitaryTech,
  Business,
} from '@mui/icons-material';
import axios from 'axios';

const Profile: React.FC = () => {
  const {
    user,
    profile,
    badges,
    loading: profileLoading,
    error,
    refreshProfile,
    endorseSkill,
    awardBadge,
    setError,
  } = useProfile();

  const [isEditing, setIsEditing] = useState(false);
  const [localProfile, setLocalProfile] = useState({
    bio: '',
    location: '',
    interests: '',
    avatarUrl: '',
  });
  const [skillsInput, setSkillsInput] = useState('');
  const [success, setSuccess] = useState('');
  const [badgeDialogOpen, setBadgeDialogOpen] = useState(false);
  const [selectedBadge, setSelectedBadge] = useState('');
  const [availableBadges, setAvailableBadges] = useState<ProfileBadge[]>([]);
  const [apiError, setApiError] = useState<string | null>(null);

  const api = useMemo(() => {
    const instance = axios.create({
      baseURL: 'http://localhost:3000',
    });
    instance.interceptors.request.use((config) => {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });
    return instance;
  }, []);
  // Initialize local profile
  useEffect(() => {
    if (profile) {
      setLocalProfile({
        bio: profile.bio || '',
        location: profile.location || '',
        interests: profile.interests || '',
        avatarUrl: profile.avatarUrl || '',
      });
      setSkillsInput(profile.skills?.map((s) => s.name).join(', ') || '');
    }
  }, [profile]);

  // Fetch available badges for admin
  useEffect(() => {
    // if (user?.role === 'ADMIN') {
    if (!user?.id) return;

    const controller = new AbortController();

    const fetchBadges = async () => {
      try {
        const res = await api.get(`profile/${user.id}/badges`, {
          signal: controller.signal,
        });
        setAvailableBadges(res.data);
      } catch (err) {
        if (!axios.isCancel(err)) {
          console.error('Failed to fetch badges', err);
        }
      }
    };

    fetchBadges();

    return () => controller.abort();
    // }
  }, [user?.role, api, user?.id]);

  // Fetch profile data when user changes
  useEffect(() => {
    if (!user?.id) return;

    let isMounted = true;

    const loadProfile = async () => {
      try {
        await refreshProfile();
        if (isMounted) console.log('Profile loaded');
      } catch (err) {
        if (isMounted) setApiError('Failed to load profile');
      }
    };

    loadProfile();

    return () => {
      isMounted = false;
    };
  }, [user?.id, refreshProfile]);

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'STUDENT':
        return 'primary';
      case 'ALUM':
        return 'secondary';
      case 'ADMIN':
        return 'error';
      default:
        return 'inherit';
    }
  };

  const getRoleColor2 = (role: string) => {
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

  const handleChange =
    (field: keyof typeof localProfile) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setLocalProfile((prev) => ({ ...prev, [field]: e.target.value }));
    };

  const handleSkillsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSkillsInput(e.target.value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // if (!user || !profile || !token) { // Check for token existence
    //   setError('Authentication required');
    //   return;
    // }

    const skillsArray = skillsInput
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    try {
      await api.put(`/profile/${user?.id}`, {
        ...localProfile,
        skills: skillsArray,
      });
      await refreshProfile();
      setSuccess('Profile updated successfully!');
      setIsEditing(false);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update profile');
    }
  };

  const handleEndorse = async (skillId: string) => {
    try {
      await endorseSkill(skillId);
      setSuccess('Skill endorsed successfully!');
    } catch (err) {
      setError('Failed to endorse skill');
    }
  };

  const handleAwardBadge = async () => {
    try {
      await awardBadge(profile?.user?.id || '', selectedBadge);
      setSuccess('Badge awarded successfully!');
      setBadgeDialogOpen(false);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to award badge');
    }
  };

  // const handleConnectionAction = async (userId: string, action: 'accept' | 'reject') => {
  //   try {
  //     await handleConnection(userId, action);
  //     setSuccess(`Connection ${action}ed successfully!`);
  //   } catch (err) {
  //     setError(`Failed to ${action} connection`);
  //   }
  // };

  const InfoCard: React.FC<{
    icon: React.ReactNode;
    title: string;
    value?: string | null;
    multiline?: boolean;
    children?: React.ReactNode;
  }> = ({ icon, title, value, multiline = false, children }) => (
    <Box>
      <Typography
        variant="subtitle2"
        color="text.secondary"
        sx={{ display: 'flex', alignItems: 'center' }}
      >
        {icon}{' '}
        <Box component="span" sx={{ ml: 1 }}>
          {title}
        </Box>
      </Typography>
      {children || (
        <Typography
          variant="body2"
          sx={{ mt: 0.5, whiteSpace: multiline ? 'normal' : 'nowrap' }}
        >
          {value || '—'}
        </Typography>
      )}
    </Box>
  );

  if (profileLoading) {
    return (
      <Container maxWidth="md">
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '80vh',
          }}
        >
          <CircularProgress />
          <Typography sx={{ ml: 2 }}>Loading profile data...</Typography>
        </Box>
      </Container>
    );
  }

  // // In Profile.tsx's useEffect
  // useEffect(() => {
  //   let isMounted = true;
  //   console.log('Fetching profile data...');
  //   const fetchData = async () => {  // <-- Proper async wrapper
  //     try {
  //       console.log('Fetching profile data...2');
  //       await refreshProfile();
  //       console.log('Profile data fetched successfully');
  //       console.log('Profile state:', profile);
  //       console.log('Badges state:', badges);
  //       if (isMounted) console.log('Fetch complete');
  //     } catch (err) {
  //       if (isMounted) setApiError('Fetch failed');
  //     }
  //   };

  //   if (user?.id) {
  //     console.log('User ID found, fetching profile...');
  //     (async () => {
  //     await fetchData();
  //     console.log('3rd useEffect fetch profile called'); // now runs after it's done
  //   })();
  //   }

  //   return () => {
  //     isMounted = false;  // <-- Cleanup
  //   };
  // }, [user?.id]);  // <-- Correct dependencies

  // useEffect(() => {
  //   if (!user?.id || !token) return;
  //   console.log('Current profile state:', profile); // Add this logging
  // }, [profile,user?.id, token]);

  if (error || apiError) {
    return (
      <Container maxWidth="md">
        <Alert severity="error" sx={{ mt: 4 }}>
          {error || apiError}
        </Alert>
      </Container>
    );
  }

  if (!profile) {
    return (
      <Container maxWidth="md">
        <Alert severity="warning" sx={{ mt: 4 }}>
          Profile not found
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="md">
      <Box sx={{ py: 4 }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          {/* Status Messages */}
          {error && (
            <Alert
              severity="error"
              sx={{ mb: 3, borderRadius: 2 }}
              onClose={() => setError('')}
            >
              {error}
            </Alert>
          )}
          {success && (
            <Alert
              severity="success"
              sx={{ mb: 3, borderRadius: 2 }}
              onClose={() => setSuccess('')}
            >
              {success}
            </Alert>
          )}

          <Paper elevation={3} sx={{ p: 4, borderRadius: 4 }}>
            <Box
              sx={{
                display: 'flex',
                flexDirection: { xs: 'column', md: 'row' },
                gap: 4,
              }}
            >
              {/* Left Column - Avatar and Basic Info */}
              <Box sx={{ minWidth: 250 }}>
                <Box sx={{ textAlign: 'center', mb: 3 }}>
                  <Badge
                    overlap="circular"
                    anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                    badgeContent={
                      badges.length ? (
                        <Tooltip title={`${badges.length} badges`}>
                          <MilitaryTech color="primary" />
                        </Tooltip>
                      ) : null
                    }
                  >
                    <Avatar
                      src={profile.avatarUrl || undefined}
                      sx={{
                        width: 120,
                        height: 120,
                        mb: 2,
                        border: '3px solid',
                        borderColor: getRoleColor(profile.user.role),
                        boxShadow: 3,
                      }}
                    />
                  </Badge>
                  <Typography variant="h5" sx={{ fontWeight: 700 }}>
                    {profile.user.name}
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mt: 0.5 }}
                  >
                    <Email
                      sx={{ fontSize: 16, verticalAlign: 'middle', mr: 0.5 }}
                    />
                    {profile.user.email}
                  </Typography>
                  <Chip
                    label={profile.user.role}
                    color={getRoleColor2(profile.user.role)}
                    size="small"
                    sx={{
                      mt: 1,
                      fontWeight: 600,
                      textTransform: 'uppercase',
                      fontSize: '0.7rem',
                    }}
                  />
                </Box>

                {/* Connections
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle1" sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <People sx={{ mr: 1 }} /> Connections
                  </Typography>
                  {connections.length > 0 ? (
                    <List dense>
                      {connections.map(conn => (
                        <ListItem key={conn.id} sx={{ px: 0 }}>
                          <ListItemAvatar>
                            <Avatar sx={{ width: 32, height: 32 }} />
                          </ListItemAvatar>
                          <ListItemText
                            primary={conn.requester.id === user?.id ? conn.recipient.name : conn.requester.name}
                            secondary={conn.status}
                          />
                          {conn.status === ConnectionStatus.PENDING && conn.recipient.id === user?.id && (
                            <Box>
                              <IconButton size="small" onClick={() => handleConnectionAction(conn.requester.id, 'accept')}>
                                <Check color="success" />
                              </IconButton>
                              <IconButton size="small" onClick={() => handleConnectionAction(conn.requester.id, 'reject')}>
                                <Close color="error" />
                              </IconButton>
                            </Box>
                          )}
                        </ListItem>
                      ))}
                    </List>
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      No connections yet
                    </Typography>
                  )}
                  <Button
                    variant="outlined"
                    size="small"
                    fullWidth
                    sx={{ mt: 1 }}
                    startIcon={<Link />}
                  >
                    Manage Connections
                  </Button>
                </Box> */}

                {/* Admin Actions */}
                {user?.role === Role.ADMIN && (
                  <Box>
                    <Button
                      variant="outlined"
                      size="small"
                      fullWidth
                      onClick={() => setBadgeDialogOpen(true)}
                      startIcon={<MilitaryTech />}
                    >
                      Award Badge
                    </Button>
                  </Box>
                )}
              </Box>

              {/* Right Column - Profile Content */}
              <Box sx={{ flex: 1 }}>
                {!isEditing ? (
                  <>
                    <Stack spacing={3}>
                      {/* About Section */}
                      <Box>
                        <Typography variant="h6" sx={{ mb: 2 }}>
                          About
                        </Typography>
                        <Grid container spacing={2}>
                          <Grid item xs={12} sm={6}>
                            <InfoCard
                              icon={
                                <Business
                                  color={getRoleColor(profile.user.role)}
                                />
                              }
                              title="Department"
                              value={
                                profile.user.role === Role.STUDENT
                                  ? 'Computer Science'
                                  : 'Alumni'
                              }
                            />
                          </Grid>
                          <Grid item xs={12} sm={6}>
                            <InfoCard
                              icon={
                                <Score
                                  color={getRoleColor(profile.user.role)}
                                />
                              }
                              title="Graduation Year"
                              value={
                                profile.user.role === Role.STUDENT
                                  ? '2024'
                                  : '2018'
                              }
                            />
                          </Grid>
                        </Grid>
                      </Box>

                      {/* Bio */}
                      <InfoCard
                        icon={<Info color={getRoleColor(profile.user.role)} />}
                        title="Bio"
                        value={profile.bio}
                        multiline
                      />

                      {/* Location */}
                      <InfoCard
                        icon={
                          <LocationOn color={getRoleColor(profile.user.role)} />
                        }
                        title="Location"
                        value={profile.location}
                      />

                      {/* Interests */}
                      <InfoCard
                        icon={
                          <Interests color={getRoleColor(profile.user.role)} />
                        }
                        title="Interests"
                      >
                        {profile.interests ? (
                          <Box
                            sx={{
                              display: 'flex',
                              flexWrap: 'wrap',
                              gap: 1,
                              mt: 0.5,
                            }}
                          >
                            {profile.interests
                              .split(',')
                              .map((interest, idx) => (
                                <Chip
                                  key={idx}
                                  label={interest.trim()}
                                  variant="outlined"
                                  color="primary"
                                  size="small"
                                />
                              ))}
                          </Box>
                        ) : null}
                      </InfoCard>

                      {/* Skills */}
                      <Box>
                        <Typography
                          variant="subtitle1"
                          sx={{ display: 'flex', alignItems: 'center', mb: 1 }}
                        >
                          <Work sx={{ mr: 1 }} /> Skills
                        </Typography>
                        {profile.skills.length > 0 ? (
                          <Box
                            sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}
                          >
                            {profile.skills.map((skill) => (
                              <Tooltip
                                key={skill.id}
                                title={
                                  skill?.endorsements?.length > 0
                                    ? `Endorsed by ${skill?.endorsements.map((e) => e.endorser.name).join(', ')}`
                                    : 'No endorsements yet'
                                }
                              >
                                <Chip
                                  label={skill.name}
                                  variant="outlined"
                                  color="primary"
                                  onDelete={
                                    profile.user.id !== user?.id
                                      ? () => handleEndorse(skill.id)
                                      : undefined
                                  }
                                  deleteIcon={<ThumbUp />}
                                />
                              </Tooltip>
                            ))}
                          </Box>
                        ) : (
                          <Typography variant="body2" color="text.secondary">
                            No skills added
                          </Typography>
                        )}
                      </Box>

                      {/* Badges */}
                      {badges.length > 0 && (
                        <Box>
                          <Typography
                            variant="subtitle1"
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              mb: 1,
                            }}
                          >
                            <MilitaryTech sx={{ mr: 1 }} /> Badges
                          </Typography>
                          <Box
                            sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}
                          >
                            {badges.map((badge) => (
                              <Tooltip
                                key={badge.badge.id}
                                title={
                                  <Box
                                    sx={{
                                      px: 1,
                                      py: 0.5,
                                      bgcolor: 'grey.900',
                                      color: 'white',
                                      borderRadius: 1,
                                    }}
                                  >
                                    {badge.badge.name}
                                  </Box>
                                }
                                arrow
                              >
                                <Avatar
                                  src={badge.badge.icon}
                                  sx={{
                                    width: 40,
                                    height: 40,
                                    cursor: 'pointer',
                                  }}
                                />
                              </Tooltip>
                            ))}
                          </Box>
                        </Box>
                      )}
                    </Stack>

                    {profile.user.id === user?.id && (
                      <Button
                        variant="contained"
                        fullWidth
                        sx={{ mt: 3 }}
                        onClick={() => setIsEditing(true)}
                        startIcon={<Edit />}
                      >
                        Edit Profile
                      </Button>
                    )}
                  </>
                ) : (
                  <motion.form onSubmit={handleSubmit}>
                    <Stack spacing={3}>
                      <TextField
                        fullWidth
                        label="Bio"
                        multiline
                        minRows={3}
                        value={localProfile.bio || ''}
                        onChange={handleChange('bio')}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <Info color="action" />
                            </InputAdornment>
                          ),
                        }}
                      />

                      <TextField
                        fullWidth
                        label="Location"
                        value={localProfile.location || ''}
                        onChange={handleChange('location')}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <LocationOn color="action" />
                            </InputAdornment>
                          ),
                        }}
                      />

                      <TextField
                        fullWidth
                        label="Interests"
                        value={localProfile.interests || ''}
                        onChange={handleChange('interests')}
                        helperText="Comma separated values"
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <Interests color="action" />
                            </InputAdornment>
                          ),
                        }}
                      />

                      <TextField
                        fullWidth
                        label="Skills"
                        value={skillsInput}
                        onChange={handleSkillsChange}
                        helperText="Comma separated values (e.g. React, Node, SQL)"
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <Work color="action" />
                            </InputAdornment>
                          ),
                        }}
                      />

                      <TextField
                        fullWidth
                        label="Avatar URL"
                        value={localProfile.avatarUrl || ''}
                        onChange={handleChange('avatarUrl')}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <UploadIcon color="action" />
                            </InputAdornment>
                          ),
                        }}
                      />

                      <Box sx={{ display: 'flex', gap: 2 }}>
                        <Button
                          type="submit"
                          variant="contained"
                          size="large"
                          disabled={profileLoading}
                          sx={{ flex: 1 }}
                        >
                          {profileLoading ? (
                            <CircularProgress size={24} />
                          ) : (
                            'Save Changes'
                          )}
                        </Button>
                        <Button
                          variant="outlined"
                          size="large"
                          sx={{ flex: 1 }}
                          onClick={() => setIsEditing(false)}
                        >
                          Cancel
                        </Button>
                      </Box>
                    </Stack>
                  </motion.form>
                )}
              </Box>
            </Box>
          </Paper>
        </motion.div>
      </Box>

      {/* Badge Award Dialog */}
      <Dialog open={badgeDialogOpen} onClose={() => setBadgeDialogOpen(false)}>
        <DialogTitle>Award Badge</DialogTitle>
        <DialogContent>
          <FormControl fullWidth margin="normal">
            <InputLabel>Select Badge</InputLabel>
            <Select
              value={selectedBadge}
              onChange={(e) => setSelectedBadge(e.target.value as string)}
              label="Select Badge"
            >
              {availableBadges.map((badge) => (
                <MenuItem key={badge.badge.id} value={badge.badge.id}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Avatar
                      src={badge.badge.icon}
                      sx={{ width: 24, height: 24 }}
                    />
                    {badge.badge.name}
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBadgeDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleAwardBadge}
            disabled={!selectedBadge}
            variant="contained"
          >
            Award
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Profile;
