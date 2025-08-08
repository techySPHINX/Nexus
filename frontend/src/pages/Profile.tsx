import React, { useEffect, useState } from 'react';
import {
  Container, Paper, TextField, Typography, Box, Button, Avatar,
  InputAdornment, Alert, Divider,
  Stack,
  Chip
} from '@mui/material';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import { LocationOn, Info, Interests, Upload as UploadIcon, Work } from '@mui/icons-material';

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

      // ✅ Instantly update the UI with new skills
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
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} style={{ width: '100%' }}>
          <Paper elevation={0} sx={{ p: 4, borderRadius: 3, border: '1px solid', borderColor: 'divider', backgroundColor: 'background.paper' }}>
            <Box sx={{ textAlign: 'center', mb: 4 }}>
              <Avatar src={profile.avatarUrl || undefined} sx={{ width: 80, height: 80, mx: 'auto', mb: 2 }} />
              <Typography variant="h5" sx={{ fontWeight: 700 }}>{user?.name}</Typography>
              <Typography variant="body2" color="text.secondary">{user?.email}</Typography>
              <Typography variant="overline" color="primary">{user?.role}</Typography>
            </Box>

            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
            {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

            <Divider sx={{ my: 2 }} />

            {!isEditing ? (
              <Box>
                <Stack spacing={1.5}>
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary">Bio</Typography>
                    <Typography>{profile.bio || '—'}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary">Location</Typography>
                    <Typography>{profile.location || '—'}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary">Interests</Typography>
                    <Typography>{profile.interests || '—'}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary">Skills</Typography>
                    {profile.skills?.length ? (
                      <Stack direction="row" spacing={1} flexWrap="wrap">
                        {profile.skills.map((skill, idx) => (
                          <Chip key={idx} label={skill} variant="outlined" />
                        ))}
                      </Stack>
                    ) : (
                      <Typography>—</Typography>
                    )}
                  </Box>
                </Stack>

                <Button
                  variant="contained"
                  fullWidth
                  sx={{ mt: 3, borderRadius: 2 }}
                  onClick={() => setIsEditing(true)}
                >
                  Edit Profile
                </Button>
              </Box>
            ) : (
              <motion.form onSubmit={handleSubmit}>
                <TextField
                  fullWidth
                  label="Bio"
                  multiline
                  minRows={3}
                  value={profile.bio}
                  onChange={handleChange('bio')}
                  margin="normal"
                  InputProps={{ startAdornment: (<InputAdornment position="start"><Info color="action" /></InputAdornment>) }}
                />

                <TextField
                  fullWidth
                  label="Location"
                  value={profile.location}
                  onChange={handleChange('location')}
                  margin="normal"
                  InputProps={{ startAdornment: (<InputAdornment position="start"><LocationOn color="action" /></InputAdornment>) }}
                />

                <TextField
                  fullWidth
                  label="Interests"
                  value={profile.interests}
                  onChange={handleChange('interests')}
                  margin="normal"
                  helperText="Comma separated values"
                  InputProps={{ startAdornment: (<InputAdornment position="start"><Interests color="action" /></InputAdornment>) }}
                />

                <TextField
                  fullWidth
                  label="Skills"
                  value={skillsInput}
                  onChange={handleSkillsChange}
                  margin="normal"
                  helperText="Comma separated values (e.g. React, Node, SQL)"
                  InputProps={{ startAdornment: (<InputAdornment position="start"><Work color="action" /></InputAdornment>) }}
                />

                <TextField
                  fullWidth
                  label="Avatar URL"
                  value={profile.avatarUrl}
                  onChange={handleChange('avatarUrl')}
                  margin="normal"
                  InputProps={{ startAdornment: (<InputAdornment position="start"><UploadIcon color="action" /></InputAdornment>) }}
                />

                <Button type="submit" fullWidth variant="contained" size="large" disabled={loading} sx={{ mt: 2 }}>
                  {loading ? 'Saving...' : 'Save Changes'}
                </Button>

                <Button fullWidth variant="text" sx={{ mt: 1 }} onClick={() => setIsEditing(false)}>Cancel</Button>
              </motion.form>
            )}
          </Paper>
        </motion.div>
      </Box>
    </Container>
  );
};

export default Profile;