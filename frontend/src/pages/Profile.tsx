import React from 'react';
import { Container, Typography, Box } from '@mui/material';
import { motion } from 'framer-motion';

const Profile: React.FC = () => {
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <Typography variant="h3" component="h1" gutterBottom sx={{ fontWeight: 700 }}>
          Profile
        </Typography>
        <Typography variant="h6" color="text.secondary">
          Manage your profile information
        </Typography>
        <Box sx={{ mt: 4 }}>
          <Typography variant="body1">
            Profile page coming soon...
          </Typography>
        </Box>
      </motion.div>
    </Container>
  );
};

export default Profile; 