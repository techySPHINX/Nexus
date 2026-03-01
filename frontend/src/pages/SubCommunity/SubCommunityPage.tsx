import {
  Suspense,
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from 'react';
import {
  Box,
  Typography,
  Button,
  Snackbar,
  Alert,
  CircularProgress,
  Grid,
  Card,
  CardContent,
  Skeleton,
  Chip,
  Fade,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  TextField,
} from '@mui/material';
import {
  // Search,
  // Add,
  FilterList,
  KeyboardArrowUp,
} from '@mui/icons-material';
import { useSubCommunity } from '../../contexts/SubCommunityContext';
import { useAuth } from '../../contexts/AuthContext';
// import { CreateSubCommunityDialog } from '../../components/SubCommunity/CreateSubCommunityDialog';
// import { SubCommunityRequestDialog } from '../../components/SubCommunity/SubCommunityRequestDialog';
import { SubCommunitySection } from '../../components/SubCommunity/SubCommunitySection';
import { ManageTypesDialog } from '../../components/SubCommunity/ManageTypesDialog';
import {
  SubCommunity,
  SubCommunityFilterParams,
  SubCommunityType,
} from '../../types/subCommunity';
// import { Link } from 'react-router-dom';

// Sections are built dynamically from types provided by context (plus 'all')

// Stable lazy section component: triggers ensureTypeLoaded in an effect
// and renders a SubCommunitySection for the given type. Keeping this
// at module scope prevents it being recreated on every render (which
// previously caused repeated API calls).
// No module-level initiated set any more — we rely on context's loading
// state and caching to determine whether a section has started loading.
const LazySection: React.FC<{
  typeId: string;
  title: string;
  initialCount?: number;
  filters?: SubCommunityFilterParams;
  hidePlaceholderWhenEmpty?: boolean;
}> = ({
  typeId,
  title,
  initialCount = 6,
  filters,
  hidePlaceholderWhenEmpty = false,
}) => {
  const {
    scheduleTypeLoad,
    isLoadingForType,
    hasMoreForType,
    getRemainingForType,
    loadMoreForType,
    subCommunities,
    subCommunitiesByType,
    error,
  } = useSubCommunity();

  // We'll observe the section wrapper and call ensureTypeLoaded only when
  // it enters the viewport. This prevents eager loading of every section.
  const rootRef = useRef<HTMLDivElement | null>(null);
  // prevent duplicate load scheduling for the same section instance
  const scheduledRef = useRef(false);
  // refs holding latest arrays so async callbacks can read up-to-date data
  const subCommunitiesRef = useRef(subCommunities);
  const subCommunitiesByTypeRef = useRef(subCommunitiesByType);

  useEffect(() => {
    subCommunitiesRef.current = subCommunities;
  }, [subCommunities]);

  useEffect(() => {
    subCommunitiesByTypeRef.current = subCommunitiesByType;
  }, [subCommunitiesByType]);

  useEffect(() => {
    scheduledRef.current = false;
  }, [filters]);

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            // Only schedule a load if we don't already have data and the
            // section isn't currently loading. We also avoid scheduling
            // multiple timeouts for the same mounted section instance.
            const displayCommunities =
              typeId === 'all'
                ? subCommunities
                : subCommunitiesByType.filter((subCom: SubCommunity) =>
                    typeof subCom.type === 'string'
                      ? subCom.type === typeId
                      : subCom.type?.name === typeId
                  );

            const isCurrentlyLoading = isLoadingForType(typeId);

            if (
              !error &&
              !scheduledRef.current &&
              displayCommunities.length === 0 &&
              !isCurrentlyLoading
            ) {
              scheduledRef.current = true;
              scheduleTypeLoad(typeId, initialCount, undefined, filters)
                .catch((err) => {
                  console.warn('Failed to load type', typeId, err);
                })
                .finally(() => {
                  const currentDisplay =
                    typeId === 'all'
                      ? subCommunitiesRef.current
                      : subCommunitiesByTypeRef.current.filter(
                          (subCom: SubCommunity) =>
                            typeof subCom.type === 'string'
                              ? subCom.type === typeId
                              : subCom.type?.name === typeId
                        );

                  if (
                    currentDisplay &&
                    currentDisplay.length > 0 &&
                    rootRef.current
                  ) {
                    observer.unobserve(rootRef.current);
                  }
                });
            }
          }
        }
      },
      {
        root: null,
        rootMargin: '300px 0px 500px 0px',
        threshold: 0.01,
      }
    );

    observer.observe(el);
    return () => {
      observer.disconnect();
    };
  }, [
    typeId,
    scheduleTypeLoad,
    initialCount,
    isLoadingForType,
    error,
    filters,
    subCommunities,
    subCommunitiesByType,
  ]);

  const displayCommunities =
    typeId === 'all'
      ? subCommunities
      : subCommunitiesByType.filter((subCom: SubCommunity) =>
          typeof subCom.type === 'string'
            ? subCom.type === typeId
            : subCom.type?.name === typeId
        );

  const isLoading = isLoadingForType(typeId);
  const hasMore = hasMoreForType(typeId, initialCount, '', filters);
  const remainingCount = getRemainingForType(typeId, initialCount, '', filters);

  // We rely on the context semaphore to serialize actual network requests
  // (so multiple observers can schedule work but only the semaphore will
  // allow one network call to proceed at a time). Removing the retrying
  // effect avoids missed schedules caused by transient global flags.

  // Decide whether we should render the real section. We always render an
  // outer wrapper with a ref so the IntersectionObserver can observe it even
  // if there's no data yet. Once we've initiated loading for this type, we
  // display the section (showing the loader via isLoading). This ensures the
  // first network call happens only when the section is visible.
  const hasStartedLoading = isLoading;
  const shouldRenderSection =
    displayCommunities.length > 0 || isLoading || hasStartedLoading;

  return (
    <div ref={rootRef}>
      {shouldRenderSection ? (
        // If we're loading and have no data yet, render a lightweight
        // skeleton grid. This provides visual feedback per-section while
        // network calls are in-flight and avoids rendering the full
        // SubCommunitySection until we have data.
        isLoading && displayCommunities.length === 0 ? (
          <div className="mb-6">
            <Typography
              sx={{
                mb: 3,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 2,
                px: 2,
                py: 1.5,
                borderRadius: 2.5,
                border: '1px solid',
                borderColor: 'divider',
                backgroundColor: 'background.paper',
              }}
              component="div"
            >
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.2,
                }}
              >
                <Box
                  component="span"
                  sx={{
                    width: 10,
                    height: 10,
                    borderRadius: '50%',
                    backgroundColor: 'primary.main',
                    boxShadow: (theme) =>
                      `0 0 0 4px ${theme.palette.primary.light}22`,
                  }}
                />
                <Typography
                  variant="h5"
                  component="h2"
                  sx={{ fontWeight: 700 }}
                >
                  {title}
                </Typography>
              </Box>
              <Skeleton variant="rounded" width={44} height={26} />
            </Typography>

            <Grid container spacing={2}>
              {[0, 1, 2].map((i) => (
                <Grid item xs={12} sm={6} md={4} key={i}>
                  <Card
                    variant="outlined"
                    sx={{
                      overflow: 'hidden',
                      boxShadow: 1,
                    }}
                  >
                    <Skeleton
                      variant="rectangular"
                      height={112}
                      animation="pulse"
                    />
                    <CardContent>
                      <Skeleton width="60%" height={20} sx={{ mb: 1 }} />
                      <Skeleton width="80%" height={16} />
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </div>
        ) : (
          <Fade in={!isLoading} timeout={240} appear>
            <Box>
              <SubCommunitySection
                title={title}
                type={typeId}
                communities={displayCommunities}
                initialCount={initialCount}
                onLoadMore={() =>
                  loadMoreForType(typeId, initialCount, undefined, filters)
                }
                hasMore={hasMore}
                isLoading={isLoading}
                remainingCount={remainingCount}
              />
            </Box>
          </Fade>
        )
      ) : (
        // keep a placeholder for observer only when needed; hide it when
        // filter mode is active to avoid empty vertical gaps.
        <>{hidePlaceholderWhenEmpty ? null : <Box sx={{ minHeight: 160 }} />}</>
      )}
    </div>
  );
};

