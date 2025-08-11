// components/ErrorFallback.tsx
import React from 'react';
import { Alert, Button } from '@mui/material';

interface ErrorFallbackProps {
  error: Error;
  resetErrorBoundary: () => void;
}

export const ErrorFallback: React.FC<ErrorFallbackProps> = ({ error, resetErrorBoundary }) => {
  return (
    <Alert
      severity="error"
      action={
        <Button color="inherit" size="small" onClick={resetErrorBoundary}>
          Try Again
        </Button>
      }
      sx={{ mb: 2 }}
    >
      Something went wrong: {error.message}
    </Alert>
  );
};