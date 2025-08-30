import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSubCommunity } from '../../contexts/SubCommunityContext';
import { useAuth } from '../../contexts/AuthContext';
import { usePosts } from '../../contexts/PostContext';
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
  Chip,
  Avatar,
  Breadcrumbs,
  Link as MuiLink,
} from '@mui/material';
import {
  People,
  Article,
  Public,
  Lock,
  ArrowBack,
  Home,
} from '@mui/icons-material';
import { CreatePostForm } from '../../components/Post/CreatePostForm';
import { Post } from '../../components/Post/Post';
import { getErrorMessage } from '@/utils/errorHandler';
import { Link } from 'react-router-dom';

export const SubCommunityFeedPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const {
    currentSubCommunity,
    getSubCommunity,
    loading: subCommunityLoading,
    error: subCommunityError,
    clearError,
    requestToJoin,
    joinRequests,
    getPendingJoinRequests,
  } = useSubCommunity();

  const {
    subCommunityFeed,
    getSubCommunityFeed,
    pagination,
    loading: feedLoading,
    error: feedError,
  } = usePosts();

  const { user } = useAuth();
  const [openForm, setOpenForm] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error'>(
    'success'
  );
  const [isMember, setIsMember] = useState(false);
  const [hasPendingRequest, setHasPendingRequest] = useState(false);

  const showSnackbar = useCallback(
    (message: string, severity: 'success' | 'error') => {
      setSnackbarMessage(message);
      setSnackbarSeverity(severity);
      setSnackbarOpen(true);
    },
    []
  );

  // Load sub-community data
  useEffect(() => {
    if (id) {
      getSubCommunity(id);
      getSubCommunityFeed(id);
    }
  }, [id, getSubCommunity, getSubCommunityFeed]);

  // Check if user is a member and has pending requests
  useEffect(() => {
    if (user && currentSubCommunity) {
      const member = currentSubCommunity.members?.find(
        (m) => m.userId === user.id
      );
      setIsMember(!!member);

      if (currentSubCommunity.isPrivate && !member) {
        getPendingJoinRequests(id!);
      }
    }
  }, [user, currentSubCommunity, id, getPendingJoinRequests]);

  // Check for pending join requests
  useEffect(() => {
    if (user && joinRequests.length > 0) {
      const userRequest = joinRequests.find((req) => req.userId === user.id);
      setHasPendingRequest(!!userRequest);
    }
  }, [user, joinRequests]);

  // Handle errors
  useEffect(() => {
    if (subCommunityError) {
      showSnackbar(subCommunityError, 'error');
      clearError();
    }

    if (feedError) {
      showSnackbar(feedError, 'error');
    }
  }, [subCommunityError, feedError, showSnackbar, clearError]);

  const handleLoadMore = () => {
    if (id && pagination.hasNext) {
      getSubCommunityFeed(id, pagination.page + 1);
    }
  };

  const handleCreatePostSuccess = useCallback(() => {
    setOpenForm(false);
    showSnackbar('Post created successfully!', 'success');
    if (id) {
      getSubCommunityFeed(id, 1); // Refresh feed
    }
  }, [getSubCommunityFeed, id, showSnackbar]);

  const handleCreatePostError = useCallback(
    (error: unknown) => {
      const errorMessage = getErrorMessage(error);
      showSnackbar(errorMessage, 'error');
    },
    [showSnackbar]
  );

  const handleJoinRequest = async () => {
    if (!id || !user) return;

    try {
      await requestToJoin(id);
      showSnackbar('Join request sent successfully!', 'success');
      setHasPendingRequest(true);
      // Refresh pending requests
      getPendingJoinRequests(id);
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      showSnackbar(errorMessage, 'error');
    }
  };

  const renderPosts = () => {
    if (feedLoading && pagination.page === 1) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <CircularProgress />
        </Box>
      );
    }

    if (!subCommunityFeed || subCommunityFeed.length === 0) {
      return (
        <Typography variant="body1" sx={{ mt: 2, textAlign: 'center' }}>
          No posts in this community yet. Be the first to post!
        </Typography>
      );
    }

    return subCommunityFeed.map((post) => (
      <Post
        key={post.id}
        post={post}
        onClick={() =>
          navigate(`/posts/${post.id}`, {
            state: { from: `/sub-communities/${id}` },
          })
        }
      />
    ));
  };

  if (subCommunityLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!currentSubCommunity) {
    return (
      <Box sx={{ maxWidth: '800px', margin: '0 auto', p: 2 }}>
        <Typography variant="h4" color="error">
          Community not found
        </Typography>
        <Button
          component={Link}
          to="/sub-communities"
          startIcon={<ArrowBack />}
          sx={{ mt: 2 }}
        >
          Back to Communities
        </Button>
      </Box>
    );
  }

  return (
    <>
      <Box sx={{ maxWidth: '1200px', margin: '0 auto', p: 2 }}>
        {/* Breadcrumbs */}
        <Breadcrumbs sx={{ mb: 2 }}>
          <MuiLink
            component={Link}
            to="/"
            color="inherit"
            sx={{ display: 'flex', alignItems: 'center' }}
          >
            <Home sx={{ mr: 0.5 }} fontSize="inherit" />
            Home
          </MuiLink>
          <MuiLink component={Link} to="/sub-communities" color="inherit">
            Communities
          </MuiLink>
          <Typography color="text.primary">
            {currentSubCommunity.name}
          </Typography>
        </Breadcrumbs>

        {/* Community Header */}
        <Box
          sx={{
            mb: 4,
            p: 3,
            bgcolor: 'background.paper',
            borderRadius: 2,
            boxShadow: 1,
          }}
        >
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              mb: 2,
            }}
          >
            <Box>
              <Typography variant="h3" component="h1" gutterBottom>
                {currentSubCommunity.name}
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
                {currentSubCommunity.description}
              </Typography>

              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <Chip
                  icon={currentSubCommunity.isPrivate ? <Lock /> : <Public />}
                  label={currentSubCommunity.isPrivate ? 'Private' : 'Public'}
                  size="small"
                  color={currentSubCommunity.isPrivate ? 'default' : 'primary'}
                />
                <Chip
                  icon={<People />}
                  label={`${currentSubCommunity._count?.members || 0} members`}
                  size="small"
                  variant="outlined"
                />
                <Chip
                  icon={<Article />}
                  label={`${currentSubCommunity._count?.posts || 0} posts`}
                  size="small"
                  variant="outlined"
                />
              </Box>
            </Box>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {currentSubCommunity.owner && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Avatar sx={{ width: 32, height: 32 }} />
                  <Typography variant="body2">
                    Owner: {currentSubCommunity.owner.name}
                  </Typography>
                </Box>
              )}

              {!isMember && currentSubCommunity.isPrivate && (
                <Button
                  variant="contained"
                  onClick={handleJoinRequest}
                  disabled={hasPendingRequest}
                >
                  {hasPendingRequest ? 'Request Pending' : 'Request to Join'}
                </Button>
              )}

              {(isMember || !currentSubCommunity.isPrivate) && (
                <Button variant="contained" onClick={() => setOpenForm(true)}>
                  Create Post
                </Button>
              )}
            </Box>
          </Box>
        </Box>

        {/* Feed Content */}
        {isMember || !currentSubCommunity.isPrivate ? (
          <>
            {renderPosts()}

            {pagination.hasNext && (
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                <Button
                  variant="outlined"
                  onClick={handleLoadMore}
                  disabled={feedLoading}
                >
                  {feedLoading ? <CircularProgress size={24} /> : 'Load More'}
                </Button>
              </Box>
            )}
          </>
        ) : (
          <Box
            sx={{
              textAlign: 'center',
              mt: 4,
              p: 4,
              bgcolor: 'background.paper',
              borderRadius: 2,
            }}
          >
            <Lock sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              This is a private community
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              You need to be a member to view posts in this community.
            </Typography>
            <Button
              variant="contained"
              onClick={handleJoinRequest}
              disabled={hasPendingRequest}
            >
              {hasPendingRequest ? 'Request Pending' : 'Request to Join'}
            </Button>
          </Box>
        )}

        {/* Create Post Dialog */}
        <Dialog
          open={openForm}
          onClose={() => setOpenForm(false)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>
            Create a New Post in {currentSubCommunity.name}
          </DialogTitle>
          <DialogContent sx={{ minHeight: '400px', overflowY: 'auto' }}>
            <CreatePostForm
              subCommunityId={currentSubCommunity.id}
              onSuccess={handleCreatePostSuccess}
              onError={handleCreatePostError}
              onCancel={() => setOpenForm(false)}
            />
          </DialogContent>
        </Dialog>
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
