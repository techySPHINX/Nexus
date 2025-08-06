import React from 'react';
import { Container, Typography, Box } from '@mui/material';
import { motion } from 'framer-motion';

const Messages: React.FC = () => {
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <Typography variant="h3" component="h1" gutterBottom sx={{ fontWeight: 700 }}>
          Messages
        </Typography>
        <Typography variant="h6" color="text.secondary">
          Chat with your connections
        </Typography>
        <Box sx={{ mt: 4 }}>
          <Typography variant="body1">
            Messages page coming soon...
          </Typography>
        </Box>
      </motion.div>
    </Container>
  );
};

export default Messages; 