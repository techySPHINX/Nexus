import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Chip,
  Typography,
  Box,
  Stack,
  Tooltip,
  IconButton,
  Skeleton,
} from '@mui/material';
import {
  Favorite,
  FavoriteBorder,
  Visibility,
  VisibilityOff,
  Handshake,
  RocketLaunch,
  Build,
  CheckCircle,
} from '@mui/icons-material';
import { format } from 'date-fns';
import { ProjectInterface, status } from '@/types/ShowcaseType';
import { ProfileNameLink } from '@/utils/ProfileNameLink';
// import { OptimizedImage } from '@/utils/optimizedImageLoading';
import { Role } from '@/types/profileType';

interface ProjectCardProps {
  project: ProjectInterface;
  currentUserId?: string | null;
  isOwner?: boolean | null;
  onSupport: (projectId: string, isSupported: boolean) => void;
  onFollow: (projectId: string, isFollowing: boolean) => void;
  onCollaborate?: () => void;
  onViewDetails: (project: ProjectInterface) => void;
}

const ProjectCard: React.FC<ProjectCardProps> = ({
  project,
  currentUserId,
  isOwner,
  onSupport,
  onFollow,
  onCollaborate,
  onViewDetails,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);

  const statusConfig = {
    [status.IDEA]: {
      label: 'Idea',
      gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      icon: <RocketLaunch sx={{ fontSize: 16 }} />,
      color: '#667eea',
    },
    [status.IN_PROGRESS]: {
      label: 'In Progress',
      gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
      icon: <Build sx={{ fontSize: 16 }} />,
      color: '#f5576c',
    },
    [status.COMPLETED]: {
      label: 'Completed',
      gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
      icon: <CheckCircle sx={{ fontSize: 16 }} />,
      color: '#00f2fe',
    },
  };

  const isSupported = project.supporters?.some(
    (s) => s.userId === currentUserId
  );
  const isFollowing = project.followers?.some(
    (f) => f.userId === currentUserId
  );

  const supportersCount =
    project._count?.supporters || project.supporters?.length || 0;
  const followersCount =
    project._count?.followers || project.followers?.length || 0;

  return (
    <Box
      sx={{
        position: 'relative',
        borderRadius: 3,
        overflow: 'hidden',
        cursor: 'pointer',
        height: 340,
        width: '100%',
        boxShadow: '0 10px 30px rgba(0,0,0,0.15)',
        transition: 'all 0.3s ease-in-out',
        '&:hover': {
          transform: 'translateY(-8px)',
          boxShadow: '0 20px 40px rgba(0,0,0,0.25)',
        },
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => onViewDetails(project)}
    >
      {/* Project Image with Gradient Overlay */}
      <Box sx={{ position: 'relative', height: '100%', width: '100%' }}>
        {/* <OptimizedImage
          src={project.imageUrl || '/default-project.webp'}
          alt={project.title}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            filter: isHovered ? 'brightness(0.7) blur(2px)' : 'brightness(0.9)',
            transition: 'all 0.4s ease',
          }}
        /> */}
        {/* Lazy-load optimized image with WebP hint and graceful fallback */}
        {(() => {
          const webpUrl =
            project.imageUrl?.replace(/\.(jpg|jpeg|png)(\?.*)?$/i, '.webp$2') ??
            undefined;
          return (
            <Box sx={{ position: 'absolute', inset: 0 }}>
              <picture>
                {webpUrl && (
                  <source
                    srcSet={webpUrl}
                    type="image/webp"
                    // let the browser decide when to fetch optimized format
                  />
                )}

                <img
                  loading="lazy"
                  decoding="async"
                  // hint to the browser this image is non-critical
                  fetchPriority="low"
                  src={project.imageUrl || '/default-project.png'}
                  // provide a simple srcSet to help high-DPI devices (no assumptions about multiple sizes)
                  srcSet={
                    project.imageUrl
                      ? `${project.imageUrl} 1x, ${project.imageUrl} 2x`
                      : undefined
                  }
                  sizes="(max-width:600px) 100vw, 50vw"
                  alt={project.title}
                  onLoad={() => setImgLoaded(true)}
                  onError={(e) => {
                    // fallback to default image and mark loaded to remove placeholder
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = '/default-project.png';
                    setImgLoaded(true);
                  }}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    // reduce brightness/blur on hover for effect
                    filter: isHovered
                      ? 'brightness(0.7) blur(2px)'
                      : 'brightness(0.9)',
                    // fade in once loaded to avoid layout shift / flash
                    opacity: imgLoaded ? 1 : 0,
                    transition:
                      'opacity 0.5s ease, filter 0.4s ease, transform 0.4s ease',
                    willChange: 'opacity, filter',
                    display: 'block',
                  }}
                />
              </picture>

              {/* lightweight placeholder shown until image loads to avoid CLS */}
              {!imgLoaded && (
                <Box
                  sx={{
                    position: 'absolute',
                    inset: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background:
                      'linear-gradient(135deg, rgba(0,0,0,0.08), rgba(0,0,0,0.18))',
                    // subtle animated shimmer to indicate loading
                    backgroundSize: '200% 100%',
                    animation: 'placeholderShimmer 1.2s linear infinite',
                    color: 'rgba(255,255,255,0.6)',
                    fontSize: 12,
                  }}
                >
                  Loading…
                </Box>
              )}

              {/* keyframes for shimmer (scoped inline) */}
              <style>{`
          @keyframes placeholderShimmer {
            0% { background-position: 200% 0; }
            100% { background-position: -200% 0; }
          }
              `}</style>
            </Box>
          );
        })()}
        {!imgLoaded && (
          <Box
            sx={{
              position: 'absolute',
              inset: 0,
              background: 'linear-gradient(135deg, #333, #111)',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              color: '#777',
            }}
          >
            Loading...
          </Box>
        )}

        {/* Gradient Overlay */}
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background:
              'linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.8) 100%)',
          }}
        />

        {/* Persistent Bottom Info */}
        <Box
          sx={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            p: 2,
            color: 'white',
            background:
              'linear-gradient(to top, rgba(0,0,0,0.9) 0%, transparent 100%)',
          }}
        >
          <Typography
            variant="h6"
            sx={{
              fontWeight: 700,
              mb: 1,
              textShadow: '2px 2px 4px rgba(0,0,0,0.5)',
              lineHeight: 1.2,
            }}
          >
            {project.title}
          </Typography>

          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <ProfileNameLink
                user={{
                  id: project.owner.id,
                  name: project.owner.name,
                  role: project.owner.role as Role,
                  profile: { avatarUrl: project.owner.profile?.avatarUrl },
                }}
                avatarSize={30}
                showRoleBadge={false}
                showYouBadge={false}
                showAvatar
              />
            </Box>

            <Box sx={{ display: 'flex', gap: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Favorite sx={{ fontSize: 18, color: '#ff6b6b' }} />
                <Typography variant="body2" fontWeight={600}>
                  {supportersCount}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Visibility sx={{ fontSize: 18, color: '#74b9ff' }} />
                <Typography variant="body2" fontWeight={600}>
                  {followersCount}
                </Typography>
              </Box>
            </Box>
          </Box>
        </Box>

        {/* Status Badge */}
        <Chip
          icon={statusConfig[project.status].icon}
          label={statusConfig[project.status].label}
          size="small"
          sx={{
            position: 'absolute',
            top: 16,
            left: 16,
            background: statusConfig[project.status].gradient,
            color: 'white',
            fontWeight: 600,
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255,255,255,0.2)',
          }}
        />

        {/* Date */}
        <Typography
          variant="caption"
          sx={{
            position: 'absolute',
            top: 16,
            right: 16,
            color: 'rgba(255,255,255,0.9)',
            background: 'rgba(0,0,0,0.3)',
            px: 1,
            py: 0.5,
            borderRadius: 2,
            backdropFilter: 'blur(4px)',
          }}
        >
          {format(new Date(project.createdAt), 'MMM d, yyyy')}
        </Typography>

        {/* Hover Overlay Content */}
        <AnimatePresence>
          {isHovered && (
            <React.Suspense
              fallback={
                <Skeleton variant="rectangular" width="100%" height="100%" />
              }
            >
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  background: 'rgba(0, 0, 0, 0.9)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  padding: 20,
                  color: 'white',
                }}
              >
                {/* Tags Section */}
                <Box>
                  <Typography
                    variant="overline"
                    sx={{ color: 'rgba(255,255,255,0.7)', mb: 1 }}
                  >
                    Technologies & Tags
                  </Typography>
                  <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                    {project.tags?.slice(0, 4).map((tag, idx) => (
                      <Chip
                        key={idx}
                        label={tag}
                        size="small"
                        sx={{
                          backgroundColor: 'rgba(255,255,255,0.1)',
                          color: 'white',
                          border: '1px solid rgba(255,255,255,0.2)',
                          mb: 1,
                          '&:hover': {
                            backgroundColor: 'rgba(255,255,255,0.2)',
                          },
                        }}
                      />
                    ))}
                    {project.tags && project.tags.length > 4 && (
                      <Chip
                        label={`+${project.tags.length - 4}`}
                        size="small"
                        sx={{
                          backgroundColor: 'rgba(255,255,255,0.05)',
                          color: 'rgba(255,255,255,0.7)',
                          border: '1px solid rgba(255,255,255,0.1)',
                        }}
                      />
                    )}
                  </Stack>
                </Box>

                {/* Owner Profile */}
                <Box sx={{ mb: 2 }}>
                  <Typography
                    variant="overline"
                    sx={{ color: 'rgba(255,255,255,0.7)' }}
                  >
                    Project Owner
                  </Typography>
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                      mt: 1,
                    }}
                  >
                    <ProfileNameLink
                      user={{
                        id: project.owner.id,
                        name: project.owner.name,
                        role: project.owner.role as Role,
                        profile: {
                          avatarUrl: project.owner.profile?.avatarUrl,
                        },
                      }}
                      avatarSize={40}
                      linkToProfile={false}
                      showAvatar
                    />
                  </Box>
                </Box>

                {/* Action Buttons */}
                {!isOwner && (
                  <Stack direction="row" spacing={1} justifyContent="end">
                    <Tooltip title={isSupported ? 'Unsupport' : 'Support'}>
                      <IconButton
                        onClick={(e) => {
                          e.stopPropagation();
                          onSupport(project.id, !!isSupported);
                        }}
                        sx={{
                          background: isSupported
                            ? 'rgba(255,107,107,0.2)'
                            : 'rgba(255,255,255,0.1)',
                          color: isSupported ? '#ff6b6b' : 'white',
                          border: '1px solid rgba(255,255,255,0.2)',
                          '&:hover': {
                            background: isSupported
                              ? 'rgba(255,107,107,0.3)'
                              : 'rgba(255,255,255,0.2)',
                            boxShadow: isSupported
                              ? '0 0 10px #ff6b6b'
                              : '0 0 10px #ffffff',
                          },
                          transition: 'all 0.2s ease',
                        }}
                      >
                        {isSupported ? <Favorite /> : <FavoriteBorder />}
                      </IconButton>
                    </Tooltip>

                    <Tooltip title={isFollowing ? 'Unfollow' : 'Follow'}>
                      <IconButton
                        onClick={(e) => {
                          e.stopPropagation();
                          onFollow(project.id, !!isFollowing);
                        }}
                        sx={{
                          background: isFollowing
                            ? 'rgba(116,185,255,0.2)'
                            : 'rgba(255,255,255,0.1)',
                          color: isFollowing ? '#74b9ff' : 'white',
                          border: '1px solid rgba(255,255,255,0.2)',
                          '&:hover': {
                            background: isFollowing
                              ? 'rgba(116,185,255,0.3)'
                              : 'rgba(255,255,255,0.2)',
                            boxShadow: isFollowing
                              ? '0 0 10px #74b9ff'
                              : '0 0 10px #ffffff',
                          },
                          transition: 'all 0.2s ease',
                        }}
                      >
                        {isFollowing ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </Tooltip>

                    {!isOwner && onCollaborate && (
                      <Tooltip title="Collaborate">
                        <IconButton
                          onClick={(e) => {
                            e.stopPropagation();
                            onCollaborate();
                          }}
                          sx={{
                            background: 'rgba(255,255,255,0.1)',
                            color: '#ffeaa7',
                            border: '1px solid rgba(255,255,255,0.2)',
                            '&:hover': {
                              background: 'rgba(255,255,255,0.2)',
                              boxShadow: '0 0 10px #ffeaa7',
                            },
                            transition: 'all 0.2s ease',
                          }}
                        >
                          <Handshake />
                        </IconButton>
                      </Tooltip>
                    )}
                  </Stack>
                )}
              </motion.div>
            </React.Suspense>
          )}
        </AnimatePresence>
      </Box>
    </Box>
  );
};

export default React.memo(ProjectCard);
