import React, { useState } from 'react';
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
} from '@mui/material';
import { Image, Close } from '@mui/icons-material';

export interface Profile {
  id: string;
  bio?: string | null;
  location?: string | null;
  interests?: string | null;
  avatarUrl?: string | null;
  // skills: Skill[];
  // endorsements: Endorsement[];
  // user: User;
}

interface CreatePostFormProps {
  subCommunityId?: string;
  onSuccess?: () => void;
  onError?: (error: any) => void; // 👈 add this
  profile?: Pick<Profile, "id" | "avatarUrl">; // 👈 only id + avatarUrl
}

export const CreatePostForm: React.FC<CreatePostFormProps> = ({
  subCommunityId,
  onSuccess,
  onError,
  profile
}) => {
  const { user } = useAuth();
  const { createPost } = usePosts();
  const [content, setContent] = useState('');
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error'>('success');

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      // Optional: validate type
      // if (!file.type.startsWith("image/")) {
      //   showSnackbar("Please select a valid image file.", "error");
      //   return;
      // }
      setImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
        // ✅ Success notification
        showSnackbar("Image added successfully!", "success");
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setImage(null);
    setImagePreview(null);
    showSnackbar('Image removed', 'success');
  };

  const showSnackbar = (message: string, severity: 'success' | 'error') => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
  };

  const handleSubmit = async () => {
    if (!content.trim()) return;

    setIsSubmitting(true);
    try {
      await createPost(content, image || undefined, subCommunityId);
      setContent('');
      setImage(null);
      setImagePreview(null);
      if (onSuccess)
        onSuccess();
    } catch (error) {
      console.error('Error creating post:', error);
      if (onError) onError(error); // 👈 call error handler
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Box sx={{ mb: 3, p: 2, border: '1px solid #eee', borderRadius: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Avatar src={profile?.avatarUrl ?? undefined} sx={{ bgcolor: 'primary.light' }}>
            {user?.name?.charAt(0) || 'U'}
          </Avatar>
          <Typography variant="subtitle1" sx={{ ml: 2 }}>
            What's on your mind?
          </Typography>
        </Box>

        <TextField
          fullWidth
          multiline
          rows={3}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Share your thoughts..."
          variant="outlined"
          sx={{ mb: 2 }}
        />

        {imagePreview && (
          <Box sx={{ position: 'relative', mb: 2 }}>
            <img
              src={imagePreview}
              alt="Preview"
              style={{ maxWidth: '100%', maxHeight: '300px', borderRadius: '8px' }}
            />
            <IconButton
              onClick={handleRemoveImage}
              sx={{ position: 'absolute', top: 8, right: 8, bgcolor: 'rgba(0,0,0,0.5)' }}
            >
              <Close sx={{ color: 'white' }} />
            </IconButton>
          </Box>
        )}

        <Divider sx={{ my: 2 }} />

        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <input
            accept="image/*"
            style={{ display: 'none' }}
            id="post-image-upload"
            type="file"
            onChange={handleImageChange}
          />
          <label htmlFor="post-image-upload">
            <span style={{color:"green",fontSize:"large"}}>+</span>
            <Button
              component="span"
              startIcon={<Image />}
              sx={{ textTransform: 'none' }}
            >
              Photo
            </Button>
          </label>

          {subCommunityId && (
            <Chip label={`Posting to: ${subCommunityId}`} size="small" />
          )}

          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={!content.trim() || isSubmitting}
          >
            {isSubmitting ? 'Posting...' : 'Post'}
          </Button>
        </Box>
      </Box>
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={() => setSnackbarOpen(false)}
          severity={snackbarSeverity}
          sx={{ width: '100%' }}
          elevation={6}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </>
  );
};