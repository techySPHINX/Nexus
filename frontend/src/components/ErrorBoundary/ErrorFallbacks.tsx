import { Box, Button, Link, Stack, Typography } from '@mui/material';
import type { FallbackProps } from 'react-error-boundary';

const DASHBOARD_PATH = '/dashboard';

type GlobalErrorFallbackProps = FallbackProps & {
  onReload?: () => void;
};

export const GlobalErrorFallback = ({
  onReload = () => window.location.reload(),
}: GlobalErrorFallbackProps) => {
  return (
    <Box
      role="alert"
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        px: 2,
      }}
    >
      <Box
        sx={{
          maxWidth: 560,
          width: '100%',
          p: 4,
          borderRadius: 2,
          border: '1px solid',
          borderColor: 'divider',
          bgcolor: 'background.paper',
          boxShadow: 1,
        }}
      >
        <Typography variant="h5" fontWeight={700} gutterBottom>
          Something went wrong
        </Typography>
        <Typography color="text.secondary" sx={{ mb: 3 }}>
          We hit an unexpected issue while loading the app. Try reloading the
          page or continue to your dashboard.
        </Typography>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
          <Button variant="contained" onClick={onReload} fullWidth>
            Reload Page
          </Button>
          <Button
            variant="outlined"
            component={Link}
            href={DASHBOARD_PATH}
            fullWidth
          >
            Go to Dashboard
          </Button>
        </Stack>
      </Box>
    </Box>
  );
};

export const RouteErrorFallback = ({ resetErrorBoundary }: FallbackProps) => {
  return (
    <Box
      role="alert"
      sx={{
        minHeight: 320,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        px: 2,
      }}
    >
      <Box
        sx={{
          maxWidth: 520,
          width: '100%',
          p: 3,
          borderRadius: 2,
          border: '1px solid',
          borderColor: 'divider',
          bgcolor: 'background.paper',
        }}
      >
        <Typography variant="h6" fontWeight={700} gutterBottom>
          This page failed to load
        </Typography>
        <Typography color="text.secondary" sx={{ mb: 2 }}>
          The rest of the app is still available. You can retry this page or
          move to another section.
        </Typography>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
          <Button variant="contained" onClick={resetErrorBoundary} fullWidth>
            Try Again
          </Button>
          <Button
            variant="outlined"
            component={Link}
            href={DASHBOARD_PATH}
            fullWidth
          >
            Go to Dashboard
          </Button>
        </Stack>
      </Box>
    </Box>
  );
};
