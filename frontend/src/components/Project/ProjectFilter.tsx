import React, { useState, useEffect } from 'react';
import { FilterProjectInterface, status, sortBy } from '@/types/ShowcaseType';
import {
  Box,
  TextField,
  MenuItem,
  Chip,
  FormControlLabel,
  Checkbox,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Typography,
} from '@mui/material';
import { ExpandMore, Close } from '@mui/icons-material';

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

  // Update parent filters when local filters change (with debounce)
  useEffect(() => {
    const timer = setTimeout(() => {
      onFilterChange(localFilters);
    }, 300);

    return () => clearTimeout(timer);
  }, [localFilters, onFilterChange]);

  const updateLocalFilter = (
    key: keyof FilterProjectInterface,
    value: FilterProjectInterface[typeof key]
  ) => {
    setLocalFilters((prev) => ({ ...prev, [key]: value }));
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

  return (
    <Accordion
      expanded={expanded}
      onChange={() => setExpanded(!expanded)}
      sx={{ mb: 3 }}
    >
      <AccordionSummary expandIcon={<ExpandMore />}>
        <Typography variant="h6">Filter Projects</Typography>
        {(localFilters.search ||
          localFilters.tags?.length ||
          localFilters.status) && (
          <Chip label="Active" color="primary" size="small" sx={{ ml: 2 }} />
        )}
      </AccordionSummary>

      <AccordionDetails>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {/* Search */}
          <TextField
            label="Search Projects"
            value={localFilters.search || ''}
            onChange={(e) => updateLocalFilter('search', e.target.value)}
            fullWidth
            size="small"
          />

          {/* Status and Sort */}
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <TextField
              select
              label="Status"
              value={localFilters.status || ''}
              onChange={(e) =>
                updateLocalFilter('status', e.target.value || undefined)
              }
              sx={{ minWidth: 120 }}
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
              sx={{ minWidth: 120 }}
              size="small"
            >
              <MenuItem value="">Default</MenuItem>
              {Object.values(sortBy).map((s) => (
                <MenuItem key={s} value={s}>
                  {s.replace('_', ' ')}
                </MenuItem>
              ))}
            </TextField>
          </Box>

          {/* Tags */}
          <Box>
            <TextField
              label="Add Tags"
              onKeyDown={handleTagInput}
              fullWidth
              size="small"
              helperText="Press Enter to add tags"
            />
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
              {localFilters.tags?.map((tag) => (
                <Chip
                  key={tag}
                  label={tag}
                  onDelete={() => removeTag(tag)}
                  deleteIcon={<Close />}
                  variant="outlined"
                  size="small"
                />
              ))}
            </Box>
          </Box>

          {/* Personalize */}
          <FormControlLabel
            control={
              <Checkbox
                checked={localFilters.personalize || false}
                onChange={(e) =>
                  updateLocalFilter('personalize', e.target.checked)
                }
              />
            }
            label="Show recommended projects"
          />
        </Box>
      </AccordionDetails>
    </Accordion>
  );
};

export default ProjectFilter;
