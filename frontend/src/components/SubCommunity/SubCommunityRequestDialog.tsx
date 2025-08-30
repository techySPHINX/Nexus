import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  Typography,
} from '@mui/material';
import { useSubCommunity } from '../../contexts/SubCommunityContext';

interface SubCommunityRequestDialogProps {
  open: boolean;
  onClose: () => void;
}

export const SubCommunityRequestDialog: React.FC<
  SubCommunityRequestDialogProps
> = ({ open, onClose }) => {
  const { createSubCommunityRequest } = useSubCommunity();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [rules, setRules] = useState('');
  const [documents, setDocuments] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await createSubCommunityRequest({ name, description, rules }, documents);
      onClose();
      resetForm();
    } catch (error) {
      console.error('Error creating sub-community request:', error);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setName('');
    setDescription('');
    setRules('');
    setDocuments([]);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle>Request New Sub-Community</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField
              label="Sub-Community Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              fullWidth
            />
            <TextField
              label="Description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              multiline
              rows={3}
              fullWidth
            />
            <TextField
              label="Community Rules"
              value={rules}
              onChange={(e) => setRules(e.target.value)}
              required
              multiline
              rows={4}
              fullWidth
              placeholder="Enter the rules and guidelines for your community..."
            />
            <Button variant="outlined" component="label">
              Upload Supporting Documents
              <input
                type="file"
                hidden
                multiple
                onChange={(e) => setDocuments(Array.from(e.target.files || []))}
              />
            </Button>
            {documents.length > 0 && (
              <Typography variant="body2">
                {documents.length} file(s) selected
              </Typography>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="contained" disabled={loading}>
            {loading ? 'Submitting...' : 'Submit Request'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};
