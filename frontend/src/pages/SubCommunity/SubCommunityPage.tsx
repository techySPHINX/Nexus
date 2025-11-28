import { FC, Suspense, useState, useEffect, useRef } from 'react';
import {
  Box,
  Typography,
  // TextField,
  // InputAdornment,
  Button,
  Snackbar,
  Alert,
  CircularProgress,
  Grid,
  Card,
  CardContent,
  Skeleton,
} from '@mui/material';
import {
  // Search,
  Add,
} from '@mui/icons-material';
import { useSubCommunity } from '../../contexts/SubCommunityContext';
import { useAuth } from '../../contexts/AuthContext';
import { CreateSubCommunityDialog } from '../../components/SubCommunity/CreateSubCommunityDialog';
import { SubCommunityRequestDialog } from '../../components/SubCommunity/SubCommunityRequestDialog';
import { SubCommunitySection } from '../../components/SubCommunity/SubCommunitySection';
// import { SubCommunityCard } from '../../components/SubCommunity/SubCommunityCard';
// using manual SubCommunitySection instead of viewport-driven infinite loader
import { ManageTypesDialog } from '../../components/SubCommunity/ManageTypesDialog';
import { SubCommunity, SubCommunityType } from '../../types/subCommunity';
import { Link } from 'react-router-dom';

// Sections are built dynamically from types provided by context (plus 'all')

// Stable lazy section component: triggers ensureTypeLoaded in an effect
// and renders a SubCommunitySection for the given type. Keeping this
// at module scope prevents it being recreated on every render (which
// previously caused repeated API calls).
// No module-level initiated set any more — we rely on context's loading
// state and caching to determine whether a section has started loading.
const LazySection: FC<{
  typeId: string;
  title: string;
  initialCount?: number;
}> = ({ typeId, title, initialCount = 6 }) => {
  const {
    ensureTypeLoaded,
    ensureAllSubCommunities,
    scheduleTypeLoad,
    isLoadingForType,
    hasMoreForType,
    getRemainingForType,
    loadMoreForType,
    subCommunities,
    subCommunitiesByType,
  } = useSubCommunity();

  // We'll observe the section wrapper and call ensureTypeLoaded only when
  // it enters the viewport. This prevents eager loading of every section.
  const rootRef = useRef<HTMLDivElement | null>(null);
  const loadTimeoutRef = useRef<number | null>(null);
  // prevent scheduling multiple timeouts for the same section instance
  const scheduledRef = useRef(false);
  // track whether this section is currently intersecting
  const isIntersectingRef = useRef(false);
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

            isIntersectingRef.current = !!entry.isIntersecting;

            if (
              !scheduledRef.current &&
              displayCommunities.length === 0 &&
              !isCurrentlyLoading
            ) {
              scheduledRef.current = true;
              const delay = 100; // 100ms stagger
              loadTimeoutRef.current = window.setTimeout(async () => {
                try {
                  if (typeId === 'all') {
                    await scheduleTypeLoad('all', initialCount);
                  } else {
                    await scheduleTypeLoad(typeId, initialCount);
                  }
                } catch (err) {
                  console.warn('Failed to load type', typeId, err);
                } finally {
                  // If, after the fetch, there is still no data for this
                  // section, allow rescheduling so it can retry later (for
                  // example when transient network failures occur).
                  const currentDisplay =
                    typeId === 'all'
                      ? subCommunitiesRef.current
                      : subCommunitiesByTypeRef.current.filter(
                          (subCom: SubCommunity) =>
                            typeof subCom.type === 'string'
                              ? subCom.type === typeId
                              : subCom.type?.name === typeId
                        );

                  if (!currentDisplay || currentDisplay.length === 0) {
                    // no data arrived for this section; allow retry later
                    scheduledRef.current = false;
                    // If the element is still intersecting, immediately re-enqueue
                    // so the queue worker will retry. This avoids waiting for a
                    // new intersection event which may not happen while the
                    // element remains visible.
                    if (isIntersectingRef.current) {
                      scheduleTypeLoad(typeId, initialCount).catch(() => {});
                    }
                  } else {
                    // we have data now; stop observing this element to avoid
                    // any further redundant scheduling for this instance.
                    if (rootRef.current) observer.unobserve(rootRef.current);
                    scheduledRef.current = true;
                  }
                }
              }, delay) as unknown as number;
            }
          } else {
            // Element left viewport. Clear any pending scheduled load so the
            // section can be rescheduled on future intersections. This fixes
            // cases where a quick scroll out/in would leave scheduledRef
            // stuck and prevent subsequent loads.
            isIntersectingRef.current = false;
            if (loadTimeoutRef.current) {
              clearTimeout(loadTimeoutRef.current);
              loadTimeoutRef.current = null;
            }
            // allow re-scheduling when the element leaves (so future
            // intersections can re-enqueue work)
            scheduledRef.current = false;
          }
        }
      },
      // Use a tight rootMargin so nearby off-screen sections aren't
      // considered intersecting. A modest threshold means a meaningful
      // portion of the section must be visible before loading.
      { root: null, rootMargin: '0px', threshold: 0.25 }
    );

    observer.observe(el);
    return () => {
      observer.disconnect();
      if (loadTimeoutRef.current) {
        clearTimeout(loadTimeoutRef.current);
        loadTimeoutRef.current = null;
      }
    };
  }, [
    typeId,
    ensureTypeLoaded,
    ensureAllSubCommunities,
    scheduleTypeLoad,
    initialCount,
    isLoadingForType,
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
  const hasMore = hasMoreForType(typeId, initialCount);
  const remainingCount = getRemainingForType(typeId, initialCount);

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
              variant="h5"
              component="h2"
              sx={{
                fontWeight: 600,
                color: 'text.primary',
                mb: 3,
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                paddingBottom: '8px',
                borderBottom: '2px solid',
                borderColor: 'primary.main',
                width: 'fit-content',
                transition: 'all 0.2s ease-in-out',
                '&:hover': {
                  color: 'primary.main',
                  borderColor: 'primary.dark',
                  '& .section-chevron': {
                    transform: 'translateX(4px)',
                    color: 'primary.dark',
                  },
                },
              }}
            >
              {title}
              <Box
                component="span"
                className="section-chevron"
                sx={{
                  color: 'primary.main',
                  fontSize: '1.3em',
                  fontWeight: 'bold',
                  transition: 'all 0.2s ease-in-out',
                }}
              >
                ›
              </Box>
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
          <SubCommunitySection
            title={title}
            type={typeId}
            communities={displayCommunities}
            initialCount={initialCount}
            onLoadMore={() => loadMoreForType(typeId, initialCount)}
            hasMore={hasMore}
            isLoading={isLoading}
            remainingCount={remainingCount}
          />
        )
      ) : (
        // keep an empty placeholder so the observer has something to attach to
        // Use a larger placeholder so sections below the fold don't all
        // register as intersecting at once (small placeholders could all
        // fall inside rootMargin and trigger eager loads).
        <Box sx={{ minHeight: 160 }} />
      )}
    </div>
  );
};

