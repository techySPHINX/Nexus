import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Button,
  Box,
  Chip,
  Avatar,
  useTheme,
  useMediaQuery,
  CircularProgress,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Public,
  Lock,
  ArrowForward,
  People,
  Schedule,
  AdminPanelSettings,
  Shield,
  Edit,
} from '@mui/icons-material';
import { Link, useNavigate } from 'react-router-dom';
import { SubCommunity } from '../../types/subCommunity';
import { useSubCommunity } from '../../contexts/SubCommunityContext';
import { useAuth } from '../../contexts/AuthContext';
import { SubCommunityRole } from '../../types/subCommunity';

interface SubCommunityCardProps {
  subCommunity: SubCommunity;
  onEdit?: (community: SubCommunity) => void;
}

export const SubCommunityCard: React.FC<SubCommunityCardProps> = ({
  subCommunity,
  onEdit,
}) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { user } = useAuth();
  const { requestToJoin, joinRequests } = useSubCommunity();

  const [isMember, setIsMember] = useState(false);
  const [userRole, setUserRole] = useState<SubCommunityRole | null>(null);
  const [hasPendingRequest, setHasPendingRequest] = useState(false);
  const [isJoining, setIsJoining] = useState(false);

  // Check if user is a member
  useEffect(() => {
    if (user && subCommunity.members) {
      // Find the current user's membership and set their role
      const member = subCommunity.members.find((m) => m.userId === user.id);
      setIsMember(!!member);
      setUserRole(member ? member.role : null);
    }
  }, [user, subCommunity.members]);

  // Check for pending join requests
  useEffect(() => {
    if (user && joinRequests.length > 0) {
      const userRequest = joinRequests.find(
        (req) =>
          req.userId === user.id && req.subCommunityId === subCommunity.id
      );
      setHasPendingRequest(!!userRequest);
    }
  }, [user, joinRequests, subCommunity.id]);

  const handleCardClick = (e: React.MouseEvent) => {
    // Prevent navigation if click is on an interactive control (button/link/input)
    const target = e.target as HTMLElement | null;
    const isInteractive = (el: HTMLElement | null) =>
      !!el?.closest(
        'a, button, input, textarea, select, [role="button"], .no-navigate'
      );
    if (isInteractive(target)) return;
    navigate(`/subcommunities/${subCommunity.id}`);
  };

  const handleJoinClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      navigate('/login', {
        state: { from: `/subcommunities/${subCommunity.id}` },
      });
      return;
    }

    setIsJoining(true);
    try {
      await requestToJoin(subCommunity.id);
      setHasPendingRequest(true);
      // Refresh pending requests
      // getPendingJoinRequests(subCommunity.id);
    } catch (error) {
      console.error('Failed to join community:', error);
    } finally {
      setIsJoining(false);
    }
  };

  const handleEditClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onEdit) {
      onEdit(subCommunity);
    }
  };

  const getRoleIcon = (role: SubCommunityRole) => {
    switch (role) {
      case SubCommunityRole.OWNER:
        return <AdminPanelSettings sx={{ fontSize: 14, color: 'gold' }} />;
      case SubCommunityRole.MODERATOR:
        return <Shield sx={{ fontSize: 14, color: 'silver' }} />;
      default:
        return <People sx={{ fontSize: 14 }} />;
    }
  };

  const getRoleColor = (role: SubCommunityRole) => {
    switch (role) {
      case SubCommunityRole.OWNER:
        return 'warning.main';
      case SubCommunityRole.MODERATOR:
        return 'success.main';
      default:
        return 'primary.main';
    }
  };

  const renderJoinButton = () => {
    if (isMember) {
      return (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {/* Show user's role if they are a member */}
          <Chip
            icon={getRoleIcon(userRole!)}
            label={userRole}
            size="small"
            sx={{
              fontSize: '0.7rem',
              height: 24,
              backgroundColor: getRoleColor(userRole!),
              color: 'white',
              fontWeight: 600,
            }}
          />
          {/* <Button
            variant="outlined"
            size="small"
            disabled
            sx={{
              borderRadius: 20,
              textTransform: 'none',
              fontWeight: 600,
              fontSize: '0.75rem',
              py: 0.5,
              px: 2,
              whiteSpace: 'nowrap',
              minWidth: 'auto',
              borderColor: 'success.main',
              color: 'success.main',
            }}
            startIcon={<Check sx={{ fontSize: 14 }} />}
          >
            Joined
          </Button> */}
        </Box>
      );
    }

    if (hasPendingRequest) {
      return (
        <Button
          variant="outlined"
          size="small"
          disabled
          sx={{
            borderRadius: 20,
            textTransform: 'none',
            fontWeight: 600,
            fontSize: '0.75rem',
            py: 0.5,
            px: 2,
            whiteSpace: 'nowrap',
            minWidth: 'auto',
          }}
          startIcon={<Schedule sx={{ fontSize: 14 }} />}
        >
          Pending
        </Button>
      );
    }

    if (!subCommunity.isPrivate) {
      return;
    }

    if (subCommunity.isPrivate) {
      return (
        <Button
          variant="contained"
          size="small"
          onClick={handleJoinClick}
          disabled={isJoining}
          sx={{
            borderRadius: 20,
            textTransform: 'none',
            fontWeight: 600,
            fontSize: '0.75rem',
            py: 0.5,
            px: 2,
            whiteSpace: 'nowrap',
            minWidth: 'auto',
          }}
          startIcon={
            isJoining ? (
              <CircularProgress size={12} />
            ) : (
              <Lock sx={{ fontSize: 14 }} />
            )
          }
        >
          {isJoining ? 'Joining...' : 'Join'}
        </Button>
      );
    }

    return (
      <Button
        variant="outlined"
        size="small"
        onClick={handleJoinClick}
        disabled={isJoining}
        sx={{
          borderRadius: 20,
          textTransform: 'none',
          fontWeight: 600,
          fontSize: '0.75rem',
          py: 0.5,
          px: 2,
          whiteSpace: 'nowrap',
          minWidth: 'auto',
          borderWidth: 2,
          '&:hover': {
            borderWidth: 2,
          },
        }}
        startIcon={
          isJoining ? (
            <CircularProgress size={12} />
          ) : (
            <People sx={{ fontSize: 14 }} />
          )
        }
      >
        {isJoining ? 'Joining...' : 'Join'}
      </Button>
    );
  };

  const canEditCommunity =
    userRole === SubCommunityRole.OWNER ||
    userRole === SubCommunityRole.MODERATOR;

  return (
    <Card
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        borderRadius: 3,
        cursor: 'pointer',
        transition: 'all 0.2s ease-in-out',
        border: `1px solid ${theme.palette.divider}`,
        backgroundColor: theme.palette.background.paper,
        position: 'relative',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: theme.shadows[4],
          borderColor: theme.palette.primary.main,
        },
      }}
      onClick={handleCardClick}
    >
      {/* Edit button for owners/moderators */}
      {canEditCommunity && onEdit && (
        <Tooltip title="Edit Community">
          <IconButton
            className="no-navigate"
            onClick={handleEditClick}
            sx={{
              position: 'absolute',
              top: 8,
              right: 8,
              backgroundColor: 'background.paper',
              '&:hover': {
                backgroundColor: 'action.hover',
              },
            }}
            size="small"
          >
            <Edit sx={{ fontSize: 16 }} />
          </IconButton>
        </Tooltip>
      )}

      <CardContent
        sx={{
          p: 2,
          flexGrow: 1,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Community Header with Icon and Name */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            mb: 2,
          }}
        >
          {subCommunity.iconUrl ? (
            <Avatar
              src={subCommunity.iconUrl}
              sx={{
                width: 48,
                height: 48,
                border: `2px solid ${theme.palette.background.paper}`,
                backgroundColor: theme.palette.background.paper,
              }}
            />
          ) : (
            <Avatar
              sx={{
                width: 48,
                height: 48,
                fontSize: '1.2rem',
                fontWeight: 'bold',
                color: 'white',
              }}
            >
              {subCommunity.name.charAt(0).toUpperCase()}
            </Avatar>
          )}

          <Box sx={{ flex: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography
                variant="h6"
                component="h3"
                sx={{
                  fontWeight: 700,
                  fontSize: isMobile ? '1rem' : '1.1rem',
                  color: theme.palette.text.primary,
                  lineHeight: 1.2,
                }}
              >
                {subCommunity.name}
              </Typography>
            </Box>

            <Typography
              variant="body2"
              sx={{
                color: theme.palette.text.secondary,
                fontSize: isMobile ? '0.8rem' : '0.9rem',
                lineHeight: 1.3,
              }}
            >
              {subCommunity._count?.members?.toLocaleString() || '0'} members
            </Typography>
          </Box>
        </Box>

        {/* Community Description */}
        <Typography
          variant="body2"
          sx={{
            color: theme.palette.text.secondary,
            fontSize: isMobile ? '0.8rem' : '0.9rem',
            lineHeight: 1.4,
            mb: 2,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {subCommunity.description}
        </Typography>

        {/* Stats, Info, and Actions in one line */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 1,
            mt: 'auto',
            flexWrap: 'wrap',
          }}
        >
          {/* Left side - Stats and Info */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              flexWrap: 'wrap',
            }}
          >
            {/* Community Type */}
            <Chip
              label={
                typeof subCommunity.type === 'string'
                  ? subCommunity.type
                  : subCommunity.type?.name || 'OTHER'
              }
              size="small"
              sx={{
                fontSize: '0.7rem',
                height: 24,
                // backgroundColor: getTypeColor(subCommunity.type),
                color: 'default',
                fontWeight: 600,
              }}
            />

            {/* Privacy Status */}
            <Chip
              icon={subCommunity.isPrivate ? <Lock /> : <Public />}
              label={subCommunity.isPrivate ? 'Private' : 'Public'}
              size="small"
              color={subCommunity.isPrivate ? 'default' : 'primary'}
              variant="filled"
              sx={{
                fontSize: '0.7rem',
                height: 24,
              }}
            />

            {/* Post Count */}
            <Chip
              icon={<ArrowForward />}
              label={`${subCommunity._count?.posts?.toLocaleString() || '0'} posts`}
              size="small"
              variant="outlined"
              sx={{
                fontSize: '0.7rem',
                height: 24,
              }}
            />

            {/* Owner Info */}
            {subCommunity.owner && (
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.5,
                }}
              >
                <Typography
                  variant="caption"
                  sx={{
                    color: theme.palette.text.secondary,
                    fontSize: '0.7rem',
                  }}
                >
                  by u/{subCommunity.owner.name}
                </Typography>
              </Box>
            )}
          </Box>

          {/* Right side - Action Buttons */}
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            {renderJoinButton()}

            <Button
              component={Link}
              to={`/subcommunities/${subCommunity.id}`}
              variant="text"
              size="small"
              className="no-navigate"
              sx={{
                borderRadius: 20,
                textTransform: 'none',
                fontWeight: 600,
                fontSize: '0.75rem',
                py: 0.5,
                minWidth: 'auto',
                px: 1,
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <ArrowForward sx={{ fontSize: 16 }} />
            </Button>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};
