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
import { SubCommunity } from '../../types/subCommunity';
import { Link } from 'react-router-dom';

const SUB_COMMUNITY_TYPES = [
  { id: 'all', label: 'Recommended', title: 'Recommended Communities' },
  { id: 'TECH', label: 'Tech', title: 'Technology Communities' },
  { id: 'GAME', label: 'Game', title: 'Gaming Communities' },
  { id: 'MUSIC', label: 'Music', title: 'Music Communities' },
  { id: 'SPORT', label: 'Sport', title: 'Sports Communities' },
  { id: 'ART', label: 'Art', title: 'Art Communities' },
  { id: 'SCIENCE', label: 'Science', title: 'Science Communities' },
  { id: 'EDUCATION', label: 'Education', title: 'Education Communities' },
  {
    id: 'ENTERTAINMENT',
    label: 'Entertainment',
    title: 'Entertainment Communities',
  },
  { id: 'LIFESTYLE', label: 'Lifestyle', title: 'Lifestyle Communities' },
  { id: 'OTHER', label: 'Others', title: 'Other Communities' },
];

export const SubCommunitiesPage: React.FC = () => {
  const {
    subCommunities,
    subCommunitiesByType,
    loading,
    getAllSubCommunities,
    getSubCommunityByType,
    error,
    clearError,
  } = useSubCommunity();

  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [requestDialogOpen, setRequestDialogOpen] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [loadedTypes, setLoadedTypes] = useState<Set<string>>(new Set());

  const isAdmin = user?.role === 'ADMIN';
  const isAlum = user?.role === 'ALUM';

  useEffect(() => {
    // Load all communities initially
    getAllSubCommunities();
  }, [getAllSubCommunities]);

  useEffect(() => {
    if (error) {
      setSnackbarOpen(true);
    }
  }, [error]);

  // Function to load a specific type if not already loaded
  const loadTypeIfNeeded = (type: string) => {
    if (type !== 'all' && !loadedTypes.has(type)) {
      getSubCommunityByType(type, 1, 20);
      setLoadedTypes((prev) => new Set(prev).add(type));
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbarOpen(false);
    clearError();
  };

  const filterCommunities = (communities: SubCommunity[]): SubCommunity[] => {
    if (!searchTerm) return communities;

    return communities.filter(
      (subCom) =>
        subCom.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        subCom.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        subCom.type.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  // Get communities for display - use cached data when available
  const getDisplayCommunities = (type: string): SubCommunity[] => {
    if (type === 'all') {
      return subCommunities;
    }

    // Pre-load the type if needed
    loadTypeIfNeeded(type);

    // Return communities of this type from the cached byType state
    return subCommunitiesByType.filter((subCom) => subCom.type === type);
  };

  if (loading && subCommunities.length === 0) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  const filteredCommunities = filterCommunities(subCommunities);

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
      </Box>

      {/* Search Bar */}
      <TextField
        fullWidth
        placeholder="Search communities by name, description, or type..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
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
        SUB_COMMUNITY_TYPES.map((typeConfig) => {
          const displayCommunities = getDisplayCommunities(typeConfig.id);

          if (displayCommunities.length === 0 && typeConfig.id !== 'all') {
            return null;
          }

          return (
            <SubCommunitySection
              key={typeConfig.id}
              title={typeConfig.title}
              type={typeConfig.id}
              communities={displayCommunities}
              // hasMore={/* You can check cache for pagination info */}
              onLoadMore={() => getSubCommunityByType(typeConfig.id, 2, 20)}
              initialCount={6}
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
