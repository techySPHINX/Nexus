import React, { useState } from 'react';
import {
  Card,
  CardContent,
  Box,
  Avatar,
  Typography,
  Button,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import {
  PersonAdd,
  Check,
  Close,
  Message,
  MoreVert,
  School,
  Work,
  LocationOn,
  Business,
} from '@mui/icons-material';
import { motion } from 'framer-motion';

interface Connection {
  id: string;
  userId: string;
  name: string;
  email: string;
  role: 'STUDENT' | 'ALUM' | 'ADMIN';
  bio?: string;
  location?: string;
  company?: string;
  status: 'pending' | 'connected' | 'received';
  profile?: {
    bio?: string;
    location?: string;
    interests?: string;
    avatarUrl?: string;
    skills?: string[];
  };
}

interface ConnectionCardProps {
  connection: Connection;
  onAccept?: (connectionId: string) => void;
  onReject?: (connectionId: string) => void;
  onRemove?: (connectionId: string) => void;
  onMessage?: (userId: string) => void;
  onConnect?: (userId: string) => void;
}

const ConnectionCard: React.FC<ConnectionCardProps> = ({
  connection,
  onAccept,
  onReject,
  onRemove,
  onMessage,
  onConnect,
}) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'STUDENT':
        return <School fontSize="small" />;
      case 'ALUM':
        return <Work fontSize="small" />;
      case 'ADMIN':
        return <Business fontSize="small" />;
      default:
        return <School fontSize="small" />;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'STUDENT':
        return 'primary';
      case 'ALUM':
        return 'secondary';
      case 'ADMIN':
        return 'error';
      default:
        return 'default';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected':
        return 'success';
      case 'pending':
        return 'warning';
      case 'received':
        return 'info';
      default:
        return 'default';
    }
  };

  const renderActionButtons = () => {
    switch (connection.status) {
      case 'pending':
        return (
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="contained"
              size="small"
              startIcon={<Check />}
              onClick={() => onAccept?.(connection.id)}
              sx={{ minWidth: 100 }}
            >
              Accept
            </Button>
            <Button
              variant="outlined"
              size="small"
              startIcon={<Close />}
              onClick={() => onReject?.(connection.id)}
              sx={{ minWidth: 100 }}
            >
              Decline
            </Button>
          </Box>
        );
      case 'connected':
        return (
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="outlined"
              size="small"
              startIcon={<Message />}
              onClick={() => onMessage?.(connection.userId)}
            >
              Message
            </Button>
            <IconButton
              size="small"
              onClick={handleMenuOpen}
            >
              <MoreVert />
            </IconButton>
          </Box>
        );
      case 'received':
        return (
          <Button
            variant="outlined"
            size="small"
            startIcon={<PersonAdd />}
            onClick={() => onConnect?.(connection.userId)}
          >
            Connect
          </Button>
        );
      default:
        return null;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
            <Avatar
              sx={{
                width: 64,
                height: 64,
                bgcolor: 'primary.main',
                fontSize: '1.5rem',
              }}
            >
              {connection.name.charAt(0).toUpperCase()}
            </Avatar>

            <Box sx={{ flexGrow: 1 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                <Box>
                  <Typography variant="h6" fontWeight={600} gutterBottom>
                    {connection.name}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <Chip
                      icon={getRoleIcon(connection.role)}
                      label={connection.role}
                      size="small"
                      color={getRoleColor(connection.role)}
                      variant="outlined"
                    />
                    <Chip
                      label={connection.status}
                      size="small"
                      color={getStatusColor(connection.status)}
                      variant="outlined"
                    />
                  </Box>
                </Box>
              </Box>

              {connection.bio && (
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  {connection.bio}
                </Typography>
              )}
              {connection.profile?.bio && !connection.bio && (
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  {connection.profile.bio}
                </Typography>
              )}

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                {(connection.location || connection.profile?.location) && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <LocationOn fontSize="small" color="action" />
                    <Typography variant="body2" color="text.secondary">
                      {connection.location || connection.profile?.location}
                    </Typography>
                  </Box>
                )}
                {connection.company && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Business fontSize="small" color="action" />
                    <Typography variant="body2" color="text.secondary">
                      {connection.company}
                    </Typography>
                  </Box>
                )}
              </Box>

              {connection.profile?.skills && connection.profile.skills.length > 0 && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Skills: {connection.profile.skills.join(', ')}
                  </Typography>
                </Box>
              )}

              {renderActionButtons()}
            </Box>
          </Box>
        </CardContent>
      </Card>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
      >
        <MenuItem onClick={() => {
          onRemove?.(connection.id);
          handleMenuClose();
        }}>
          <ListItemIcon>
            <Close fontSize="small" />
          </ListItemIcon>
          <ListItemText>Remove Connection</ListItemText>
        </MenuItem>
      </Menu>
    </motion.div>
  );
};

export default ConnectionCard;
