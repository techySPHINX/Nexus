import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Typography,
  Snackbar,
  Alert,
} from '@mui/material';
import { useSubCommunity } from '../../contexts/SubCommunityContext';
import { getErrorMessage } from '@/utils/errorHandler';

interface SubCommunityRequestDialogProps {
  open: boolean;
  onClose: () => void;
}

const COMMUNITY_TYPES = [
  'TECH',
  'GAME',
  'MUSIC',
  'SPORT',
  'ART',
  'SCIENCE',
  'EDUCATION',
  'ENTERTAINMENT',
  'LIFESTYLE',
  'OTHER',
];

export const SubCommunityRequestDialog: React.FC<
  SubCommunityRequestDialogProps
> = ({ open, onClose }) => {
  const { createSubCommunityRequest } = useSubCommunity();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [rules, setRules] = useState('');
  const [type, setType] = useState('OTHER');
  const [loading, setLoading] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error'>(
    'success'
  );

  const showSnackbar = (message: string, severity: 'success' | 'error') => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
  };

  const handleCloseSnackbar = () => {
    setSnackbarOpen(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name || !description || !rules || !type) {
      showSnackbar('Please fill in all required fields', 'error');
      return;
    }

    if (name.length < 3) {
      showSnackbar('Community name must be at least 3 characters', 'error');
      return;
    }

    if (description.length < 10) {
      showSnackbar('Description must be at least 10 characters', 'error');
      return;
    }

    if (rules.length < 10) {
      showSnackbar('Rules must be at least 10 characters', 'error');
      return;
    }

    setLoading(true);
    try {
      await createSubCommunityRequest({
        name,
        description,
        rules,
        type,
      });
      showSnackbar('Community request submitted successfully!', 'success');
      onClose();
      resetForm();
    } catch (error: unknown) {
      console.error('Error creating sub-community request:', error);
      const errorMessage = getErrorMessage(error) || 'Failed to submit request';
      showSnackbar(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setName('');
    setDescription('');
    setRules('');
    setType('OTHER');
  };

  const handleDialogClose = () => {
    if (!loading) {
      onClose();
      resetForm();
    }
  };

  return (
    <>
      <Dialog open={open} onClose={handleDialogClose} maxWidth="md" fullWidth>
        <form onSubmit={handleSubmit}>
          <DialogTitle>Request New Community</DialogTitle>
          <DialogContent>
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                gap: 3,
                mt: 1,
                py: 1,
              }}
            >
              <TextField
                label="Community Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                fullWidth
                placeholder="Enter a unique name for your community"
                helperText="3-50 characters"
                error={name.length > 0 && name.length < 3}
                disabled={loading}
              />

              <FormControl fullWidth required disabled={loading}>
                <InputLabel>Community Type</InputLabel>
                <Select
                  value={type}
                  label="Community Type"
                  onChange={(e) => setType(e.target.value)}
                  required
                >
                  {COMMUNITY_TYPES.map((type) => (
                    <MenuItem key={type} value={type}>
                      {type.charAt(0) + type.slice(1).toLowerCase()}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <TextField
                label="Description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
                multiline
                rows={3}
                fullWidth
                placeholder="Describe what your community is about..."
                helperText="10-500 characters"
                error={description.length > 0 && description.length < 10}
                disabled={loading}
              />

              <TextField
                label="Community Rules & Guidelines"
                value={rules}
                onChange={(e) => setRules(e.target.value)}
                required
                multiline
                rows={4}
                fullWidth
                placeholder="Set clear rules for your community members..."
                helperText="10-1000 characters"
                error={rules.length > 0 && rules.length < 10}
                disabled={loading}
              />

              <Typography variant="body2" color="text.secondary">
                Your request will be reviewed by administrators. You&apos;ll be
                notified once it&apos;s approved.
              </Typography>
            </Box>
          </DialogContent>
          <DialogActions sx={{ p: 3, pt: 0 }}>
            <Button onClick={handleDialogClose} disabled={loading}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={
                loading ||
                !name ||
                !description ||
                !rules ||
                !type ||
                name.length < 3 ||
                description.length < 10 ||
                rules.length < 10
              }
              sx={{ minWidth: 120 }}
            >
              {loading ? 'Submitting...' : 'Submit Request'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbarSeverity}
          sx={{ width: '100%' }}
          variant="filled"
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </>
  );
};
