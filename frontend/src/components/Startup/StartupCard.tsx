import React from 'react';
import { StartupSummary } from '@/types/StartupType';
import { motion } from 'framer-motion';
import {
  Box,
  Typography,
  Avatar,
  LinearProgress,
  Tooltip,
  IconButton,
  Chip,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import {
  Edit,
  Delete,
  Visibility,
  Add,
  Check,
  TrendingUp,
  People,
  AttachMoney,
  Language,
} from '@mui/icons-material';
import { useAuth } from '@/contexts/AuthContext';

interface Props {
  startup: StartupSummary;
  onFollowToggle?: (startup: StartupSummary, isFollowing: boolean) => void;
  onView?: () => void;
  onEdit?: (startup: StartupSummary) => void;
  onDelete?: (startupId: string) => void;
  tab: number;
}

const StartupCard: React.FC<Props> = ({
  startup,
  onFollowToggle,
  onView,
  onEdit,
  onDelete,
  tab,
}) => {
  const { user } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const isOwner = user?.id === startup.founderId;
  const hasFunding = !!startup.fundingGoal;
  const hasMonetization =
    Array.isArray(startup.monetizationModel) &&
    startup.monetizationModel.length > 0;
  const fundingProgress = startup.fundingGoal
    ? Math.min(100, ((startup.fundingRaised || 0) / startup.fundingGoal) * 100)
    : 0;

  const handleFollow = () => onFollowToggle?.(startup, !!startup.isFollowing);

  const getStatusColor = (status: string) => {
    const statusMap: { [key: string]: string } = {
      LAUNCHED: '#10b981',
      BETA: '#3b82f6',
      PROTOTYPING: '#f59e0b',
      LIVE: '#ef4444',
      IDEA: '#6b7280',
    };
    return statusMap[status.toUpperCase()] || statusMap.IDEA;
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `₹${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `₹${(num / 1000).toFixed(1)}K`;
    return `₹${num}`;
  };

  // Content sections that adjust based on available data
  const renderContentSections = () => {
    const sections = [];

    // Always show monetization if available
    if (hasMonetization) {
      sections.push(
        <Box
          key="monetization"
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            mb: 1,
          }}
        >
          <AttachMoney
            sx={{ fontSize: { xs: 16, sm: 18 }, color: 'success.main' }}
          />
          <Typography
            variant="body2"
            sx={{
              fontSize: { xs: '0.8rem', sm: '0.9rem' },
              fontWeight: 500,
              color: 'text.primary',
            }}
          >
            {Array.isArray(startup.monetizationModel)
              ? startup.monetizationModel.join(', ')
              : String(startup.monetizationModel || '')}
          </Typography>
        </Box>
      );
    }

    // Always show funding progress if available
    if (hasFunding) {
      sections.push(
        <Box key="funding" sx={{ width: '100%', mb: 1.5 }}>
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              mb: 0.5,
              gap: 1,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <TrendingUp sx={{ fontSize: { xs: 16, sm: 18 } }} />
              <Typography
                variant="caption"
                fontWeight={600}
                sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}
              >
                Funding
              </Typography>
            </Box>
            <Typography
              variant="caption"
              fontWeight={600}
              sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}
            >
              {formatNumber(startup.fundingRaised || 0)} /{' '}
              {formatNumber(startup.fundingGoal || 0)}
            </Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={fundingProgress}
            sx={{
              height: { xs: 4, sm: 6 },
              borderRadius: 3,
              backgroundColor: 'grey.200',
              '& .MuiLinearProgress-bar': {
                borderRadius: 3,
                backgroundColor: fundingProgress >= 100 ? '#10b981' : '#3b82f6',
              },
            }}
          />
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{
              display: 'block',
              textAlign: 'center',
              mt: 0.5,
              fontSize: { xs: '0.65rem', sm: '0.7rem' },
            }}
          >
            {fundingProgress.toFixed(1)}% funded
          </Typography>
        </Box>
      );
    }
    // Add spacing filler when content is minimal
    const hasSubstantialContent = hasMonetization || hasFunding;
    if (!hasSubstantialContent) {
      sections.push(<Box key="spacer" sx={{ flex: 1, minHeight: '20px' }} />);
    }

    return sections;
  };

  const createdDate = startup.createdAt ? new Date(startup.createdAt) : null;
  const formattedCreated = createdDate
    ? createdDate.toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    : '';

  return (
    <motion.div
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2 }}
      style={{
        display: 'flex',
        alignItems: 'stretch',
        minHeight: '140px',
        height: '100%',
        position: 'relative',
        gap: 0,
        border: '1px solid #e5e7eb',
        borderRadius: '16px',
        backgroundColor: 'white',
        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
      }}
      className="hover:shadow-lg transition-all"
    >
      {/* Logo Section - Consistent height */}
      <Box
        sx={{
          width: { xs: '80px', sm: '100px', lg: '120px' },
          minWidth: { xs: '80px', sm: '100px', lg: '120px' },
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: { xs: 1, sm: 2 },
          borderRight: '1px solid',
          borderColor: 'divider',
          borderTopLeftRadius: '16px',
          borderBottomLeftRadius: '16px',
          position: 'relative',
          overflow: 'hidden',
          // light background design: subtle gradient + soft decorative blobs
          background:
            'linear-gradient(180deg, rgba(99,102,241,0.04), rgba(59,130,246,0.02))',
          // add a faint striped texture for depth
          backgroundImage:
            'linear-gradient(180deg, rgba(255,255,255,0.02), rgba(255,255,255,0)), repeating-linear-gradient(45deg, rgba(0,0,0,0.01) 0 1px, transparent 1px 8px)',
        }}
      >
        {/* Decorative soft blobs */}
        <Box
          sx={{
            position: 'absolute',
            width: { xs: 56, sm: 72, lg: 88 },
            height: { xs: 56, sm: 72, lg: 88 },
            borderRadius: '50%',
            background:
              'radial-gradient(circle at 30% 30%, rgba(99,102,241,0.12), rgba(99,102,241,0.04) 40%, transparent 60%)',
            top: -10,
            left: -10,
            pointerEvents: 'none',
            filter: 'blur(6px)',
            opacity: 0.95,
          }}
        />
        <Box
          sx={{
            position: 'absolute',
            width: { xs: 36, sm: 48, lg: 56 },
            height: { xs: 36, sm: 48, lg: 56 },
            borderRadius: '50%',
            background:
              'radial-gradient(circle at 70% 70%, rgba(99,102,241,0.08), rgba(59,130,246,0.02) 40%, transparent 60%)',
            bottom: -8,
            right: -8,
            pointerEvents: 'none',
            filter: 'blur(4px)',
            opacity: 0.9,
          }}
        />

        <Avatar
          src={startup.imageUrl}
          alt={startup.name}
          sx={{
            width: { xs: 60, sm: 80, lg: 100 },
            height: { xs: 60, sm: 80, lg: 100 },
            borderRadius: 2,
            fontSize: { xs: '1.5rem', sm: '2rem' },
            backgroundColor: 'background.paper',
            boxShadow: '0 6px 18px rgba(15,23,42,0.06)',
            border: '1px solid rgba(15,23,42,0.04)',
            zIndex: 1,
          }}
        >
          🚀
        </Avatar>
      </Box>

      {/* Main Content Section - Flexible but consistent */}
      <Box
        sx={{
          flex: 1,
          minWidth: 0,
          padding: { xs: 1.5, sm: 2, lg: 2.5 },
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
        }}
      >
        {/* Top Section: Header and Status */}
        <Box sx={{ minHeight: { sm: 140 } }}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: { xs: 1, sm: 2 },
              mb: 1.5,
              flexWrap: 'row',
              flexDirection: { xs: 'column', lg: 'row' }, // if md then row, else column
            }}
          >
            <Typography
              variant="h6"
              fontWeight={700}
              sx={{
                fontSize: { xs: '1rem', sm: '1.1rem', lg: '1.25rem' },
                lineHeight: 1.2,
                flex: 1,
                minWidth: 0,
                wordBreak: 'break-word',
              }}
            >
              {startup.name}
            </Typography>
            <Chip
              label={startup.status ?? 'IDEA'}
              size="small"
              sx={{
                backgroundColor: getStatusColor(startup.status ?? 'IDEA'),
                color: 'white',
                fontWeight: 600,
                fontSize: { xs: '0.7rem', sm: '0.75rem' },
                height: { xs: 24, sm: 28 },
                '& .MuiChip-label': {
                  px: { xs: 1, sm: 1.5 },
                },
                mt: { xs: 1, md: 0 }, // add top margin when stacked
              }}
            />
          </Box>

          {/* Dynamic Content Sections */}
          {renderContentSections()}
        </Box>

        {/* Bottom Section: Followers - Always present for consistency */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            pt: 1,
            borderTop: '1px solid',
            borderColor: 'divider',
          }}
        >
          <Tooltip title={createdDate ? createdDate.toLocaleString() : ''}>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{
                fontSize: { xs: '0.7rem', sm: '0.75rem' },
                display: 'flex',
                alignItems: 'center',
                gap: 0.5,
                whiteSpace: 'nowrap',
              }}
            >
              {createdDate ? `${formattedCreated}` : 'No date'}
            </Typography>
          </Tooltip>
          <Tooltip title="Followers">
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{
                fontSize: { xs: '0.7rem', sm: '0.75rem' },
                display: 'flex',
                alignItems: 'center',
                gap: 0.5,
              }}
            >
              <People sx={{ fontSize: { xs: 14, sm: 16 } }} />
              {startup.followersCount || 0}
            </Typography>
          </Tooltip>

          {/* view websiteUrl */}
          {startup.websiteUrl && (
            <Tooltip title="Visit Website">
              <IconButton
                color="primary"
                onClick={() => {
                  if (startup.websiteUrl) {
                    window.open(startup.websiteUrl, '_blank');
                  }
                }}
                size="small"
                sx={{
                  backgroundColor: 'primary.50',
                  '&:hover': {
                    backgroundColor: 'primary.100',
                  },
                }}
              >
                <Language fontSize="small" />
              </IconButton>
            </Tooltip>
          )}

          {/* View button in main content area for mobile */}
          <Tooltip title="View Details">
            <IconButton
              color="primary"
              onClick={onView}
              size="small"
              sx={{
                backgroundColor: 'primary.50',
                '&:hover': {
                  backgroundColor: 'primary.100',
                },
              }}
            >
              <Visibility fontSize="small" />
            </IconButton>
          </Tooltip>
          {isOwner ? (
            tab !== 0 ? (
              <Box
                sx={{
                  display: 'flex',
                  gap: { xs: 0.5, sm: 1 },
                  flexDirection: 'row',
                }}
              >
                <Tooltip title="Edit">
                  <IconButton
                    onClick={() => onEdit?.(startup)}
                    size={isMobile ? 'small' : 'medium'}
                    color="info"
                  >
                    <Edit fontSize={isMobile ? 'small' : 'medium'} />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Delete">
                  <IconButton
                    onClick={() => onDelete?.(startup.id)}
                    size={isMobile ? 'small' : 'medium'}
                    color="error"
                  >
                    <Delete fontSize={isMobile ? 'small' : 'medium'} />
                  </IconButton>
                </Tooltip>
              </Box>
            ) : (
              <Box
                sx={{
                  display: 'flex',
                  gap: { xs: 0.5, sm: 1 },
                  width: 100,
                  flexDirection: 'row',
                }}
              ></Box>
            )
          ) : (
            <Tooltip title={startup.isFollowing ? 'Unfollow' : 'Follow'}>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleFollow}
                style={{
                  borderRadius: '20px',
                  padding: isMobile ? '6px 12px' : '8px 16px',
                  fontSize: isMobile ? '0.7rem' : '0.8rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  border: startup.isFollowing ? '1px solid #d1d5db' : 'none',
                  background: startup.isFollowing
                    ? '#f9fafb'
                    : 'linear-gradient(to right, #3b82f6, #6366f1)',
                  color: startup.isFollowing ? '#374151' : '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  minWidth: isMobile ? 'auto' : '100px',
                  justifyContent: 'center',
                  height: isMobile ? '32px' : '36px',
                }}
              >
                {startup.isFollowing ? (
                  <>
                    <Check fontSize={isMobile ? 'small' : 'medium'} />
                    {!isMobile}
                  </>
                ) : (
                  <>
                    <Add fontSize={isMobile ? 'small' : 'medium'} />
                    {!isMobile && 'Follow'}
                  </>
                )}
              </motion.button>
            </Tooltip>
          )}
        </Box>
      </Box>
    </motion.div>
  );
};

export default StartupCard;
