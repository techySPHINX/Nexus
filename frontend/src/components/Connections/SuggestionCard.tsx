import React from 'react';
import {
  Card,
  CardContent,
  CardActions,
  Box,
  Typography,
  Avatar,
  Chip,
  Button,
} from '@mui/material';
import {
  Star as StarIcon,
  PersonAdd as PersonAddIcon,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import type { ConnectionSuggestion } from '../../types/connections';

interface SuggestionCardProps {
  suggestion: ConnectionSuggestion;
  index: number;
  onConnect: (userId: string) => void;
}

const SuggestionCard: React.FC<SuggestionCardProps> = ({
  suggestion,
  index,
  onConnect,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.1 }}
      whileHover={{ y: -8 }}
    >
      <Card
        sx={{
          height: '100%',
          borderRadius: 3,
          border: '1px solid',
          borderColor: 'divider',
          overflow: 'hidden',
          transition: 'all 0.3s ease',
          '&:hover': {
            boxShadow: 6,
            borderColor: 'primary.main',
          },
        }}
      >
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <Avatar sx={{ width: 48, height: 48, mr: 2 }}>
              {suggestion.user?.name?.[0]?.toUpperCase() || 'U'}
            </Avatar>
            <Box sx={{ flex: 1 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 0.5 }}>
                {suggestion.user?.name}
              </Typography>
              <Chip
                label={suggestion.user?.role}
                size="small"
                color={
                  suggestion.user?.role === 'STUDENT' ? 'info' : 'secondary'
                }
                sx={{ borderRadius: 2 }}
              />
            </Box>
          </Box>

          <Box sx={{ mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <StarIcon sx={{ fontSize: 16, color: 'text.secondary', mr: 1 }} />
              <Typography variant="body2" color="text.secondary">
                {suggestion.matchScore}% match
              </Typography>
            </Box>
          </Box>
        </CardContent>

        <CardActions sx={{ p: 2, pt: 0, justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              size="small"
              variant="contained"
              startIcon={<PersonAddIcon />}
              onClick={() => onConnect(suggestion.user?.id)}
              sx={{ borderRadius: 2 }}
            >
              Connect
            </Button>
          </Box>
        </CardActions>
      </Card>
    </motion.div>
  );
};

export default SuggestionCard;
