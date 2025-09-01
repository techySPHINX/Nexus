import React from 'react';
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
} from '@mui/material';
import { Public, Lock, ArrowForward } from '@mui/icons-material';
import { Link, useNavigate } from 'react-router-dom';
import { SubCommunity } from '../../types/subCommunity';

interface SubCommunityCardProps {
  subCommunity: SubCommunity;
}

export const SubCommunityCard: React.FC<SubCommunityCardProps> = ({
  subCommunity,
}) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const handleCardClick = (e: React.MouseEvent) => {
    // Prevent navigation if click is on the join button
    if ((e.target as HTMLElement).closest('button')) {
      return;
    }
    navigate(`/subcommunities/${subCommunity.id}`);
  };

  const handleJoinClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // Here you would open your join component/modal
    console.log('Join clicked for:', subCommunity.id);
    // Example: openJoinModal(subCommunity.id);
  };

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
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: theme.shadows[4],
          borderColor: theme.palette.primary.main,
        },
      }}
      onClick={handleCardClick}
    >
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
                backgroundColor: theme.palette.primary.main,
                fontSize: '1.2rem',
                fontWeight: 'bold',
              }}
            >
              {subCommunity.name.charAt(0).toUpperCase()}
            </Avatar>
          )}

          <Box sx={{ flex: 1 }}>
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
              r/{subCommunity.name}
            </Typography>

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
            {subCommunity.isPrivate ? (
              <Button
                variant="contained"
                size="small"
                onClick={handleJoinClick}
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
                startIcon={<Lock sx={{ fontSize: 14 }} />}
              >
                Join
              </Button>
            ) : (
              <Button
                variant="outlined"
                size="small"
                onClick={handleJoinClick}
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
              >
                Join
              </Button>
            )}

            <Button
              component={Link}
              to={`/subcommunities/${subCommunity.id}`}
              variant="text"
              size="small"
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
