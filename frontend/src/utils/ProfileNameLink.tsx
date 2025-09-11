import { Typography, Chip, Box, Tooltip, Avatar } from '@mui/material';
import { useAuth } from '@/contexts/AuthContext';
import { Role } from '@/types/engagement';
import { useNavigate } from 'react-router-dom';
import { Person, MenuBook, EmojiEvents, Security } from '@mui/icons-material';
import { useProfile } from '@/contexts/ProfileContext';

interface User {
  id?: string;
  email?: string;
  role?: Role;
  name?: string;
  profile?: {
    avatarUrl?: string;
  };
}

interface ProfileNameLinkProps {
  user: User;
  linkToProfile?: boolean;
  showAvatar?: boolean;
  showRoleBadge?: boolean;
  showYouBadge?: boolean;
  onlyFirstName?: boolean;
  variant?: 'subtitle1' | 'subtitle2' | 'body1' | 'body2' | 'h6';
  fontSize?: string;
  fontWeight?: number | string;
  avatarSize?: number;
}

export const ProfileNameLink: React.FC<ProfileNameLinkProps> = ({
  user,
  linkToProfile = true,
  showAvatar = false,
  showRoleBadge = true,
  showYouBadge = true,
  onlyFirstName = false,
  variant = 'subtitle2',
  fontSize = '0.9rem',
  fontWeight = 600,
  avatarSize = 24,
}) => {
  const { user: authUser } = useAuth();
  const { profile: authProfile } = useProfile();
  const navigate = useNavigate();

  const isAuthor = authUser?.id === user?.id;
  const isAdmin = user?.role === 'ADMIN';
  const isAlum = user?.role === 'ALUM';

  const getUserName = () => user?.name || 'Unknown User';

  const handleOnClick = () => {
    if (linkToProfile && user?.id) {
      navigate(`/profile/${user.id}`);
    }
  };

  const getRoleConfig = () => {
    if (isAdmin) {
      return {
        label: 'Admin',
        color: 'error' as const,
        icon: <Security fontSize="small" />,
      };
    }
    if (isAlum) {
      return {
        label: 'Alumni',
        color: 'secondary' as const,
        icon: <EmojiEvents fontSize="small" />,
      };
    }
    return {
      label: 'Student',
      color: 'info' as const,
      icon: <MenuBook fontSize="small" />,
    };
  };

  const roleConfig = getRoleConfig();

  return (
    <Box
      sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}
    >
      {/* Avatar */}
      {showAvatar && (
        <Tooltip title={getUserName()}>
          <Avatar
            src={authProfile?.avatarUrl || undefined}
            sx={{
              width: avatarSize,
              height: avatarSize,
              cursor: linkToProfile ? 'pointer' : 'default',
            }}
            onClick={handleOnClick}
          >
            {getUserName().charAt(0).toUpperCase()}
          </Avatar>
        </Tooltip>
      )}

      {/* Name */}
      <Typography
        variant={variant}
        fontSize={fontSize}
        fontWeight={fontWeight}
        onClick={handleOnClick}
        sx={{
          cursor: linkToProfile ? 'pointer' : 'default',
          '&:hover': linkToProfile ? { color: 'primary.main' } : {},
          display: 'inline',
        }}
      >
        {onlyFirstName ? getUserName().split(' ')[0] : getUserName()}
      </Typography>

      {/* Role Badge */}
      {showRoleBadge && user?.role && (
        <Tooltip title={`${roleConfig.label}`} arrow placement="top">
          <Chip
            icon={roleConfig.icon}
            size="small"
            variant="outlined"
            color={roleConfig.color}
            sx={{
              height: 22,
              minWidth: 22,
              width: 22,
              borderRadius: '50%', // circle style
              px: 0,
              '& .MuiChip-icon': {
                fontSize: 18,
                margin: 0,
              },
              '& .MuiChip-label': {
                display: 'none', // hide text label
              },
            }}
          />
        </Tooltip>
      )}

      {/* "You" Badge */}
      {showYouBadge && isAuthor && (
        <Tooltip title="This is you">
          <Chip
            icon={<Person fontSize="small" />}
            label="You"
            size="small"
            variant="filled"
            color="primary"
            sx={{
              height: 20,
              fontSize: '0.7rem',
              '& .MuiChip-icon': { fontSize: 14 },
            }}
          />
        </Tooltip>
      )}
    </Box>
  );
};
