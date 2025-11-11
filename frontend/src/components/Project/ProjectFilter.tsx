import React, { useState } from 'react';
import { FilterProjectInterface, status, sortBy } from '@/types/ShowcaseType';
import {
  Box,
  TextField,
  MenuItem,
  Chip,
  Typography,
  Button,
  Stack,
  Paper,
  IconButton,
  Grid,
  Badge,
} from '@mui/material';
import { Close, Search, FilterList } from '@mui/icons-material';
import { AnimatePresence, motion } from 'framer-motion';

interface ProjectFilterProps {
  filters: FilterProjectInterface;
  onFilterChange: (filters: FilterProjectInterface) => void;
}

const ProjectFilter: React.FC<ProjectFilterProps> = ({
  filters,
  onFilterChange,
}) => {
  const [localFilters, setLocalFilters] = useState(filters);
  const [expanded, setExpanded] = useState(false);

  // Keep localFilters in sync when parent `filters` prop changes
  React.useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);

  // Centralized apply handler: use current localFilters (including search)
  const handleApplyFilters = () => {
    onFilterChange({ ...localFilters, cursor: undefined });
    setExpanded(false);
  };

  // Helper for Apply button near search field
  const applyFromSearch = () => {
    onFilterChange({ ...localFilters, cursor: undefined });
  };

  // Search updates local state only; applying happens when user clicks Apply
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setLocalFilters((prev) => ({ ...prev, search: value, cursor: undefined }));
  };

  const handleClearSearch = () => {
    setLocalFilters((prev) => ({ ...prev, search: '', cursor: undefined }));
  };

  const updateLocalFilter = (
    key: keyof FilterProjectInterface,
    value: FilterProjectInterface[typeof key]
  ) => {
    setLocalFilters((prev) => ({ ...prev, [key]: value, cursor: undefined }));
  };

  const handleTagInput = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && e.currentTarget.value.trim()) {
      const newTag = e.currentTarget.value.trim();
      updateLocalFilter('tags', [...(localFilters.tags || []), newTag]);
      e.currentTarget.value = '';
      e.preventDefault();
    }
  };

  const removeTag = (tagToRemove: string) => {
    updateLocalFilter(
      'tags',
      localFilters.tags?.filter((tag) => tag !== tagToRemove) || []
    );
  };

  const clearAllFilters = () => {
    setLocalFilters((prev) => {
      const next: FilterProjectInterface = {
        pageSize: 12,
        personalize: prev.personalize,
      };
      onFilterChange(next);
      return next;
    });
  };

  // Removed unused hasActiveFilters

  return (
    <Paper sx={{ mb: 3, p: 2, borderRadius: 3, boxShadow: 2 }} elevation={1}>
      {/* Personalize Toggle + Search + Filters */}
      <Grid container spacing={2} alignItems="center" sx={{ mb: 1 }}>
        <Grid item>
          <Button
            variant={localFilters.personalize ? 'contained' : 'outlined'}
            color={localFilters.personalize ? 'primary' : 'info'}
            onClick={() => {
              setLocalFilters((prev) => ({
                ...prev,
                personalize: !prev.personalize,
              }));
              onFilterChange({
                ...localFilters,
                personalize: !localFilters.personalize,
              });
            }}
            sx={{
              borderRadius: 3,
              fontWeight: 700,
              px: 2,
              py: 1,
              boxShadow: localFilters.personalize ? 2 : 0,
              transition: 'all 0.3s',
            }}
          >
            {localFilters.personalize ? 'Show All' : 'Personalize'}
          </Button>
        </Grid>

        <Grid item xs>
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <TextField
              label="Search projects..."
              value={localFilters.search || ''}
              onChange={handleSearchChange}
              fullWidth
              size="small"
              onKeyDown={(e) => {
                if (e.key === 'Enter') applyFromSearch();
              }}
              InputProps={{
                startAdornment: (
                  <Search sx={{ color: 'text.secondary', mr: 1 }} />
                ),
                endAdornment: (
                  <IconButton
                    size="small"
                    onClick={handleClearSearch}
                    aria-label="clear-search"
                  >
                    <Close fontSize="small" />
                  </IconButton>
                ),
              }}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
            />

            <Button
              variant="contained"
              color="primary"
              onClick={applyFromSearch}
              sx={{ whiteSpace: 'nowrap' }}
            >
              Apply
            </Button>
          </Box>
        </Grid>

        <Grid item>
          <Badge
            badgeContent={
              Number(!!localFilters.search) +
              Number(!!localFilters.status) +
              Number(!!localFilters.sortBy) +
              (localFilters.tags?.length || 0)
            }
            color="primary"
          >
            <Button
              variant={expanded ? 'contained' : 'outlined'}
              startIcon={<FilterList />}
              onClick={() => setExpanded(!expanded)}
              sx={{ borderRadius: 2 }}
            >
              Filters
            </Button>
          </Badge>
        </Grid>

        {(localFilters.status ||
          localFilters.sortBy ||
          localFilters.tags?.length) && (
          <Grid item>
            <Button
              variant="text"
              onClick={clearAllFilters}
              sx={{ color: 'text.secondary' }}
            >
              Clear All
            </Button>
          </Grid>
        )}
      </Grid>

      {/* Expanded Filters */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Box
              sx={{
                p: 3,
                border: 1,
                borderColor: 'divider',
                borderRadius: 2,
                bgcolor: 'background.paper',
                mb: 2,
              }}
            >
              <Stack spacing={3}>
                {/* Status and Sort */}
                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                  <TextField
                    select
                    label="Status"
                    value={localFilters.status || ''}
                    onChange={(e) =>
                      updateLocalFilter('status', e.target.value || undefined)
                    }
                    sx={{ minWidth: 140 }}
                    size="small"
                  >
                    <MenuItem value="">All Status</MenuItem>
                    {Object.values(status).map((s) => (
                      <MenuItem key={s} value={s}>
                        {s.replace('_', ' ')}
                      </MenuItem>
                    ))}
                  </TextField>

                  <TextField
                    select
                    label="Sort By"
                    value={localFilters.sortBy || ''}
                    onChange={(e) =>
                      updateLocalFilter(
                        'sortBy',
                        (e.target.value as sortBy) || undefined
                      )
                    }
                    sx={{ minWidth: 140 }}
                    size="small"
                  >
                    <MenuItem value="">Most Recent</MenuItem>
                    <MenuItem value={sortBy.SUPPORTERS}>
                      Most Supported
                    </MenuItem>
                    <MenuItem value={sortBy.FOLLOWERS}>Most Followed</MenuItem>
                    <MenuItem value={sortBy.CREATED_AT}>Date Created</MenuItem>
                    <MenuItem value={sortBy.UPDATED_AT}>Last Updated</MenuItem>
                  </TextField>
                </Box>

                {/* Tags */}
                <Box>
                  <Typography variant="subtitle2" gutterBottom>
                    Tags
                  </Typography>
                  <TextField
                    label="Add tags (press Enter)"
                    onKeyDown={handleTagInput}
                    fullWidth
                    size="small"
                    sx={{ mb: 1 }}
                  />
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {localFilters.tags?.map((tag) => (
                      <Chip
                        key={tag}
                        label={tag}
                        onDelete={() => removeTag(tag)}
                        deleteIcon={<Close />}
                        variant="outlined"
                        size="small"
                        color="primary"
                      />
                    ))}
                  </Box>
                </Box>

                {/* Apply Filters Button */}
                <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={handleApplyFilters}
                    sx={{ borderRadius: 2, px: 4, py: 1.2, fontWeight: 600 }}
                  >
                    Apply Filters
                  </Button>
                </Box>
              </Stack>
            </Box>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Active Filters Display */}
      {(localFilters.search ||
        localFilters.status ||
        localFilters.sortBy ||
        localFilters.tags?.length) && (
        <Box
          sx={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 1,
            alignItems: 'center',
          }}
        >
          <Typography variant="body2" color="text.secondary">
            Active filters:
          </Typography>
          {localFilters.search && (
            <Chip
              label={`Search: "${localFilters.search}"`}
              size="small"
              onDelete={handleClearSearch}
            />
          )}
          {localFilters.status && (
            <Chip
              label={`Status: ${localFilters.status.replace('_', ' ')}`}
              size="small"
              onDelete={() => updateLocalFilter('status', undefined)}
            />
          )}
          {localFilters.tags?.map((tag) => (
            <Chip
              key={tag}
              label={tag}
              size="small"
              onDelete={() => removeTag(tag)}
            />
          ))}
        </Box>
      )}
    </Paper>
  );
};

export default ProjectFilter;
