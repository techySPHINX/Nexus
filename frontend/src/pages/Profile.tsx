import React, { useEffect, useState } from 'react';
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
  Badge as MuiBadge,
  Autocomplete,
  Card,
  IconButton,
} from '@mui/material';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { useProfile } from '../contexts/ProfileContext';
import {
  LocationOn,
  Info,
  Interests,
  Upload as UploadIcon,
  Work,
  Score,
  Edit,
  ThumbUp,
  MilitaryTech,
  Business,
  EmojiEvents,
  Refresh,
  Star,
} from '@mui/icons-material';
import axios from 'axios';
import {
  Role,
  UserBadge,
  Badge as BadgeType,
  Skill,
} from '@/types/profileType';
import { useNavigate, useParams } from 'react-router-dom';
import { getErrorMessage } from '@/utils/errorHandler';

const Profile: React.FC = () => {
  const {
    profile,
    badges,
    allSkills,
    allBadges,
    loading,
    error,
    refreshProfile,
    searchedProfile,
    endorseSkill,
    awardBadge,
    setError,
    updateProfile,
    fetchAllSkills,
    fetchAllBadges,
  } = useProfile();

  const { userId } = useParams<{ userId?: string }>();
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();

  const [isEditing, setIsEditing] = useState(false);
  const [localProfile, setLocalProfile] = useState({
    bio: '',
    location: '',
    interests: '',
    avatarUrl: '',
  });
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [success, setSuccess] = useState('');
  const [badgeDialogOpen, setBadgeDialogOpen] = useState(false);
  const [selectedBadge, setSelectedBadge] = useState('');
  const [profileLoading, setProfileLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);
  const [avatarPreview, setAvatarPreview] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Check if viewing own profile or another user's profile
  const isOwnProfile = !userId || userId === currentUser?.id;

  // Initialize local profile
  useEffect(() => {
    if (profile) {
      setLocalProfile({
        bio: profile.bio || '',
        location: profile.location || '',
        interests: profile.interests || '',
        avatarUrl: profile.avatarUrl || '',
      });
      setSelectedSkills(profile.skills?.map((s) => s.name) || []);
      setAvatarPreview(profile.avatarUrl || '');
    }
  }, [profile]);

  // Fetch profile data
  useEffect(() => {
    let isMounted = true;
    setProfileLoading(true);

    const loadProfile = async () => {
      try {
        if (isOwnProfile) {
          await refreshProfile();
        } else if (userId) {
          await searchedProfile(userId);
        }

        await fetchAllSkills();
        await fetchAllBadges();
      } catch (err) {
        if (isMounted) {
          setApiError('Failed to load profile');
          console.error('Profile loading error:', err);
        }
      } finally {
        if (isMounted) setProfileLoading(false);
      }
    };

    loadProfile();

    return () => {
      isMounted = false;
    };
  }, [
    userId,
    isOwnProfile,
    refreshProfile,
    searchedProfile,
    fetchAllSkills,
    fetchAllBadges,
  ]);

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

  const handleChange =
    (field: keyof typeof localProfile) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value;
      setLocalProfile((prev) => ({ ...prev, [field]: newValue }));

      // Update preview for avatar URL
      if (field === 'avatarUrl') {
        setAvatarPreview(newValue);
      }
    };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !profile) {
      setError('Authentication required');
      return;
    }

    try {
      await updateProfile({
        ...localProfile,
        skills: selectedSkills,
      });
      setSuccess('Profile updated successfully!');
      setIsEditing(false);
    } catch (err) {
      if (err && typeof err === 'object' && 'message' in err) {
        setError(
          (err as { message?: string }).message || 'Failed to update profile'
        );
      } else {
        setError('Failed to update profile');
      }
      console.error('Unexpected error:', err);
    }
  };

  const handleEndorse = async (skillId: string) => {
    try {
      await endorseSkill(skillId);
      setSuccess('Skill endorsed successfully!');
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.message || 'Failed to endorse skill');
      } else {
        setError('An unexpected error occurred');
        console.error('Unexpected error:', err);
      }
    }
  };

  const handleAwardBadge = async () => {
    try {
      if (!profile) return;
      await awardBadge(profile.user.id, selectedBadge);
      setSuccess('Badge awarded successfully!');
      setBadgeDialogOpen(false);
      setSelectedBadge('');
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        setError(error.response?.data?.message || 'Failed to award badge');
      } else {
        setError('An unexpected error occurred');
      }
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      if (isOwnProfile) {
        await refreshProfile();
      } else if (userId) {
        await searchedProfile(userId);
      }
      setSuccess('Profile refreshed successfully!');
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsRefreshing(false);
    }
  };

  const InfoCard: React.FC<{
    icon: React.ReactNode;
    title: string;
    value?: string | null;
    multiline?: boolean;
    children?: React.ReactNode;
  }> = ({ icon, title, value, multiline = false, children }) => (
    <Card variant="outlined" sx={{ p: 2, height: '100%' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
        {icon}
        <Typography variant="subtitle2" sx={{ ml: 1, fontWeight: 600 }}>
          {title}
        </Typography>
      </Box>
      {children || (
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ mt: 0.5, whiteSpace: multiline ? 'normal' : 'nowrap' }}
        >
          {value || '—'}
        </Typography>
      )}
    </Card>
  );

  if (loading || profileLoading) {
    return (
      <Container maxWidth="lg">
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

  if (error || apiError) {
    return (
      <Container maxWidth="lg">
        <Alert severity="error" sx={{ mt: 4 }}>
          {error || apiError}
        </Alert>
      </Container>
    );
  }

  if (!profile) {
    return (
      <Container maxWidth="lg">
        <Alert severity="warning" sx={{ mt: 4 }}>
          Profile not found
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg">
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

          {/* Header Section */}
          <Paper
            elevation={1}
            sx={{ p: 3, mb: 3, bgcolor: 'background.default' }}
          >
            <Box
              sx={{
                display: 'flex',
                flexDirection: { xs: 'column', sm: 'row' },
                justifyContent: 'space-between',
                alignItems: { xs: 'flex-start', sm: 'center' },
                gap: 2,
              }}
            >
              <Box>
                <Typography variant="h4" gutterBottom>
                  {isOwnProfile ? 'My' : `${profile.user.name}'s`} Profile
                </Typography>
                <Typography variant="subtitle1" color="text.secondary">
                  <Chip
                    label={profile.user.role}
                    color={
                      ['primary', 'secondary', 'error', 'default'].includes(
                        getRoleColor(profile.user.role)
                      )
                        ? (getRoleColor(profile.user.role) as
                            | 'primary'
                            | 'secondary'
                            | 'error'
                            | 'default')
                        : 'default'
                    }
                    sx={{
                      mr: 1,
                      whiteSpace: 'pre-line',
                      fontWeight: 600,
                      textTransform: 'uppercase',
                      fontSize: '0.7rem',
                    }}
                  />
                  {isOwnProfile ? `• ${profile.user.email}` : null}
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                <Tooltip title="Refresh profile data">
                  <IconButton
                    onClick={handleRefresh}
                    disabled={isRefreshing}
                    size="large"
                  >
                    <Refresh />
                    {isRefreshing && <CircularProgress size={20} />}
                  </IconButton>
                </Tooltip>
                {isOwnProfile && (
                  <Tooltip title="Edit your profile">
                    <Button
                      variant="contained"
                      onClick={() => setIsEditing(true)}
                      startIcon={<Edit />}
                    ></Button>
                  </Tooltip>
                )}
                {!isOwnProfile && currentUser?.role === Role.ADMIN && (
                  <Tooltip title="Award a badge to this user">
                    <Button
                      variant="outlined"
                      onClick={() => setBadgeDialogOpen(true)}
                      startIcon={<MilitaryTech />}
                    ></Button>
                  </Tooltip>
                )}
              </Box>
            </Box>

            {/* Stats */}
            <Box sx={{ display: 'flex', gap: 2, mt: 2, flexWrap: 'wrap' }}>
              {profile.user._count?.Post > 0 && (
                <Tooltip title="View all posts">
                  <Chip
                    label={`${profile.user._count?.Post || 0} Posts`}
                    variant="outlined"
                    onClick={() => {
                      navigate(`/users/${profile.user.id}/posts`);
                    }}
                    sx={{
                      cursor: 'pointer',
                      transition: 'all 0.2s ease-in-out',
                      '&:hover': {
                        backgroundColor: 'primary.main',
                        color: 'green',
                        borderColor: 'primary.main',
                        transform: 'scale(1.05)',
                      },
                    }}
                  />
                </Tooltip>
              )}
              {profile.user._count?.Comment > 0 && (
                <Chip
                  label={`${profile.user._count?.Comment || 0} Post Comments`}
                  variant="outlined"
                />
              )}
              {profile.user._count?.projects > 0 && (
                <Chip
                  label={`${profile.user._count?.projects} Projects`}
                  variant="outlined"
                />
              )}
              {badges && badges.length > 0 && (
                <Chip label={`${badges.length} Badges`} variant="outlined" />
              )}
              {profile.user._count?.ownedSubCommunities > 0 && (
                <Chip
                  label={`${profile.user._count?.ownedSubCommunities} Sub-Communities Created`}
                  variant="outlined"
                />
              )}
              {profile.user._count?.subCommunityMemberships > 0 && (
                <Chip
                  label={`${profile.user._count?.subCommunityMemberships} Sub-Communities Joined`}
                  variant="outlined"
                />
              )}
              {profile.user._count?.events > 0 && (
                <Chip
                  label={`${profile.user._count?.events} Events`}
                  variant="outlined"
                />
              )}
              {profile.user._count?.postedReferrals > 0 && (
                <Chip
                  label={`${profile.user._count?.postedReferrals} Referrals`}
                  variant="outlined"
                />
              )}
            </Box>
          </Paper>

          {/* Main Content Grid */}
          <Grid container spacing={3}>
            {/* Left Column - Profile Info */}
            <Grid item xs={12} md={4}>
              <Paper elevation={1} sx={{ p: 3, mb: 3 }}>
                <Box sx={{ textAlign: 'center', mb: 3 }}>
                  <MuiBadge
                    overlap="circular"
                    anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                    badgeContent={
                      badges.length > 0 ? (
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
                        mx: 'auto',
                      }}
                    />
                  </MuiBadge>
                </Box>

                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <InfoCard
                      icon={
                        <Business color={getRoleColor(profile.user.role)} />
                      }
                      title="Department"
                      value={
                        profile.user.role === Role.STUDENT
                          ? 'Computer Science'
                          : 'Alumni'
                      }
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <InfoCard
                      icon={<Score color={getRoleColor(profile.user.role)} />}
                      title="Graduation Year"
                      value={
                        profile.user.role === Role.STUDENT ? '2024' : '2018'
                      }
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <InfoCard
                      icon={
                        <LocationOn color={getRoleColor(profile.user.role)} />
                      }
                      title="Location"
                      value={profile.location}
                    />
                  </Grid>
                </Grid>
              </Paper>

              {/* Additional Sections */}
              {/* {profile.user.postedReferrals &&
                profile.user.postedReferrals.length > 0 && (
                  <Paper elevation={1} sx={{ p: 3, mb: 3 }}>
                    <ReferralsSection
                      referrals={profile.user.postedReferrals}
                    />
                  </Paper>
                )}

              {profile.user.userPoints && (
                <Paper elevation={1} sx={{ p: 3, mb: 3 }}>
                  <PointsSection userPoints={profile.user.userPoints} />
                </Paper>
              )}

              {profile.user.events && profile.user.events.length > 0 && (
                <Paper elevation={1} sx={{ p: 3 }}>
                  <EventsSection events={profile.user.events} />
                </Paper>
              )} */}
            </Grid>

            {/* Right Column - Main Content */}
            <Grid item xs={12} md={8}>
              <Paper elevation={1} sx={{ p: 3, mb: 3 }}>
                {/* Bio Section */}
                <Box sx={{ mb: 3 }}>
                  <Typography
                    variant="h6"
                    sx={{ mb: 2, display: 'flex', alignItems: 'center' }}
                  >
                    <Info
                      color={getRoleColor(profile.user.role)}
                      sx={{ mr: 1 }}
                    />{' '}
                    Bio
                  </Typography>
                  <Typography
                    variant="body1"
                    color="text.secondary"
                    sx={{ lineHeight: 1.6 }}
                  >
                    {profile.bio || 'No bio provided'}
                  </Typography>
                </Box>

                {/* Interests Section */}
                <Box sx={{ mb: 3 }}>
                  <Typography
                    variant="h6"
                    sx={{ mb: 2, display: 'flex', alignItems: 'center' }}
                  >
                    <Star
                      color={getRoleColor(profile.user.role)}
                      sx={{ mr: 1 }}
                    />{' '}
                    Interests
                  </Typography>
                  {profile.interests ? (
                    <Box
                      sx={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: 1,
                        mt: 0.5,
                      }}
                    >
                      {profile.interests.split(',').map((interest, idx) => (
                        <Chip
                          key={idx}
                          label={interest.trim()}
                          variant="outlined"
                          color="primary"
                          size="small"
                        />
                      ))}
                    </Box>
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      No interests added yet
                    </Typography>
                  )}
                </Box>

                {/* Skills Section */}
                <Box sx={{ mb: 3 }}>
                  <Typography
                    variant="h6"
                    sx={{ mb: 2, display: 'flex', alignItems: 'center' }}
                  >
                    <Work
                      color={getRoleColor(profile.user.role)}
                      sx={{ mr: 1 }}
                    />{' '}
                    Skills
                  </Typography>
                  {profile.skills.length > 0 ? (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                      {profile.skills.map((skill) => (
                        <Tooltip
                          key={skill.id}
                          title={
                            skill.endorsements && skill.endorsements.length > 0
                              ? `Endorsed by ${skill.endorsements.map((e) => e.endorser.name).join(', ')}`
                              : 'No endorsements yet'
                          }
                        >
                          <Chip
                            label={skill.name}
                            variant="outlined"
                            color="primary"
                            onDelete={
                              !isOwnProfile &&
                              currentUser?.id !== profile.user.id
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
                      No skills added yet
                    </Typography>
                  )}
                </Box>

                {/* Badges Section */}
                <Box sx={{ mb: 3 }}>
                  <Typography
                    variant="h6"
                    sx={{ mb: 2, display: 'flex', alignItems: 'center' }}
                  >
                    <EmojiEvents
                      sx={{ mr: 1 }}
                      color={getRoleColor(profile.user.role)}
                    />{' '}
                    Badges
                  </Typography>
                  {badges.length > 0 ? (
                    <Grid container spacing={1}>
                      {badges.map((badge: UserBadge) => (
                        <Grid item key={badge.badge.id}>
                          <Tooltip
                            title={
                              <Box sx={{ textAlign: 'center' }}>
                                <Typography variant="subtitle2">
                                  {badge.badge.name}
                                </Typography>
                                <Typography variant="caption">
                                  {badge.badge.description}
                                </Typography>
                                <br />
                                <Typography variant="caption">
                                  Awarded:{' '}
                                  {new Date(
                                    badge.assignedAt
                                  ).toLocaleDateString()}
                                </Typography>
                              </Box>
                            }
                            arrow
                          >
                            <Avatar
                              src={badge.badge.icon}
                              sx={{
                                width: 50,
                                height: 50,
                                cursor: 'pointer',
                                border: '2px solid',
                                borderColor: 'primary.main',
                              }}
                            />
                          </Tooltip>
                        </Grid>
                      ))}
                    </Grid>
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      No badges yet
                    </Typography>
                  )}
                </Box>
              </Paper>
            </Grid>
          </Grid>
        </motion.div>
      </Box>

      {/* Edit Profile Dialog */}
      <Dialog
        open={isEditing}
        onClose={() => setIsEditing(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Edit Profile</DialogTitle>
        <DialogContent>
          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
            <Stack spacing={3}>
              {/* Avatar Preview and URL Input */}
              <Box sx={{ textAlign: 'center' }}>
                <Avatar
                  src={avatarPreview || undefined}
                  sx={{ width: 80, height: 80, mb: 2, mx: 'auto' }}
                />
                <TextField
                  fullWidth
                  label="Avatar URL"
                  value={localProfile.avatarUrl}
                  onChange={handleChange('avatarUrl')}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <UploadIcon color="action" />
                      </InputAdornment>
                    ),
                  }}
                />
              </Box>

              <TextField
                fullWidth
                label="Bio"
                multiline
                minRows={3}
                value={localProfile.bio}
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
                value={localProfile.location}
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
                value={localProfile.interests}
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

              <Autocomplete
                multiple
                options={allSkills.map((skill: Skill) => skill.name)}
                value={selectedSkills}
                onChange={(_event, newValue) => {
                  setSelectedSkills(newValue);
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Skills"
                    helperText="Select or type to add new skills"
                    InputProps={{
                      ...params.InputProps,
                      startAdornment: (
                        <>
                          <InputAdornment position="start">
                            <Work color="action" />
                          </InputAdornment>
                          {params.InputProps.startAdornment}
                        </>
                      ),
                    }}
                  />
                )}
                freeSolo
                renderTags={(value, getTagProps) =>
                  value.map((option, index) => {
                    const { key, ...tagProps } = getTagProps({ index });
                    return (
                      <Chip
                        key={key}
                        label={option}
                        {...tagProps}
                        onDelete={() => {
                          const newSkills = [...selectedSkills];
                          newSkills.splice(index, 1);
                          setSelectedSkills(newSkills);
                        }}
                      />
                    );
                  })
                }
              />

              <Box sx={{ display: 'flex', gap: 2 }}>
                <Button
                  type="submit"
                  variant="contained"
                  size="large"
                  disabled={loading}
                  sx={{ flex: 1 }}
                >
                  {loading ? <CircularProgress size={24} /> : 'Save Changes'}
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
          </Box>
        </DialogContent>
      </Dialog>

      {/*  Award Dialog */}
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
              {allBadges.map((badge: BadgeType) => (
                <MenuItem key={badge.id} value={badge.id}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Avatar src={badge.icon} sx={{ width: 24, height: 24 }} />
                    <Box>
                      <Typography variant="body2">{badge.name}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {badge.description}
                      </Typography>
                    </Box>
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
