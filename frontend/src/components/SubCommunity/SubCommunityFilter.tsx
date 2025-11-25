import React from 'react';
import {
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
  ToggleButton,
  ToggleButtonGroup,
  Button,
} from '@mui/material';

export type SubCommunityFilterValue = {
  privacy: 'all' | 'public' | 'private';
  sort: 'recommended' | 'newest' | 'members';
};

interface Props {
  value: SubCommunityFilterValue;
  onChange: (v: SubCommunityFilterValue) => void;
  onApply?: () => void;
  types?: string[];
}

export const SubCommunityFilter: React.FC<Props> = ({
  value,
  onChange,
  onApply,
}) => {
  const handlePrivacy = (e: SelectChangeEvent) => {
    onChange({ ...value, privacy: e.target.value as any });
  };

  const handleSort = (
    _event: React.MouseEvent<HTMLElement>,
    newSort: 'recommended' | 'newest' | 'members' | null
  ) => {
    if (newSort) onChange({ ...value, sort: newSort });
  };

  return (
    <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 2 }}>
      <FormControl size="small" sx={{ minWidth: 160 }}>
        <InputLabel id="sc-privacy-label">Privacy</InputLabel>
        <Select
          labelId="sc-privacy-label"
          value={value.privacy}
          label="Privacy"
          onChange={handlePrivacy}
        >
          <MenuItem value="all">All</MenuItem>
          <MenuItem value="public">Public</MenuItem>
          <MenuItem value="private">Private</MenuItem>
        </Select>
      </FormControl>

      <ToggleButtonGroup
        value={value.sort}
        exclusive
        onChange={handleSort}
        size="small"
        aria-label="sort"
      >
        <ToggleButton value="recommended">Recommended</ToggleButton>
        <ToggleButton value="newest">Newest</ToggleButton>
        <ToggleButton value="members">Members</ToggleButton>
      </ToggleButtonGroup>
        <Box sx={{ ml: 'auto' }}>
          <Button size="small" variant="contained" onClick={onApply}>
            Apply
          </Button>
        </Box>
    </Box>
  );
};

export default SubCommunityFilter;