const SubCommunitiesPage: React.FC = () => {
  const {
    subCommunities,
    loading,
    ensureTypes,
    error,
    clearError,
    types,
    sectionLoadInProgress,
  } = useSubCommunity();

  const { user } = useAuth();
  // const [searchTerm, setSearchTerm] = useState('');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [requestDialogOpen, setRequestDialogOpen] = useState(false);
  const [manageTypesOpen, setManageTypesOpen] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  // Note: we previously tracked loadedTypes here; async loading is handled
  // inside LazySection to avoid triggering async work during render.

  const isAdmin = user?.role === 'ADMIN';
  const isAlum = user?.role === 'ALUM';

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

  // Prevent scrolling while any section is actively loading. This keeps the
  // viewport stable so users don't scroll past a skeleton while it's loading
  // and accidentally trigger many sections to queue up.
  useEffect(() => {
    // Rely on the global sectionLoadInProgress flag from context which is
    // set whenever a section-level load is actively running (and cleared
    // when it finishes). This is more reliable than scanning per-type
    // flags and avoids races when many observers trigger.
    const previousOverflow = document.body.style.overflow;
    if (sectionLoadInProgress) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = previousOverflow || '';
    }

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [sectionLoadInProgress]);

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

  if (loading && subCommunities.length === 0) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  // const filteredCommunities = filterCommunities(subCommunities);

  const sections = [
    { id: 'all', title: 'Recommended Communities' },
    ...((types || []) as SubCommunityType[]).map((t: SubCommunityType) => ({
      id: t.name,
      title: `${t.name} Communities`,
    })),
  ];

  return (
    <Box sx={{ maxWidth: 1200, margin: '0 auto', p: 3 }}>
      {/* Header Section */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 4,
          flexWrap: 'wrap',
          gap: 2,
        }}
      >
        <Typography variant="h4" component="h1" sx={{ fontWeight: 700 }}>
          Communities
        </Typography>

        <Box
          sx={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            gap: 1,
          }}
        >
          <Button
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
              ml: { xs: 0, sm: 2 },
              mb: { xs: 1, sm: 0 },
              textTransform: 'none',
            }}
          >
            My Communities
          </Button>

          {(isAdmin || isAlum) && (
            <Button
              variant="outlined"
              startIcon={<Add />}
              onClick={() => setRequestDialogOpen(true)}
              sx={{ borderRadius: 2 }}
            >
              Request New Community
            </Button>
          )}
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

      {/* Search Bar */}
      {/* <TextField
        fullWidth
        placeholder="Search communities by name, description, or type..."
        value={searchTerm}
        onChange={(e: ChangeEvent<HTMLInputElement>) =>
          setSearchTerm(e.target.value)
        }
        sx={{ mb: 4 }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <Search />
            </InputAdornment>
          ),
          sx: { borderRadius: 2 },
        }}
      /> */}

      {/* Search Results */}
      {/* {searchTerm && (
        <Box sx={{ mb: 4 }}>
          <Typography
            variant="h5"
            component="h2"
            gutterBottom
            sx={{ fontWeight: 600, color: 'text.primary', mb: 3 }}
          >
            Search Results for &quot;{searchTerm}&quot;
          </Typography>
          {filteredCommunities.length === 0 ? (
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ textAlign: 'center', py: 4 }}
            >
              No communities found matching your search
            </Typography>
          ) : (
            <Grid container spacing={3}>
              {filteredCommunities.map((subCom) => (
                <Grid item xs={12} sm={6} md={6} key={subCom.id}>
                  <SubCommunityCard subCommunity={subCom} />
                </Grid>
              ))}
            </Grid>
          )}
        </Box>
      )} */}

      {/* Community Sections */}
      {
        // !searchTerm &&
        sections.map((typeConfig) => {
          const typeId = typeConfig.id;

          return (
            <LazySection
              key={typeId}
              typeId={typeId}
              title={typeConfig.title}
            />
          );
        })
      }

      {/* Empty State */}
      {
        // !searchTerm &&
        subCommunities.length === 0 && (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No communities found
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Be the first to create a community!
            </Typography>
          </Box>
        )
      }

      {/* Dialogs */}
      <CreateSubCommunityDialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
      />

      <SubCommunityRequestDialog
        open={requestDialogOpen}
        onClose={() => setRequestDialogOpen(false)}
      />

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
    </Box>
  );
};

export default SubCommunitiesPage;
