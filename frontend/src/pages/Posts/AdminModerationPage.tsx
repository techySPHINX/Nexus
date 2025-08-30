import React, { useEffect, useState, useCallback } from 'react';
import { usePosts } from '../../contexts/PostContext';
import { Post } from '../../components/Post/Post';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Snackbar,
  Alert,
  Paper,
  Chip,
  Grid,
} from '@mui/material';
import { getErrorMessage } from '@/utils/errorHandler';
import {
  Refresh,
  CheckCircle,
  Cancel,
  ArrowUpward,
  ArrowDownward,
} from '@mui/icons-material';
import { Post as PostType } from '../../types/post';

export const AdminModerationPage: React.FC = () => {
  const {
    pendingPosts, // This should contain the posts from context
    getPendingPosts,
    pagination,
    loading,
    approvePost,
    rejectPost,
    error,
    clearError,
  } = usePosts();
  const navigate = useNavigate();

  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const [actionType, setActionType] = useState<'approve' | 'reject' | null>(
    null
  );
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error'>(
    'success'
  );
  const [sortBy, setSortBy] = useState<'newest' | 'oldest'>('newest');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [allPosts, setAllPosts] = useState<PostType[]>([]); // Store all loaded posts

  const showSnackbar = useCallback(
    (message: string, severity: 'success' | 'error') => {
      setSnackbarMessage(message);
      setSnackbarSeverity(severity);
      setSnackbarOpen(true);
    },
    []
  );

  const loadPosts = useCallback(
    async (page: number = 1, refresh: boolean = false) => {
      if (refresh) {
        setIsRefreshing(true);
      }
      try {
        await getPendingPosts(page, 10);
      } finally {
        if (refresh) {
          setIsRefreshing(false);
        }
      }
    },
    [getPendingPosts]
  );

  // Update allPosts when pendingPosts changes
  useEffect(() => {
    if (pagination.page === 1) {
      // First page, replace all posts
      setAllPosts(pendingPosts);
    } else {
      // Subsequent pages, append to existing posts (remove duplicates)
      setAllPosts((prev) => {
        const existingIds = new Set(prev.map((post) => post.id));
        const newPosts = pendingPosts.filter(
          (post) => !existingIds.has(post.id)
        );
        return [...prev, ...newPosts];
      });
    }
  }, [pendingPosts, pagination.page]);

  useEffect(() => {
    loadPosts(1);
  }, [loadPosts]);

  useEffect(() => {
    if (error) {
      showSnackbar(error, 'error');
      clearError();
    }
  }, [error, clearError, showSnackbar]);

  const handleLoadMore = () => {
    loadPosts(pagination.page + 1);
  };

  const handleRefresh = () => {
    loadPosts(1, true);
  };

  const handleSortChange = () => {
    setSortBy((prev) => (prev === 'newest' ? 'oldest' : 'newest'));
  };

  const handleApprove = (postId: string) => {
    setSelectedPostId(postId);
    setActionType('approve');
  };

  const handleReject = (postId: string) => {
    setSelectedPostId(postId);
    setActionType('reject');
  };

  const handleConfirmAction = async () => {
    if (!selectedPostId || !actionType) return;

    try {
      if (actionType === 'approve') {
        await approvePost(selectedPostId);
        showSnackbar('Post approved successfully!', 'success');
      } else {
        await rejectPost(selectedPostId);
        showSnackbar('Post rejected successfully!', 'success');
      }
      // Remove the processed post from the list
      setAllPosts((prev) => prev.filter((post) => post.id !== selectedPostId));
    } catch (err) {
      showSnackbar(getErrorMessage(err), 'error');
    } finally {
      setSelectedPostId(null);
      setActionType(null);
    }
  };

  const handleCancelAction = () => {
    setSelectedPostId(null);
    setActionType(null);
  };

  const handleCloseSnackbar = () => {
    setSnackbarOpen(false);
  };

  // Client-side sorting
  const getSortedPosts = useCallback(() => {
    const postsToSort = [...allPosts];

    if (sortBy === 'newest') {
      return postsToSort.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    } else {
      return postsToSort.sort(
        (a, b) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );
    }
  }, [allPosts, sortBy]);

  const sortedPosts = getSortedPosts();
  const currentPagePosts = sortedPosts;

  // Calculate display metrics
  const totalLoaded = allPosts.length;
  const hasMore = pagination.hasNext;
  const totalCount = pagination.total;

  return (
    <Box sx={{ maxWidth: '1200px', margin: '0 auto', p: { xs: 1, sm: 2 } }}>
      {/* Header Section */}
      <Paper elevation={1} sx={{ p: 3, mb: 3, bgcolor: 'background.default' }}>
        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            justifyContent: 'space-between',
            alignItems: { xs: 'flex-start', sm: 'center' },
            gap: 2,
          }}
        >
          <Box>
            <Typography variant="h4" gutterBottom>
              Post Moderation
            </Typography>
            <Typography variant="subtitle1" color="text.secondary">
              Review and approve or reject pending posts
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <Button
              variant="outlined"
              onClick={handleSortChange}
              startIcon={
                sortBy === 'newest' ? <ArrowDownward /> : <ArrowUpward />
              }
              size="small"
            >
              {sortBy === 'newest' ? 'Newest First' : 'Oldest First'}
            </Button>

            <Button
              variant="outlined"
              onClick={handleRefresh}
              startIcon={<Refresh />}
              disabled={loading || isRefreshing}
              size="small"
            >
              {isRefreshing ? <CircularProgress size={20} /> : 'Refresh'}
            </Button>
          </Box>
        </Box>

        {/* Stats */}
        <Box sx={{ display: 'flex', gap: 2, mt: 2, flexWrap: 'wrap' }}>
          <Chip
            label={`${totalCount} Total Pending`}
            color="primary"
            variant="outlined"
          />
          <Chip label={`${totalLoaded} Loaded`} variant="outlined" />
          <Chip
            label={`${sortBy === 'newest' ? 'Newest First' : 'Oldest First'}`}
            variant="outlined"
          />
        </Box>
      </Paper>

      {/* Loading State */}
      {loading && pagination.page === 1 ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <CircularProgress />
        </Box>
      ) : currentPagePosts.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center', mt: 2 }}>
          <CheckCircle sx={{ fontSize: 60, color: 'success.main', mb: 2 }} />
          <Typography variant="h6" gutterBottom>
            No pending posts to moderate
          </Typography>
          <Typography variant="body2" color="text.secondary">
            All posts have been reviewed and moderated.
          </Typography>
        </Paper>
      ) : (
        <>
          {/* Posts Grid */}
          <Grid container spacing={3}>
            {currentPagePosts.map((post) => (
              <Grid item xs={12} key={post.id}>
                <Post
                  post={post}
                  isAdminView={true}
                  showActions={true}
                  onApprove={() => handleApprove(post.id)}
                  onReject={() => handleReject(post.id)}
                  onClick={() =>
                    navigate(`/posts/${post.id}`, {
                      state: { from: '/admin/moderation' },
                    })
                  }
                />
              </Grid>
            ))}
          </Grid>

          {/* Pagination Controls */}
          {hasMore && (
            <Box
              sx={{ display: 'flex', justifyContent: 'center', mt: 4, gap: 2 }}
            >
              <Button
                variant="contained"
                onClick={handleLoadMore}
                disabled={loading}
                startIcon={loading ? <CircularProgress size={16} /> : null}
              >
                {loading ? 'Loading...' : 'Load More Posts'}
              </Button>

              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ alignSelf: 'center' }}
              >
                Showing {totalLoaded} of {totalCount} posts
              </Typography>
            </Box>
          )}

          {/* End of list message */}
          {!hasMore && totalCount > 0 && (
            <Paper sx={{ p: 2, textAlign: 'center', mt: 2 }}>
              <CheckCircle sx={{ color: 'success.main', mb: 1 }} />
              <Typography variant="body2" color="text.secondary">
                You&apos;ve reached the end of all pending posts
              </Typography>
            </Paper>
          )}
        </>
      )}

      {/* Confirmation Dialog */}
      <Dialog
        open={!!actionType}
        onClose={handleCancelAction}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {actionType === 'approve' ? (
              <CheckCircle color="success" />
            ) : (
              <Cancel color="error" />
            )}
            {actionType === 'approve' ? 'Approve Post' : 'Reject Post'}
          </Box>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" gutterBottom>
            Are you sure you want to {actionType} this post?
          </Typography>
          {actionType === 'reject' && (
            <Typography variant="body2" color="text.secondary">
              This action cannot be undone. The post will be permanently removed
              from the moderation queue.
            </Typography>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={handleCancelAction} variant="outlined">
            Cancel
          </Button>
          <Button
            onClick={handleConfirmAction}
            color={actionType === 'approve' ? 'success' : 'error'}
            variant="contained"
          >
            {actionType === 'approve' ? 'Approve' : 'Reject'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for feedback */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={4000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbarSeverity}
          sx={{ width: '100%' }}
          variant="filled"
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};
