import React, { useEffect, useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { usePosts } from '../../contexts/PostContext';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Post } from '../../components/Post/Post';
import {
  Box,
  Typography,
  Button,
  CircularProgress,
  Paper,
  Chip,
  Avatar,
  Divider,
  IconButton,
  ToggleButtonGroup,
  ToggleButton,
} from '@mui/material';
import {
  Refresh,
  Person,
  Article,
  CheckCircle,
  Pending,
  Cancel,
} from '@mui/icons-material';

type PostStatusFilter = 'approved' | 'pending' | 'rejected';

export const UserPostsPage: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const { userPosts, getUserPosts, pagination, loading, clearUserPosts } =
    usePosts();
  const { user: currentUser } = useAuth();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [statusFilter, setStatusFilter] =
    useState<PostStatusFilter>('approved');
  const navigate = useNavigate();

  const loadPosts = useCallback(
    async (page = 1, isRefresh = false) => {
      if (!userId) return;

      console.log('Loading posts for user ID:', userId);
      console.log('user from auth:', currentUser);

      if (isRefresh) {
        setIsRefreshing(true);
      }

      try {
        await getUserPosts(userId, page);
      } finally {
        if (isRefresh) {
          setIsRefreshing(false);
        }
      }
    },
    [userId, getUserPosts, currentUser]
  );

  useEffect(() => {
    if (!currentUser) {
      console.warn('No authenticated user found.');
      return;
    }
    let isActive = true;
    setHasLoaded(false);

    const loadData = async () => {
      if (userId) {
        try {
          await loadPosts(1);
          if (isActive) {
            setHasLoaded(true);
            console.log('Posts loaded for user ID:', userId);
          }
        } catch (error) {
          console.error('Failed to load posts:', error);
        } finally {
          if (isActive) setHasLoaded(true);
        }
      }
    };

    loadData();

    return () => {
      isActive = false;
      clearUserPosts();
    };
  }, [userId, loadPosts, clearUserPosts, currentUser]);

  const handleLoadMore = () => {
    if (userId) {
      loadPosts(pagination.page + 1);
    }
  };

  const handleRefresh = () => {
    if (userId) {
      loadPosts(1, true);
    }
  };

  const handleStatusFilterChange = (
    _event: React.MouseEvent<HTMLElement>,
    newFilter: PostStatusFilter
  ) => {
    if (newFilter !== null) {
      setStatusFilter(newFilter);
    }
  };

  // Filter posts based on status
  const filteredPosts = userPosts.filter((post) => {
    switch (statusFilter) {
      case 'approved':
        return post.status === 'APPROVED';
      case 'pending':
        return post.status === 'PENDING';
      case 'rejected':
        return post.status === 'REJECTED';
      default:
        return true; // 'all' - show all posts
    }
  });

  // Count posts by status
  const postCounts = {
    approved: userPosts.filter((post) => post.status === 'APPROVED').length,
    pending: userPosts.filter((post) => post.status === 'PENDING').length,
    rejected: userPosts.filter((post) => post.status === 'REJECTED').length,
  };

  const isCurrentUserProfile = currentUser?.id === userId;
  const firstPost = userPosts[0];
  const userDisplayName = firstPost?.author?.name || 'Unknown User';
  const userAvatar = firstPost?.author?.profile?.avatarUrl;

  // Prevent initial flash of empty state
  if (!hasLoaded && loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '400px',
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (!firstPost) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '400px',
        }}
      >
        <Typography>No posts found.</Typography>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: '800px', margin: '0 auto', p: { xs: 1, sm: 2 } }}>
      {/* Header Section */}
      <Paper elevation={1} sx={{ p: 3, mb: 3, bgcolor: 'background.default' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          <IconButton
            onClick={handleRefresh}
            disabled={loading || isRefreshing}
            size="small"
          >
            <Refresh />
          </IconButton>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
          <Avatar src={userAvatar} sx={{ width: 60, height: 60 }}>
            <Person sx={{ fontSize: 40 }} />
          </Avatar>

          <Box>
            <Typography variant="h4" gutterBottom>
              {isCurrentUserProfile ? 'My' : `${userDisplayName}'s`} Posts
            </Typography>
            <Typography variant="subtitle1" color="text.secondary">
              {isCurrentUserProfile
                ? 'Your published content'
                : 'All published posts'}
            </Typography>
          </Box>
        </Box>

        {/* Status Filter */}
        <Box sx={{ mb: 2 }}>
          <ToggleButtonGroup
            value={statusFilter}
            onChange={handleStatusFilterChange}
            exclusive
            aria-label="post status filter"
            sx={{ flexWrap: 'wrap', gap: 1 }}
          >
            <ToggleButton value="approved" aria-label="approved posts">
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CheckCircle fontSize="small" color="success" />
                Approved
                <Chip
                  label={postCounts.approved}
                  size="small"
                  sx={{ ml: 1, height: '20px' }}
                  color="success"
                />
              </Box>
            </ToggleButton>
            {isCurrentUserProfile && (
              <>
                <ToggleButton value="pending" aria-label="pending posts">
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Pending fontSize="small" color="warning" />
                    Pending
                    <Chip
                      label={postCounts.pending}
                      size="small"
                      sx={{ ml: 1, height: '20px' }}
                      color="warning"
                    />
                  </Box>
                </ToggleButton>
                <ToggleButton value="rejected" aria-label="rejected posts">
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Cancel fontSize="small" color="error" />
                    Rejected
                    <Chip
                      label={postCounts.rejected}
                      size="small"
                      sx={{ ml: 1, height: '20px' }}
                      color="error"
                    />
                  </Box>
                </ToggleButton>
              </>
            )}
          </ToggleButtonGroup>
        </Box>

        {/* Stats */}
        {userPosts.length > 0 && (
          <Box sx={{ display: 'flex', gap: 2, mt: 2, flexWrap: 'wrap' }}>
            <Chip
              label={`Page ${pagination.page} of ${pagination.totalPages}`}
              variant="outlined"
            />
            <Chip
              label={`${filteredPosts.length} ${statusFilter}`}
              variant="filled"
              color={
                statusFilter === 'approved'
                  ? 'success'
                  : statusFilter === 'pending'
                    ? 'warning'
                    : 'error'
              }
            />
          </Box>
        )}
      </Paper>

      {/* Content */}
      {userPosts.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center', mt: 2 }}>
          <Article sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" gutterBottom>
            No posts yet
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {isCurrentUserProfile
              ? "You haven't published any posts yet. Start sharing your thoughts!"
              : "This user hasn't published any posts yet."}
          </Typography>
        </Paper>
      ) : filteredPosts.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center', mt: 2 }}>
          <Article sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" gutterBottom>
            No {statusFilter} posts
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {statusFilter === 'approved'
              ? "This user doesn't have any approved posts yet."
              : "This user doesn't have any pending posts."}
          </Typography>
          <Button
            variant="outlined"
            onClick={() => setStatusFilter('approved')}
            sx={{ mt: 2 }}
          >
            View Posts
          </Button>
        </Paper>
      ) : (
        <>
          {/* Posts List */}
          <Box sx={{ mb: 3 }}>
            {filteredPosts.map((post, index) => (
              <Box key={post.id}>
                <Post
                  post={post}
                  onClick={() =>
                    navigate(`/posts/${post.id}`, {
                      state: { from: `/users/${userId}/posts` },
                    })
                  }
                />
                {index < filteredPosts.length - 1 && <Divider sx={{ my: 2 }} />}
              </Box>
            ))}
          </Box>

          {/* Pagination Controls */}
          {pagination.hasNext && (
            <Box
              sx={{ display: 'flex', justifyContent: 'center', mt: 2, gap: 2 }}
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
                Showing {userPosts.length} of {pagination.total} posts
              </Typography>
            </Box>
          )}

          {/* End of list message */}
          {!pagination.hasNext && pagination.totalPages > 1 && (
            <Paper sx={{ p: 2, textAlign: 'center', mt: 2 }}>
              <Typography variant="body2" color="text.secondary">
                You&apos;ve reached the end of all posts
              </Typography>
            </Paper>
          )}
        </>
      )}
    </Box>
  );
};
