import {
  Typography,
  Chip,
  Box,
  Tooltip,
  Avatar,
  Link,
  Divider,
} from '@mui/material';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/contexts/ProfileContext';
import { Role } from '@/types/engagement';
import { useNavigate } from 'react-router-dom';
import {
  Person,
  MenuBook,
  EmojiEvents,
  Security,
  ArrowOutward,
  LocationOn,
  School,
} from '@mui/icons-material';
import { FC, MouseEvent, useEffect, useState, useRef } from 'react';
import Popper from '@mui/material/Popper';
import Fade from '@mui/material/Fade';
import { ProfilePreviewResponse } from '@/services/profileService';
import { useTheme } from '@/contexts/ThemeContext';

interface User {
  id?: string;
  email?: string;
  role?: Role;
  name?: string;
  profile?: {
    avatarUrl?: string;
  };
  department?: string;
  location?: string;
  company?: string;
  bio?: string;
  stats?: {
    posts?: number;
    projects?: number;
    followers?: number;
  };
  isOnline?: boolean;
}

interface ProfileNameLinkProps {
  user: User;
  linkToProfile?: boolean;
  showAvatar?: boolean;
  showAvaterPopUp?: boolean;
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
  showAvaterPopUp = false,
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
  const { getProfilePreview } = useProfile();
  const navigate = useNavigate();
  const { isDark } = useTheme();

  const isAuthor = authUser?.id === user?.id;
  const isAdmin = user?.role === 'ADMIN';
  const isAlum = user?.role === 'ALUM';

  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const [previewData, setPreviewData] = useState<ProfilePreviewResponse | null>(
    null
  );
  const hoverTimeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const popperRef = useRef<HTMLDivElement>(null);

  const open = Boolean(anchorEl);

  const getRoleConfig = () => {
    if (isAdmin) {
      return {
        label: 'Admin',
        color: 'error' as const,
        icon: Security,
        short: 'AD',
        gradient: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
        bgClass: isDark ? 'rgba(239, 68, 68, 0.15)' : 'rgba(239, 68, 68, 0.08)',
      };
    }
    if (isAlum) {
      return {
        label: 'Alumni',
        color: 'secondary' as const,
        icon: EmojiEvents,
        short: 'AL',
        gradient: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
        bgClass: isDark
          ? 'rgba(139, 92, 246, 0.15)'
          : 'rgba(139, 92, 246, 0.08)',
      };
    }
    return {
      label: 'Student',
      color: 'info' as const,
      icon: MenuBook,
      short: 'ST',
      gradient: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
      bgClass: isDark ? 'rgba(59, 130, 246, 0.15)' : 'rgba(59, 130, 246, 0.08)',
    };
  };

  const roleConfig = getRoleConfig();
  const RoleIcon = roleConfig.icon;

  useEffect(() => {
    if (!open || !user?.id) return;

    let isMounted = true;

    getProfilePreview(user.id, showAvaterPopUp)
      .then((data) => {
        if (isMounted) {
          setPreviewData(data);
        }
      })
      .catch((error) => {
        console.error('Failed to load profile preview:', error);
      });

    return () => {
      isMounted = false;
    };
  }, [open, user?.id, showAvaterPopUp, getProfilePreview]);

