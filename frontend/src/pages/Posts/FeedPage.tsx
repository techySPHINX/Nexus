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
import { Post as PostCard } from '../../components/Post/Post';
import type { Post as PostType } from '../../types/post';
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
  Paper,
  Chip,
  useMediaQuery,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import RecentNews from '@/components/News/RecentNews';
import { getErrorMessage } from '@/utils/errorHandler';

const FEED_FETCH_DEDUP_TTL_MS = 1500;
const inFlightFeedFetches = new Set<string>();
const recentProfileRefreshes = new Map<string, number>();
const inFlightProfileRefreshes = new Set<string>();

type FeedTab = 'all' | 'following' | 'subcommunity' | 'mySubcomm';

type FeedPagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
};

type FeedTabState = {
  posts: PostType[];
  pagination: FeedPagination;
  initialized: boolean;
};

const DEFAULT_TAB_PAGINATION: FeedPagination = {
  page: 1,
  limit: 10,
  total: 0,
  totalPages: 1,
  hasNext: false,
  hasPrev: false,
};

const createInitialTabCache = (): Record<FeedTab, FeedTabState> => ({
  all: {
    posts: [],
    pagination: DEFAULT_TAB_PAGINATION,
    initialized: false,
  },
  following: {
    posts: [],
    pagination: DEFAULT_TAB_PAGINATION,
    initialized: false,
  },
  subcommunity: {
    posts: [],
    pagination: DEFAULT_TAB_PAGINATION,
    initialized: false,
  },
  mySubcomm: {
    posts: [],
    pagination: DEFAULT_TAB_PAGINATION,
    initialized: false,
  },
});

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
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { getFeed, getCommunityFeed, loading, error, clearError } = usePosts();
  const { user } = useAuth();
  const { profile, refreshProfile } = useProfile();
  const [openForm, setOpenForm] = useState(false);
  const [activeTab, setActiveTab] = useState<
    'all' | 'following' | 'subcommunity' | 'mySubcomm'
  >('all');
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error'>(
    'success'
  );
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isTabLoading, setIsTabLoading] = useState(false);
  const [tabCache, setTabCache] = useState<Record<FeedTab, FeedTabState>>(
    createInitialTabCache
  );
  const navigate = useNavigate();

  const getTabA11yProps = (value: FeedTab) => ({
    id: `feed-tab-${value}`,
    'aria-controls': `feed-tabpanel-${value}`,
  });

  const mergeUniquePosts = useCallback(
    (previous: PostType[], incoming: PostType[]) => {
      const existingIds = new Set(previous.map((post) => post.id));
      const uniqueIncoming = incoming.filter(
        (post) => !existingIds.has(post.id)
      );
      return [...previous, ...uniqueIncoming];
    },
    []
  );

  const loadTabPage = useCallback(
    async (tab: FeedTab, page = 1, append = false, forceRefresh = false) => {
      const shouldShowInitialLoader =
        page === 1 && (!tabCache[tab].initialized || forceRefresh);

      if (shouldShowInitialLoader) {
        setIsTabLoading(true);
      }

      try {
        let response:
          | {
              posts?: PostType[];
              pagination?: Partial<FeedPagination>;
            }
          | undefined;

        if (tab === 'subcommunity') {
          response = (await getCommunityFeed(page, 10, 'member')) as
            | {
                posts?: PostType[];
                pagination?: Partial<FeedPagination>;
              }
            | undefined;
        } else if (tab === 'mySubcomm') {
          response = (await getCommunityFeed(page, 10, 'managed')) as
            | {
                posts?: PostType[];
                pagination?: Partial<FeedPagination>;
              }
            | undefined;
        } else {
          response = (await getFeed(
            page,
            10,
            tab === 'following' ? 'following' : 'all'
          )) as
            | {
                posts?: PostType[];
                pagination?: Partial<FeedPagination>;
              }
            | undefined;
        }

        const nextPosts = response?.posts ?? [];
        const nextPagination: FeedPagination = {
          ...DEFAULT_TAB_PAGINATION,
          ...(response?.pagination || {}),
          page,
          limit: Number(response?.pagination?.limit || 10),
          total: Number(response?.pagination?.total || nextPosts.length),
          totalPages: Number(
            response?.pagination?.totalPages ||
              Math.max(1, Math.ceil(nextPosts.length / 10))
          ),
          hasNext: Boolean(response?.pagination?.hasNext),
          hasPrev: page > 1,
        };

        setTabCache((prev) => ({
          ...prev,
          [tab]: {
            posts:
              append && prev[tab].initialized
                ? mergeUniquePosts(prev[tab].posts, nextPosts)
                : nextPosts,
            pagination: nextPagination,
            initialized: true,
          },
        }));

        return response;
      } finally {
        if (shouldShowInitialLoader) {
          setIsTabLoading(false);
        }
      }
    },
    [getCommunityFeed, getFeed, mergeUniquePosts, tabCache]
  );

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

    if (tabCache[activeTab].initialized) {
      return;
    }

    const key = `${user.id}:${activeTab}`;
    if (inFlightFeedFetches.has(key)) return;
    inFlightFeedFetches.add(key);

    const loadTabFeed = async () => {
      try {
        await loadTabPage(activeTab, 1, false, false);

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
      } finally {
        inFlightFeedFetches.delete(key);
      }
    };

    void loadTabFeed();
  }, [activeTab, loadTabPage, refreshProfile, tabCache, user?.id]);

  useEffect(() => {
    if (error) {
      showSnackbar(error, 'error');
      clearError();
    }
  }, [error, showSnackbar, clearError]);

  const currentTabState = tabCache[activeTab];
  const currentFeed = currentTabState.posts;
  const currentPagination = currentTabState.pagination;

  const handleLoadMore = async () => {
    const nextPage = Number(currentPagination.page) + 1;
    setIsLoadingMore(true);
    try {
      await loadTabPage(activeTab, nextPage, true, false);
    } finally {
      setIsLoadingMore(false);
    }
  };

  const handleCreatePostSuccess = useCallback(() => {
    setOpenForm(false);
    showSnackbar('Post created successfully and sent for approval!', 'success');
    void loadTabPage(activeTab, 1, false, true);
  }, [activeTab, loadTabPage, showSnackbar]);

  const handleCreatePostError = useCallback(
    (error: unknown) => {
      const errorMessage = getErrorMessage(error);
      showSnackbar(errorMessage, 'error');
    },
    [showSnackbar]
  );

  const renderPosts = () => {
    if (!currentFeed || currentFeed.length === 0) {
      if (activeTab === 'subcommunity') {
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

      if (activeTab === 'mySubcomm') {
        return (
          <Typography variant="body1" sx={{ mt: 2 }}>
            No posts from your moderated or owned subcommunities yet.
          </Typography>
        );
      }

      if (activeTab === 'following') {
        return (
          <Typography variant="body1" sx={{ mt: 2 }}>
            No posts from people you follow yet. Follow more users to
            personalize this view.
          </Typography>
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
        <Box key={post.id} component="li" sx={{ listStyle: 'none' }}>
          <PostCard
            post={post}
            compactMode={isMobile}
            onClick={() =>
              navigate(`/posts/${post.id}`, {
                state: { from: '/feed' },
              })
            }
          />
        </Box>
      );
    });
  };

  return (
    <>
      <Container
        maxWidth="lg"
        sx={{ py: { xs: 0.75, sm: 3 }, px: { xs: 0.5, sm: 2 } }}
      >
        <Grid container spacing={{ xs: 0.75, sm: 1.5, md: 4 }}>
          <Grid item xs={8} sm={8} md={8}>
            <Box
              sx={{
                maxWidth: { xs: '100%', md: '800px' },
                margin: { xs: 0, md: '0 auto' },
                p: { xs: 0, sm: 1 },
                ...(isMobile && {
                  '& .MuiCardHeader-title': {
                    fontSize: '0.74rem',
                    lineHeight: 1.2,
                  },
                  '& .MuiCardHeader-subheader': {
                    fontSize: '0.62rem',
                    lineHeight: 1.2,
                  },
                  '& .MuiCardContent-root .MuiTypography-body2': {
                    fontSize: '0.66rem',
                    lineHeight: 1.25,
                  },
                  '& .MuiCardContent-root .MuiTypography-h6': {
                    fontSize: '0.76rem',
                  },
                  '& .MuiChip-label': {
                    fontSize: '0.58rem',
                  },
                  '& .MuiButton-root': {
                    fontSize: '0.64rem',
                    minHeight: 28,
                  },
                }),
              }}
            >
              <Paper
                variant="outlined"
                sx={{
                  p: { xs: 1, sm: 1.5, md: 2.5 },
                  mb: { xs: 1, sm: 2.5 },
                  borderRadius: { xs: 1.5, sm: 2.5 },
                }}
              >
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: { xs: 'flex-start', sm: 'center' },
                    flexDirection: { xs: 'column', sm: 'row' },
                    gap: { xs: 0.75, sm: 1.5 },
                    mb: { xs: 0.5, sm: 1 },
                  }}
                >
                  <Box>
                    <Typography
                      variant={isMobile ? 'subtitle1' : 'h5'}
                      sx={{
                        fontWeight: 700,
                        fontSize: { xs: '0.8rem', sm: '1.2rem' },
                      }}
                    >
                      Feed
                    </Typography>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ display: { xs: 'none', sm: 'block' } }}
                    >
                      Latest posts from your network and communities
                    </Typography>
                  </Box>
                  {!isMobile && (
                    <Chip
                      size="small"
                      variant="outlined"
                      label={`${currentFeed.length} post${currentFeed.length === 1 ? '' : 's'}`}
                    />
                  )}
                </Box>

                <Tabs
                  value={activeTab}
                  onChange={(_, value) => setActiveTab(value)}
                  aria-label="Feed scope tabs"
                  selectionFollowsFocus
                  variant="scrollable"
                  scrollButtons="auto"
                  allowScrollButtonsMobile
                  sx={{
                    mb:
                      user?.role === 'ALUM' || user?.role === 'ADMIN' ? 1.5 : 0,
                    '& .MuiTab-root': {
                      minHeight: { xs: 30, sm: 44, md: 48 },
                      px: { xs: 0.35, sm: 1.1, md: 1.5 },
                      minWidth: { xs: 42, sm: 72 },
                      fontSize: { xs: '0.61rem', sm: '0.82rem', md: '0.9rem' },
                      textTransform: 'none',
                      fontWeight: 600,
                    },
                  }}
                >
                  <Tab
                    label={isMobile ? 'All' : 'All'}
                    value="all"
                    {...getTabA11yProps('all')}
                    aria-label="All feed posts"
                  />
                  <Tab
                    label={isMobile ? 'Follow' : 'Followed'}
                    value="following"
                    {...getTabA11yProps('following')}
                    aria-label="Posts from followed users"
                  />
                  <Tab
                    label={isMobile ? 'Sub' : 'Subcommunity'}
                    value="subcommunity"
                    {...getTabA11yProps('subcommunity')}
                    aria-label="Posts from joined subcommunities"
                  />
                  <Tab
                    label={isMobile ? 'My' : 'MySubcomm'}
                    value="mySubcomm"
                    {...getTabA11yProps('mySubcomm')}
                    aria-label="Posts from managed subcommunities"
                  />
                </Tabs>

                {(user?.role === 'ALUM' || user?.role === 'ADMIN') && (
                  <Button
                    variant="contained"
                    onClick={() => setOpenForm(true)}
                    fullWidth={isMobile}
                    size={isMobile ? 'small' : 'medium'}
                  >
                    Create Post
                  </Button>
                )}
              </Paper>
              {(user?.role === 'ALUM' || user?.role === 'ADMIN') && (
                <>
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

              {isTabLoading && currentFeed.length === 0 ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                  <CircularProgress />
                </Box>
              ) : (
                <Box
                  id={`feed-tabpanel-${activeTab}`}
                  role="tabpanel"
                  aria-labelledby={`feed-tab-${activeTab}`}
                  component="section"
                >
                  <Box
                    component="ul"
                    sx={{
                      p: 0,
                      m: 0,
                      ...(isMobile && {
                        '& > li .MuiCard-root': {
                          mb: 1,
                          borderRadius: 1.5,
                        },
                        '& > li .MuiCardHeader-root': {
                          px: 1,
                          py: 0.5,
                        },
                        '& > li .MuiCardContent-root': {
                          px: 1,
                          py: 0.75,
                        },
                        '& > li .MuiCardActions-root': {
                          px: 0.5,
                          py: 0.25,
                        },
                      }),
                    }}
                  >
                    {renderPosts()}
                  </Box>

                  {currentPagination.hasNext && (
                    <Box
                      sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}
                    >
                      <Button
                        variant="outlined"
                        onClick={handleLoadMore}
                        disabled={isLoadingMore || loading}
                        fullWidth={isMobile}
                        size={isMobile ? 'small' : 'medium'}
                      >
                        {isLoadingMore ? (
                          <CircularProgress size={24} />
                        ) : (
                          'Load More'
                        )}
                      </Button>
                    </Box>
                  )}
                </Box>
              )}
            </Box>
          </Grid>

          <Grid item xs={4} sm={4} md={4}>
            <Box
              sx={{
                position: 'sticky',
                alignSelf: 'flex-start',
                top: { xs: 8, sm: 33 },
              }}
            >
              <RecentNews compact={isMobile} />
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
