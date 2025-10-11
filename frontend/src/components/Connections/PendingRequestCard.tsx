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
  Schedule as TimeIcon,
  Check as CheckIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import type { PendingRequest } from '../../types/connections';

interface PendingRequestCardProps {
  request: PendingRequest;
  index: number;
  type: 'received' | 'sent';
  onAcceptRequest?: (requestId: string) => void;
  onRejectRequest?: (requestId: string) => void;
}

const PendingRequestCard: React.FC<PendingRequestCardProps> = ({
  request,
  index,
  type,
  onAcceptRequest,
  onRejectRequest,
}) => {
  const user = type === 'received' ? request.requester : request.recipient;
  const actionText = type === 'received' ? 'Requested' : 'Sent';

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
              {user?.name?.[0]?.toUpperCase() || 'U'}
            </Avatar>
            <Box sx={{ flex: 1 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 0.5 }}>
                {user?.name}
              </Typography>
              <Chip
                label={user?.role}
                size="small"
                color={user?.role === 'STUDENT' ? 'info' : 'secondary'}
                sx={{ borderRadius: 2 }}
              />
            </Box>
          </Box>

          <Box sx={{ mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <TimeIcon sx={{ fontSize: 16, color: 'text.secondary', mr: 1 }} />
              <Typography variant="body2" color="text.secondary">
                {actionText}{' '}
                {request.createdAt
                  ? new Date(request.createdAt).toLocaleDateString()
                  : 'Recently'}
              </Typography>
            </Box>
          </Box>
        </CardContent>

        <CardActions sx={{ p: 2, pt: 0, justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', gap: 1 }}>
            {type === 'received' && onAcceptRequest && onRejectRequest && (
              <>
                <Button
                  size="small"
                  variant="contained"
                  color="success"
                  startIcon={<CheckIcon />}
                  onClick={() => onAcceptRequest(request.id)}
                  sx={{ borderRadius: 2 }}
                >
                  Accept
                </Button>
                <Button
                  size="small"
                  variant="outlined"
                  color="error"
                  startIcon={<CloseIcon />}
                  onClick={() => onRejectRequest(request.id)}
                  sx={{ borderRadius: 2 }}
                >
                  Reject
                </Button>
              </>
            )}
            {type === 'sent' && (
              <Chip label="Pending" size="small" color="info" />
            )}
          </Box>
        </CardActions>
      </Card>
    </motion.div>
  );
};

export default PendingRequestCard;
