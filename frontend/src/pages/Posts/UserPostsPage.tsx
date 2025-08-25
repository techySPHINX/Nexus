import React, { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { usePosts } from '../../contexts/PostContext';
import { Post } from '../../components/Post/Post';
import { Box, Typography, Button, CircularProgress } from '@mui/material';

export const UserPostsPage: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const { userPosts, getUserPosts, pagination, loading } = usePosts();

  useEffect(() => {
    if (userId) {
      getUserPosts(userId);
    }
  }, [userId, getUserPosts]);

  const handleLoadMore = () => {
    if (userId) {
      getUserPosts(userId, pagination.page + 1);
    }
  };

  return (
    <Box sx={{ maxWidth: '800px', margin: '0 auto', p: 2 }}>
      <Typography variant="h4" gutterBottom>
        User&apos;s Posts
      </Typography>

      {loading && pagination.page === 1 ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <CircularProgress />
        </Box>
      ) : userPosts.length === 0 ? (
        <Typography variant="body1" sx={{ mt: 2 }}>
          This user hasn&apos;t posted anything yet.
        </Typography>
      ) : (
        <>
          {userPosts.map((post) => (
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
  );
};
