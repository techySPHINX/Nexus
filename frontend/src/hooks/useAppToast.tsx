import { useCallback } from 'react';
import { IconButton } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { SnackbarKey, useSnackbar } from 'notistack';

export type ToastVariant = 'success' | 'error' | 'warning' | 'info';

export const useAppToast = () => {
  const { enqueueSnackbar, closeSnackbar } = useSnackbar();

  const toast = useCallback(
    (message: string, variant: ToastVariant = 'info') => {
      const isError = variant === 'error';

      enqueueSnackbar(message, {
        variant,
        autoHideDuration: isError ? undefined : 4000,
        persist: isError,
        action: isError
          ? (snackbarId: SnackbarKey) => (
              <IconButton
                aria-label="Dismiss notification"
                color="inherit"
                size="small"
                onClick={() => closeSnackbar(snackbarId)}
              >
                <CloseIcon fontSize="small" />
              </IconButton>
            )
          : undefined,
      });
    },
    [closeSnackbar, enqueueSnackbar]
  );

  return { toast };
};
