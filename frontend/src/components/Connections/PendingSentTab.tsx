import { FC } from 'react';
import {
  Card,
  CardContent,
  Box,
  Avatar,
  Typography,
  Chip,
  CardActions,
  Button,
} from '@mui/material';

interface PendingRequest {
  id: string;
  createdAt: string;
  requester?: {
    id: string;
    name: string;
    email: string;
    role: 'STUDENT' | 'ALUM' | 'ADMIN';
    profile?: {
      bio?: string;
      location?: string;
      interests?: string;
      avatarUrl?: string;
      skills: string[];
    };
  };
  recipient?: {
    id: string;
    name: string;
    email: string;
    role: 'STUDENT' | 'ALUM' | 'ADMIN';
    profile?: {
      bio?: string;
      location?: string;
      interests?: string;
      avatarUrl?: string;
      skills: string[];
    };
  };
}

interface ConnectionTabProps {
  pendingSent: PendingRequest[];
  handleCancelConnection: (id: string) => void;
  getRoleColor: (
    role: string
  ) =>
    | 'default'
    | 'primary'
    | 'secondary'
    | 'error'
    | 'info'
    | 'success'
    | 'warning';
  actionLoading?: string | null;
}

const PendingSentTab: FC<ConnectionTabProps> = ({
  pendingSent,
  handleCancelConnection,
  getRoleColor,
  actionLoading,
}) => {
  return (
    <Box
      sx={{
        display: 'grid',
        gap: 2,
        gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
      }}
    >
      {pendingSent.map((request) => (
        <Card
          key={request.id}
          sx={{
            background: (theme) =>
              theme.palette.mode === 'dark'
                ? 'linear-gradient(145deg, rgba(30,40,50,0.8) 0%, rgba(20,30,40,0.9) 100%)'
                : 'linear-gradient(145deg, rgba(240,248,255,0.9) 0%, rgba(230,240,250,0.95) 100%)',
            backdropFilter: 'blur(10px)',
            border: (theme) =>
              theme.palette.mode === 'dark'
                ? '1px solid rgba(255,255,255,0.1)'
                : '1px solid rgba(0,0,0,0.05)',
            borderRadius: '16px',
          }}
        >
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Avatar
                sx={{
                  mr: 2,
                  width: 48,
                  height: 48,
                  background: (theme) =>
                    theme.palette.mode === 'dark'
                      ? 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)'
                      : 'linear-gradient(135deg, #a1c4fd 0%, #c2e9fb 100%)',
                }}
              >
                {request.recipient?.name?.charAt(0).toUpperCase() || '?'}
              </Avatar>
              <Box>
                <Typography
                  variant="h6"
                  component="div"
                  sx={{
                    color: (theme) =>
                      theme.palette.mode === 'dark' ? 'white' : 'text.primary',
                  }}
                >
                  {request.recipient?.name || 'Unknown User'}
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    color: (theme) =>
                      theme.palette.mode === 'dark'
                        ? 'rgba(255,255,255,0.6)'
                        : 'text.secondary',
                  }}
                >
                  {request.recipient?.email || 'No email'}
                </Typography>
              </Box>
            </Box>
            <Chip
              label={request.recipient?.role || 'Unknown'}
              color={getRoleColor(request.recipient?.role || '')}
              size="small"
              sx={{
                background: (theme) =>
                  theme.palette.mode === 'dark'
                    ? 'rgba(255,255,255,0.1)'
                    : 'rgba(0,0,0,0.05)',
                color: (theme) =>
                  theme.palette.mode === 'dark' ? 'white' : 'text.primary',
                border: (theme) =>
                  theme.palette.mode === 'dark'
                    ? '1px solid rgba(255,255,255,0.2)'
                    : '1px solid rgba(0,0,0,0.1)',
              }}
            />
          </CardContent>
          <CardActions
            sx={{
              borderTop: (theme) =>
                theme.palette.mode === 'dark'
                  ? '1px solid rgba(255,255,255,0.05)'
                  : '1px solid rgba(0,0,0,0.05)',
              padding: '12px 16px',
            }}
          >
            <Button
              size="small"
              onClick={() => handleCancelConnection(request.id)}
              disabled={actionLoading === `cancel-${request.id}`}
              sx={{
                background: (theme) =>
                  theme.palette.mode === 'dark'
                    ? 'linear-gradient(135deg, rgba(255, 185, 0, 0.2) 0%, rgba(255, 119, 0, 0.2) 100%)'
                    : 'linear-gradient(135deg, rgba(255, 193, 7, 0.1) 0%, rgba(255, 152, 0, 0.1) 100%)',
                color: (theme) =>
                  theme.palette.mode === 'dark' ? '#ffb800' : '#ff9800',
                width: '100%',
                '&:hover': {
                  background: (theme) =>
                    theme.palette.mode === 'dark'
                      ? 'linear-gradient(135deg, rgba(255, 185, 0, 0.3) 0%, rgba(255, 119, 0, 0.3) 100%)'
                      : 'linear-gradient(135deg, rgba(255, 193, 7, 0.2) 0%, rgba(255, 152, 0, 0.2) 100%)',
                },
                '&.Mui-disabled': {
                  background: (theme) =>
                    theme.palette.mode === 'dark'
                      ? 'rgba(255,255,255,0.05)'
                      : 'rgba(0,0,0,0.03)',
                  color: (theme) =>
                    theme.palette.mode === 'dark'
                      ? 'rgba(255,255,255,0.3)'
                      : 'rgba(0,0,0,0.2)',
                },
              }}
            >
              Cancel Request
            </Button>
          </CardActions>
        </Card>
      ))}
    </Box>
  );
};

export default PendingSentTab;
