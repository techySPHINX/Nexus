import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { usePosts } from '../../contexts/PostContext';
import { Post } from '../../components/Post/Post';
import { CommentSection } from '../../components/Post/CommentSection';
import {
  Box,
  CircularProgress,
  Typography,
  Button,
  Container,
  Alert,
} from '@mui/material';
import { Home, ArrowBack, Comment as CommentIcon } from '@mui/icons-material';

const PostDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { currentPost, getPost, loading, error } = usePosts();
  const [notFound, setNotFound] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  // const location = useLocation();
  const navigate = useNavigate();

  // Get the previous path from location state or default to '/feed'
  // const getBackPath = () => {
  //   // Check if we have a previous location in state
  //   if (location.state?.from) {
  //     return location.state.from;
  //   }

  //   // Default paths based on referrer or current path
  //   const referrer = document.referrer;
  //   const currentPath = location.pathname;

  //   // If coming from admin moderation
  //   if (
  //     referrer.includes('/admin/moderation') ||
  //     currentPath.includes('admin')
  //   ) {
  //     return '/admin/moderation';
  //   }

  //   // If coming from user posts
  //   if (referrer.includes('/user/') || currentPath.includes('user')) {
  //     // Try to extract userId from referrer or use generic path
  //     const userIdMatch = referrer.match(/\/user\/([^/]+)/);
  //     if (userIdMatch) {
  //       return `/user/${userIdMatch[1]}/posts`;
  //     }
  //     return '/';
  //   }

  //   // Default to feed
  //   return '/feed';
  // };

  // const getBackButtonText = () => {
  //   const backPath = getBackPath();

  //   if (backPath.includes('/admin/moderation')) {
  //     return 'Back to Moderation';
  //   }

  //   if (backPath.includes('/users/') && backPath.includes('/posts')) {
  //     return 'Back to User Posts';
  //   }

  //   if (backPath.includes('/user/')) {
  //     return 'Back to Profile';
  //   }

  //   return 'Back to Feed';
  // };

  useEffect(() => {
    if (id) {
      const fetchPost = async () => {
        try {
          console.log('Fetching post with ID:', id);
          setIsLoading(true);
          setNotFound(false);
          await getPost(id);
          console.log('Post fetched successfully');
        } catch (err) {
          console.error('Error fetching post:', err);
          setNotFound(true);
        } finally {
          setIsLoading(false);
        }
      };
      fetchPost();
    }
  }, [id, getPost]);

  const handleCommentAdded = () => {
    // Refresh the post to update comment count
    if (id) {
      getPost(id);
    }
  };

  if (isLoading || loading) {
    return (
      <Container maxWidth="lg">
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '60vh',
            flexDirection: 'column',
            gap: 2,
          }}
        >
          <CircularProgress size={60} />
          <Typography variant="body1" color="text.secondary">
            Loading post...
          </Typography>
        </Box>
      </Container>
    );
  }

  if (notFound || error || !currentPost) {
    return (
      <Container maxWidth="lg">
        <Box
          sx={{
            textAlign: 'center',
            mt: 8,
            minHeight: '60vh',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            gap: 3,
          }}
        >
          <Typography variant="h4" color="error" gutterBottom>
            Post Not Found
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            {error ||
              "The post you're looking for doesn't exist or may have been removed."}
          </Typography>
          <Box
            sx={{
              display: 'flex',
              gap: 2,
              flexWrap: 'wrap',
              justifyContent: 'center',
            }}
          >
            <Button
              component={Link}
              to="/"
              variant="contained"
              startIcon={<Home />}
              size="large"
            >
              Back to Home
            </Button>
          </Box>
        </Box>
      </Container>
    );
  }

  // const backPath = getBackPath();
  // const backButtonText = getBackButtonText();

  return (
    <Container maxWidth="md">
      {/* Back Button */}
      <Box sx={{ display: 'flex', justifyContent: 'flex-start', mt: 4 }}>
        <Button
          // component={Link}
          // to={backPath}
          onClick={() => navigate(-1)}
          variant="outlined"
          startIcon={<ArrowBack />}
          size="large"
          sx={{ mb: 4 }}
        >
          Back
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Post Content */}
      <Box sx={{ mb: 2 }}>
        <Post post={currentPost} showActions={true} />
      </Box>

      {/* Comments Section - Always visible on detail page */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <CommentIcon color="action" />
          <Typography variant="h6">
            Comments{' '}
            {currentPost._count?.Comment > 0 &&
              `(${currentPost._count.Comment})`}
          </Typography>
        </Box>
        <CommentSection
          postId={currentPost.id}
          onCommentAdded={handleCommentAdded}
        />
      </Box>
    </Container>
  );
};

export default PostDetailPage;
