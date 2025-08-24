import React, { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { usePosts } from '../contexts/PostContext';
import { Post } from '../components/Post/Post';
import { Box, Typography, Button, CircularProgress } from '@mui/material';
import { CreatePostForm } from '../components/Post/CreatePostForm';

export const SubCommunityPage: React.FC = () => {
  const { subCommunityId } = useParams<{ subCommunityId: string }>();
  const { subCommunityFeed, getSubCommunityFeed, pagination, loading } =
    usePosts();

  useEffect(() => {
    if (subCommunityId) {
      getSubCommunityFeed(subCommunityId);
    }
  }, [subCommunityId, getSubCommunityFeed]);

  const handleLoadMore = () => {
    if (subCommunityId) {
      getSubCommunityFeed(subCommunityId, pagination.page + 1);
    }
  };

  return (
    <Box sx={{ maxWidth: '800px', margin: '0 auto', p: 2 }}>
      <Typography variant="h4" gutterBottom>
        Sub-Community Feed
      </Typography>

      <CreatePostForm subCommunityId={subCommunityId} />

      {loading && pagination.page === 1 ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <CircularProgress />
        </Box>
      ) : subCommunityFeed.length === 0 ? (
        <Typography variant="body1" sx={{ mt: 2 }}>
          No posts in this sub-community yet. Be the first to post!
        </Typography>
      ) : (
        <>
          {subCommunityFeed.map((post) => (
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
