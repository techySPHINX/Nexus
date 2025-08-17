import React, { useEffect, useState } from 'react';
import { usePosts } from '../../contexts/PostContext';
import { useProfile } from '../../contexts/ProfileContext';
import { Post } from '../../pages/Post';
import { Box, Typography, Button, CircularProgress, Dialog, DialogTitle, DialogContent, Snackbar, Alert } from '@mui/material';
import { CreatePostForm } from '../Post/CreatePostForm';

export const FeedPage: React.FC = () => {
  const { feed, getFeed, pagination, loading } = usePosts();
  const {profile, refreshProfile} = useProfile();
  const [openForm, setOpenForm] = React.useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error'>('success');

  const showSnackbar = (message: string, severity: 'success' | 'error') => {
    console.log("Snackbar called with:", message, severity);
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
  };

  useEffect(() => {
    getFeed();
    refreshProfile();
  }, [getFeed]);

  const handleLoadMore = () => {
    getFeed(pagination.page + 1);
  };

  return (
    <>
      <Box sx={{ maxWidth: '800px', margin: '0 auto', p: 2 }}>
        <Typography variant="h4" gutterBottom>
          Your Feed
        </Typography>
        <Button
          variant="contained"
          onClick={() => setOpenForm(true)}
          sx={{ mb: 2 }}
        >
          Create Post
        </Button>
        <Dialog open={openForm} onClose={() => setOpenForm(false)}>
          <DialogTitle>Create a New Post</DialogTitle>
          <DialogContent sx={{ minWidth: '600px', maxWidth: '800px', minHeight: '60vh', maxHeight: '80vh', overflowY: 'auto' }}>
            <CreatePostForm profile={profile ?? undefined}
              onSuccess={() => {
                setOpenForm(false);
                showSnackbar('Post created successfully!', 'success');
                getFeed(1);
              }}
              onError={() => {
                showSnackbar('Failed to create post. Please try again.', 'error');
              }}
            />
          </DialogContent>
        </Dialog>

        {loading && pagination.page === 1 ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
            <CircularProgress />
          </Box>
        ) : feed.length === 0 ? (
          <Typography variant="body1" sx={{ mt: 2 }}>
            No posts to show. Follow more people or communities to see posts in your feed.
          </Typography>
        ) : (
          <>
            {feed.map((post) => (
              <Post key={post.id} post={post} />
            ))}

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