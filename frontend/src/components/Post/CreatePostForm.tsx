import React, { useState, useCallback } from 'react';
import { usePosts } from '../../contexts/PostContext';
import { useAuth } from '../../contexts/AuthContext';
import {
  Box,
  TextField,
  Button,
  IconButton,
  Avatar,
  Divider,
  Chip,
  Typography,
  Snackbar,
  Alert,
  CircularProgress,
} from '@mui/material';
import { Image, Close, Cancel } from '@mui/icons-material';
import { getErrorMessage } from '@/utils/errorHandler';

export interface Profile {
  id: string;
  bio?: string | null;
  location?: string | null;
  interests?: string | null;
  avatarUrl?: string | null;
}

interface CreatePostFormProps {
  subCommunityId?: string;
  onSuccess?: () => void;
  onError?: (error: unknown) => void;
  onCancel?: () => void;
  profile?: Pick<Profile, 'id' | 'avatarUrl'>;
}

export const CreatePostForm: React.FC<CreatePostFormProps> = ({
  subCommunityId,
  onSuccess,
  onError,
  onCancel,
  profile,
}) => {
  const { user } = useAuth();
  const { createPost, clearError } = usePosts();
  const [content, setContent] = useState('');
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<
    'success' | 'error' | 'info'
  >('success');

  const showSnackbar = useCallback(
    (message: string, severity: 'success' | 'error' | 'info') => {
      setSnackbarMessage(message);
      setSnackbarSeverity(severity);
      setSnackbarOpen(true);
    },
    []
  );

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];

      // Validate file type
      if (!file.type.startsWith('image/')) {
        showSnackbar(
          'Please select a valid image file (JPEG, PNG, GIF).',
          'error'
        );
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        showSnackbar('Image size must be less than 5MB.', 'error');
        return;
      }

      setImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
        showSnackbar('Image added successfully!', 'success');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setImage(null);
    setImagePreview(null);
    showSnackbar('Image removed', 'info');
  };

  const handleCloseSnackbar = () => {
    setSnackbarOpen(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!content.trim()) {
      showSnackbar('Please write something to post.', 'error');
      return;
    }

    setIsSubmitting(true);
    clearError();

    try {
      await createPost(content, image || undefined, subCommunityId);

      // Reset form
      setContent('');
      setImage(null);
      setImagePreview(null);

      showSnackbar(
        'Post created successfully and sent for approval!',
        'success'
      );

      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('Error creating post:', error);
      const errorMessage = getErrorMessage(error);
      showSnackbar(errorMessage, 'error');

      if (onError) {
        onError(error);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    }
  };

  const isFormEmpty = !content.trim() && !image;

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ width: '100%' }}>
      <Box sx={{ mb: 3, p: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Avatar
            src={profile?.avatarUrl ?? undefined}
            sx={{
              bgcolor: 'primary.light',
              width: 48,
              height: 48,
            }}
          >
            {user?.name?.charAt(0) || 'U'}
          </Avatar>
          <Typography variant="subtitle1" sx={{ ml: 2, fontWeight: 500 }}>
            {user?.name || 'User'}
          </Typography>
        </Box>

        <TextField
          fullWidth
          multiline
          rows={4}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="What's on your mind?"
          variant="outlined"
          sx={{
            mb: 2,
            '& .MuiOutlinedInput-root': {
              borderRadius: 2,
            },
          }}
          disabled={isSubmitting}
        />

        {imagePreview && (
          <Box sx={{ position: 'relative', mb: 2 }}>
            <img
              src={imagePreview}
              alt="Preview"
              style={{
                width: '100%',
                maxHeight: '300px',
                borderRadius: '8px',
                objectFit: 'cover',
              }}
            />
            <IconButton
              onClick={handleRemoveImage}
              sx={{
                position: 'absolute',
                top: 8,
                right: 8,
                bgcolor: 'rgba(0,0,0,0.7)',
                '&:hover': {
                  bgcolor: 'rgba(0,0,0,0.9)',
                },
              }}
              disabled={isSubmitting}
            >
              <Close sx={{ color: 'white', fontSize: 20 }} />
            </IconButton>
          </Box>
        )}

        <Divider sx={{ my: 2 }} />

        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <input
              accept="image/*"
              style={{ display: 'none' }}
              id="post-image-upload"
              type="file"
              onChange={handleImageChange}
              disabled={isSubmitting}
            />
            <label htmlFor="post-image-upload">
              <Button
                component="span"
                startIcon={<Image />}
                sx={{
                  textTransform: 'none',
                  color: 'text.secondary',
                }}
                disabled={isSubmitting}
              >
                Add Photo
              </Button>
            </label>

            {subCommunityId && (
              <Chip
                label={`Community: ${subCommunityId}`}
                size="small"
                color="primary"
                variant="outlined"
              />
            )}
          </Box>

          <Box sx={{ display: 'flex', gap: 1 }}>
            {onCancel && (
              <Button
                variant="outlined"
                onClick={handleCancel}
                disabled={isSubmitting}
                startIcon={<Cancel />}
              >
                Cancel
              </Button>
            )}
            <Button
              type="submit"
              variant="contained"
              disabled={isFormEmpty || isSubmitting}
              sx={{ minWidth: 100 }}
            >
              {isSubmitting ? <CircularProgress size={24} /> : 'Post'}
            </Button>
          </Box>
        </Box>
      </Box>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={4000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbarSeverity}
          sx={{ width: '100%' }}
          elevation={6}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};
