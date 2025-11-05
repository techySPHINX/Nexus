import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  TextField,
  InputAdornment,
  Button,
  Snackbar,
  Alert,
  CircularProgress,
  Grid,
} from '@mui/material';
import { Search, Add } from '@mui/icons-material';
import { useSubCommunity } from '../../contexts/SubCommunityContext';
import { useAuth } from '../../contexts/AuthContext';
import { CreateSubCommunityDialog } from '../../components/SubCommunity/CreateSubCommunityDialog';
import { SubCommunityRequestDialog } from '../../components/SubCommunity/SubCommunityRequestDialog';
import { SubCommunitySection } from '../../components/SubCommunity/SubCommunitySection';
import { SubCommunityCard } from '../../components/SubCommunity/SubCommunityCard';
// using manual SubCommunitySection instead of viewport-driven infinite loader
import { ManageTypesDialog } from '../../components/SubCommunity/ManageTypesDialog';
import { SubCommunity, SubCommunityType } from '../../types/subCommunity';
import { Link } from 'react-router-dom';

// Sections are built dynamically from types provided by context (plus 'all')

// Stable lazy section component: triggers ensureTypeLoaded in an effect
// and renders a SubCommunitySection for the given type. Keeping this
// at module scope prevents it being recreated on every render (which
// previously caused repeated API calls).
const LazySection: React.FC<{
  typeId: string;
  title: string;
  initialCount?: number;
}> = ({ typeId, title, initialCount = 6 }) => {
  const {
    ensureTypeLoaded,
    isLoadingForType,
    hasMoreForType,
    getRemainingForType,
    loadMoreForType,
    subCommunities,
    subCommunitiesByType,
  } = useSubCommunity();

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        if (typeId !== 'all') await ensureTypeLoaded(typeId, initialCount);
      } catch (err) {
        if (mounted) console.warn('Failed to load type', typeId, err);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [typeId, ensureTypeLoaded, initialCount]);

  const displayCommunities =
    typeId === 'all'
      ? subCommunities
      : subCommunitiesByType.filter((subCom: SubCommunity) =>
          typeof subCom.type === 'string'
            ? subCom.type === typeId
            : subCom.type?.name === typeId
        );

  if (displayCommunities.length === 0) return null;

  const isLoading = isLoadingForType(typeId);
  const hasMore = hasMoreForType(typeId, initialCount);
  const remainingCount = getRemainingForType(typeId, initialCount);

  return (
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
  );
};

export const SubCommunitiesPage: React.FC = () => {
  const {
    subCommunities,
    loading,
    ensureAllSubCommunities,
    ensureTypes,
    error,
    clearError,
    types,
  } = useSubCommunity();

  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
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
        await Promise.all([ensureAllSubCommunities(), ensureTypes()]);
      } catch (err) {
        if (mounted) console.warn('Failed initial subcommunity load', err);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [ensureAllSubCommunities, ensureTypes]);

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

  const filterCommunities = (communities: SubCommunity[]): SubCommunity[] => {
    if (!searchTerm) return communities;

    return communities.filter((subCom) => {
      const typeStr =
        typeof subCom.type === 'string' ? subCom.type : subCom.type?.name || '';

      return (
        subCom.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        subCom.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        typeStr.toLowerCase().includes(searchTerm.toLowerCase())
      );
    });
  };

  // (Per-type display logic moved into LazySection to avoid inline async work)

  if (loading && subCommunities.length === 0) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  const filteredCommunities = filterCommunities(subCommunities);

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

        <Button
          component={Link}
          to="/subcommunities/my"
          variant="contained"
          color="primary"
          startIcon={<Add />}
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
            sx={{ borderRadius: 2, ml: 1 }}
          >
            Manage Types
          </Button>
        )}
      </Box>

      {/* Search Bar */}
      <TextField
        fullWidth
        placeholder="Search communities by name, description, or type..."
        value={searchTerm}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
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
      />

      {/* Search Results */}
      {searchTerm && (
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
      )}

      {/* Community Sections */}
      {!searchTerm &&
        sections.map((typeConfig) => {
          const typeId = typeConfig.id;

          return (
            <LazySection
              key={typeId}
              typeId={typeId}
              title={typeConfig.title}
            />
          );
        })}

      {/* Empty State */}
      {!searchTerm && subCommunities.length === 0 && (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No communities found
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Be the first to create a community!
          </Typography>
        </Box>
      )}

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
        <React.Suspense fallback={null}>
          {/* Lazy load to avoid bundling if not used often */}
          <ManageTypesDialog
            open={manageTypesOpen}
            onClose={() => setManageTypesOpen(false)}
          />
        </React.Suspense>
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
