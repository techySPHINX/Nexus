import React, { useState, useCallback } from 'react';
import { usePosts } from '../../contexts/PostContext';
import { useAuth } from '../../contexts/AuthContext';
import {
  Box,
  TextField,
  Button,
  IconButton,
  Divider,
  Chip,
  Snackbar,
  Alert,
  CircularProgress,
} from '@mui/material';
import { Image, Close, Cancel } from '@mui/icons-material';
import { getErrorMessage } from '@/utils/errorHandler';
import { ProfileNameLink } from '@/utils/ProfileNameLink';
import { SubCommunityRole } from '@/types/subCommunity';

export interface Profile {
  id: string;
  bio?: string | null;
  location?: string | null;
  interests?: string | null;
  avatarUrl?: string | null;
}

interface CreatePostFormProps {
  subCommunityId?: string;
  subCommunityName?: string;
  onSuccess?: () => void;
  onError?: (error: unknown) => void;
  onCancel?: () => void;
  profile?: Pick<Profile, 'id' | 'avatarUrl'>;
  userRole?: SubCommunityRole | null;
}

export const CreatePostForm: React.FC<CreatePostFormProps> = ({
  subCommunityId,
  subCommunityName,
  onSuccess,
  onError,
  onCancel,
  profile,
  userRole,
}) => {
  console.log('Profile prop in CreatePostForm:', profile);
  const { user } = useAuth();
  const { createPost, clearError } = usePosts();
  const [content, setContent] = useState('');
  const [subject, setSubject] = useState('');
  const [type, setType] = useState<'DISCUSSION' | 'QUESTION' | 'UPDATE'>('UPDATE');
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

    if (!subject.trim()) {
      showSnackbar('Please provide a subject for your post.', 'error');
      return;
    }

    if (!content.trim()) {
      showSnackbar('Please provide content for your post.', 'error');
      return;
    }

    setIsSubmitting(true);
    clearError();

    try {
      await createPost(subject, content, image || undefined, subCommunityId, type);

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

  const isFormEmpty = !subject.trim() && !content.trim() && !image;

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ width: '100%' }}>
      <Box sx={{ mb: 3, p: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <ProfileNameLink
            user={{
              id: user?.id,
              name: user?.name,
              profile: {
                avatarUrl: profile?.avatarUrl ?? undefined,
              },
            }}
            showAvatar={true}
            showYouBadge={false}
            linkToProfile={false}
            variant="subtitle1"
            fontSize="1.2rem"
            fontWeight={500}
            avatarSize={45}
          />
        </Box>

        <TextField
          fullWidth
          multiline
          rows={2}
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
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

        <TextField
          fullWidth
          multiline
          rows={4}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Write your post content here..."
          variant="outlined"
          sx={{
            mb: 2,
            '& .MuiOutlinedInput-root': {
              borderRadius: 2,
            },
          }}
          disabled={isSubmitting}
        />

        <Box sx={{ mb: 2 }}>
          <Box
            sx={{
              display: 'flex',
              overflowX: 'auto',
              gap: 1,
              pb: 1,
              '&::-webkit-scrollbar': { height: 6 },
              '&::-webkit-scrollbar-thumb': { bgcolor: 'grey.300', borderRadius: 3 },
            }}
          >
            {[
              { label: 'Discussion', value: 'DISCUSSION' },
              { label: 'Question', value: 'QUESTION' },
              // Only show Announcement if user is owner, admin, or moderator
              ...(userRole === 'OWNER' || user?.role === 'ADMIN' || userRole === 'MODERATOR'
          ? [{ label: 'Announcement', value: 'ANNOUNCEMENT' },
              { label: 'Update', value: 'UPDATE' },
          ]
          : []),
            ].map((option) => (
              <Chip
          key={option.value}
          label={option.label}
          color={type === option.value ? 'primary' : 'default'}
          variant={type === option.value ? 'filled' : 'outlined'}
          clickable
          onClick={() => setType(option.value as typeof type)}
          sx={{
            fontWeight: type === option.value ? 600 : 400,
            fontSize: '1rem',
            px: 2,
          }}
          disabled={isSubmitting}
              />
            ))}
          </Box>
        </Box>

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

            {subCommunityName && (
              <Chip
                label={`Community: c/${subCommunityName}`}
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
