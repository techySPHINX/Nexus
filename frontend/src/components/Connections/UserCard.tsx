import { Card, CardContent, Box, Avatar, Typography, Chip, Divider, CardActions } from "@mui/material";

// components/UserCard.tsx
interface UserCardProps {
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
  actions?: React.ReactNode;
  children?: React.ReactNode;
}

export const UserCard = ({ user, actions, children }: UserCardProps) => {
  const getRoleColor = (role: string) => {
    switch (role) {
      case 'STUDENT': return 'primary';
      case 'ALUM': return 'secondary';
      case 'ADMIN': return 'error';
      default: return 'default';
    }
  };

  return (
    <Card sx={{ borderRadius: 3, transition: 'transform .18s ease, box-shadow .18s ease', '&:hover': { transform: 'translateY(-6px)', boxShadow: 6 } }}>
      <CardContent>
        <Box display="flex" gap={2} alignItems="center">
          <Avatar src={user.profile?.avatarUrl} sx={{ width: 64, height: 64 }}>
            {!user.profile?.avatarUrl && user.name?.[0]}
          </Avatar>
          <Box sx={{ flex: 1 }}>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>{user.name}</Typography>
            <Typography variant="body2" color="text.secondary">{user.email}</Typography>
            <Box mt={1} display="flex" gap={1} alignItems="center">
              <Chip label={user.role} color={getRoleColor(user.role) as any} size="small" />
              {user.profile?.location && (
                <Typography variant="caption" color="text.secondary">📍 {user.profile.location}</Typography>
              )}
            </Box>
            {user.profile?.bio && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>{user.profile.bio}</Typography>
            )}
            {user.profile?.skills && user.profile.skills.length > 0 && (
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                Skills: {user.profile.skills.join(', ')}
              </Typography>
            )}
            {children}
          </Box>
        </Box>
      </CardContent>
      {actions && (
        <>
          <Divider />
          <CardActions sx={{ px: 2, py: 1, justifyContent: 'space-between' }}>
            {actions}
          </CardActions>
        </>
      )}
    </Card>
  );
};