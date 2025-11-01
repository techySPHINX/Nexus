import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Chip,
  Typography,
  Box,
  Stack,
  Tooltip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  CircularProgress,
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
import {
  ProjectInterface,
  ProjectDetailInterface,
  status,
} from '@/types/ShowcaseType';
import { ProfileNameLink } from '@/utils/ProfileNameLink';
import { Role } from '@/types/profileType';
import { useShowcase } from '@/contexts/ShowcaseContext';
import { useNotification } from '@/contexts/NotificationContext';

interface ProjectCardProps {
  project: ProjectInterface;
  tab: number;
  currentUserId?: string | null;
  isOwner?: boolean | null;
  onSupport: (projectId: string, isSupported: boolean) => void;
  onFollow: (projectId: string, isFollowing: boolean) => void;
  onCollaborate?: () => void;
  onViewDetails: (project: ProjectInterface) => void;
}

const ProjectCard: React.FC<ProjectCardProps> = ({
  project,
  tab,
  currentUserId,
  isOwner,
  onSupport,
  onFollow,
  onCollaborate,
  onViewDetails,
}) => {
  const { deleteProject, getProjectById, projectById } = useShowcase();
  const { showNotification } = useNotification();
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);
  const [updateModalOpen, setUpdateModalOpen] = useState(false);

  // lazy-load UpdateSection so we don't add a hard dependency at top
  const UpdateSection = useMemo(
    () => React.lazy(() => import('./UpdateSection')),
    []
  );

  // ✅ Memoize image URL to prevent recomputation / re-renders
  const webpUrl = useMemo(() => {
    if (!project.imageUrl) return undefined;
    console.log('Computing webp URL for', project.imageUrl);
    return project.imageUrl.replace(/\.(jpg|jpeg|png)(\?.*)?$/i, '.webp$2');
  }, [project.imageUrl]);

  // ✅ Status configuration (static)
  const statusConfig = useMemo(
    () => ({
      [status.IDEA]: {
        label: 'Idea',
        gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        icon: <RocketLaunch sx={{ fontSize: 16 }} />,
      },
      [status.IN_PROGRESS]: {
        label: 'In Progress',
        gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
        icon: <Build sx={{ fontSize: 16 }} />,
      },
      [status.COMPLETED]: {
        label: 'Completed',
        gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
        icon: <CheckCircle sx={{ fontSize: 16 }} />,
      },
    }),
    []
  );

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

  // Centralized delete handler: use context action.
  const handleDeleteProject = async () => {
    setDeleting(true);
    try {
      await deleteProject(project.id);
      showNotification?.('Project deleted', 'success');
      setConfirmDeleteOpen(false);
    } catch (error) {
      console.error('Failed to delete project', error);
      showNotification?.('Failed to delete project', 'error');
    } finally {
      setDeleting(false);
    }
    // parent components should refresh lists as needed; if not, consider adding a callback.
  };

  // Centralized update handler: UpdateSection will call updateProject itself
  // here we just receive the updated project for local UI adjustments
  const handleUpdateProjectDetails = () => {
    // Close local modal — UpdateSection already calls updateProject in context
    setUpdateModalOpen(false);
  };

  // Open the UpdateSection modal. If we don't have a full project detail
  // in context, fetch it first so UpdateSection receives ProjectDetailInterface
  const handleUpdateClick = async (e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    try {
      if (!projectById || projectById.id !== project.id) {
        await getProjectById(project.id, true, 1);
      }
    } catch (err) {
      console.error('Failed to fetch project details before update', err);
    }
    setUpdateModalOpen(true);
  };

  const handleSupportClick = async (e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }
    try {
      await onSupport(project.id, !!isSupported);
      showNotification?.(
        isSupported ? 'Removed support' : 'Supported project',
        'success'
      );
    } catch (err) {
      console.error('Support action failed', err);
      showNotification?.('Action failed', 'error');
    }
  };

  const handleFollowClick = async (e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }
    try {
      await onFollow(project.id, !!isFollowing);
      showNotification?.(
        isFollowing ? 'Unfollowed' : 'Following project',
        'success'
      );
    } catch (err) {
      console.error('Follow action failed', err);
      showNotification?.('Action failed', 'error');
    }
  };

  return (
    <>
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
        onClick={() => {
          // Prevent opening details while update modal is open
          if (!updateModalOpen && !confirmDeleteOpen) onViewDetails(project);
        }}
      >
        {/* ✅ Image container (isolated, not tied to hover re-renders) */}
        <Box sx={{ position: 'relative', height: '100%', width: '100%' }}>
          <picture>
            {webpUrl && <source srcSet={webpUrl} type="image/webp" />}
            <img
              loading="lazy"
              decoding="async"
              src={project.imageUrl}
              srcSet={
                project.imageUrl
                  ? `${project.imageUrl} 1x, ${project.imageUrl} 2x`
                  : undefined
              }
              sizes="(max-width:600px) 100vw, 50vw"
              alt={project.title}
              onLoad={() => setImgLoaded(true)}
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = '/default-project.png';
                setImgLoaded(true);
              }}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                filter: isHovered
                  ? 'brightness(0.7) blur(2px)'
                  : 'brightness(0.9)',
                opacity: imgLoaded ? 1 : 0,
                transition:
                  'opacity 0.5s ease, filter 0.4s ease, transform 0.4s ease',
                willChange: 'opacity, filter',
                display: 'block',
              }}
            />
          </picture>

          {/* ✅ Lightweight shimmer placeholder */}
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
                backgroundSize: '200% 100%',
                animation: 'placeholderShimmer 1.2s linear infinite',
                color: 'rgba(255,255,255,0.6)',
                fontSize: 12,
              }}
            >
              Loading…
            </Box>
          )}

          <style>{`
            @keyframes placeholderShimmer {
              0% { background-position: 200% 0; }
              100% { background-position: -200% 0; }
            }
          `}</style>

          {/* ✅ Gradient Overlay */}
          <Box
            sx={{
              position: 'absolute',
              inset: 0,
              background:
                'linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.8) 100%)',
            }}
          />

          {/* ✅ Bottom Info */}
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
              <ProfileNameLink
                user={{
                  id: project.owner?.id || '',
                  name: project.owner?.name || 'Cannot Load',
                  role: (project.owner?.role as Role) || 'Cannot Load',
                  profile: {
                    avatarUrl: project.owner?.profile?.avatarUrl || '',
                  },
                }}
                avatarSize={30}
                showRoleBadge={false}
                showYouBadge={false}
                showAvatar
              />

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

          {/* ✅ Status + Date */}
          <Chip
            icon={
              statusConfig[project.status]?.icon ?? (
                <RocketLaunch sx={{ fontSize: 16 }} />
              )
            }
            label={statusConfig[project.status]?.label ?? 'Unknown'}
            size="small"
            sx={{
              position: 'absolute',
              top: 16,
              left: 16,
              background:
                statusConfig[project.status]?.gradient ??
                'linear-gradient(135deg, #6b7280 0%, #374151 100%)',
              color: 'white',
              fontWeight: 600,
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255,255,255,0.2)',
            }}
          />

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
            {project.createdAt && !isNaN(new Date(project.createdAt).getTime())
              ? format(new Date(project.createdAt), 'MMM d, yyyy')
              : 'Unknown date'}
          </Typography>

          {/* ✅ Hover overlay — isolated from image */}
          <AnimatePresence>
            {isHovered && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'rgba(0, 0, 0, 0.9)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  padding: 20,
                  color: 'white',
                }}
              >
                {/* Tags */}
                <Box>
                  <Typography
                    variant="overline"
                    sx={{ color: 'rgba(255,255,255,0.7)', mb: 1 }}
                  >
                    Technologies & Tags
                  </Typography>
                  <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                    {project.tags?.slice(0, 10).map((tag, idx) => (
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
                    {project.tags && project.tags.length > 10 && (
                      <Chip
                        label={`+${project.tags.length - 10}`}
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

                {/* Anchor actions for update and delete */}
                {tab == 1 && (
                  <Box
                    onClick={(e) => e.stopPropagation()}
                    sx={{
                      position: 'absolute',
                      top: 5,
                      right: 16,
                      display: 'flex',
                      gap: 1,
                      zIndex: 40,
                    }}
                  >
                    <Tooltip title="Update">
                      <IconButton
                        onClick={(e) => {
                          e.stopPropagation();
                          e.preventDefault();
                          handleUpdateClick(e);
                        }}
                        onMouseDown={(e) => e.preventDefault()}
                        sx={{
                          width: 36,
                          height: 36,
                          bgcolor: 'rgba(255,255,255,0.04)',
                          color: 'white',
                          border: '1px solid rgba(255,255,255,0.08)',
                          '&:hover': { bgcolor: 'rgba(255,255,255,0.08)' },
                        }}
                      >
                        <Build sx={{ fontSize: 18 }} />
                      </IconButton>
                    </Tooltip>

                    <Tooltip title="Delete">
                      <IconButton
                        onClick={async (e) => {
                          e.stopPropagation();
                          e.preventDefault();
                          setConfirmDeleteOpen(true);
                        }}
                        onMouseDown={(e) => e.preventDefault()}
                        sx={{
                          width: 36,
                          height: 36,
                          bgcolor: 'rgba(255,255,255,0.04)',
                          color: 'white',
                          border: '1px solid rgba(255,255,255,0.08)',
                          '&:hover': { bgcolor: 'rgba(255,255,255,0.08)' },
                        }}
                      >
                        <Typography sx={{ fontSize: 18 }}>🗑️</Typography>
                      </IconButton>
                    </Tooltip>
                  </Box>
                )}

                {/* Owner */}
                <Box>
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
                        id: project.owner?.id || '',
                        name: project.owner?.name || 'Cannot Load',
                        role: (project.owner?.role as Role) || 'Cannot Load',
                        profile: {
                          avatarUrl: project.owner?.profile?.avatarUrl || '',
                        },
                      }}
                      avatarSize={40}
                      linkToProfile={false}
                      showAvatar
                    />
                  </Box>
                </Box>

                {/* Confirm delete dialog */}
                <Dialog
                  open={confirmDeleteOpen}
                  onClose={() => setConfirmDeleteOpen(false)}
                  aria-labelledby="confirm-delete-title"
                >
                  <DialogTitle id="confirm-delete-title">
                    Delete project?
                  </DialogTitle>
                  <DialogContent>
                    Are you sure you want to delete this project?
                  </DialogContent>
                  <DialogActions>
                    <Button
                      onClick={() => setConfirmDeleteOpen(false)}
                      disabled={deleting}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={() => handleDeleteProject()}
                      color="error"
                      variant="contained"
                      disabled={deleting}
                      startIcon={
                        deleting ? <CircularProgress size={16} /> : null
                      }
                    >
                      {deleting ? 'Deleting...' : 'Delete'}
                    </Button>
                  </DialogActions>
                </Dialog>

                {/* Snackbar
                <Snackbar
                  open={snackOpen}
                  autoHideDuration={4000}
                  onClose={() => setSnackOpen(false)}
                  anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
                >
                  <Alert
                    onClose={() => setSnackOpen(false)}
                    severity={snackSeverity}
                    sx={{ width: '100%' }}
                  >
                    {snackMsg}
                  </Alert>
                </Snackbar> */}
                {/* Actions */}
                {!isOwner && (
                  <Stack direction="row" spacing={1} justifyContent="end">
                    {!(tab == 3) && (
                      <Tooltip title={isSupported ? 'Unsupport' : 'Support'}>
                        <IconButton
                          onClick={(e) => handleSupportClick(e)}
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
                          }}
                        >
                          {isSupported ? <Favorite /> : <FavoriteBorder />}
                        </IconButton>
                      </Tooltip>
                    )}
                    {!(tab == 2) && (
                      <Tooltip title={isFollowing ? 'Unfollow' : 'Follow'}>
                        <IconButton
                          onClick={(e) => handleFollowClick(e)}
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
                          }}
                        >
                          {isFollowing ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </Tooltip>
                    )}
                    {onCollaborate && (
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
                          }}
                        >
                          <Handshake />
                        </IconButton>
                      </Tooltip>
                    )}
                  </Stack>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Update modal / panel — lazy-loaded UpdateSection */}
          <React.Suspense
            fallback={
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: 160,
                }}
              >
                Loading editor…
              </Box>
            }
          >
            {/* UpdateSection is a Dialog; pass open and the full project detail when available */}
            <UpdateSection
              open={updateModalOpen}
              project={
                (projectById as ProjectDetailInterface) ??
                (project as unknown as ProjectDetailInterface)
              }
              onClose={() => setUpdateModalOpen(false)}
              onUpdated={handleUpdateProjectDetails}
            />
          </React.Suspense>
        </Box>
      </Box>

      {/* Notifications are now handled by NotificationProvider */}
    </>
  );
};

// ✅ Prevent unnecessary re-renders when props don’t change
export default React.memo(ProjectCard);
