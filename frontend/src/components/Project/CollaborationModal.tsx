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
import { motion } from 'framer-motion';
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

const CollaborationModal: React.FC<CollaborationModalProps> = ({
  project,
  onClose,
  onSubmit,
  loading = false,
}) => {
  const [message, setMessage] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ message: message.trim() || undefined });
  };

  return (
    <Dialog
      open
      onClose={onClose}
      PaperComponent={React.forwardRef(function MotionPaper(
        props: import('@mui/material').PaperProps,
        ref: React.Ref<HTMLDivElement>
      ) {
        const { children } = props;
        // Only pass valid HTML div props to motion.div
        return (
          <motion.div
            ref={ref}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.3 }}
            style={{
              borderRadius: 24,
              padding: 24,
              maxWidth: 500,
              width: '100%',
              boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
            }}
            // Only spread rest if it contains valid div props
          >
            {children}
          </motion.div>
        );
      })}
      PaperProps={{
        sx: {
          borderRadius: 3,
          p: 3,
          maxWidth: 500,
          width: '100%',
          boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
        },
      }}
      sx={{ zIndex: 1400 }}
    >
      <DialogTitle sx={{ fontWeight: 700, fontSize: 24, mb: 1, px: 0 }}>
        Request Collaboration
      </DialogTitle>
      <DialogContent dividers sx={{ px: 0 }}>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          Request to collaborate on: <strong>{project.title}</strong>
        </Typography>

        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
          <TextField
            label="Message (Optional)"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            fullWidth
            multiline
            rows={4}
            placeholder="Tell the project owner why you want to collaborate..."
            variant="outlined"
            size="medium"
          />
        </Box>
      </DialogContent>
      <DialogActions sx={{ justifyContent: 'flex-end', gap: 2, pt: 2, px: 0 }}>
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <Button
            onClick={onClose}
            color="inherit"
            variant="outlined"
            disabled={loading}
          >
            Cancel
          </Button>
        </motion.div>
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={loading}
            sx={{ bgcolor: 'purple.500', '&:hover': { bgcolor: 'purple.600' } }}
          >
            Send Request
          </Button>
        </motion.div>
      </DialogActions>
    </Dialog>
  );
};

export default CollaborationModal;
