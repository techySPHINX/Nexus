import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePosts } from '../../contexts/PostContext';
import { useProfile } from '../../contexts/ProfileContext';
import { useAuth } from '../../contexts/AuthContext';
import { Post } from '../../components/Post/Post';
import {
  Box,
  Typography,
  Button,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  Snackbar,
  Alert,
} from '@mui/material';
import { CreatePostForm } from '../../components/Post/CreatePostForm';
import { getErrorMessage } from '@/utils/errorHandler';

export const FeedPage: React.FC = () => {
  const { feed, getFeed, pagination, loading, error, clearError } = usePosts();
  const { user } = useAuth();
  const { profile, refreshProfile } = useProfile();
  const [openForm, setOpenForm] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error'>(
    'success'
  );
  const navigate = useNavigate();

  const showSnackbar = useCallback(
    (message: string, severity: 'success' | 'error') => {
      setSnackbarMessage(message);
      setSnackbarSeverity(severity);
      setSnackbarOpen(true);
    },
    []
  );

  useEffect(() => {
    getFeed();
    refreshProfile();
  }, [getFeed, refreshProfile]);

  useEffect(() => {
    if (error) {
      showSnackbar(error, 'error');
      clearError();
    }
  }, [error, showSnackbar, clearError]);

  const handleLoadMore = () => {
    getFeed(pagination.page + 1);
  };

  const handleCreatePostSuccess = useCallback(() => {
    setOpenForm(false);
    showSnackbar('Post created successfully!', 'success');
    getFeed(1);
  }, [getFeed, showSnackbar]);

  const handleCreatePostError = useCallback(
    (error: unknown) => {
      const errorMessage = getErrorMessage(error);
      showSnackbar(errorMessage, 'error');
    },
    [showSnackbar]
  );

  // In FeedPage.tsx, replace the renderPosts function with:
  const renderPosts = () => {
    if (!feed || feed.length === 0) {
      return (
        <Typography variant="body1" sx={{ mt: 2 }}>
          No posts to show. Follow more people or communities to see posts in
          your feed.
        </Typography>
      );
    }

    return feed.map((post) => {
      if (!post || !post.id) {
        console.warn('Invalid post object:', post);
        return null;
      }

      return (
        <Post
          key={post.id}
          post={post}
          onClick={() =>
            navigate(`/posts/${post.id}`, {
              state: { from: '/feed' },
            })
          }
        />
      );
    });
  };

  return (
    <>
      <Box sx={{ maxWidth: '800px', margin: '0 auto', p: 2 }}>
        <Typography variant="h4" gutterBottom>
          Your Feed
        </Typography>
        {(user?.role === 'ALUM' || user?.role === 'ADMIN') && (
          <>
            <Button
              variant="contained"
              onClick={() => setOpenForm(true)}
              sx={{ mb: 2 }}
            >
              Create Post
            </Button>
            <Dialog
              open={openForm}
              onClose={() => setOpenForm(false)}
              maxWidth="md"
              fullWidth
            >
              <DialogTitle>Create a New Post</DialogTitle>
              <DialogContent
                sx={{
                  minHeight: '400px',
                  overflowY: 'auto',
                }}
              >
                <CreatePostForm
                  profile={profile ?? undefined}
                  onSuccess={handleCreatePostSuccess}
                  onError={handleCreatePostError}
                  onCancel={() => setOpenForm(false)}
                />
              </DialogContent>
            </Dialog>
          </>
        )}

        {loading && pagination.page === 1 ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            {renderPosts()}

            {pagination.hasNext && (
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                <Button
                  variant="outlined"
                  onClick={handleLoadMore}
                  disabled={loading}
                >
                  {loading ? <CircularProgress size={24} /> : 'Load More'}
                </Button>
              </Box>
            )}
          </>
        )}
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
