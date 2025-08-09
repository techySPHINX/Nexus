import React, { useEffect, useState } from 'react';
import {
  Container, Paper, TextField, Typography, Box, Button, Avatar,
  InputAdornment, Alert, Divider,
  Stack,
  Chip,
  Grid,
  CircularProgress
} from '@mui/material';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import { LocationOn, Info, Interests, Upload as UploadIcon, Work, Email, School, Score, CalendarToday, Warning, Notifications, Edit } from '@mui/icons-material';

interface ProfileData {
  bio: string;
  location: string;
  interests: string;
  skills: string[]; // stored as array in state
  avatarUrl: string;
}

const Profile: React.FC = () => {
  const { user, token } = useAuth();
  const [profile, setProfile] = useState<ProfileData>({
    bio: '',
    location: '',
    interests: '',
    skills: [],
    avatarUrl: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [skillsInput, setSkillsInput] = useState(profile.skills.join(', '));

  interface InfoCardProps {
    icon: React.ReactNode;
    title: string;
    value?: string;
    multiline?: boolean;
    children?: React.ReactNode;
  }

  const InfoCard: React.FC<InfoCardProps> = ({ icon, title, value, multiline = false, children }) => (
    <Box>
      <Typography variant="subtitle2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center' }}>
        {icon} <Box component="span" sx={{ ml: 1 }}>{title}</Box>
      </Typography>
      {children !== undefined ? (
        children
      ) : (
        <Typography variant="body2" sx={{ mt: 0.5, whiteSpace: multiline ? 'normal' : 'nowrap' }}>
          {value}
        </Typography>
      )}
    </Box>
  );

  useEffect(() => {
    setSkillsInput(profile.skills.join(', '));
  }, [profile.skills]
  );


  // Fetch profile on mount
  useEffect(() => {
    if (!user) return;
    const fetchProfile = async () => {
      try {
        const res = await axios.get(`/profile/${user.id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        // Ensure we normalize skills to string[]
        const data = res.data || {};
        setProfile({
          bio: data.bio ?? '',
          location: data.location ?? '',
          interests: data.interests ?? '',
          skills: Array.isArray(data.skills) ? data.skills.map((s: any) => (typeof s === 'string' ? s : s.name ?? '')) : [],
          avatarUrl: data.avatarUrl ?? ''
        });
      } catch (err: any) {
        console.error(err);
        setError('Failed to load profile data.');
      }
    };
    fetchProfile();
  }, [user, token]);

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

  const handleChange = (field: keyof ProfileData) => (e: React.ChangeEvent<HTMLInputElement>) => {
    // const value = e.target.value;
    setProfile(prev => ({
      ...prev,
      [field]: e.target.value
    }));
  };

  const handleSkillsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSkillsInput(e.target.value);
  };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);
    setError('');
    setSuccess('');

    const skillsArray = skillsInput
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    try {
      // Pick only allowed fields so backend DTO validation doesn't complain
      const allowedFields = (({ bio, location, interests, skills, avatarUrl }) => ({
        bio,
        location,
        interests,
        skills: skillsArray,
        avatarUrl
      }))(profile);


      if (allowedFields.avatarUrl) {
        if (allowedFields.avatarUrl.length > 512) {
          setError('Avatar URL must be less than 512 characters.');
          return;
        }
        if (!/^https?:\/\//.test(allowedFields.avatarUrl)) {
          setError('Avatar URL must start with http or https.');
          return;
        }
      }


      await axios.put(
        `/profile/${user.id}`,
        { ...allowedFields, skills: skillsArray },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Instantly update the UI with new skills
      setProfile(prev => ({ ...prev, skills: skillsArray }));


      setSuccess('Profile updated successfully.');
      setIsEditing(false);
    } catch (err: any) {
      console.error(err);
      // Prefer descriptive backend message if available
      const msg = err?.response?.data?.message ?? err?.response?.data ?? err.message;
      setError(typeof msg === 'string' ? msg : JSON.stringify(msg));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="sm">
      <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', py: 4 }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          style={{ width: '100%' }}
        >
          <Paper
            elevation={3}
            sx={{
              p: 4,
              borderRadius: 4,
              background: 'linear-gradient(to bottom, #f5f7fa 0%, #ffffff 100%)',
              boxShadow: '0 8px 32px rgba(0,0,0,0.05)',
              border: '1px solid rgba(255,255,255,0.3)'
            }}
          >
            {/* Profile Header */}
            <Box sx={{ textAlign: 'center', mb: 4 }}>
              <Avatar
                src={profile.avatarUrl || undefined}
                sx={{
                  width: 96,
                  height: 96,
                  mx: 'auto',
                  mb: 2,
                  border: '3px solid',
                  borderColor: getRoleColor(user?.role || ''),
                  boxShadow: 3
                }}
              />
              <Typography variant="h5" sx={{ fontWeight: 700, letterSpacing: 0.5 }}>{user?.name}</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                <Email sx={{ fontSize: 16, verticalAlign: 'middle', mr: 0.5 }} />
                {user?.email}
              </Typography>
              <Chip
                label={user?.role}
                color={
                  user?.role === 'STUDENT'
                    ? 'primary'
                    : user?.role === 'ALUM'
                      ? 'secondary'
                      : user?.role === 'ADMIN'
                        ? 'error'
                        : 'default'
                }
                size="small"
                sx={{
                  mt: 1,
                  fontWeight: 600,
                  letterSpacing: 0.5,
                  textTransform: 'uppercase',
                  fontSize: '0.7rem'
                }}
              />
            </Box>

            {/* Status Messages */}
            {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{error}</Alert>}
            {success && <Alert severity="success" sx={{ mb: 2, borderRadius: 2 }}>{success}</Alert>}

            <Divider sx={{ my: 3, borderColor: 'divider' }} />

            {!isEditing ? (
              <Box>
                <Grid container spacing={2} sx={{ mb: 2 }}>
                  {/* Academic Information */}
                  <Grid item xs={12} sm={6}>
                    <InfoCard
                      icon={<School color={getRoleColor(user?.role || '')} />}
                      title="Department"
                      value={/*profile.department ||*/ '—'}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <InfoCard
                      icon={<Score color={getRoleColor(user?.role || '')} />}
                      title="CGPA"
                      value={/*profile.cgpa ||*/ '—'}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <InfoCard
                      icon={<CalendarToday color={getRoleColor(user?.role || '')} />}
                      title="Year"
                      value={/*profile.year || */'—'}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <InfoCard
                      icon={<Warning color={getRoleColor(user?.role || '')} />}
                      title="Backlogs"
                      value={/*profile.backlogs || */'—'}
                    />
                  </Grid>
                </Grid>

                {/* Personal Information */}
                <Stack spacing={2} sx={{ mb: 3 }}>
                  <InfoCard
                    icon={<Info color={getRoleColor(user?.role || '')} />}
                    title="Bio"
                    value={profile.bio || '—'}
                    multiline
                  />
                  <InfoCard
                    icon={<LocationOn color={getRoleColor(user?.role || '')} />}
                    title="Location"
                    value={profile.location || '—'}
                  />
                  <InfoCard
                    icon={<Interests color={getRoleColor(user?.role || '')} />}
                    title="Interests"
                  >
                    {profile.interests ? (
                      <Box
                        sx={{
                          display: 'flex',
                          flexWrap: 'wrap',
                          gap: 1,
                          mt: 0.5
                        }}
                      >
                        {profile.interests.split(',').map((interest, idx) => (
                          <Chip
                            key={idx}
                            label={interest.trim()}
                            variant="outlined"
                            color="primary"
                            size="medium"
                            sx={{
                              borderRadius: 1,
                              fontSize: '0.75rem',
                              fontWeight: 500,
                              textTransform: 'capitalize'
                            }}
                          />
                        ))}
                      </Box>
                    ) : (
                      <Typography variant="body2">—</Typography>
                    )}
                  </InfoCard>

                  {/* Skills Section */}
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1, display: 'flex', alignItems: 'center' }}>
                      <Work color={getRoleColor(user?.role || '')} sx={{ mr: 1 }} /> Skills
                    </Typography>
                    {profile.skills?.length ? (
                      <Box
                        sx={{
                          display: 'flex',
                          flexWrap: 'wrap',
                          gap: 1,
                          mb: 2
                        }}
                      >
                        {profile.skills.map((skill, idx) => (
                          <Chip
                            key={idx}
                            label={skill}
                            variant="outlined"
                            color='primary'
                            size="medium"
                            sx={{
                              borderRadius: 1,
                              fontSize: '0.75rem',
                              fontWeight: 500,
                              textTransform: 'capitalize'
                            }}
                          />
                        ))}
                      </Box>
                    ) : (
                      <Typography variant="body2">—</Typography>
                    )}
                  </Box>
                </Stack>

                {/* Future Notification Section Placeholder */}
                <Box sx={{
                  p: 2,
                  mb: 3,
                  borderRadius: 2,
                  backgroundColor: 'action.hover',
                  borderLeft: '4px solid',
                  borderColor: getRoleColor(user?.role || '').concat('.main')
                }}>
                  <Typography variant="subtitle2" color="text.secondary">
                    <Notifications color={getRoleColor(user?.role || '')} sx={{ verticalAlign: 'middle', mr: 1 }} />
                    Notification Center (Coming Soon)
                  </Typography>
                  <Typography variant="body2" sx={{ mt: 0.5 }}>
                    You'll receive important updates here
                  </Typography>
                </Box>

                <Button
                  variant="contained"
                  fullWidth
                  sx={{
                    mt: 2,
                    borderRadius: 2,
                    py: 1.5,
                    fontWeight: 600,
                    letterSpacing: 0.5
                  }}
                  onClick={() => setIsEditing(true)}
                  startIcon={<Edit />}
                  color={getRoleColor(user?.role || '')}
                >
                  Edit Profile
                </Button>
              </Box>
            ) : (
              <motion.form onSubmit={handleSubmit}>
                <Grid container spacing={2}>
                  {/* <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Department"
                      value={profile.department}
                      onChange={handleChange('department')}
                      margin="normal"
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <School color="action" />
                          </InputAdornment>
                        )
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="CGPA"
                      type="number"
                      value={profile.cgpa}
                      onChange={handleChange('cgpa')}
                      margin="normal"
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <Score color="action" />
                          </InputAdornment>
                        ),
                        inputProps: { step: "0.01", min: "0", max: "10" }
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Year"
                      value={profile.year}
                      onChange={handleChange('year')}
                      margin="normal"
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <CalendarToday color="action" />
                          </InputAdornment>
                        )
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Backlogs"
                      type="number"
                      value={profile.backlogs}
                      onChange={handleChange('backlogs')}
                      margin="normal"
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <Warning color="action" />
                          </InputAdornment>
                        ),
                        inputProps: { min: "0" }
                      }}
                    />
                  </Grid> */}
                </Grid>

                <TextField
                  fullWidth
                  label="Bio"
                  multiline
                  minRows={3}
                  value={profile.bio}
                  onChange={handleChange('bio')}
                  margin="normal"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Info color="action" />
                      </InputAdornment>
                    )
                  }}
                />

                <TextField
                  fullWidth
                  label="Location"
                  value={profile.location}
                  onChange={handleChange('location')}
                  margin="normal"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <LocationOn color="action" />
                      </InputAdornment>
                    )
                  }}
                />

                <TextField
                  fullWidth
                  label="Interests"
                  value={profile.interests}
                  onChange={handleChange('interests')}
                  margin="normal"
                  helperText="Comma separated values"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Interests color="action" />
                      </InputAdornment>
                    )
                  }}
                />

                <TextField
                  fullWidth
                  label="Skills"
                  value={skillsInput}
                  onChange={handleSkillsChange}
                  margin="normal"
                  helperText="Comma separated values (e.g. React, Node, SQL)"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Work color="action" />
                      </InputAdornment>
                    )
                  }}
                />

                <TextField
                  fullWidth
                  label="Avatar URL"
                  value={profile.avatarUrl}
                  onChange={handleChange('avatarUrl')}
                  margin="normal"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <UploadIcon color="action" />
                      </InputAdornment>
                    )
                  }}
                />

                <Box sx={{ display: 'flex', gap: 2, mt: 3 }}>
                  <Button
                    type="submit"
                    variant="contained"
                    size="large"
                    disabled={loading}
                    sx={{
                      flex: 1,
                      borderRadius: 2,
                      py: 1.5,
                      fontWeight: 600
                    }}
                    color={getRoleColor(user?.role || '')}
                  >
                    {loading ? <CircularProgress size={24} /> : 'Save Changes'}
                  </Button>
                  <Button
                    variant="outlined"
                    size="large"
                    sx={{
                      flex: 1,
                      borderRadius: 2,
                      py: 1.5
                    }}
                    onClick={() => setIsEditing(false)}
                    color={getRoleColor(user?.role || '')}
                  >
                    Cancel
                  </Button>
                </Box>
              </motion.form>
            )}
          </Paper>
        </motion.div>
      </Box>
    </Container>
  );
};

export default Profile;