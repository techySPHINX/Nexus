import { FC } from 'react';
import {
  Box,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';

interface FilterBarProps {
  search: string;
  setSearch: (v: string) => void;
  status: string;
  setStatus: (v: string) => void;
}

const FilterBar: FC<FilterBarProps> = ({
  search,
  setSearch,
  status,
  setStatus,
}) => {
  return (
    <Box
      sx={{
        display: 'flex',
        gap: 2,
        alignItems: 'center',
        mb: 2,
        flexWrap: 'wrap',
      }}
    >
      <TextField
        size="small"
        placeholder="Search startups..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        InputProps={{
          'aria-label': 'Search startups',
        }}
      />

      <FormControl size="small" sx={{ minWidth: 160 }}>
        <InputLabel>Status</InputLabel>
        <Select
          label="Status"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          <MenuItem value="ALL">All Status</MenuItem>
          <MenuItem value="IDEA">💡 Idea</MenuItem>
          <MenuItem value="PROTOTYPING">🔨 Prototyping</MenuItem>
          <MenuItem value="BETA">🚀 Beta</MenuItem>
          <MenuItem value="LAUNCHED">🎯 Launched</MenuItem>
        </Select>
      </FormControl>
    </Box>
  );
};

export default FilterBar;
