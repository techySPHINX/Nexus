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
  Container,
} from '@mui/material';
import {
  People,
  Article,
  Public,
  Lock,
  ArrowBack,
  Add,
} from '@mui/icons-material';
import { CreatePostForm } from '../../components/Post/CreatePostForm';
import { Post } from '../../components/Post/Post';
import { getErrorMessage } from '@/utils/errorHandler';
import { Link } from 'react-router-dom';
import { useTheme } from '@mui/material/styles';

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
  const theme = useTheme();
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
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4, py: 4 }}>
          <CircularProgress size={40} />
        </Box>
      );
    }

    if (!subCommunityFeed || subCommunityFeed.length === 0) {
      return (
        <Box
          sx={{
            textAlign: 'center',
            py: 6,
            bgcolor: 'background.paper',
            borderRadius: 2,
          }}
        >
          <Article sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No posts yet
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Be the first to share something in this community!
          </Typography>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => setOpenForm(true)}
          >
            Create First Post
          </Button>
        </Box>
      );
    }

    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {subCommunityFeed.map((post) => (
          <Post
            key={post.id}
            post={post}
            onClick={() =>
              navigate(`/posts/${post.id}`, {
                state: { from: `/sub-communities/${id}` },
              })
            }
          />
        ))}
      </Box>
    );
  };

  if (subCommunityLoading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '60vh',
        }}
      >
        <CircularProgress size={60} />
      </Box>
    );
  }

  if (!currentSubCommunity) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="h4" color="error" gutterBottom>
            Community not found
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            The community you&apos;re looking for doesn&apos;t exist or may have
            been removed.
          </Typography>
          <Button
            component={Link}
            to="/subcommunities"
            variant="contained"
            startIcon={<ArrowBack />}
            size="large"
          >
            Back to Communities
          </Button>
        </Box>
      </Container>
    );
  }

  return (
    <>
      <Box sx={{ maxWidth: '1200px', margin: '0 auto', p: { xs: 1, sm: 2 } }}>
        {/* Breadcrumbs */}
        <Button
          component={Link}
          to="/subcommunities"
          startIcon={<ArrowBack />}
          sx={{ mt: 2, mb: 3 }}
          variant="outlined"
          size="small"
        >
          Back to Communities
        </Button>

        {/* Community Header with Banner */}
        <Box
          sx={{
            mb: 4,
            borderRadius: 3,
            overflow: 'hidden',
            boxShadow: 2,
            position: 'relative',
          }}
        >
          {/* Banner Image */}
          <Box
            sx={{
              height: { xs: 120, md: 160 },
              backgroundImage: `url(${currentSubCommunity.bannerUrl})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              position: 'relative',
              '&::before': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background:
                  'linear-gradient(to bottom, rgba(27, 228, 9, 0.3), rgba(149, 240, 129, 0.7))',
              },
            }}
          />

          {/* Community Info Overlay */}
          <Box
            sx={{
              p: 3,
              bgcolor: 'background.paper',
              position: 'relative',
            }}
          >
            <Box
              sx={{
                display: 'flex',
                flexDirection: { xs: 'column', md: 'row' },
                justifyContent: 'space-between',
                alignItems: { xs: 'flex-start', md: 'center' },
                gap: 2,
              }}
            >
              {/* Left Side - Community Info */}
              <Box sx={{ flex: 1 }}>
                <Box
                  sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}
                >
                  <Avatar
                    src={currentSubCommunity?.iconUrl ?? undefined}
                    sx={{
                      width: 64,
                      height: 64,
                      border: `3px solid ${theme.palette.background.paper}`,
                      boxShadow: 2,
                    }}
                  />
                  <Box>
                    <Typography
                      variant="h3"
                      component="h1"
                      sx={{ fontWeight: 700, mb: 1 }}
                    >
                      r/{currentSubCommunity.name}
                    </Typography>
                    <Typography
                      variant="body1"
                      color="text.secondary"
                      sx={{ mb: 2 }}
                    >
                      {currentSubCommunity.description}
                    </Typography>
                  </Box>
                </Box>

                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  <Chip
                    icon={currentSubCommunity.isPrivate ? <Lock /> : <Public />}
                    label={
                      currentSubCommunity.isPrivate
                        ? 'Private Community'
                        : 'Public Community'
                    }
                    size="medium"
                    color={
                      currentSubCommunity.isPrivate ? 'default' : 'primary'
                    }
                    sx={{ fontWeight: 600 }}
                  />
                  <Chip
                    icon={<People />}
                    label={`${currentSubCommunity._count?.members?.toLocaleString() || 0} members`}
                    size="medium"
                    variant="outlined"
                  />
                  <Chip
                    icon={<Article />}
                    label={`${currentSubCommunity._count?.posts?.toLocaleString() || 0} posts`}
                    size="medium"
                    variant="outlined"
                  />
                </Box>
              </Box>

              {/* Right Side - Actions */}
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 1,
                  minWidth: '200px',
                }}
              >
                {currentSubCommunity.owner && (
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                      mb: 1,
                    }}
                  >
                    <Avatar sx={{ width: 32, height: 32 }} />
                    <Typography variant="body2" color="text.secondary">
                      Owned by u/{currentSubCommunity.owner.name}
                    </Typography>
                  </Box>
                )}

                {/* Join/Request to Join Buttons */}
                {!isMember && currentSubCommunity.isPrivate && (
                  <Button
                    variant="contained"
                    onClick={handleJoinRequest}
                    disabled={hasPendingRequest}
                    size="large"
                    startIcon={<Lock />}
                    sx={{ borderRadius: 2, fontWeight: 600 }}
                  >
                    {hasPendingRequest ? 'Request Pending' : 'Request to Join'}
                  </Button>
                )}

                {!isMember && !currentSubCommunity.isPrivate && (
                  <Button
                    variant="contained"
                    onClick={handleJoinRequest}
                    disabled={hasPendingRequest}
                    size="large"
                    startIcon={<People />}
                    sx={{ borderRadius: 2, fontWeight: 600 }}
                  >
                    Join Community
                  </Button>
                )}

                {/* Create Post Button (for members) */}
                {(isMember || !currentSubCommunity.isPrivate) && (
                  <Button
                    variant="contained"
                    onClick={() => setOpenForm(true)}
                    size="large"
                    startIcon={<Add />}
                    sx={{ borderRadius: 2, fontWeight: 600 }}
                  >
                    Create Post
                  </Button>
                )}

                {/* Leave Community Button (for members) */}
                {isMember && (
                  <Button
                    variant="outlined"
                    onClick={handleJoinRequest} // You'll need to implement leave functionality
                    size="small"
                    sx={{ borderRadius: 2, fontWeight: 600, mt: 1 }}
                  >
                    Leave Community
                  </Button>
                )}
              </Box>
            </Box>
          </Box>
        </Box>

        {/* Feed Content */}
        {isMember || !currentSubCommunity.isPrivate ? (
          <>
            {renderPosts()}

            {pagination.hasNext && (
              <Box
                sx={{ display: 'flex', justifyContent: 'center', mt: 4, py: 2 }}
              >
                <Button
                  variant="outlined"
                  onClick={handleLoadMore}
                  disabled={feedLoading}
                  size="large"
                  sx={{ borderRadius: 2, minWidth: '200px' }}
                >
                  {feedLoading ? (
                    <CircularProgress size={24} />
                  ) : (
                    'Load More Posts'
                  )}
                </Button>
              </Box>
            )}
          </>
        ) : (
          <Box
            sx={{
              textAlign: 'center',
              p: 6,
              bgcolor: 'background.paper',
              borderRadius: 3,
              boxShadow: 1,
            }}
          >
            <Lock sx={{ fontSize: 64, color: 'text.secondary', mb: 3 }} />
            <Typography variant="h5" gutterBottom sx={{ fontWeight: 600 }}>
              Private Community
            </Typography>
            <Typography
              variant="body1"
              color="text.secondary"
              sx={{ mb: 4, maxWidth: '400px', mx: 'auto' }}
            >
              This community is private. You need to be an approved member to
              view and participate in discussions.
            </Typography>
            <Button
              variant="contained"
              onClick={handleJoinRequest}
              disabled={hasPendingRequest}
              size="large"
              startIcon={<Lock />}
              sx={{ borderRadius: 2, fontWeight: 600, px: 4 }}
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
          PaperProps={{
            sx: { borderRadius: 3 },
          }}
        >
          <DialogTitle
            sx={{
              bgcolor: 'primary.main',
              color: 'white',
              fontWeight: 600,
              fontSize: '1.2rem',
            }}
          >
            Create Post in r/{currentSubCommunity.name}
          </DialogTitle>
          <DialogContent sx={{ p: 3, minHeight: '400px' }}>
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
        autoHideDuration={4000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSnackbarOpen(false)}
          severity={snackbarSeverity}
          sx={{
            width: '100%',
            borderRadius: 2,
            fontWeight: 500,
          }}
          elevation={6}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </>
  );
};
