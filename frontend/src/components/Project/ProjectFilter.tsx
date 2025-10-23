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
  const [searchActive, setSearchActive] = useState(false);

  // Keep localFilters in sync when parent `filters` prop changes
  React.useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);

  // Only apply filters when user clicks the button (for dropdown fields)
  const handleApplyFilters = () => {
    onFilterChange({
      ...filters,
      status: localFilters.status,
      sortBy: localFilters.sortBy,
      tags: localFilters.tags,
      // skills: localFilters.skills, // add if you have skills
    });
    setExpanded(false);
  };

  // Search applies instantly, but can be cleared
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setLocalFilters((prev) => {
      const next: FilterProjectInterface = {
        ...prev,
        search: value,
        cursor: undefined,
      };
      onFilterChange(next);
      return next;
    });
    setSearchActive(!!value);
  };

  const handleClearSearch = () => {
    setLocalFilters((prev) => {
      const next: FilterProjectInterface = {
        ...prev,
        search: '',
        cursor: undefined,
      };
      onFilterChange(next);
      return next;
    });
    setSearchActive(false);
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
    <Box sx={{ mb: 3 }}>
      {/* Personalize Toggle - outside dropdown, animated */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, gap: 2 }}>
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
            background: localFilters.personalize
              ? 'linear-gradient(90deg, #1976d2 60%, #64b5f6 100%)'
              : undefined,
          }}
        >
          {localFilters.personalize ? 'Show All' : 'Personalize'}
        </Button>

        {/* Quick Search Bar */}
        <TextField
          label="Search projects..."
          value={localFilters.search || ''}
          onChange={handleSearchChange}
          fullWidth
          size="small"
          InputProps={{
            startAdornment: <Search sx={{ color: 'text.secondary', mr: 1 }} />,
            endAdornment: searchActive && (
              <Button
                size="small"
                color="secondary"
                onClick={handleClearSearch}
                sx={{ minWidth: 0, px: 1 }}
              >
                <Close fontSize="small" />
              </Button>
            ),
          }}
          sx={{
            maxWidth: 400,
            '& .MuiOutlinedInput-root': {
              borderRadius: 2,
            },
          }}
        />

        <Button
          variant={expanded ? 'contained' : 'outlined'}
          startIcon={<FilterList />}
          onClick={() => setExpanded(!expanded)}
          sx={{ borderRadius: 2 }}
        >
          Filters
          {(localFilters.status ||
            localFilters.sortBy ||
            localFilters.tags?.length) && (
            <Chip
              label="!"
              size="small"
              color="primary"
              sx={{ ml: 1, minWidth: 20, height: 20 }}
            />
          )}
        </Button>

        {(localFilters.status ||
          localFilters.sortBy ||
          localFilters.tags?.length) && (
          <Button
            variant="text"
            onClick={clearAllFilters}
            sx={{ color: 'text.secondary' }}
          >
            Clear All
          </Button>
        )}
      </Box>

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
    </Box>
  );
};

export default ProjectFilter;
