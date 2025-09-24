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
  CircularProgress,
  IconButton,
} from '@mui/material';
import { motion } from 'framer-motion';
import { Send, Close } from '@mui/icons-material';
import {
  ProjectInterface,
  CreateCollaborationRequestInterface,
} from '@/types/ShowcaseType';

interface CollaborationModalProps {
  project: ProjectInterface;
  onClose: () => void;
  onSubmit: (data: CreateCollaborationRequestInterface) => void;
  loading?: boolean;
}

const MotionDialog = motion(Dialog);

const CollaborationModal: React.FC<CollaborationModalProps> = ({
  project,
  onClose,
  onSubmit,
  loading = false,
}) => {
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    await onSubmit({ message: message.trim() || undefined });
    setMessage('');
    onClose();
  };

  return (
    <MotionDialog
      open
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      initial={{ opacity: 0, scale: 0.95, y: -10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: -10 }}
      transition={{ duration: 0.2 }}
      PaperProps={{
        sx: {
          borderRadius: 3,
          background: 'linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%)',
          color: 'white',
        },
      }}
    >
      <DialogTitle sx={{ p: 2, pb: 1 }}>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Typography variant="subtitle1" fontWeight={600} color="primary.main">
            Collaborate on {project.title}
          </Typography>
          <IconButton onClick={onClose} size="small" sx={{ color: 'white' }}>
            <Close />
          </IconButton>
        </Box>
        <Typography variant="caption" color="black">
          Send a request to the project owner
        </Typography>
      </DialogTitle>

      <DialogContent sx={{ p: 2 }}>
        <TextField
          label="Message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          fullWidth
          multiline
          rows={3}
          placeholder="Explain your skills (20-50 words)..."
          variant="outlined"
          size="small"
          disabled={loading}
          inputProps={{
            minLength: 20,
            maxLength: 250,
          }}
          sx={{
            mb: 1,
            '& .MuiOutlinedInput-root': {
              color: 'black',
              '& fieldset': { borderColor: '#374151' },
              '&:hover fieldset': { borderColor: 'primary.main' },
              '&.Mui-focused fieldset': { borderColor: 'primary.main' },
            },
            '& .MuiInputLabel-root': { color: 'black' },
          }}
        />
        <Typography variant="caption" color="black">
          Minimum 20 words. Briefly explain your contribution.
        </Typography>
      </DialogContent>

      <DialogActions sx={{ p: 2, pt: 0 }}>
        <Button
          onClick={onClose}
          size="small"
          disabled={loading}
          sx={{ color: 'primary.main' }}
        >
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          size="small"
          disabled={loading || message.trim().split(' ').length < 20}
          startIcon={loading ? <CircularProgress size={14} /> : <Send />}
          sx={{
            backgroundColor: 'primary.main',
            '&:hover': { backgroundColor: 'primary.dark' },
          }}
        >
          {loading ? 'Sending...' : 'Send'}
        </Button>
      </DialogActions>
    </MotionDialog>
  );
};

export default CollaborationModal;