const SubCommunityPage: React.FC = () => {
  const {
    subCommunities,
    loading,
    ensureTypes,
    error,
    clearError,
    types,
    scheduleTypeLoad,
    isLoadingForType,
    isAnySectionLoading,
    subCommunitiesByType,
    activeFilters,
    setActiveFilters,
  } = useSubCommunity();

  const { user } = useAuth();
  // const [searchTerm, setSearchTerm] = useState('');
  // const [createDialogOpen, setCreateDialogOpen] = useState(false);
  // const [requestDialogOpen, setRequestDialogOpen] = useState(false);
  const [manageTypesOpen, setManageTypesOpen] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [showBackToTop, setShowBackToTop] = useState(false);
  // Note: we previously tracked loadedTypes here; async loading is handled
  // inside LazySection to avoid triggering async work during render.

  const isAdmin = user?.role === 'ADMIN';
  // const isAlum = user?.role === 'ALUM';

  const handleFilterChange = useCallback(
    (updates: Partial<SubCommunityFilterParams>) => {
      setActiveFilters({ ...activeFilters, ...updates });
    },
    [activeFilters, setActiveFilters]
  );

  const clearFilters = useCallback(() => {
    setActiveFilters({});
  }, [setActiveFilters]);

  const hasActiveFilters = useMemo(
    () =>
      !!(
        activeFilters.privacy ||
        activeFilters.membership ||
        activeFilters.sort ||
        activeFilters.minMembers
      ),
    [activeFilters]
  );

  // useEffect(() => {
  //   // When filters change, clear the type cache so sections fetch fresh data.
  //   resetTypeCache();
  // }, [activeFilters, resetTypeCache]);

  useEffect(() => {
    // Load all communities and types initially (idempotent)
    let mounted = true;
    (async () => {
      try {
        // Only load the available types initially. Individual sections
        // (including 'all'/recommended) will load when scrolled into view.
        await ensureTypes();
      } catch (err) {
        if (mounted) console.warn('Failed initial subcommunity load', err);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [ensureTypes]);

  useEffect(() => {
    if (error) {
      setSnackbarOpen(true);
    }
  }, [error]);

  // No async calls during render: we use a small wrapper component below to
  // kick off `ensureTypeLoaded` in a useEffect when a section mounts.

  const handleCloseSnackbar = () => {
    setSnackbarOpen(false);
    clearError();
  };

  // const filterCommunities = (communities: SubCommunity[]): SubCommunity[] => {
  //   if (!searchTerm) return communities;

  //   return communities.filter((subCom) => {
  //     const typeStr =
  //       typeof subCom.type === 'string' ? subCom.type : subCom.type?.name || '';

  //     return (
  //       subCom.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
  //       subCom.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
  //       typeStr.toLowerCase().includes(searchTerm.toLowerCase())
  //     );
  //   });
  // };

  // (Per-type display logic moved into LazySection to avoid inline async work)

  // const filteredCommunities = filterCommunities(subCommunities);

  const sections = useMemo(() => {
    const typedSections = ((types || []) as SubCommunityType[]).map(
      (t: SubCommunityType) => ({
        id: t.name,
        title: `${t.name} Communities`,
      })
    );
    if (hasActiveFilters) return typedSections;
    return [{ id: 'all', title: 'Recommended Communities' }, ...typedSections];
  }, [hasActiveFilters, types]);

  const totalLoadedCommunities = hasActiveFilters
    ? subCommunitiesByType.length
    : subCommunities.length;

  const isFilteringJoinedOnly = activeFilters.membership === 'joined';
  const isFilterLoading = hasActiveFilters && isAnySectionLoading();

  const getDisplayCountByType = useCallback(
    (typeId: string) => {
      if (typeId === 'all') return subCommunities.length;
      return subCommunitiesByType.filter((subCom: SubCommunity) =>
        typeof subCom.type === 'string'
          ? subCom.type === typeId
          : subCom.type?.name === typeId
      ).length;
    },
    [subCommunities.length, subCommunitiesByType]
  );

  useEffect(() => {
    if (error || hasActiveFilters) return;
    let ticking = false;

    const tryPreloadNearBottom = () => {
      if (ticking) return;
      ticking = true;

      window.requestAnimationFrame(() => {
        const bottomDistance =
          document.documentElement.scrollHeight -
          (window.innerHeight + window.scrollY);

        if (bottomDistance < 800) {
          sections.forEach(({ id }) => {
            const alreadyLoaded = getDisplayCountByType(id) > 0;
            const loadingType = isLoadingForType(id);
            if (!alreadyLoaded && !loadingType) {
              void scheduleTypeLoad(id, 6, undefined, activeFilters);
            }
          });
        }

        ticking = false;
      });
    };

    window.addEventListener('scroll', tryPreloadNearBottom, { passive: true });
    tryPreloadNearBottom();

    return () => {
      window.removeEventListener('scroll', tryPreloadNearBottom);
    };
  }, [
    activeFilters,
    error,
    hasActiveFilters,
    getDisplayCountByType,
    isLoadingForType,
    scheduleTypeLoad,
    sections,
  ]);

  useEffect(() => {
    const container = document.getElementById('app-scroll-container');

    const updateVisibility = () => {
      const currentY = container ? container.scrollTop : window.scrollY;
      setShowBackToTop(currentY > 480);
    };

    if (container) {
      container.addEventListener('scroll', updateVisibility, { passive: true });
      updateVisibility();
      return () => {
        container.removeEventListener('scroll', updateVisibility);
      };
    }

    window.addEventListener('scroll', updateVisibility, { passive: true });
    updateVisibility();
    return () => {
      window.removeEventListener('scroll', updateVisibility);
    };
  }, []);

  const handleBackToTop = () => {
    const container = document.getElementById('app-scroll-container');
    if (container) {
      container.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (loading && subCommunities.length === 0) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 1200, margin: '0 auto', p: 3 }}>
      {/* Header Section */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          mb: 3,
          flexWrap: 'wrap',
          gap: 2.5,
          p: { xs: 2, md: 3 },
          borderRadius: 3,
          border: '1px solid',
          borderColor: 'divider',
          backgroundColor: 'background.paper',
        }}
      >
        <Box>
          <Typography variant="h4" component="h1" sx={{ fontWeight: 700 }}>
            Communities
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mt: 0.5 }}>
            Discover communities by interest and join the conversations that
            matter to you.
          </Typography>

          <Box sx={{ display: 'flex', gap: 1, mt: 1.5, flexWrap: 'wrap' }}>
            <Chip
              size="small"
              label={`${sections.length} sections`}
              color="primary"
              variant="outlined"
            />
            <Chip
              size="small"
              label={`${totalLoadedCommunities} loaded communities`}
              variant="outlined"
            />
          </Box>
        </Box>

        <Box
          sx={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            gap: 1,
            justifyContent: { xs: 'flex-start', md: 'flex-end' },
          }}
        >
          {/* <Button
            component={Link}
            to="/subcommunities/my"
            variant="contained"
            color="primary"
            sx={{
              borderRadius: 2,
              boxShadow: 1,
              fontWeight: 600,
              px: 3,
              py: 1.2,
              minWidth: 170,
              mb: { xs: 1, sm: 0 },
              textTransform: 'none',
            }}
          >
            My Communities
          </Button> */}

          {/* {(isAdmin || isAlum) && (
            <Button
              variant="outlined"
              startIcon={<Add />}
              onClick={() => setRequestDialogOpen(true)}
              sx={{ borderRadius: 2 }}
            >
              Request New Community
            </Button>
          )} */}
          {isAdmin && (
            <Button
              variant="outlined"
              onClick={() => setManageTypesOpen(true)}
              sx={{ borderRadius: 2 }}
            >
              Manage Types
            </Button>
          )}
        </Box>
      </Box>

      {/* Filter Bar */}
      <Box
        sx={{
          mb: 3,
          p: 2,
          borderRadius: 2,
          backgroundColor: 'background.paper',
          border: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Box
          sx={{
            mb: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 1,
            flexWrap: 'wrap',
          }}
        >
          <Typography
            variant="subtitle1"
            sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
          >
            <FilterList fontSize="small" />
            Filters
          </Typography>
          <Button
            variant="text"
            size="small"
            onClick={clearFilters}
            disabled={!hasActiveFilters}
            sx={{ textTransform: 'none' }}
          >
            Clear filters
          </Button>
        </Box>

        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel id="subcommunity-privacy-label">Privacy</InputLabel>
              <Select
                labelId="subcommunity-privacy-label"
                label="Privacy"
                value={activeFilters.privacy || 'all'}
                onChange={(e) =>
                  handleFilterChange({
                    privacy:
                      e.target.value === 'all'
                        ? undefined
                        : (e.target
                            .value as SubCommunityFilterParams['privacy']),
                  })
                }
              >
                <MenuItem value="all">All</MenuItem>
                <MenuItem value="public">Public</MenuItem>
                <MenuItem value="private">Private</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel id="subcommunity-membership-label">
                Membership
              </InputLabel>
              <Select
                labelId="subcommunity-membership-label"
                label="Membership"
                value={activeFilters.membership || 'all'}
                onChange={(e) =>
                  handleFilterChange({
                    membership:
                      e.target.value === 'all'
                        ? undefined
                        : (e.target
                            .value as SubCommunityFilterParams['membership']),
                  })
                }
              >
                <MenuItem value="all">All</MenuItem>
                <MenuItem value="joined">Joined only</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel id="subcommunity-sort-label">Sort</InputLabel>
              <Select
                labelId="subcommunity-sort-label"
                label="Sort"
                value={activeFilters.sort || 'all'}
                onChange={(e) =>
                  handleFilterChange({
                    sort:
                      e.target.value === 'all'
                        ? undefined
                        : (e.target.value as SubCommunityFilterParams['sort']),
                  })
                }
              >
                <MenuItem value="all">Default</MenuItem>
                <MenuItem value="recent">Most recent</MenuItem>
                <MenuItem value="popular">Most popular</MenuItem>
                <MenuItem value="active">Most active</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              size="small"
              type="number"
              label="Min members"
              value={activeFilters.minMembers ?? ''}
              inputProps={{ min: 0 }}
              onChange={(e) => {
                const parsed = Number(e.target.value);
                handleFilterChange({
                  minMembers:
                    Number.isFinite(parsed) && parsed > 0 ? parsed : undefined,
                });
              }}
            />
          </Grid>
        </Grid>
      </Box>

      {/* Community Sections */}

      {
        // !searchTerm &&
        sections.map((typeConfig) => {
          const typeId = typeConfig.id;

          return (
            <Box key={typeId}>
              <LazySection
                typeId={typeId}
                title={typeConfig.title}
                filters={activeFilters}
                hidePlaceholderWhenEmpty={hasActiveFilters}
              />
            </Box>
          );
        })
      }

      {/* Empty State */}
      {!isFilterLoading && totalLoadedCommunities === 0 && (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            {isFilteringJoinedOnly
              ? "You're not a member of any communities yet"
              : 'No communities found'}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {isFilteringJoinedOnly
              ? 'Join a community to see results in Joined only filter.'
              : 'Be the first to create a community!'}
          </Typography>
        </Box>
      )}

      {/* Dialogs */}
      {/* <CreateSubCommunityDialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
      />

      <SubCommunityRequestDialog
        open={requestDialogOpen}
        onClose={() => setRequestDialogOpen(false)}
      /> */}

      {/* Manage Types dialog for admins */}
      {isAdmin && (
        <Suspense fallback={null}>
          {/* Lazy load to avoid bundling if not used often */}
          <ManageTypesDialog
            open={manageTypesOpen}
            onClose={() => setManageTypesOpen(false)}
          />
        </Suspense>
      )}

      {/* Error Snackbar */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity="error"
          sx={{ width: '100%' }}
        >
          {error}
        </Alert>
      </Snackbar>

      {showBackToTop && (
        <Button
          variant="contained"
          color="primary"
          onClick={handleBackToTop}
          startIcon={<KeyboardArrowUp />}
          sx={{
            position: 'fixed',
            right: { xs: 16, md: 24 },
            bottom: { xs: 20, md: 28 },
            borderRadius: 999,
            px: 2,
            py: 1,
            zIndex: 1300,
            textTransform: 'none',
            boxShadow: 3,
          }}
        >
          Back to top
        </Button>
      )}
    </Box>
  );
};

export default SubCommunityPage;
