import React from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Button,
  Alert,
} from '@mui/material';
import { CheckCircle, Email, Schedule, Login } from '@mui/icons-material';
import { useLocation, Link as RouterLink } from 'react-router-dom';
import { motion } from 'framer-motion';

const RegistrationSuccess: React.FC = () => {
  const location = useLocation();
  const { message, requiresApproval } = location.state || {
    message: 'Registration successful!',
    requiresApproval: true,
  };

  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          py: 4,
        }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
          style={{ width: '100%' }}
        >
          <Paper
            elevation={0}
            sx={{
              p: 4,
              borderRadius: 3,
              border: '1px solid',
              borderColor: 'divider',
              textAlign: 'center',
            }}
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <Box
                sx={{
                  width: 80,
                  height: 80,
                  borderRadius: '50%',
                  backgroundColor: 'success.main',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mx: 'auto',
                  mb: 3,
                }}
              >
                <CheckCircle sx={{ color: 'white', fontSize: 40 }} />
              </Box>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <Typography
                variant="h4"
                component="h1"
                gutterBottom
                sx={{ fontWeight: 700 }}
              >
                Registration Submitted!
              </Typography>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <Typography variant="body1" color="text.secondary" paragraph>
                {message}
              </Typography>
            </motion.div>

            {requiresApproval ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.5 }}
              >
                <Alert
                  severity="info"
                  sx={{
                    mb: 3,
                    textAlign: 'left',
                    '& .MuiAlert-message': {
                      width: '100%',
                    },
                  }}
                >
                  <Typography variant="subtitle2" gutterBottom>
                    What happens next?
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <Schedule sx={{ fontSize: 16, mr: 1 }} />
                    <Typography variant="body2">
                      Our admin team will review your documents
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <Email sx={{ fontSize: 16, mr: 1 }} />
                    <Typography variant="body2">
                      You'll receive login credentials via email once approved
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Login sx={{ fontSize: 16, mr: 1 }} />
                    <Typography variant="body2">
                      Use those credentials to access the platform
                    </Typography>
                  </Box>
                </Alert>
              </motion.div>
            ) : null}

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.6 }}
            >
              <Box
                sx={{
                  display: 'flex',
                  gap: 2,
                  justifyContent: 'center',
                  flexWrap: 'wrap',
                }}
              >
                <Button
                  component={RouterLink}
                  to="/login"
                  variant="contained"
                  size="large"
                  sx={{ px: 4 }}
                >
                  Go to Login
                </Button>
                <Button
                  component={RouterLink}
                  to="/"
                  variant="outlined"
                  size="large"
                  sx={{ px: 4 }}
                >
                  Back to Home
                </Button>
              </Box>
            </motion.div>

            {requiresApproval ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.7 }}
              >
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mt: 3 }}
                >
                  <strong>Note:</strong> The approval process typically takes
                  1-2 business days. Please check your email regularly for
                  updates.
                </Typography>
              </motion.div>
            ) : null}
          </Paper>
        </motion.div>
      </Box>
    </Container>
  );
};

export default RegistrationSuccess;
