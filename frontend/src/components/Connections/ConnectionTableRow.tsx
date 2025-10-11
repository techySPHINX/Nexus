import React from 'react';
import {
  TableRow,
  TableCell,
  Box,
  Typography,
  Avatar,
  Chip,
  IconButton,
  Tooltip,
  Button,
} from '@mui/material';
import {
  Message as MessageIcon,
  Close as CloseIcon,
  Check as CheckIcon,
  PersonAdd as PersonAddIcon,
} from '@mui/icons-material';
import type {
  Connection,
  PendingRequest,
  ConnectionSuggestion,
} from '../../types/connections';

interface ConnectionTableRowProps {
  item: Connection | PendingRequest | ConnectionSuggestion;
  tabValue: number;
  getRoleColor: (role: string) => 'primary' | 'secondary' | 'error' | 'default';
  onSendMessage?: (userId: string) => void;
  onRemoveConnection?: (connectionId: string) => void;
  onAcceptRequest?: (requestId: string) => void;
  onRejectRequest?: (requestId: string) => void;
  onConnect?: (userId: string) => void;
}

const ConnectionTableRow: React.FC<ConnectionTableRowProps> = ({
  item,
  tabValue,
  getRoleColor,
  onSendMessage,
  onRemoveConnection,
  onAcceptRequest,
  onRejectRequest,
  onConnect,
}) => {
  if (tabValue === 0) {
    // Connections tab
    const connection = item as Connection;
    return (
      <TableRow key={connection.id} hover>
        <TableCell>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar sx={{ bgcolor: 'primary.main' }}>
              {connection.user?.name?.charAt(0) || '?'}
            </Avatar>
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                {connection.user?.name || 'Unknown User'}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {connection.user?.email || 'No email'}
              </Typography>
            </Box>
          </Box>
        </TableCell>
        <TableCell>
          <Chip
            label={connection.user?.role || 'Unknown'}
            color={getRoleColor(connection.user?.role || '')}
            size="small"
          />
        </TableCell>
        <TableCell>
          <Chip
            label={connection.status}
            color={connection.status === 'ACCEPTED' ? 'success' : 'default'}
            size="small"
          />
        </TableCell>
        <TableCell>
          <Typography variant="body2" color="text.secondary">
            {connection.createdAt
              ? new Date(connection.createdAt).toLocaleDateString()
              : 'N/A'}
          </Typography>
        </TableCell>
        <TableCell>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Tooltip title="Send Message">
              <IconButton
                size="small"
                onClick={() => onSendMessage?.(connection.user?.id)}
                sx={{ color: 'primary.main' }}
              >
                <MessageIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Remove Connection">
              <IconButton
                size="small"
                onClick={() => onRemoveConnection?.(connection.id)}
                sx={{ color: 'error.main' }}
              >
                <CloseIcon />
              </IconButton>
            </Tooltip>
          </Box>
        </TableCell>
      </TableRow>
    );
  } else if (tabValue === 1) {
    // Pending Received tab
    const pendingRequest = item as PendingRequest;
    return (
      <TableRow key={pendingRequest.id} hover>
        <TableCell>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar sx={{ bgcolor: 'info.main' }}>
              {pendingRequest.requester?.name?.charAt(0) || '?'}
            </Avatar>
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                {pendingRequest.requester?.name || 'Unknown User'}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {pendingRequest.requester?.email || 'No email'}
              </Typography>
            </Box>
          </Box>
        </TableCell>
        <TableCell>
          <Chip
            label={pendingRequest.requester?.role || 'Unknown'}
            color={getRoleColor(pendingRequest.requester?.role || '')}
            size="small"
          />
        </TableCell>
        <TableCell>
          <Typography variant="body2" color="text.secondary">
            {pendingRequest.createdAt
              ? new Date(pendingRequest.createdAt).toLocaleDateString()
              : 'N/A'}
          </Typography>
        </TableCell>
        <TableCell>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              size="small"
              startIcon={<CheckIcon />}
              onClick={() => onAcceptRequest?.(pendingRequest.id)}
              variant="contained"
              color="success"
              sx={{ minHeight: '32px' }}
            >
              Accept
            </Button>
            <Button
              size="small"
              startIcon={<CloseIcon />}
              onClick={() => onRejectRequest?.(pendingRequest.id)}
              variant="outlined"
              color="error"
              sx={{ minHeight: '32px' }}
            >
              Reject
            </Button>
          </Box>
        </TableCell>
      </TableRow>
    );
  } else if (tabValue === 2) {
    // Pending Sent tab
    const pendingSent = item as PendingRequest;
    return (
      <TableRow key={pendingSent.id} hover>
        <TableCell>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar sx={{ bgcolor: 'info.main' }}>
              {pendingSent.recipient?.name?.charAt(0) || '?'}
            </Avatar>
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                {pendingSent.recipient?.name || 'Unknown User'}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {pendingSent.recipient?.email || 'No email'}
              </Typography>
            </Box>
          </Box>
        </TableCell>
        <TableCell>
          <Chip
            label={pendingSent.recipient?.role || 'Unknown'}
            color={getRoleColor(pendingSent.recipient?.role || '')}
            size="small"
          />
        </TableCell>
        <TableCell>
          <Typography variant="body2" color="text.secondary">
            {pendingSent.createdAt
              ? new Date(pendingSent.createdAt).toLocaleDateString()
              : 'N/A'}
          </Typography>
        </TableCell>
        <TableCell>
          <Chip label="Pending" color="warning" size="small" />
        </TableCell>
        <TableCell>
          <Tooltip title="Cancel Request">
            <IconButton
              size="small"
              onClick={() => onRejectRequest?.(pendingSent.id)}
              sx={{ color: 'error.main' }}
            >
              <CloseIcon />
            </IconButton>
          </Tooltip>
        </TableCell>
      </TableRow>
    );
  } else if (tabValue === 3) {
    // Suggestions tab
    const suggestion = item as ConnectionSuggestion;
    return (
      <TableRow key={suggestion.user.id} hover>
        <TableCell>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar sx={{ bgcolor: 'success.main' }}>
              {suggestion.user?.name?.charAt(0) || '?'}
            </Avatar>
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                {suggestion.user?.name || 'Unknown User'}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {suggestion.user?.email || 'No email'}
              </Typography>
            </Box>
          </Box>
        </TableCell>
        <TableCell>
          <Chip
            label={suggestion.user?.role || 'Unknown'}
            color={getRoleColor(suggestion.user?.role || '')}
            size="small"
          />
        </TableCell>
        <TableCell>
          <Typography variant="body2" color="text.secondary">
            {suggestion.reasons.join(', ')}
          </Typography>
        </TableCell>
        <TableCell>
          <Typography variant="body2" color="text.secondary">
            Match Score: {suggestion.matchScore}%
          </Typography>
        </TableCell>
        <TableCell>
          <Button
            size="small"
            startIcon={<PersonAddIcon />}
            onClick={() => onConnect?.(suggestion.user.id)}
            variant="contained"
            color="primary"
            sx={{ minHeight: '32px' }}
          >
            Connect
          </Button>
        </TableCell>
      </TableRow>
    );
  }

  return null;
};

export default ConnectionTableRow;
