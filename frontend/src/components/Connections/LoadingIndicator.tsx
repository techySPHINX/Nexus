// components/LoadingIndicator.tsx
import { Box, CircularProgress } from '@mui/material';

export const LoadingIndicator = () => {
  return (
    <Box display="flex" justifyContent="center" my={2}>
      <CircularProgress size={28} />
    </Box>
  );
};
