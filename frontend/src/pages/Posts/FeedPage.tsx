import {
  FC,
  useEffect,
  useState,
  useCallback,
  ComponentType,
  lazy,
  LazyExoticComponent,
} from 'react';
import { useNavigate } from 'react-router-dom';
import { usePosts } from '../../contexts/PostContext';
import { useProfile } from '../../contexts/ProfileContext';
import { useAuth } from '../../contexts/AuthContext';
import { Post } from '../../components/Post/Post';
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
  Grid,
  Container,
  Tabs,
  Tab,
} from '@mui/material';
import RecentNews from '@/components/News/RecentNews';
import { getErrorMessage } from '@/utils/errorHandler';

const FEED_FETCH_DEDUP_TTL_MS = 1500;
const recentFeedFetches = new Map<string, number>();
const inFlightFeedFetches = new Set<string>();
const recentProfileRefreshes = new Map<string, number>();
const inFlightProfileRefreshes = new Set<string>();

export enum SubCommunityRole {
  OWNER = 'OWNER',
  MODERATOR = 'MODERATOR',
  MEMBER = 'MEMBER',
}

// Lazy-load heavy components so the page renders a skeleton first
type CreatePostFormProps = {
  subCommunityId?: string;
  subCommunityName?: string;
  onSuccess?: () => void;
  onError?: (error: unknown) => void;
  onCancel?: () => void;
  profile?: { id?: string; avatarUrl?: string | null };
  userRole?: SubCommunityRole | null;
};

const CreatePostForm = lazy(() =>
  import('../../components/Post/CreatePostForm').then((mod) => {
    return {
      default: (
        mod as unknown as {
          CreatePostForm: ComponentType<CreatePostFormProps>;
        }
      ).CreatePostForm,
    };
  })
) as LazyExoticComponent<ComponentType<CreatePostFormProps>>;

