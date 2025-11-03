import React, { useEffect, useState } from 'react';
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
import { useShowcase } from '@/contexts/ShowcaseContext';

interface CollaborationModalProps {
  project: ProjectInterface;
  seekingOptions?: string[];
  onLoadSeekingOptions?: () => void;
  onClose: () => void;
  onSubmit: (data: CreateCollaborationRequestInterface) => void;
  loading?: boolean;
}

const MotionDialog = motion(Dialog);

// Track which projects have already requested server-side seeking options.
// This avoids duplicate network calls caused by React StrictMode (double
// mount/unmount in development) or repeated function references from parents.
const seekingOptionsLoaded = new Set<string>();

const CollaborationModal: React.FC<CollaborationModalProps> = ({
  project,
  seekingOptions = [],
  onLoadSeekingOptions,
  onClose,
  onSubmit,
  loading = false,
}) => {
  const { actionLoading } = useShowcase();
  // actionLoading may optionally contain a `seekingOptions` flag; keep defensive typing
  const seekingOptionsLoading =
    (actionLoading as Record<string, unknown>)['seekingOptions'] ?? false;

  const [message, setMessage] = useState('');
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  // local state kept for UI feedback (if needed). We don't need a "seekingLoaded"
  // flag for preventing duplicate loads because we use the module-level set.
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading || isSubmitting) return;
    setIsSubmitting(true);

    // If user selected roles, append them to the message so backend receives that context
    const finalMessage =
      (message.trim() || '') +
      (selectedRoles.length
        ? `\n\nI can help with: ${selectedRoles.join(', ')}`
        : '');

    try {
      await onSubmit({ message: finalMessage.trim() || undefined });
      setMessage('');
      onClose();
    } catch (err) {
      // Keep modal open on error to allow retry. The parent should provide
      // its own error handling/notification. Log for debugging.
      console.error('Failed to submit collaboration request', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    // Only request server-side seeking options once per project.
    // Use a module-level set to avoid duplicate calls caused by StrictMode
    // or changing handler references from parent components.
    if (!onLoadSeekingOptions) return;

    const p = project as unknown as {
      id?: string | number;
      title?: string;
      seekingCollaboration?: boolean;
    };

    const key = p.id ?? p.title ?? 'unknown-project';
    if (
      !seekingOptionsLoaded.has(String(key)) &&
      p.seekingCollaboration === true
    ) {
      seekingOptionsLoaded.add(String(key));
      onLoadSeekingOptions();
    }

    // Intentionally keep dependency list minimal: run once when mounted.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onLoadSeekingOptions]);

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
        {/* Seeking options (roles/skills) */}
        <Box sx={{ mb: 1 }}>
          <Typography variant="subtitle2" color="black" sx={{ mb: 1 }}>
            What help does this project need?
          </Typography>
          <Box
            sx={{
              display: 'flex',
              gap: 1,
              flexWrap: 'wrap',
              alignItems: 'center',
            }}
          >
            {seekingOptionsLoading ? (
              <CircularProgress size={20} color="primary" />
            ) : (
              (() => {
                // Determine a safe array of options to render.
                const serverOpts = Array.isArray(seekingOptions)
                  ? seekingOptions
                  : [];
                const projAny = project as unknown as Record<string, unknown>;
                const projectOpts = Array.isArray(project.seeking)
                  ? project.seeking
                  : Array.isArray(projAny.seekingCollaboration)
                    ? (projAny.seekingCollaboration as string[])
                    : [];

                // If project.seekingCollaboration is a boolean true it signals "load server options".
                const wantsServerOptions =
                  projAny.seekingCollaboration === true;

                const optsToShow = serverOpts.length ? serverOpts : projectOpts;

                if (optsToShow.length === 0) {
                  // If the project requests server options but none are available yet, show a subtle hint.
                  return (
                    <Typography variant="body2" color="text.secondary">
                      {wantsServerOptions
                        ? 'No roles available yet — the project is asking for contributors.'
                        : 'No specific roles listed.'}
                    </Typography>
                  );
                }

                return optsToShow.map((opt) => (
                  <Button
                    key={opt}
                    size="small"
                    variant={
                      selectedRoles.includes(opt) ? 'contained' : 'outlined'
                    }
                    onClick={() => {
                      setSelectedRoles((prev) =>
                        prev.includes(opt)
                          ? prev.filter((p) => p !== opt)
                          : [...prev, opt]
                      );
                    }}
                    sx={{ textTransform: 'none' }}
                  >
                    {opt}
                  </Button>
                ));
              })()
            )}
          </Box>
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ display: 'block', mt: 1 }}
          >
            Select any roles that match your skills — selected roles will be
            appended to your message.
          </Typography>
        </Box>

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
        <Typography variant="caption" color="text.secondary">
          Minimum 20 words. You can also select roles above and submit a shorter
          message.
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
          disabled={
            loading ||
            (message.trim().split(/\s+/).filter(Boolean).length < 20 &&
              selectedRoles.length === 0)
          }
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
