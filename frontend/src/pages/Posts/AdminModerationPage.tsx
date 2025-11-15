import React, { useEffect, useState, useCallback } from 'react';
import { usePosts } from '../../contexts/PostContext';
import { useSubCommunity } from '../../contexts/SubCommunityContext';
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
  Card,
  CardContent,
  Avatar,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Tooltip,
} from '@mui/material';
import { getErrorMessage } from '@/utils/errorHandler';
import {
  Refresh,
  CheckCircle,
  Cancel,
  ArrowUpward,
  ArrowDownward,
  Groups,
  Public,
  Lock,
  Visibility,
} from '@mui/icons-material';
import { Post as PostType } from '../../types/post';
import { SubCommunity } from '../../types/subCommunity';

// interface TabPanelProps {
//   children?: React.ReactNode;
//   index: number;
//   value: number;
// }

// function TabPanel(props: TabPanelProps) {
//   const { children, value, index, ...other } = props;

//   return (
//     <div
//       role="tabpanel"
//       hidden={value !== index}
//       id={`moderation-tabpanel-${index}`}
//       aria-labelledby={`moderation-tab-${index}`}
//       {...other}
//     >
//       {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
//     </div>
//   );
// }

const AdminModerationPage: React.FC = () => {
  const {
    pendingPosts,
    getPendingPosts,
    pagination,
    loading,
    approvePost,
    rejectPost,
    error,
    clearError,
  } = usePosts();

  const { subCommunities, getAllSubCommunities } = useSubCommunity();
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
  const [allPosts, setAllPosts] = useState<PostType[]>([]);
  // const [activeTab, setActiveTab] = useState(0);
  const [filterSubCommunity, setFilterSubCommunity] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [expandedPostId, setExpandedPostId] = useState<string | null>(null);

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
        await getPendingPosts(page, 20); // Increased page size for better moderation
      } finally {
        if (refresh) {
          setIsRefreshing(false);
        }
      }
    },
    [getPendingPosts]
  );

  useEffect(() => {
    loadPosts(1);
    getAllSubCommunities();
  }, [loadPosts, getAllSubCommunities]);

  useEffect(() => {
    if (pagination.page === 1) {
      setAllPosts(pendingPosts);
    } else {
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

  const toggleExpandPost = (postId: string) => {
    setExpandedPostId(expandedPostId === postId ? null : postId);
  };

  const getSortedAndFilteredPosts = useCallback(() => {
    let filteredPosts = [...allPosts];

    // Filter by subcommunity
    if (filterSubCommunity !== 'all') {
      filteredPosts = filteredPosts.filter(
        (post) => post.subCommunityId === filterSubCommunity
      );
    }

    // Filter by post type
    if (filterType !== 'all') {
      filteredPosts = filteredPosts.filter((post) => post.type === filterType);
    }

    // Sort posts
    if (sortBy === 'newest') {
      return filteredPosts.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    } else {
      return filteredPosts.sort(
        (a, b) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );
    }
  }, [allPosts, filterSubCommunity, filterType, sortBy]);

  const filteredPosts = getSortedAndFilteredPosts();
  const filteredCount = filteredPosts.length;

  const getSubCommunityName = (subCommunityId?: string): string => {
    if (!subCommunityId) return 'No Community';
    const subCommunity = subCommunities.find((sc) => sc.id === subCommunityId);
    return subCommunity ? `r/${subCommunity.name}` : 'Unknown Community';
  };

  const getSubCommunityInfo = (
    subCommunityId?: string
  ): SubCommunity | null => {
    if (!subCommunityId) return null;
    return subCommunities.find((sc) => sc.id === subCommunityId) || null;
  };

  const SubCommunityInfoCard: React.FC<{ post: PostType }> = ({ post }) => {
    const subCommunity = getSubCommunityInfo(post.subCommunityId);

    if (!subCommunity) return null;

    return (
      <Card variant="outlined" sx={{ mb: 2, bgcolor: 'grey.50' }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <Avatar
              src={subCommunity.iconUrl || undefined}
              sx={{ width: 32, height: 32 }}
            >
              {subCommunity.name.charAt(0)}
            </Avatar>
            <Typography variant="subtitle2" fontWeight="bold">
              r/{subCommunity.name}
            </Typography>
            <Chip
              icon={subCommunity.isPrivate ? <Lock /> : <Public />}
              label={subCommunity.isPrivate ? 'Private' : 'Public'}
              size="small"
              color={subCommunity.isPrivate ? 'default' : 'primary'}
            />
          </Box>
          <Typography variant="body2" color="text.secondary">
            {subCommunity.description}
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
            <Chip
              icon={<Groups />}
              label={`${subCommunity._count?.members || 0} members`}
              size="small"
              variant="outlined"
            />
          </Box>
        </CardContent>
      </Card>
    );
  };

  return (
    <Box sx={{ maxWidth: '1400px', margin: '0 auto', p: { xs: 1, sm: 2 } }}>
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
              Post Moderation Dashboard
            </Typography>
            <Typography variant="subtitle1" color="text.secondary">
              Review and manage pending posts across all communities
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
              variant="contained"
              onClick={handleRefresh}
              startIcon={<Refresh />}
              disabled={loading || isRefreshing}
              size="small"
            >
              {isRefreshing ? <CircularProgress size={20} /> : 'Refresh'}
            </Button>
          </Box>
        </Box>

        {/* Stats and Filters */}
        <Box
          sx={{
            display: 'flex',
            gap: 2,
            mt: 2,
            flexWrap: 'wrap',
            alignItems: 'center',
          }}
        >
          <Chip
            label={`${pagination.total} Total Pending`}
            color="primary"
            variant="outlined"
          />
          <Chip label={`${allPosts.length} Loaded`} variant="outlined" />
          <Chip label={`${filteredCount} Filtered`} variant="outlined" />

          {/* Filters */}
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Community</InputLabel>
            <Select
              value={filterSubCommunity}
              label="Community"
              onChange={(e) => setFilterSubCommunity(e.target.value)}
            >
              <MenuItem value="all">All Communities</MenuItem>
              {subCommunities.map((sc) => (
                <MenuItem key={sc.id} value={sc.id}>
                  r/{sc.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Post Type</InputLabel>
            <Select
              value={filterType}
              label="Post Type"
              onChange={(e) => setFilterType(e.target.value)}
            >
              <MenuItem value="all">All Types</MenuItem>
              <MenuItem value="UPDATE">Update</MenuItem>
              <MenuItem value="QUESTION">Question</MenuItem>
              <MenuItem value="DISCUSSION">Discussion</MenuItem>
              <MenuItem value="ANNOUNCEMENT">Announcement</MenuItem>
            </Select>
          </FormControl>
        </Box>
      </Paper>

      {/* Main Content */}
      {loading && pagination.page === 1 ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <CircularProgress />
        </Box>
      ) : filteredPosts.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center', mt: 2 }}>
          <CheckCircle sx={{ fontSize: 60, color: 'success.main', mb: 2 }} />
          <Typography variant="h6" gutterBottom>
            No pending posts match your filters
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {filterSubCommunity !== 'all' || filterType !== 'all'
              ? 'Try adjusting your filters to see more posts.'
              : 'All posts have been reviewed and moderated.'}
          </Typography>
        </Paper>
      ) : (
        <>
          {/* Posts Grid */}
          <Grid container spacing={3}>
            {filteredPosts.map((post) => (
              <Grid item xs={12} key={post.id}>
                <Card variant="outlined">
                  <CardContent>
                    {/* Subcommunity Info */}
                    <SubCommunityInfoCard post={post} />

                    {/* Post Content */}
                    <Post
                      post={post}
                      isAdminView={true}
                      showActions={true}
                      onApprove={() => handleApprove(post.id)}
                      onReject={() => handleReject(post.id)}
                      onClick={() => toggleExpandPost(post.id)}
                    />

                    {/* Quick Actions */}
                    <Box
                      sx={{
                        display: 'flex',
                        gap: 1,
                        mt: 2,
                        pt: 2,
                        borderTop: 1,
                        borderColor: 'divider',
                      }}
                    >
                      <Button
                        variant="contained"
                        color="success"
                        startIcon={<CheckCircle />}
                        onClick={() => handleApprove(post.id)}
                        size="small"
                      >
                        Approve
                      </Button>
                      <Button
                        variant="outlined"
                        color="error"
                        startIcon={<Cancel />}
                        onClick={() => handleReject(post.id)}
                        size="small"
                      >
                        Reject
                      </Button>
                      <Tooltip title="View Full Post">
                        <IconButton
                          size="small"
                          onClick={() => navigate(`/posts/${post.id}`)}
                        >
                          <Visibility />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>

          {/* Pagination Controls */}
          {pagination.hasNext && (
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'center',
                mt: 4,
                gap: 2,
                alignItems: 'center',
              }}
            >
              <Button
                variant="contained"
                onClick={handleLoadMore}
                disabled={loading}
                startIcon={loading ? <CircularProgress size={16} /> : null}
              >
                {loading ? 'Loading...' : 'Load More Posts'}
              </Button>
              <Typography variant="body2" color="text.secondary">
                Showing {allPosts.length} of {pagination.total} posts
                {filteredCount !== allPosts.length &&
                  ` (${filteredCount} filtered)`}
              </Typography>
            </Box>
          )}

          {!pagination.hasNext && allPosts.length > 0 && (
            <Paper sx={{ p: 2, textAlign: 'center', mt: 2 }}>
              <CheckCircle sx={{ color: 'success.main', mb: 1 }} />
              <Typography variant="body2" color="text.secondary">
                You&apos;ve reached the end of all pending posts
                {filteredCount !== allPosts.length &&
                  ` (${filteredCount} match your filters)`}
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
          {selectedPostId && (
            <Typography variant="body2" color="text.secondary">
              Post in:{' '}
              {getSubCommunityName(
                allPosts.find((p) => p.id === selectedPostId)?.subCommunityId
              )}
            </Typography>
          )}
          {actionType === 'reject' && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              This action cannot be undone. The post will be permanently
              removed.
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
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
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

export default AdminModerationPage;
