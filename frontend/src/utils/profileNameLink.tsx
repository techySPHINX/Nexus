import { Typography, Chip, Box, Tooltip, Avatar } from '@mui/material';
import { useAuth } from '@/contexts/AuthContext';
import { User } from '@/types/engagement';
import { useNavigate } from 'react-router-dom';
import {
  AdminPanelSettings,
  School,
  Person,
  MilitaryTech,
} from '@mui/icons-material';

interface ProfileNameLinkProps {
  user: User;
  linkToProfile?: boolean;
  showAvatar?: boolean;
  showRoleBadge?: boolean;
  showYouBadge?: boolean;
  variant?: 'subtitle1' | 'subtitle2' | 'body1' | 'body2';
  fontSize?: string;
  fontWeight?: number | string;
  avatarSize?: number;
}

const ProfileNameLink: React.FC<ProfileNameLinkProps> = ({
  user,
  linkToProfile = true,
  showAvatar = false,
  showRoleBadge = true,
  showYouBadge = true,
  variant = 'subtitle2',
  fontSize = '0.9rem',
  fontWeight = 600,
  avatarSize = 24,
}) => {
  const { user: authUser } = useAuth();
  const navigate = useNavigate();

  const isAuthor = authUser?.id === user?.id;
  const isAdmin = user?.role === 'ADMIN';
  const isAlum = user?.role === 'ALUM';
  const isStudent = user?.role === 'STUDENT';

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
        icon: <AdminPanelSettings fontSize="small" />,
      };
    }
    if (isAlum) {
      return {
        label: 'Alum',
        color: 'secondary' as const,
        icon: <MilitaryTech fontSize="small" />,
      };
    }
    return {
      label: 'Student',
      color: 'info' as const,
      icon: <School fontSize="small" />,
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
            src={user?.profile?.avatarUrl}
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
        }}
      >
        {getUserName()}
      </Typography>

      {/* Role Badge */}
      {showRoleBadge && user?.role && (
        <Tooltip title={`User role: ${roleConfig.label}`}>
          <Chip
            icon={roleConfig.icon}
            label={roleConfig.label}
            size="small"
            variant="filled"
            color={roleConfig.color}
            sx={{
              height: 20,
              fontSize: '0.7rem',
              '& .MuiChip-icon': { fontSize: 14 },
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

export default ProfileNameLink;
