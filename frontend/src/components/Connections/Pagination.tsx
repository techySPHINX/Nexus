import {
  Box,
  Typography,
  FormControl,
  Select,
  MenuItem,
  Button,
} from '@mui/material';

const PaginationControls = ({
  currentPage,
  totalPages,
  onPageChange,
  onLimitChange,
  totalItems,
  limit,
}: {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onLimitChange: (limit: number) => void;
  totalItems: number;
  limit: number;
}) => (
  <Box display="flex" justifyContent="space-between" alignItems="center" mt={3}>
    <Typography variant="body2" color="text.secondary">
      Showing {(currentPage - 1) * limit + 1}-
      {Math.min(currentPage * limit, totalItems)} of {totalItems}
    </Typography>

    <Box display="flex" alignItems="center" gap={2}>
      <FormControl size="small" sx={{ minWidth: 80 }}>
        <Select
          value={limit}
          onChange={(e) => onLimitChange(Number(e.target.value))}
        >
          <MenuItem value={10}>10</MenuItem>
          <MenuItem value={20}>20</MenuItem>
          <MenuItem value={50}>50</MenuItem>
          <MenuItem value={100}>100</MenuItem>
        </Select>
      </FormControl>

      <Button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        variant="outlined"
      >
        Previous
      </Button>

      <Typography variant="body1">
        Page {currentPage} of {totalPages}
      </Typography>

      <Button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage >= totalPages}
        variant="outlined"
      >
        Next
      </Button>
    </Box>
  </Box>
);

export default PaginationControls;