  const handleMouseEnter = (event: MouseEvent<HTMLElement>) => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    setAnchorEl(event.currentTarget);
  };

  const handleMouseLeave = () => {
    hoverTimeoutRef.current = setTimeout(() => {
      if (popperRef.current && !popperRef.current.matches(':hover')) {
        setAnchorEl(null);
        setPreviewData(null);
      }
    }, 150);
  };

  const handlePopperMouseEnter = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
  };

  const handlePopperMouseLeave = () => {
    hoverTimeoutRef.current = setTimeout(() => {
      setAnchorEl(null);
      setPreviewData(null);
    }, 150);
  };

  const handleOnClick = () => {
    if (linkToProfile && user?.id) {
      navigate(`/profile/${user.id}`);
      setAnchorEl(null);
    }
  };

  const displayName = user?.name || 'Unknown User';
  const firstName = displayName.split(' ')[0];

  return (
    <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 1 }}>
      {/* Trigger */}
      <Box
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        sx={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 1,
          cursor: linkToProfile ? 'pointer' : 'default',
        }}
      >
        {/* Avatar */}
        {showAvatar && (
          <Tooltip title={displayName} arrow>
            <Box
              onClick={handleOnClick}
              sx={{
                position: 'relative',
                width: avatarSize,
                height: avatarSize,
                cursor: linkToProfile ? 'pointer' : 'default',
              }}
            >
              <Avatar
                src={user.profile?.avatarUrl}
                alt={displayName}
                sx={{
                  width: avatarSize,
                  height: avatarSize,
                  border: '2px solid',
                  borderColor: isDark
                    ? 'rgba(255,255,255,0.1)'
                    : 'rgba(0,0,0,0.05)',
                  background: roleConfig.gradient,
                  transition: 'transform 0.2s ease',
                  '&:hover': linkToProfile ? { transform: 'scale(1.05)' } : {},
                }}
              >
                {displayName.charAt(0).toUpperCase()}
              </Avatar>

              {/* Online indicator */}
              {user.isOnline && (
                <Box
                  sx={{
                    position: 'absolute',
                    bottom: -2,
                    right: -2,
                    width: 10,
                    height: 10,
                    borderRadius: '50%',
                    bgcolor: '#22c55e',
                    border: '2px solid',
                    borderColor: isDark ? '#0f172a' : 'white',
                    animation: 'pulse 2s infinite',
                    '@keyframes pulse': {
                      '0%': { opacity: 0.6 },
                      '50%': { opacity: 1 },
                      '100%': { opacity: 0.6 },
                    },
                  }}
                />
              )}
            </Box>
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
            color: isDark ? '#f1f5f9' : '#0f172a',
            '&:hover': linkToProfile
              ? {
                  color: isDark ? '#60a5fa' : '#2563eb',
                  textDecoration: 'underline',
                }
              : {},
            transition: 'color 0.2s ease',
          }}
        >
          {onlyFirstName ? firstName : displayName}
        </Typography>
      </Box>

      {/* Role Badge */}
      {showRoleBadge && user?.role && (
        <>
          {/* Mobile: short text */}
          <Chip
            size="small"
            label={roleConfig.short}
            sx={{
              height: badgeSize,
              minWidth: badgeSize,
              borderRadius: '50%',
              fontWeight: 700,
              fontSize: '0.75rem',
              display: { xs: 'inline-flex', sm: 'none' },
              bgcolor: roleConfig.bgClass,
              color: isDark
                ? '#fff'
                : roleConfig.color === 'error'
                  ? '#dc2626'
                  : roleConfig.color === 'secondary'
                    ? '#7c3aed'
                    : '#2563ed',
              border: '1px solid',
              borderColor: roleConfig.bgClass,
            }}
          />

          {/* Desktop: icon with tooltip */}
          <Box sx={{ display: { xs: 'none', sm: 'inline-flex' } }}>
            <Tooltip title={roleConfig.label} arrow placement="top">
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: badgeSize,
                  height: badgeSize,
                  borderRadius: '50%',
                  background: roleConfig.gradient,
                  color: 'white',
                  cursor: 'default',
                  transition: 'transform 0.2s ease',
                  '&:hover': {
                    transform: 'scale(1.1)',
                  },
                }}
              >
                <RoleIcon sx={{ fontSize: badgeSize * 0.6 }} />
              </Box>
            </Tooltip>
          </Box>
        </>
      )}

      {/* "You" Badge */}
      {showYouBadge && isAuthor && (
        <>
          {/* Mobile: 'YOU' text */}
          <Chip
            size="small"
            label="YOU"
            sx={{
              height: badgeSize,
              minWidth: badgeSize,
              borderRadius: '50%',
              fontWeight: 700,
              fontSize: '0.75rem',
              display: { xs: 'inline-flex', sm: 'none' },
              background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
              color: 'white',
            }}
          />

          {/* Desktop: icon with tooltip */}
          <Box sx={{ display: { xs: 'none', sm: 'inline-flex' } }}>
            <Tooltip title="This is you" arrow placement="top">
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: badgeSize,
                  height: badgeSize,
                  borderRadius: '50%',
                  background:
                    'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
                  color: 'white',
                  cursor: 'default',
                  transition: 'transform 0.2s ease',
                  '&:hover': {
                    transform: 'scale(1.1)',
                  },
                }}
              >
                <Person sx={{ fontSize: badgeSize * 0.6 }} />
              </Box>
            </Tooltip>
          </Box>
        </>
      )}

      {/* Profile Preview Popper */}
      {previewData && (
        <Popper
          open={open}
          anchorEl={anchorEl}
          placement="bottom-start"
          transition
          disablePortal
          modifiers={[
            {
              name: 'offset',
              options: { offset: [0, 8] },
            },
          ]}
          sx={(theme) => ({
            zIndex: theme.zIndex.tooltip + 1,
          })}
        >
          {({ TransitionProps }) => (
            <Fade {...TransitionProps} timeout={200}>
              <Box
                ref={popperRef}
                onMouseEnter={handlePopperMouseEnter}
                onMouseLeave={handlePopperMouseLeave}
                sx={{
                  width: 340,
                  borderRadius: 3,
                  border: '1px solid',
                  borderColor: isDark
                    ? 'rgba(96, 165, 250, 0.25)'
                    : 'rgba(59, 130, 246, 0.25)',
                  boxShadow: isDark
                    ? '0px 24px 54px rgba(9, 24, 51, 0.3)'
                    : '0px 24px 54px rgba(9, 24, 51, 0.12)',
                  backdropFilter: 'blur(8px)',
                  background: isDark
                    ? 'linear-gradient(180deg, rgba(15,23,42,0.96) 0%, rgba(13, 28, 63, 0.95) 100%)'
                    : 'linear-gradient(180deg, rgba(255,255,255,0.96) 0%, rgba(239, 246, 255, 0.95) 100%)',
                  color: isDark ? 'white' : '#0f172a',
                  p: 2.5,
                }}
              >
                <>
                  {/* Header */}
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 2,
                      mb: 2,
                    }}
                  >
                    <Avatar
                      src={user.profile?.avatarUrl || previewData.avatarUrl}
                      alt={displayName}
                      sx={{
                        width: 56,
                        height: 56,
                        border: '2px solid',
                        borderColor: isDark ? '#60a5fa' : '#3b82f6',
                        background: roleConfig.gradient,
                        boxShadow: `0 4px 12px ${
                          isDark
                            ? 'rgba(96, 165, 250, 0.3)'
                            : 'rgba(59, 130, 246, 0.2)'
                        }`,
                      }}
                    >
                      {displayName.charAt(0).toUpperCase()}
                    </Avatar>

                    <Box sx={{ flex: 1 }}>
                      <Typography
                        variant="subtitle1"
                        fontWeight={700}
                        lineHeight={1.2}
                      >
                        {displayName}
                      </Typography>
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 0.5,
                          mt: 0.5,
                        }}
                      >
                        <Box
                          sx={{
                            width: 8,
                            height: 8,
                            borderRadius: '50%',
                            background: roleConfig.gradient,
                          }}
                        />
                        <Typography
                          variant="caption"
                          sx={{
                            color: isDark
                              ? 'rgba(255,255,255,0.75)'
                              : 'rgba(0,0,0,0.6)',
                            fontWeight: 500,
                          }}
                        >
                          {roleConfig.label} •{' '}
                          {previewData.dept || 'Nexus Member'}
                        </Typography>
                      </Box>
                    </Box>
                  </Box>

                  {/* Bio */}
                  {previewData.bio && (
                    <Typography
                      variant="body2"
                      sx={{
                        mb: 2,
                        color: isDark
                          ? 'rgba(255,255,255,0.9)'
                          : 'rgba(0,0,0,0.7)',
                        lineHeight: 1.5,
                      }}
                    >
                      {previewData.bio}
                    </Typography>
                  )}

                  {/* Stats Grid */}
                  <Box
                    sx={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(3, 1fr)',
                      gap: 1.5,
                      mb: 2,
                    }}
                  >
                    <Box
                      sx={{
                        textAlign: 'center',
                        p: 0.1,
                        borderRadius: 1,
                        bgcolor: isDark
                          ? 'rgba(255,255,255,0.05)'
                          : 'rgba(0,0,0,0.02)',
                      }}
                    >
                      <Typography variant="caption" fontWeight={700}>
                        {previewData.user?._count?.Post || 0} Posts
                      </Typography>
                    </Box>
                    <Box
                      sx={{
                        textAlign: 'center',
                        p: 0.1,
                        borderRadius: 1,
                        bgcolor: isDark
                          ? 'rgba(255,255,255,0.05)'
                          : 'rgba(0,0,0,0.02)',
                      }}
                    >
                      <Typography variant="caption" fontWeight={700}>
                        {previewData.user?._count?.projects || 0} Projects
                      </Typography>
                    </Box>
                  </Box>

                  {/* Chips */}
                  <Box
                    sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}
                  >
                    {previewData.dept && (
                      <Chip
                        icon={<School sx={{ fontSize: 14 }} />}
                        label={previewData.dept}
                        size="small"
                        sx={{
                          bgcolor: isDark
                            ? 'rgba(255,255,255,0.08)'
                            : 'rgba(0,0,0,0.05)',
                          color: 'inherit',
                        }}
                      />
                    )}
                    {previewData.location && (
                      <Chip
                        icon={<LocationOn sx={{ fontSize: 14 }} />}
                        label={previewData.location}
                        size="small"
                        sx={{
                          bgcolor: isDark
                            ? 'rgba(255,255,255,0.08)'
                            : 'rgba(0,0,0,0.05)',
                          color: 'inherit',
                        }}
                      />
                    )}
                    {/* {previewData.company && (
                      <Chip
                        icon={<Business sx={{ fontSize: 14 }} />}
                        label={previewData.company}
                        size="small"
                        sx={{
                          bgcolor: isDark
                            ? 'rgba(255,255,255,0.08)'
                            : 'rgba(0,0,0,0.05)',
                          color: 'inherit',
                        }}
                      />
                    )} */}
                  </Box>

                  <Divider
                    sx={{
                      my: 2,
                      borderColor: isDark
                        ? 'rgba(255,255,255,0.1)'
                        : 'rgba(0,0,0,0.1)',
                    }}
                  />

                  {/* View Profile Button */}
                  <Link
                    component="button"
                    underline="none"
                    onClick={handleOnClick}
                    sx={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 0.5,
                      color: isDark ? '#60a5fa' : '#2563eb',
                      fontWeight: 600,
                      fontSize: '0.9rem',
                      transition: 'gap 0.2s ease',
                      '&:hover': {
                        gap: 1,
                        color: isDark ? '#93c5fd' : '#1d4ed8',
                      },
                    }}
                  >
                    View full profile <ArrowOutward fontSize="small" />
                  </Link>
                </>

                {/* // Loading spinner
                // <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                //   <Box */}
                {/* //     sx={{ */}
                {/* //       width: 24,
                //       height: 24,
                //       borderRadius: '50%',
                //       border: '2px solid',
                //       borderColor: isDark
                //         ? 'rgba(255,255,255,0.1)'
                //         : 'rgba(0,0,0,0.1)',
                //       borderTopColor: isDark ? '#60a5fa' : '#3b82f6',
                //       animation: 'spin 1s linear infinite',
                //       '@keyframes spin': { */}
                {/* //         '0%': { transform: 'rotate(0deg)' },
                //         '100%': { transform: 'rotate(360deg)' },
                //       },
                //     }}
                //   />
                // </Box> */}
              </Box>
            </Fade>
          )}
        </Popper>
      )}
    </Box>
  );
};
