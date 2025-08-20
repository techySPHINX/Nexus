import React, { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { usePosts } from '../../contexts/PostContext';
import { Post } from '../../pages/Post';
import { Box, CircularProgress, Typography, Button } from '@mui/material';
import { Link } from 'react-router-dom';

export const PostDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { currentPost, getPost, loading } = usePosts();

  useEffect(() => {
    if (id) {
      getPost(id);
    }
  }, [id, getPost]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!currentPost) {
    return (
      <Box sx={{ textAlign: 'center', mt: 4 }}>
        <Typography variant="h5" gutterBottom>
          Post not found
        </Typography>
        <Button component={Link} to="/" variant="contained">
          Back to Feed
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: '800px', margin: '0 auto', p: 2 }}>
      <Post post={currentPost} />
    </Box>
  );
};