const FeedPage: FC = () => {
  const {
    feed,
    communityFeed,
    getFeed,
    getCommunityFeed,
    pagination,
    loading,
    error,
    clearError,
  } = usePosts();
  const { user } = useAuth();
  const { profile, refreshProfile } = useProfile();
  const [openForm, setOpenForm] = useState(false);
  const [activeTab, setActiveTab] = useState<
    'all' | 'following' | 'communities'
  >('all');
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error'>(
    'success'
  );
  const navigate = useNavigate();

  const showSnackbar = useCallback(
    (message: string, severity: 'success' | 'error') => {
      setSnackbarMessage(message);
      setSnackbarSeverity(severity);
      setSnackbarOpen(true);
    },
    []
  );

  useEffect(() => {
    if (!user?.id) return;

    const key = `${user.id}:${activeTab}`;
    const lastFetchedAt = recentFeedFetches.get(key) ?? 0;
    if (Date.now() - lastFetchedAt < FEED_FETCH_DEDUP_TTL_MS) return;
    if (inFlightFeedFetches.has(key)) return;

    inFlightFeedFetches.add(key);

    const loadTabFeed = async () => {
      try {
        if (activeTab === 'communities') {
          await getCommunityFeed();
        } else {
          await getFeed();
        }
        const profileKey = user.id;
        const lastProfileRefreshAt =
          recentProfileRefreshes.get(profileKey) ?? 0;
        const shouldRefreshProfile =
          Date.now() - lastProfileRefreshAt >= FEED_FETCH_DEDUP_TTL_MS &&
          !inFlightProfileRefreshes.has(profileKey);

        if (shouldRefreshProfile) {
          inFlightProfileRefreshes.add(profileKey);
          try {
            await refreshProfile();
            recentProfileRefreshes.set(profileKey, Date.now());
          } finally {
            inFlightProfileRefreshes.delete(profileKey);
          }
        }

        recentFeedFetches.set(key, Date.now());
      } finally {
        inFlightFeedFetches.delete(key);
      }
    };

    void loadTabFeed();
  }, [activeTab, getFeed, getCommunityFeed, refreshProfile, user?.id]);

  useEffect(() => {
    if (error) {
      showSnackbar(error, 'error');
      clearError();
    }
  }, [error, showSnackbar, clearError]);

  const currentFeed = activeTab === 'communities' ? communityFeed : feed;

  const handleLoadMore = () => {
    if (activeTab === 'communities') {
      getCommunityFeed(pagination.page + 1);
      return;
    }
    getFeed(pagination.page + 1);
  };

  const handleCreatePostSuccess = useCallback(() => {
    setOpenForm(false);
    showSnackbar('Post created successfully and sent for approval!', 'success');
    if (activeTab === 'communities') {
      getCommunityFeed(1);
    } else {
      getFeed(1);
    }
  }, [activeTab, getCommunityFeed, getFeed, showSnackbar]);

  const handleCreatePostError = useCallback(
    (error: unknown) => {
      const errorMessage = getErrorMessage(error);
      showSnackbar(errorMessage, 'error');
    },
    [showSnackbar]
  );

  const renderPosts = () => {
    if (!currentFeed || currentFeed.length === 0) {
      if (activeTab === 'communities') {
        return (
          <Box sx={{ mt: 2 }}>
            <Typography variant="body1" sx={{ mb: 1 }}>
              You haven&apos;t joined any communities yet, or there are no
              approved posts in your communities.
            </Typography>
            <Button
              variant="outlined"
              onClick={() => navigate('/subcommunities')}
            >
              Browse communities
            </Button>
          </Box>
        );
      }

      return (
        <Typography variant="body1" sx={{ mt: 2 }}>
          No posts to show. Follow more people or communities to see posts in
          your feed.
        </Typography>
      );
    }

    return currentFeed.map((post) => {
      if (!post || !post.id) {
        console.warn('Invalid post object:', post);
        return null;
      }

      return (
        <Post
          key={post.id}
          post={post}
          onClick={() =>
            navigate(`/posts/${post.id}`, {
              state: { from: '/feed' },
            })
          }
        />
      );
    });
  };

  return (
    <>
      <Container maxWidth="lg" sx={{ py: 3 }}>
        <Grid container spacing={4}>
          <Grid item xs={12} md={8}>
            <Box sx={{ maxWidth: '800px', margin: '0 auto', p: 2 }}>
              <Typography variant="h4" gutterBottom>
                Your Feed
              </Typography>
              <Tabs
                value={activeTab}
                onChange={(_, value) => setActiveTab(value)}
                sx={{ mb: 2 }}
                variant="scrollable"
                scrollButtons="auto"
              >
                <Tab label="All" value="all" />
                <Tab label="Following" value="following" />
                <Tab label="My Communities" value="communities" />
              </Tabs>
              {(user?.role === 'ALUM' || user?.role === 'ADMIN') && (
                <>
                  <Button
                    variant="contained"
                    onClick={() => setOpenForm(true)}
                    sx={{ mb: 2 }}
                  >
                    Create Post
                  </Button>
                  <Dialog
                    open={openForm}
                    onClose={() => setOpenForm(false)}
                    maxWidth="md"
                    fullWidth
                  >
                    <DialogTitle>Create a New Post</DialogTitle>
                    <DialogContent
                      sx={{
                        minHeight: '400px',
                        overflowY: 'auto',
                      }}
                    >
                      <CreatePostForm
                        profile={profile ?? undefined}
                        onSuccess={handleCreatePostSuccess}
                        onError={handleCreatePostError}
                        onCancel={() => setOpenForm(false)}
                      />
                    </DialogContent>
                  </Dialog>
                </>
              )}

              {loading && pagination.page === 1 ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                  <CircularProgress />
                </Box>
              ) : (
                <>
                  {renderPosts()}

                  {pagination.hasNext && (
                    <Box
                      sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}
                    >
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
          </Grid>

          <Grid item xs={12} md={4}>
            <Box sx={{ position: 'sticky', top: { xs: 16, md: 96 } }}>
              <RecentNews />
            </Box>
          </Grid>
        </Grid>
      </Container>
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

export default FeedPage;
