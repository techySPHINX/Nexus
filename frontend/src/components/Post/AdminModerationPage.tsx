import React, { useEffect } from 'react';
import { usePosts } from '../../contexts/PostContext';
import { Post } from '../../pages/Post';
import { Box, Typography, Button, CircularProgress } from '@mui/material';

export const AdminModerationPage: React.FC = () => {
  const { pendingPosts, getPendingPosts, pagination, loading } = usePosts();

  useEffect(() => {
    getPendingPosts();
  }, [getPendingPosts]);

  const handleLoadMore = () => {
    getPendingPosts(pagination.page + 1);
  };

  return (
    <Box sx={{ maxWidth: '800px', margin: '0 auto', p: 2 }}>
      <Typography variant="h4" gutterBottom>
        Post Moderation
      </Typography>
      <Typography variant="subtitle1" color="text.secondary" gutterBottom>
        Review and approve or reject pending posts
      </Typography>
      
      {loading && pagination.page === 1 ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <CircularProgress />
        </Box>
      ) : pendingPosts.length === 0 ? (
        <Typography variant="body1" sx={{ mt: 2 }}>
          No pending posts to moderate.
        </Typography>
      ) : (
        <>
          {pendingPosts.map((post) => (
            <Post key={post.id} post={post} isAdminView showActions={false} />
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
  );
};