import React from 'react';
import {
  Card,
  CardContent,
  CardActions,
  Box,
  Typography,
  Avatar,
  Chip,
  IconButton,
  Tooltip,
  Badge,
} from '@mui/material';
import {
  LocationOn as LocationIcon,
  Schedule as TimeIcon,
  Message as MessageIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import type { Connection } from '../../types/connections';

interface ConnectionCardProps {
  connection: Connection;
  index: number;
  onSendMessage: (userId: string) => void;
  onRemoveConnection: (connectionId: string) => void;
}

const ConnectionCard: React.FC<ConnectionCardProps> = ({
  connection,
  index,
  onSendMessage,
  onRemoveConnection,
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
            <Badge
              overlap="circular"
              anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
              badgeContent={
                <Box
                  sx={{
                    width: 12,
                    height: 12,
                    borderRadius: '50%',
                    backgroundColor: 'success.main',
                    border: '2px solid white',
                  }}
                />
              }
            >
              <Avatar
                sx={{
                  width: 48,
                  height: 48,
                  mr: 2,
                  background:
                    'linear-gradient(135deg, #4caf50 0%, #8bc34a 100%)',
                }}
              >
                {connection.user?.name?.[0]?.toUpperCase() || 'U'}
              </Avatar>
            </Badge>
            <Box sx={{ flex: 1 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 0.5 }}>
                {connection.user?.name}
              </Typography>
              <Chip
                label={connection.user?.role}
                size="small"
                color={
                  connection.user?.role === 'STUDENT' ? 'info' : 'secondary'
                }
                sx={{ borderRadius: 2 }}
              />
            </Box>
          </Box>

          <Box sx={{ mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <LocationIcon
                sx={{ fontSize: 16, color: 'text.secondary', mr: 1 }}
              />
              <Typography variant="body2" color="text.secondary">
                KIIT University
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <TimeIcon sx={{ fontSize: 16, color: 'text.secondary', mr: 1 }} />
              <Typography variant="body2" color="text.secondary">
                Connected{' '}
                {connection.createdAt
                  ? new Date(connection.createdAt).toLocaleDateString()
                  : 'Recently'}
              </Typography>
            </Box>
          </Box>
        </CardContent>

        <CardActions sx={{ p: 2, pt: 0, justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Tooltip title="Send Message">
              <IconButton
                size="small"
                onClick={() => onSendMessage(connection.user?.id)}
                sx={{
                  color: 'primary.main',
                  backgroundColor: 'primary.light',
                  '&:hover': {
                    backgroundColor: 'primary.main',
                    color: 'white',
                  },
                }}
              >
                <MessageIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Remove Connection">
              <IconButton
                size="small"
                onClick={() => onRemoveConnection(connection.id)}
                sx={{
                  color: 'error.main',
                  backgroundColor: 'error.light',
                  '&:hover': { backgroundColor: 'error.main', color: 'white' },
                }}
              >
                <CloseIcon />
              </IconButton>
            </Tooltip>
          </Box>
        </CardActions>
      </Card>
    </motion.div>
  );
};

export default ConnectionCard;
