import { Alert,Snackbar } from "@mui/material";
import { useState } from "react";

export function SnackbarTab() {
    const [snackbarOpen, setSnackbarOpen] = useState(false);
        const [snackbarMessage, setSnackbarMessage] = useState('');
        const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error'>('success');
    return (
        <Snackbar
                open={snackbarOpen}
                autoHideDuration={4000}
                onClose={() => setSnackbarOpen(false)}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            >
                <Alert
                    onClose={() => setSnackbarOpen(false)}
                    severity={snackbarSeverity}
                    sx={{ width: '100%' }}
                    elevation={6}
                >
                    {snackbarMessage}
                </Alert>
            </Snackbar>
    );
}