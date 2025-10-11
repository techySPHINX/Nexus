import React from 'react';
import {
  Paper,
  Typography,
  Box,
  TextField,
  FormControl,
  Select,
  MenuItem,
  InputLabel,
  Chip,
  FormGroup,
  FormControlLabel,
  Switch,
} from '@mui/material';
import {
  Search as SearchIcon,
  FilterList as FilterIcon,
} from '@mui/icons-material';
import { motion } from 'framer-motion';

interface SearchAndFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  statusFilter: string;
  onStatusFilterChange: (status: string) => void;
  roleFilter: string;
  onRoleFilterChange: (role: string) => void;
  showSearchAndFilters: boolean;
  onToggleSearchAndFilters: () => void;
}

const SearchAndFilters: React.FC<SearchAndFiltersProps> = ({
  searchTerm,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  roleFilter,
  onRoleFilterChange,
  showSearchAndFilters,
  onToggleSearchAndFilters,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.4 }}
    >
      <Paper
        elevation={3}
        sx={{
          p: 3,
          borderRadius: 3,
          background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
          border: '1px solid #e0e0e0',
          mb: 4,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <FilterIcon sx={{ mr: 2, color: '#4caf50' }} />
          <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 600 }}>
            Search & Filters
          </Typography>
          <FormGroup>
            <FormControlLabel
              control={
                <Switch
                  checked={showSearchAndFilters}
                  onChange={onToggleSearchAndFilters}
                  color="success"
                />
              }
              label="Show Filters"
            />
          </FormGroup>
        </Box>

        {showSearchAndFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Box
              sx={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 3,
                alignItems: 'center',
              }}
            >
              <TextField
                placeholder="Search connections..."
                value={searchTerm}
                onChange={(e) => onSearchChange(e.target.value)}
                variant="outlined"
                size="small"
                sx={{
                  flex: 1,
                  minWidth: 200,
                  '& .MuiOutlinedInput-root': {
                    backgroundColor: 'white',
                    borderRadius: 2,
                  },
                }}
                InputProps={{
                  startAdornment: <SearchIcon sx={{ color: '#666', mr: 1 }} />,
                }}
              />

              <FormControl size="small" sx={{ minWidth: 120 }}>
                <InputLabel>Status</InputLabel>
                <Select
                  value={statusFilter}
                  label="Status"
                  onChange={(e) => onStatusFilterChange(e.target.value)}
                  sx={{
                    backgroundColor: 'white',
                    borderRadius: 2,
                  }}
                >
                  <MenuItem value="">All</MenuItem>
                  <MenuItem value="accepted">
                    <Chip
                      label="Connected"
                      size="small"
                      color="success"
                      sx={{ mr: 1 }}
                    />
                    Connected
                  </MenuItem>
                  <MenuItem value="pending">
                    <Chip
                      label="Pending"
                      size="small"
                      color="warning"
                      sx={{ mr: 1 }}
                    />
                    Pending
                  </MenuItem>
                </Select>
              </FormControl>

              <FormControl size="small" sx={{ minWidth: 120 }}>
                <InputLabel>Role</InputLabel>
                <Select
                  value={roleFilter}
                  label="Role"
                  onChange={(e) => onRoleFilterChange(e.target.value)}
                  sx={{
                    backgroundColor: 'white',
                    borderRadius: 2,
                  }}
                >
                  <MenuItem value="">All Roles</MenuItem>
                  <MenuItem value="STUDENT">
                    <Chip
                      label="Student"
                      size="small"
                      color="primary"
                      sx={{ mr: 1 }}
                    />
                    Students
                  </MenuItem>
                  <MenuItem value="ALUMNI">
                    <Chip
                      label="Alumni"
                      size="small"
                      color="secondary"
                      sx={{ mr: 1 }}
                    />
                    Alumni
                  </MenuItem>
                </Select>
              </FormControl>
            </Box>
          </motion.div>
        )}
      </Paper>
    </motion.div>
  );
};

export default SearchAndFilters;
