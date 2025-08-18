import React from 'react';
import { Grid, Card, CardContent, Box, Avatar, Typography, Chip, CardActions, Button } from "@mui/material";
import { Message as MessageIcon } from '@mui/icons-material';

interface Skill {
  id: string;
  name: string;
}

interface Profile {
  bio?: string;
  location?: string;
  interests?: string;
  avatarUrl?: string;
  skills: Skill[];
}

interface User {
  id: string;
  name: string;
  email: string;
  role: "STUDENT" | "ALUM" | "ADMIN";
  profile?: Profile;
}

interface Connection {
  id: string;
  user: User;
}

interface ConnectionTabProps {
  connections: Connection[];
  setSelectedUser: (user: User | null) => void;
  setMessageDialog: (open: boolean) => void;
  setConnectionToBlock: (id: string) => void;
  setBlockDialogOpen: (open: boolean) => void;
  getRoleColor: (role: string) => 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning';
}

const ConnectionTab: React.FC<ConnectionTabProps> = ({
  connections,
  setSelectedUser,
  setMessageDialog,
  setConnectionToBlock,
  setBlockDialogOpen,
  getRoleColor,
}) => {
  return (
    <Grid container spacing={3}>
      {connections.map((connection) => (
        <Grid item xs={12} sm={6} md={4} key={connection.id}>
          <Card sx={{
            background: (theme) => theme.palette.mode === 'dark'
              ? 'linear-gradient(145deg, rgba(30,30,40,0.8) 0%, rgba(20,20,30,0.9) 100%)'
              : 'linear-gradient(145deg, rgba(255,255,255,0.9) 0%, rgba(245,245,255,0.95) 100%)',
            backdropFilter: 'blur(10px)',
            border: (theme) => theme.palette.mode === 'dark'
              ? '1px solid rgba(255,255,255,0.1)'
              : '1px solid rgba(0,0,0,0.05)',
            borderRadius: '16px',
            boxShadow: (theme) => theme.palette.mode === 'dark'
              ? '0 8px 32px 0 rgba(0,0,0,0.36)'
              : '0 8px 32px 0 rgba(0,0,0,0.1)',
            transition: 'transform 0.3s ease, box-shadow 0.3s ease',
            '&:hover': {
              transform: 'translateY(-5px)',
              boxShadow: (theme) => theme.palette.mode === 'dark'
                ? '0 12px 40px 0 rgba(80,120,255,0.2)'
                : '0 12px 40px 0 rgba(80,120,255,0.1)'
            }
          }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Avatar sx={{
                  mr: 2,
                  width: 48,
                  height: 48,
                  background: (theme) => theme.palette.mode === 'dark'
                    ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                    : 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                  boxShadow: (theme) => theme.palette.mode === 'dark'
                    ? '0 4px 15px rgba(118, 75, 162, 0.3)'
                    : '0 4px 15px rgba(0, 194, 254, 0.3)'
                }}>
                  {connection.user.name.charAt(0).toUpperCase()}
                </Avatar>
                <Box>
                  <Typography variant="h6" component="div" sx={{
                    color: (theme) => theme.palette.mode === 'dark' ? 'white' : 'text.primary',
                    fontWeight: 600,
                    textShadow: (theme) => theme.palette.mode === 'dark' ? '0 2px 4px rgba(0,0,0,0.2)' : 'none'
                  }}>
                    {connection.user.name}
                  </Typography>
                  <Typography variant="body2" sx={{
                    color: (theme) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.7)' : 'text.secondary',
                    fontSize: '0.75rem'
                  }}>
                    {connection.user.email}
                  </Typography>
                </Box>
              </Box>
              <Chip
                label={connection.user.role}
                color={getRoleColor(connection.user.role)}
                size="small"
                sx={{
                  mb: 2,
                  background: (theme) => theme.palette.mode === 'dark'
                    ? 'rgba(255,255,255,0.1)'
                    : 'rgba(0,0,0,0.05)',
                  backdropFilter: 'blur(5px)',
                  border: (theme) => theme.palette.mode === 'dark'
                    ? '1px solid rgba(255,255,255,0.1)'
                    : '1px solid rgba(0,0,0,0.05)',
                  color: (theme) => theme.palette.mode === 'dark' ? 'white' : 'text.primary'
                }}
              />
              {connection.user.profile?.skills && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" sx={{
                    color: (theme) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.7)' : 'text.secondary',
                    fontSize: '0.75rem',
                    mb: 1
                  }}>
                    SKILLS:
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {connection.user.profile.skills.slice(0, 3).map((skill, index) => (
                      <Chip
                        key={index}
                        label={skill.name}
                        size="small"
                        sx={{
                          background: (theme) => theme.palette.mode === 'dark'
                            ? 'rgba(80,120,255,0.15)'
                            : 'rgba(78,115,223,0.1)',
                          border: (theme) => theme.palette.mode === 'dark'
                            ? '1px solid rgba(80,120,255,0.3)'
                            : '1px solid rgba(78,115,223,0.2)',
                          color: (theme) => theme.palette.mode === 'dark'
                            ? 'rgba(200,220,255,0.9)'
                            : 'rgba(78,115,223,0.9)',
                          fontSize: '0.7rem',
                          height: '24px'
                        }}
                      />
                    ))}
                  </Box>
                </Box>
              )}
            </CardContent>
            <CardActions sx={{
              borderTop: (theme) => theme.palette.mode === 'dark'
                ? '1px solid rgba(255,255,255,0.05)'
                : '1px solid rgba(0,0,0,0.05)',
              padding: '12px 16px',
              justifyContent: 'space-between'
            }}>
              <Button
                size="small"
                startIcon={<MessageIcon sx={{
                  color: (theme) => theme.palette.mode === 'dark'
                    ? 'rgba(100,220,255,0.8)'
                    : 'rgba(78,115,223,0.8)'
                }} />}
                onClick={() => {
                  setSelectedUser(connection.user);
                  setMessageDialog(true);
                }}
                sx={{
                  color: (theme) => theme.palette.mode === 'dark'
                    ? 'rgba(100,220,255,0.8)'
                    : 'rgba(78,115,223,0.8)',
                  '&:hover': {
                    background: (theme) => theme.palette.mode === 'dark'
                      ? 'rgba(100,220,255,0.1)'
                      : 'rgba(78,115,223,0.1)'
                  }
                }}
              >
                Message
              </Button>
              <Button
                size="small"
                onClick={() => {
                  setConnectionToBlock(connection.id);
                  setBlockDialogOpen(true);
                }}
                sx={{
                  color: (theme) => theme.palette.mode === 'dark'
                    ? 'rgba(255,100,120,0.8)'
                    : 'rgba(220,53,69,0.8)',
                  '&:hover': {
                    background: (theme) => theme.palette.mode === 'dark'
                      ? 'rgba(255,100,120,0.1)'
                      : 'rgba(220,53,69,0.1)'
                  }
                }}
              >
                Remove
              </Button>
            </CardActions>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
};

export default ConnectionTab;