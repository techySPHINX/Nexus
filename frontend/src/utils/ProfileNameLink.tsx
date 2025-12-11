import { Typography, Chip, Box, Tooltip, Avatar } from '@mui/material';
import { useAuth } from '@/contexts/AuthContext';
import { Role } from '@/types/engagement';
import { useNavigate } from 'react-router-dom';
import { Person, MenuBook, EmojiEvents, Security } from '@mui/icons-material';
import { FC } from 'react';

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
  variant?: 'subtitle1' | 'subtitle2' | 'body1' | 'body2' | 'h6' | 'caption';
  fontSize?: string;
  fontWeight?: number | string;
  avatarSize?: number;
  badgeSize?: number;
}

export const ProfileNameLink: FC<ProfileNameLinkProps> = ({
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
  badgeSize = 22,
}) => {
  const { user: authUser } = useAuth();
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
        icon: <Security sx={{ fontSize: { fontSize } }} />,
        short: 'AD',
      };
    }
    if (isAlum) {
      return {
        label: 'Alumni',
        color: 'secondary' as const,
        icon: <EmojiEvents sx={{ fontSize: { fontSize } }} />,
        short: 'AL',
      };
    }
    return {
      label: 'Student',
      color: 'info' as const,
      icon: <MenuBook sx={{ fontSize: { fontSize } }} />,
      short: 'ST',
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
            src={user.profile?.avatarUrl || undefined}
            alt={getUserName()}
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

      {/* Role Badge: icon on desktop, short text on mobile/tablet */}
      {showRoleBadge && user?.role && (
        <>
          {/* Mobile/Tablet: show short text */}
          <Chip
            size="small"
            variant="outlined"
            color={roleConfig.color}
            label={roleConfig.short}
            sx={{
              height: badgeSize,
              minWidth: badgeSize,
              borderRadius: '50%',
              px: 0.5,
              fontWeight: 700,
              fontSize: { xs: '0.8rem', sm: '0.9rem' },
              display: { xs: 'inline-flex', sm: 'none' },
              '& .MuiChip-label': {
                pl: 0.5,
              },
            }}
          />
          {/* Desktop: show icon with tooltip */}
          <Box sx={{ display: { xs: 'none', sm: 'inline-flex' } }}>
            <Tooltip title={roleConfig.label} arrow placement="top">
              <Chip
                icon={roleConfig.icon}
                size="small"
                variant="outlined"
                color={roleConfig.color}
                sx={{
                  height: badgeSize,
                  minWidth: badgeSize,
                  width: badgeSize,
                  borderRadius: '50%',
                  px: 0,
                  '& .MuiChip-icon': {
                    fontSize: 18,
                    margin: 0,
                  },
                  '& .MuiChip-label': {
                    display: 'none',
                  },
                }}
              />
            </Tooltip>
          </Box>
        </>
      )}

      {/* "You" Badge: 'YOU' on mobile/tablet, icon on desktop */}
      {showYouBadge && isAuthor && (
        <>
          {/* Mobile/Tablet: show 'YOU' text */}
          <Chip
            size="small"
            variant="filled"
            color="primary"
            label="YOU"
            sx={{
              height: badgeSize,
              minWidth: badgeSize,
              borderRadius: '50%',
              px: 0.5,
              fontWeight: 700,
              fontSize: { xs: '0.8rem', sm: '0.9rem' },
              display: { xs: 'inline-flex', sm: 'none' },
              '& .MuiChip-label': {
                pl: 0.5,
              },
            }}
          />
          {/* Desktop: show icon with tooltip */}
          <Box sx={{ display: { xs: 'none', sm: 'inline-flex' } }}>
            <Tooltip title="This is you" arrow placement="bottom">
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: badgeSize,
                  height: badgeSize,
                  borderRadius: '50%',
                  bgcolor: 'primary.main',
                  color: 'primary.contrastText',
                  boxShadow: 2,
                  cursor: 'default',
                  fontWeight: 700,
                  fontSize: '0.9rem',
                }}
              >
                <Person fontSize="inherit" />
              </Box>
            </Tooltip>
          </Box>
        </>
      )}
    </Box>
  );
};
