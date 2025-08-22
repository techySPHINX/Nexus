import React from 'react';
import {
  Grid,
  Card,
  CardContent,
  Box,
  Avatar,
  Typography,
  Chip,
  CardActions,
  Button,
} from '@mui/material';
import {
  Message as MessageIcon,
  PersonAdd as PersonAddIcon,
} from '@mui/icons-material';

interface Profile {
  bio?: string;
  location?: string;
  interests?: string;
  avatarUrl?: string;
  skills: string[];
}

interface User {
  id: string;
  name: string;
  email: string;
  role: 'STUDENT' | 'ALUM' | 'ADMIN';
  profile?: Profile;
}

interface ConnectionSuggestion {
  user: {
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
  matchScore: number;
  reasons: string[];
}

interface ConnectionTabProps {
  suggestions: ConnectionSuggestion[];
  sendRequest: (userId: string) => void;
  setSelectedUser: (user: User | null) => void;
  setMessageDialog: (open: boolean) => void;
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

const SuggestionTab: React.FC<ConnectionTabProps> = ({
  suggestions,
  sendRequest,
  setSelectedUser,
  setMessageDialog,
  getRoleColor,
  actionLoading,
}) => {
  return (
    <Grid container spacing={3}>
      {suggestions.map((suggestion) => (
        <Grid item xs={12} sm={6} md={4} key={suggestion.user.id}>
          <Card
            sx={{
              background: (theme) =>
                theme.palette.mode === 'dark'
                  ? 'linear-gradient(145deg, rgba(30,50,40,0.8) 0%, rgba(20,40,30,0.9) 100%)'
                  : 'linear-gradient(145deg, rgba(240,255,240,0.9) 0%, rgba(230,255,230,0.95) 100%)',
              backdropFilter: 'blur(10px)',
              border: (theme) =>
                theme.palette.mode === 'dark'
                  ? '1px solid rgba(255,255,255,0.1)'
                  : '1px solid rgba(0,0,0,0.05)',
              borderRadius: '16px',
              boxShadow: (theme) =>
                theme.palette.mode === 'dark'
                  ? '0 8px 32px 0 rgba(0,0,0,0.36)'
                  : '0 8px 32px 0 rgba(0,0,0,0.1)',
              transition: 'transform 0.3s ease, box-shadow 0.3s ease',
              '&:hover': {
                transform: 'translateY(-5px)',
                boxShadow: (theme) =>
                  theme.palette.mode === 'dark'
                    ? '0 12px 40px 0 rgba(80,255,120,0.2)'
                    : '0 12px 40px 0 rgba(80,255,120,0.1)',
              },
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
                        ? 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)'
                        : 'linear-gradient(135deg, #84fab0 0%, #8fd3f4 100%)',
                  }}
                >
                  {suggestion.user.name.charAt(0).toUpperCase()}
                </Avatar>
                <Box>
                  <Typography
                    variant="h6"
                    component="div"
                    sx={{
                      color: (theme) =>
                        theme.palette.mode === 'dark'
                          ? 'white'
                          : 'text.primary',
                    }}
                  >
                    {suggestion.user.name}
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{
                      color: (theme) =>
                        theme.palette.mode === 'dark'
                          ? 'rgba(255,255,255,0.7)'
                          : 'text.secondary',
                    }}
                  >
                    {suggestion.user.email}
                  </Typography>
                </Box>
              </Box>
              <Box
                sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}
              >
                <Chip
                  label={suggestion.user.role}
                  color={getRoleColor(suggestion.user.role)}
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
                <Box
                  sx={{
                    ml: 'auto',
                    background: (theme) =>
                      theme.palette.mode === 'dark'
                        ? 'rgba(67, 233, 123, 0.2)'
                        : 'rgba(132, 250, 176, 0.2)',
                    borderRadius: '12px',
                    padding: '4px 8px',
                    fontSize: '0.75rem',
                    color: (theme) =>
                      theme.palette.mode === 'dark' ? '#43e97b' : '#28a745',
                    fontWeight: 600,
                  }}
                >
                  {suggestion.matchScore}% MATCH
                </Box>
              </Box>
              {suggestion.reasons.length > 0 && (
                <Box sx={{ mb: 2 }}>
                  <Typography
                    variant="body2"
                    sx={{
                      color: (theme) =>
                        theme.palette.mode === 'dark'
                          ? 'rgba(255,255,255,0.7)'
                          : 'text.secondary',
                      fontSize: '0.75rem',
                      mb: 1,
                    }}
                  >
                    CONNECTION REASONS:
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {suggestion.reasons.slice(0, 2).map((reason, index) => (
                      <Chip
                        key={index}
                        label={reason}
                        size="small"
                        sx={{
                          background: (theme) =>
                            theme.palette.mode === 'dark'
                              ? 'rgba(67, 233, 123, 0.15)'
                              : 'rgba(132, 250, 176, 0.15)',
                          border: (theme) =>
                            theme.palette.mode === 'dark'
                              ? '1px solid rgba(67, 233, 123, 0.3)'
                              : '1px solid rgba(132, 250, 176, 0.3)',
                          color: (theme) =>
                            theme.palette.mode === 'dark'
                              ? 'rgba(200, 255, 220, 0.9)'
                              : 'rgba(40, 167, 69, 0.9)',
                          fontSize: '0.7rem',
                          height: '24px',
                        }}
                      />
                    ))}
                  </Box>
                </Box>
              )}
            </CardContent>
            <CardActions
              sx={{
                borderTop: (theme) =>
                  theme.palette.mode === 'dark'
                    ? '1px solid rgba(255,255,255,0.05)'
                    : '1px solid rgba(0,0,0,0.05)',
                padding: '12px 16px',
                justifyContent: 'space-between',
              }}
            >
              <Button
                size="small"
                startIcon={
                  <PersonAddIcon
                    sx={{
                      color: (theme) =>
                        theme.palette.mode === 'dark' ? '#43e97b' : '#28a745',
                    }}
                  />
                }
                onClick={() => sendRequest(suggestion.user.id)}
                disabled={actionLoading === `send-${suggestion.user.id}`}
                sx={{
                  color: (theme) =>
                    theme.palette.mode === 'dark' ? '#43e97b' : '#28a745',
                  '&:hover': {
                    background: (theme) =>
                      theme.palette.mode === 'dark'
                        ? 'rgba(67, 233, 123, 0.1)'
                        : 'rgba(40, 167, 69, 0.1)',
                  },
                  '&.Mui-disabled': {
                    color: (theme) =>
                      theme.palette.mode === 'dark'
                        ? 'rgba(255,255,255,0.3)'
                        : 'rgba(0,0,0,0.2)',
                  },
                }}
              >
                Connect
              </Button>
              <Button
                size="small"
                startIcon={
                  <MessageIcon
                    sx={{
                      color: (theme) =>
                        theme.palette.mode === 'dark'
                          ? 'rgba(100,220,255,0.8)'
                          : 'rgba(78,115,223,0.8)',
                    }}
                  />
                }
                onClick={() => {
                  setSelectedUser(suggestion.user);
                  setMessageDialog(true);
                }}
                sx={{
                  color: (theme) =>
                    theme.palette.mode === 'dark'
                      ? 'rgba(100,220,255,0.8)'
                      : 'rgba(78,115,223,0.8)',
                  '&:hover': {
                    background: (theme) =>
                      theme.palette.mode === 'dark'
                        ? 'rgba(100,220,255,0.1)'
                        : 'rgba(78,115,223,0.1)',
                  },
                }}
              >
                Message
              </Button>
            </CardActions>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
};
export default SuggestionTab;
