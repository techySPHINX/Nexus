// ProjectDetailModal.tsx
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Box,
  Chip,
  Button,
  IconButton,
  Avatar,
  Divider,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  CircularProgress,
  TextField,
  Skeleton,
  Card,
  CardContent,
  Tooltip,
  Grid,
  useTheme,
  Snackbar,
  Alert,
  alpha,
} from '@mui/material';
import {
  Close,
  Favorite,
  FavoriteBorder,
  Visibility,
  VisibilityOff,
  Handshake,
  GitHub,
  Language,
  Person,
  Group,
  Comment as CommentIcon,
  Update,
  CalendarToday,
  Label,
  Send,
  Build,
  CheckCircle,
  RocketLaunch,
  Share,
  Bookmark,
  BookmarkBorder,
  TrendingUp,
} from '@mui/icons-material';
import { AddCircle, Delete } from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { format, formatDistanceToNow } from 'date-fns';
import {
  status,
  ProjectComment,
  ProjectTeam,
  ProjectUpdateInterface,
  ProjectDetailInterface,
  CommentPaginationResponse,
} from '@/types/ShowcaseType';
import { User } from '@/types/profileType';
import { ProfileNameLink } from '@/utils/ProfileNameLink';
import { useShowcase } from '@/contexts/ShowcaseContext';
const UpdateSection = React.lazy(() => import('./UpdateSection'));
import { apiService } from '@/services/api';

interface ProjectDetailModalProps {
  project: ProjectDetailInterface;
  open: boolean;
  comments?: {
    data: ProjectComment[];
    pagination: CommentPaginationResponse;
  };
  loading?: boolean;
  loadingComments?: boolean;
  loadingTeamMembers?: boolean;
  currentUserId?: string;
  onClose: () => void;
  onSupport: (isSupported: boolean) => void;
  onFollow: (isFollowing: boolean) => void;
  onCollaborate: () => void;
  onLoadComments: (page?: number, forceRefresh?: boolean) => void;
  onCreateComment: (comment: string) => Promise<void>;
  onLoadTeamMembers: () => void;
  isProjectOwner: boolean | null;
  onCreateTeamMember: (data: ProjectTeam) => Promise<void>;
  onRemoveTeamMember: (userId: string) => Promise<void>;
  onLoadUpdates: () => void;
  onRefresh: () => void;
  onDelete: () => void;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`project-detail-tabpanel-${index}`}
      aria-labelledby={`project-detail-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 2 }}>{children}</Box>}
    </div>
  );
}

const listItemVariants = {
  hidden: { opacity: 0, y: 8 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.03,
      type: 'spring',
      stiffness: 300,
      damping: 22,
    },
  }),
};

const containerStagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.03 } },
};

// Skeleton Components
const ProjectDetailSkeleton = () => (
  <Box sx={{ p: 3 }}>
    <Box sx={{ display: 'flex', gap: 3, mb: 3 }}>
      {/* Image Skeleton */}
      <Box sx={{ flex: 1 }}>
        <Skeleton variant="rounded" width="100%" height={300} sx={{ mb: 2 }} />
        <Skeleton variant="text" width="60%" height={40} />
        <Skeleton variant="text" width="40%" height={30} />
        <Skeleton variant="text" width="80%" height={20} sx={{ mt: 2 }} />
        <Skeleton variant="text" width="90%" height={20} />
        <Skeleton variant="text" width="85%" height={20} />
      </Box>

      {/* Sidebar Skeleton */}
      <Box sx={{ width: 300 }}>
        <Skeleton variant="rounded" width="100%" height={120} sx={{ mb: 2 }} />
        <Skeleton variant="rounded" width="100%" height={80} sx={{ mb: 1 }} />
        <Skeleton variant="rounded" width="100%" height={80} sx={{ mb: 1 }} />
        <Skeleton variant="rounded" width="100%" height={80} sx={{ mb: 1 }} />
        <Skeleton variant="rounded" width="100%" height={80} />
      </Box>
    </Box>

    {/* Tabs Skeleton */}
    <Skeleton variant="rounded" width="100%" height={50} sx={{ mb: 2 }} />
    <Skeleton variant="rounded" width="100%" height={200} />
  </Box>
);

const CommentSkeleton = () => (
  <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
    <Skeleton variant="circular" width={40} height={40} />
    <Box sx={{ flex: 1 }}>
      <Skeleton variant="text" width="40%" height={20} sx={{ mb: 1 }} />
      <Skeleton variant="text" width="90%" height={60} />
    </Box>
  </Box>
);

const TeamMemberSkeleton = () => (
  <Box sx={{ display: 'flex', gap: 2, mb: 2, alignItems: 'center' }}>
    <Skeleton variant="circular" width={40} height={40} />
    <Box sx={{ flex: 1 }}>
      <Skeleton variant="text" width="60%" height={20} />
      <Skeleton variant="text" width="40%" height={16} />
    </Box>
  </Box>
);

const UpdateSkeleton = () => (
  <Box sx={{ mb: 3 }}>
    <Skeleton variant="text" width="70%" height={24} sx={{ mb: 1 }} />
    <Skeleton variant="text" width="90%" height={60} sx={{ mb: 1 }} />
    <Skeleton variant="text" width="30%" height={16} />
  </Box>
);

const ProjectDetailModal: React.FC<ProjectDetailModalProps> = ({
  project,
  open,
  comments,
  loading = false,
  loadingComments = false,
  loadingTeamMembers = false,
  currentUserId,
  onClose,
  onSupport,
  onFollow,
  onCollaborate,
  onLoadComments,
  onLoadTeamMembers,
  onLoadUpdates,
  onCreateComment,
  onCreateTeamMember,
  onRemoveTeamMember,
  onRefresh,
  onDelete,
}) => {
  const { teamMembers, updates, actionLoading } = useShowcase();
  const theme = useTheme();
  const [updateModalOpen, setUpdateModalOpen] = useState(false);
  const [snackOpen, setSnackOpen] = useState(false);
  const [snackMsg, setSnackMsg] = useState('');
  const [snackSeverity, setSnackSeverity] = useState<
    'success' | 'error' | 'info' | 'warning'
  >('success');
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [isBookmarked, setIsBookmarked] = useState(false);

  // Fix scroll jumping by maintaining tab content height
  const tabContentRef = useRef<HTMLDivElement>(null);

  const statusConfig = useMemo(
    () => ({
      [status.IDEA]: {
        label: 'Concept',
        gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        icon: <RocketLaunch sx={{ fontSize: 16 }} />,
        color: 'primary',
      },
      [status.IN_PROGRESS]: {
        label: 'In Development',
        gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
        icon: <Build sx={{ fontSize: 16 }} />,
        color: 'secondary',
      },
      [status.COMPLETED]: {
        label: 'Launched',
        gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
        icon: <CheckCircle sx={{ fontSize: 16 }} />,
        color: 'success',
      },
    }),
    []
  );

  const handleSupportClick = async () => {
    try {
      await onSupport(isSupported);
      setSnackMsg(isSupported ? 'Removed support' : 'Supported project');
      setSnackSeverity('success');
      setSnackOpen(true);
    } catch (err) {
      console.error(err);
      setSnackMsg('Support action failed');
      setSnackSeverity('error');
      setSnackOpen(true);
    }
  };

  const handleFollowClick = async () => {
    try {
      await onFollow(isFollowing);
      setSnackMsg(isFollowing ? 'Unfollowed' : 'Following project');
      setSnackSeverity('success');
      setSnackOpen(true);
    } catch (err) {
      console.error(err);
      setSnackMsg('Follow action failed');
      setSnackSeverity('error');
      setSnackOpen(true);
    }
  };

  const handleRefreshClick = async () => {
    try {
      await onRefresh();
      setSnackMsg('Refreshed');
      setSnackSeverity('success');
      setSnackOpen(true);
    } catch (err) {
      console.error(err);
      setSnackMsg('Refresh failed');
      setSnackSeverity('error');
      setSnackOpen(true);
    }
  };

  const handleDeleteConfirmed = async () => {
    setDeleting(true);
    try {
      await onDelete();
      setSnackMsg('Project deleted');
      setSnackSeverity('success');
      setSnackOpen(true);
      setConfirmDeleteOpen(false);
    } catch (err) {
      console.error(err);
      setSnackMsg('Delete failed');
      setSnackSeverity('error');
      setSnackOpen(true);
    } finally {
      setDeleting(false);
    }
  };

  // Team member management
  const [userSearch, setUserSearch] = useState('');
  const [userOptions, setUserOptions] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [newMemberRole, setNewMemberRole] = useState<'MEMBER' | 'OWNER'>(
    'MEMBER'
  );
  const [isAddingMember, setIsAddingMember] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const submitDebounce = useRef<number | null>(null);

  const commentData: ProjectComment[] = comments?.data ?? [];
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);

  // Fix scroll jumping on tab change
  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);

    // Load data for the tab if needed
    if (newValue === 2 && commentData.length === 0 && !loadingComments) {
      onLoadComments(1, false);
    }
    if (newValue === 1 && (teamMembers?.[project.id]?.length ?? 0) === 0) {
      onLoadTeamMembers();
    }
    if (newValue === 3 && (updates?.[project.id]?.length ?? 0) === 0) {
      onLoadUpdates();
    }

    // Reset scroll position to top of tab content
    setTimeout(() => {
      if (tabContentRef.current) {
        tabContentRef.current.scrollTop = 0;
      }
    }, 0);
  };

  useEffect(() => {
    if (open) {
      const t = setTimeout(() => closeButtonRef.current?.focus(), 80);
      return () => clearTimeout(t);
    }
  }, [open]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [open, onClose]);

  const isSupported = !!project.supporters?.some(
    (s) => s.userId === currentUserId
  );
  const isFollowing = !!project.followers?.some(
    (f) => f.userId === currentUserId
  );
  const isOwner = !!(currentUserId && project.owner?.id === currentUserId);

  // Debounced user search
  useEffect(() => {
    let t: number | null = null;
    if (!userSearch || userSearch.trim().length < 2) {
      setUserOptions([]);
      return;
    }
    t = window.setTimeout(async () => {
      try {
        const resp = await apiService.users.search(userSearch.trim());
        const data = resp?.data ?? [];
        setUserOptions(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error('Failed to search users', err);
        setUserOptions([]);
      }
    }, 350);

    return () => {
      if (t) window.clearTimeout(t);
    };
  }, [userSearch]);

  const handleAddMember = async () => {
    if (!selectedUser || !onCreateTeamMember) return;
    if (
      (teamMembers?.[project.id] ?? []).some(
        (m) => m.user?.id === selectedUser.id
      )
    ) {
      console.warn('User already a team member');
      return;
    }
    setIsAddingMember(true);
    try {
      const payload: ProjectTeam = {
        id: '',
        role: newMemberRole,
        createdAt: new Date(),
        user: {
          id: selectedUser.id,
          name: selectedUser.name || selectedUser.email || 'Unknown',
          role: selectedUser.role,
          profile: { avatarUrl: selectedUser.profile?.avatarUrl || '' },
        },
      };
      await onCreateTeamMember(payload);
      setSelectedUser(null);
      setUserSearch('');
      setUserOptions([]);
    } catch (err) {
      console.error('Failed to add team member', err);
    } finally {
      setIsAddingMember(false);
    }
  };

  const handleSubmitComment = async () => {
    if (!commentText.trim() || isSubmittingComment) return;

    if (submitDebounce.current) {
      window.clearTimeout(submitDebounce.current);
    }
    submitDebounce.current = window.setTimeout(async () => {
      setIsSubmittingComment(true);
      try {
        await onCreateComment(commentText.trim());
        setCommentText('');
        onLoadComments(1, true);
      } catch (err) {
        console.error('Failed to submit comment', err);
      } finally {
        setIsSubmittingComment(false);
      }
    }, 300);
  };

  useEffect(() => {
    if (!open) {
      setCommentText('');
      setIsSubmittingComment(false);
    }
  }, [open]);

  // Use original image handling - like user ID card style
  const imageProps = {
    src: project.imageUrl || '/default-project.png',
    alt: project.title || 'Project image',
    loading: 'lazy' as const,
    style: {
      width: '100%',
      maxHeight: 300,
      objectFit: 'cover' as React.CSSProperties['objectFit'],
      display: 'block',
      borderRadius: '12px',
    } as React.CSSProperties,
  };

  const listContainerSx = {
    maxHeight: 340,
    overflowY: 'auto' as const,
    pr: 1,
  };

  // Professional Metric Card Component
  interface MetricCardProps {
    icon: React.ReactElement;
    value: React.ReactNode;
    label: string;
    color?: 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning';
  }

  const MetricCard: React.FC<MetricCardProps> = ({
    icon,
    value,
    label,
    color = 'primary',
  }) => (
    <Card
      variant="outlined"
      sx={{
        textAlign: 'center',
        p: 2,
        border: `1px solid ${alpha(theme.palette[color].main, 0.1)}`,
        background: `linear-gradient(135deg, ${alpha(theme.palette[color].main, 0.05)} 0%, ${alpha(theme.palette[color].main, 0.02)} 100%)`,
        transition: 'all 0.3s ease',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: `0 8px 24px ${alpha(theme.palette[color].main, 0.15)}`,
        },
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          mb: 1,
        }}
      >
        {React.cloneElement(icon, {
          sx: {
            fontSize: 24,
            color: `${color}.main`,
            opacity: 0.8,
          },
        })}
      </Box>
      <Typography variant="h4" fontWeight="bold" color={`${color}.main`}>
        {value}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
        {label}
      </Typography>
    </Card>
  );

  if (loading) {
    return (
      <Dialog
        open={open}
        onClose={onClose}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            maxHeight: '95vh',
            overflow: 'hidden',
          },
        }}
      >
        <ProjectDetailSkeleton />
      </Dialog>
    );
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      aria-labelledby="project-detail-title"
      aria-describedby="project-detail-description"
      role="dialog"
      PaperProps={{
        sx: {
          borderRadius: 3,
          maxHeight: '95vh',
          overflow: 'hidden',
        },
      }}
    >
      {/* Header with Close Button */}
      <DialogTitle
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          pb: 2,
          borderBottom: `1px solid ${theme.palette.divider}`,
        }}
      >
        <Typography variant="h6" component="h2">
          Project Details
        </Typography>
        <IconButton
          onClick={onClose}
          aria-label="Close project details"
          ref={closeButtonRef}
        >
          <Close />
        </IconButton>
      </DialogTitle>

      <DialogContent
        dividers
        sx={{
          overflowY: 'auto',
          p: 3,
        }}
      >
        {/* Main Content Grid - Image on top like user ID card */}
        <Grid container spacing={3}>
          {/* Left Column - Image and Basic Info */}
          <Grid item xs={12} sm={8}>
            {/* Project Image - Top like user ID card */}
            <Card sx={{ mb: 3, borderRadius: 3 }}>
              <Box sx={{ borderRadius: '12px 12px 0 0', overflow: 'hidden' }}>
                {project.imageUrl ? (
                  <img {...imageProps} alt={project.title} />
                ) : (
                  <Box
                    sx={{
                      width: '100%',
                      height: 300,
                      bgcolor: 'grey.100',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: '12px 12px 0 0',
                    }}
                  >
                    <Typography variant="h6" color="text.secondary">
                      No Project Image
                    </Typography>
                  </Box>
                )}
              </Box>

              <CardContent>
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    mb: 2,
                  }}
                >
                  <Box>
                    <Typography
                      variant="h4"
                      component="h1"
                      fontWeight="bold"
                      gutterBottom
                    >
                      {project.title}
                    </Typography>
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 2,
                        flexWrap: 'wrap',
                      }}
                    >
                      <Chip
                        icon={statusConfig[project.status]?.icon}
                        label={statusConfig[project.status]?.label}
                        size="small"
                        sx={{
                          background: statusConfig[project.status]?.gradient,
                          color: 'white',
                          fontWeight: 600,
                        }}
                      />
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          color: 'text.secondary',
                        }}
                      >
                        <CalendarToday sx={{ fontSize: 16, mr: 0.5 }} />
                        <Typography variant="body2">
                          {project.createdAt &&
                          !isNaN(new Date(project.createdAt).getTime())
                            ? format(new Date(project.createdAt), 'MMM d, yyyy')
                            : 'Unknown date'}
                        </Typography>
                      </Box>
                    </Box>
                  </Box>

                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Tooltip title="Bookmark">
                      <IconButton
                        onClick={() => setIsBookmarked(!isBookmarked)}
                      >
                        {isBookmarked ? (
                          <Bookmark color="primary" />
                        ) : (
                          <BookmarkBorder />
                        )}
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Share">
                      <IconButton>
                        <Share />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </Box>

                {/* Description */}
                <Typography
                  variant="body1"
                  color="text.primary"
                  sx={{
                    lineHeight: 1.7,
                    mb: 3,
                  }}
                >
                  {project.description ||
                    'No description provided for this project.'}
                </Typography>

                {/* External Links */}
                {(project.githubUrl || project.websiteUrl) && (
                  <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                    {project.githubUrl && (
                      <Button
                        variant="outlined"
                        startIcon={<GitHub />}
                        onClick={() => window.open(project.githubUrl, '_blank')}
                      >
                        GitHub
                      </Button>
                    )}
                    {project.websiteUrl && (
                      <Button
                        variant="outlined"
                        startIcon={<Language />}
                        onClick={() =>
                          window.open(project.websiteUrl, '_blank')
                        }
                      >
                        Website
                      </Button>
                    )}
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Right Column - Owner Info and Metrics */}
          <Grid item xs={12} sm={4}>
            <Box sx={{ position: 'sticky' }}>
              {/* Owner Card */}
              <Card sx={{ mb: 3 }}>
                <CardContent>
                  <Typography
                    variant="h6"
                    gutterBottom
                    sx={{ fontWeight: 600 }}
                  >
                    Project Owner
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Avatar
                      src={project.owner?.profile?.avatarUrl}
                      sx={{
                        width: 56,
                        height: 56,
                      }}
                    >
                      <Person />
                    </Avatar>
                    <Box>
                      <Typography variant="subtitle1" fontWeight={700}>
                        {project.owner?.name || 'Owner'}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {project.owner?.role || 'Project Lead'}
                      </Typography>
                      <Typography
                        variant="caption"
                        color="primary"
                        sx={{ mt: 0.5 }}
                      >
                        {project.createdAt &&
                        !isNaN(new Date(project.createdAt).getTime())
                          ? `Created ${formatDistanceToNow(new Date(project.createdAt))} ago`
                          : ''}
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>

              {/* Metrics Grid */}
              <Typography
                variant="h6"
                gutterBottom
                sx={{ fontWeight: 600, mb: 2 }}
              >
                Project Metrics
              </Typography>
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={6}>
                  <MetricCard
                    icon={<Favorite />}
                    value={project._count?.supporters ?? 0}
                    label="Supporters"
                    color="error"
                  />
                </Grid>
                <Grid item xs={6}>
                  <MetricCard
                    icon={<Visibility />}
                    value={project._count?.followers ?? 0}
                    label="Followers"
                    color="info"
                  />
                </Grid>
                <Grid item xs={6}>
                  <MetricCard
                    icon={<CommentIcon />}
                    value={project._count?.comments ?? 0}
                    label="Comments"
                    color="warning"
                  />
                </Grid>
                <Grid item xs={6}>
                  <MetricCard
                    icon={<Group />}
                    value={project._count?.teamMembers ?? 0}
                    label="Team"
                    color="success"
                  />
                </Grid>
              </Grid>

              {/* Quick Actions */}
              {!isOwner && currentUserId && (
                <Card sx={{ mb: 3 }}>
                  <CardContent>
                    <Typography
                      variant="h6"
                      gutterBottom
                      sx={{ fontWeight: 600 }}
                    >
                      Actions
                    </Typography>
                    <Box
                      sx={{ display: 'flex', gap: 1, flexDirection: 'column' }}
                    >
                      <Button
                        variant={isSupported ? 'contained' : 'outlined'}
                        startIcon={
                          isSupported ? <Favorite /> : <FavoriteBorder />
                        }
                        onClick={handleSupportClick}
                        color="error"
                        fullWidth
                      >
                        {isSupported ? 'Supported' : 'Support'}
                      </Button>
                      <Button
                        variant={isFollowing ? 'contained' : 'outlined'}
                        startIcon={
                          isFollowing ? <VisibilityOff /> : <Visibility />
                        }
                        onClick={handleFollowClick}
                        color="primary"
                        fullWidth
                      >
                        {isFollowing ? 'Following' : 'Follow'}
                      </Button>
                      <Button
                        variant="contained"
                        startIcon={<Handshake />}
                        onClick={onCollaborate}
                        fullWidth
                        sx={{
                          background:
                            'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        }}
                      >
                        Collaborate
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              )}
            </Box>
          </Grid>
          {/* Seeking Collaborators Banner */}
          {project.seeking && project.seeking.length > 0 && (
            <Card
              sx={{
                m: 3,
                border: `1px solid ${theme.palette.info.main}`,
                background: `linear-gradient(135deg, ${alpha(theme.palette.info.main, 0.05)} 0%, ${alpha(theme.palette.info.main, 0.02)} 100%)`,
              }}
            >
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Avatar sx={{ bgcolor: 'info.main' }}>
                    <Handshake />
                  </Avatar>
                  <Box sx={{ flex: 1 }}>
                    <Typography
                      variant="h6"
                      gutterBottom
                      sx={{ fontWeight: 600 }}
                    >
                      🤝 Seeking Collaborators
                    </Typography>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ mb: 2 }}
                    >
                      This project is actively looking for team members with the
                      following skills:
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                      {(project.seeking ?? []).map((skill, idx) => (
                        <Chip
                          key={skill + idx}
                          label={skill}
                          size="small"
                          clickable
                          variant="filled"
                          color="info"
                        />
                      ))}
                    </Box>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          )}
        </Grid>

        {/* Tabs Section - Fixed scroll jumping */}
        <Card sx={{ mt: 3 }}>
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs
              value={activeTab}
              onChange={handleTabChange}
              variant="scrollable"
              scrollButtons="auto"
            >
              <Tab
                icon={<Label />}
                label={`Tags & Skills`}
                id="project-detail-tab-0"
                aria-controls="project-detail-tabpanel-0"
              />
              <Tab
                icon={<Group />}
                label={`Team (${project._count?.teamMembers ?? 0})`}
                id="project-detail-tab-1"
                aria-controls="project-detail-tabpanel-1"
              />
              <Tab
                icon={<CommentIcon />}
                label={`Discussion (${project._count?.comments ?? 0})`}
                id="project-detail-tab-2"
                aria-controls="project-detail-tabpanel-2"
              />
              <Tab
                icon={<Update />}
                label={`Updates (${project._count?.updates ?? 0})`}
                id="project-detail-tab-3"
                aria-controls="project-detail-tabpanel-3"
              />
            </Tabs>
          </Box>

          <CardContent>
            {/* Tab content with fixed scroll container */}
            <Box ref={tabContentRef} sx={{ maxHeight: 400, overflowY: 'auto' }}>
              {/* Tab 0: Tags & Skills */}
              <TabPanel value={activeTab} index={0}>
                <motion.div
                  initial="hidden"
                  animate="visible"
                  variants={containerStagger}
                >
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="h6" gutterBottom>
                      Project Tags
                    </Typography>
                    <Box
                      sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 3 }}
                    >
                      {(project.tags ?? []).length ? (
                        (project.tags ?? []).map((tag) => (
                          <Chip
                            key={tag}
                            label={tag}
                            variant="filled"
                            color="secondary"
                          />
                        ))
                      ) : (
                        <Typography variant="body2" color="text.secondary">
                          No tags.
                        </Typography>
                      )}
                    </Box>
                    <Typography variant="h6" gutterBottom>
                      Skills Used
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                      {(project.skills ?? []).length ? (
                        (project.skills ?? []).map((skill) => (
                          <Chip
                            key={skill}
                            label={skill}
                            variant="outlined"
                            color="primary"
                          />
                        ))
                      ) : (
                        <Typography variant="body2" color="text.secondary">
                          No skills listed.
                        </Typography>
                      )}
                    </Box>
                  </Box>
                </motion.div>
              </TabPanel>

              {/* Tab 1: Team */}
              <TabPanel value={activeTab} index={1}>
                {loadingTeamMembers ? (
                  <Box>
                    {[...Array(3)].map((_, i) => (
                      <TeamMemberSkeleton key={i} />
                    ))}
                  </Box>
                ) : (
                  <motion.div
                    initial="hidden"
                    animate="visible"
                    variants={containerStagger}
                  >
                    {/* Original team management functionality */}
                    {isOwner && (
                      <Box
                        sx={{
                          mb: 2,
                          display: 'flex',
                          gap: 1,
                          alignItems: 'center',
                        }}
                      >
                        <TextField
                          fullWidth
                          size="small"
                          placeholder="Search users by name or email..."
                          value={userSearch}
                          onChange={(e) => setUserSearch(e.target.value)}
                          InputProps={{
                            endAdornment: isAddingMember ? (
                              <CircularProgress size={20} />
                            ) : null,
                          }}
                        />
                        <TextField
                          size="small"
                          select
                          value={newMemberRole}
                          onChange={(e) =>
                            setNewMemberRole(
                              e.target.value as 'MEMBER' | 'OWNER'
                            )
                          }
                          SelectProps={{ native: true }}
                          sx={{ width: 140 }}
                        >
                          <option value="MEMBER">Member</option>
                          <option value="OWNER">Owner</option>
                        </TextField>
                        <Button
                          variant="contained"
                          onClick={handleAddMember}
                          disabled={!selectedUser || isAddingMember}
                          startIcon={<AddCircle />}
                        >
                          Add
                        </Button>
                      </Box>
                    )}
                    {userSearch && userOptions.length > 0 && (
                      <Box sx={{ mb: 2 }}>
                        <List dense>
                          {userOptions.map((u) => (
                            <ListItem
                              key={u.id}
                              button
                              onClick={() => {
                                setSelectedUser(u);
                                setUserSearch(u.name || u.email || '');
                                setUserOptions([]);
                              }}
                            >
                              <ListItemAvatar>
                                <Avatar src={u.profile?.avatarUrl ?? undefined}>
                                  <Person />
                                </Avatar>
                              </ListItemAvatar>
                              <ListItemText
                                primary={u.name || u.email}
                                secondary={u.role}
                              />
                            </ListItem>
                          ))}
                        </List>
                      </Box>
                    )}
                    <List>
                      <motion.div
                        variants={containerStagger}
                        initial="hidden"
                        animate="visible"
                      >
                        {(teamMembers?.[project.id] ?? []).length ? (
                          (teamMembers?.[project.id] ?? []).map(
                            (member: ProjectTeam, i: number) => (
                              <motion.div
                                key={member.id}
                                variants={listItemVariants}
                                custom={i + 1}
                              >
                                <ListItem
                                  secondaryAction={
                                    isOwner ? (
                                      <IconButton
                                        edge="end"
                                        aria-label="Remove team member"
                                        onClick={() =>
                                          onRemoveTeamMember(member.id)
                                        }
                                      >
                                        <Delete />
                                      </IconButton>
                                    ) : undefined
                                  }
                                >
                                  <ListItemAvatar>
                                    <Avatar
                                      src={
                                        member.user?.profile?.avatarUrl ??
                                        undefined
                                      }
                                    >
                                      <Person />
                                    </Avatar>
                                  </ListItemAvatar>
                                  <ListItemText
                                    primary={
                                      member.user?.name || 'Unnamed Member'
                                    }
                                    secondary={member.role || 'Team Member'}
                                  />
                                </ListItem>
                              </motion.div>
                            )
                          )
                        ) : (
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{ py: 2, textAlign: 'center' }}
                          >
                            No team members yet
                          </Typography>
                        )}
                      </motion.div>
                    </List>
                  </motion.div>
                )}
              </TabPanel>

              {/* Tab 2: Comments */}
              <TabPanel value={activeTab} index={2}>
                {loadingComments ? (
                  <Box>
                    {[...Array(4)].map((_, i) => (
                      <CommentSkeleton key={i} />
                    ))}
                  </Box>
                ) : (
                  <>
                    {!isOwner && currentUserId && (
                      <Box sx={{ mb: 2 }}>
                        <TextField
                          fullWidth
                          multiline
                          rows={3}
                          placeholder="Add a comment..."
                          value={commentText}
                          onChange={(e) => setCommentText(e.target.value)}
                          variant="outlined"
                          size="small"
                          disabled={isSubmittingComment}
                          InputProps={{
                            endAdornment: (
                              <IconButton
                                edge="end"
                                onClick={handleSubmitComment}
                                disabled={
                                  !commentText.trim() || isSubmittingComment
                                }
                                color="primary"
                              >
                                {isSubmittingComment ? (
                                  <CircularProgress size={20} />
                                ) : (
                                  <Send />
                                )}
                              </IconButton>
                            ),
                          }}
                        />
                      </Box>
                    )}
                    <Box sx={listContainerSx}>
                      <AnimatePresence initial={false}>
                        <motion.div
                          variants={containerStagger}
                          initial="hidden"
                          animate="visible"
                        >
                          {commentData.length ? (
                            commentData.map(
                              (comment: ProjectComment, idx: number) => (
                                <motion.div
                                  key={comment.id ?? idx}
                                  variants={listItemVariants}
                                  custom={idx}
                                >
                                  <ListItem alignItems="flex-start">
                                    <ListItemAvatar>
                                      <Tooltip
                                        title={`View ${comment.user?.name}'s profile`}
                                      >
                                        <Avatar
                                          src={comment.user?.profile?.avatarUrl}
                                          sx={{ cursor: 'pointer' }}
                                          onClick={() =>
                                            window.open(
                                              `/profile/${comment.user?.id}`,
                                              '_blank'
                                            )
                                          }
                                        >
                                          <Person />
                                        </Avatar>
                                      </Tooltip>
                                    </ListItemAvatar>
                                    <ListItemText
                                      primary={
                                        <Box
                                          sx={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'baseline',
                                          }}
                                        >
                                          <ProfileNameLink
                                            user={
                                              comment.user ?? {
                                                id: 'unknown',
                                                name: 'Unknown User',
                                                role: undefined,
                                                profile: { avatarUrl: '' },
                                              }
                                            }
                                            avatarSize={20}
                                          />
                                          <Typography
                                            variant="caption"
                                            color="text.secondary"
                                          >
                                            {format(
                                              new Date(comment.createdAt),
                                              'MMM d, yyyy • h:mm a'
                                            )}
                                          </Typography>
                                        </Box>
                                      }
                                      secondary={
                                        <Typography
                                          variant="body1"
                                          sx={{ mt: 1 }}
                                        >
                                          {comment.comment}
                                        </Typography>
                                      }
                                    />
                                  </ListItem>
                                  {idx < commentData.length - 1 && (
                                    <Divider variant="inset" />
                                  )}
                                </motion.div>
                              )
                            )
                          ) : (
                            <Typography
                              variant="body2"
                              color="text.secondary"
                              sx={{ py: 2, textAlign: 'center' }}
                            >
                              No comments yet — be the first to comment.
                            </Typography>
                          )}
                        </motion.div>
                      </AnimatePresence>
                    </Box>
                  </>
                )}
              </TabPanel>

              {/* Tab 3: Updates */}
              <TabPanel value={activeTab} index={3}>
                {actionLoading?.updates ? (
                  <Box>
                    {[...Array(3)].map((_, i) => (
                      <UpdateSkeleton key={i} />
                    ))}
                  </Box>
                ) : (
                  <Box sx={listContainerSx}>
                    <List>
                      {(updates?.[project.id] ?? []).length ? (
                        (updates?.[project.id] ?? []).map(
                          (update: ProjectUpdateInterface, i: number) => (
                            <motion.div
                              key={update.id}
                              initial="hidden"
                              animate="visible"
                              variants={listItemVariants}
                              custom={i}
                            >
                              <ListItem alignItems="flex-start">
                                <ListItemAvatar>
                                  <Avatar
                                    sx={{ bgcolor: theme.palette.primary.main }}
                                  >
                                    <Update />
                                  </Avatar>
                                </ListItemAvatar>
                                <ListItemText
                                  primary={
                                    <Typography variant="h6">
                                      {update.title}
                                    </Typography>
                                  }
                                  secondary={
                                    <>
                                      <Typography
                                        variant="body2"
                                        color="text.primary"
                                        paragraph
                                      >
                                        {update.content}
                                      </Typography>
                                      <Typography
                                        variant="caption"
                                        color="text.secondary"
                                      >
                                        {update.createdAt &&
                                        !isNaN(
                                          new Date(update.createdAt).getTime()
                                        )
                                          ? format(
                                              new Date(update.createdAt),
                                              'MMM d, yyyy • h:mm a'
                                            )
                                          : 'Unknown date'}
                                      </Typography>
                                    </>
                                  }
                                />
                              </ListItem>
                              <Divider variant="inset" component="li" />
                            </motion.div>
                          )
                        )
                      ) : (
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{ py: 2, textAlign: 'center' }}
                        >
                          No updates yet
                        </Typography>
                      )}
                    </List>
                  </Box>
                )}
              </TabPanel>
            </Box>
          </CardContent>
        </Card>
      </DialogContent>

      {/* Footer Actions */}
      <DialogActions
        sx={{
          justifyContent: 'space-between',
          p: 2,
          borderTop: `1px solid ${theme.palette.divider}`,
        }}
      >
        <Button
          onClick={handleRefreshClick}
          variant="outlined"
          startIcon={<TrendingUp />}
        >
          Refresh
        </Button>
        <Box sx={{ display: 'flex', gap: 1 }}>
          {isOwner && (
            <>
              <Button
                onClick={() => setUpdateModalOpen(true)}
                variant="contained"
                startIcon={<Update />}
              >
                Update Project
              </Button>
              <Button
                onClick={() => setConfirmDeleteOpen(true)}
                variant="outlined"
                color="error"
                startIcon={<Delete />}
              >
                Delete
              </Button>
            </>
          )}
          <Button onClick={onClose} variant="outlined">
            Close
          </Button>
        </Box>
      </DialogActions>

      {/* Modals and Snackbar */}
      {updateModalOpen && (
        <React.Suspense fallback={<div>Loading editor...</div>}>
          <UpdateSection
            open={updateModalOpen}
            project={project}
            onClose={() => setUpdateModalOpen(false)}
            onUpdated={() => {
              onRefresh();
              setUpdateModalOpen(false);
              setSnackMsg('Project updated successfully');
              setSnackSeverity('success');
              setSnackOpen(true);
            }}
          />
        </React.Suspense>
      )}

      <Dialog
        open={confirmDeleteOpen}
        onClose={() => setConfirmDeleteOpen(false)}
      >
        <DialogTitle>Delete Project?</DialogTitle>
        <DialogContent>
          <Typography>
            This action cannot be undone. All project data will be permanently
            deleted.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setConfirmDeleteOpen(false)}
            disabled={deleting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleDeleteConfirmed}
            color="error"
            variant="contained"
            disabled={deleting}
          >
            {deleting ? 'Deleting...' : 'Delete Project'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackOpen}
        autoHideDuration={4000}
        onClose={() => setSnackOpen(false)}
      >
        <Alert onClose={() => setSnackOpen(false)} severity={snackSeverity}>
          {snackMsg}
        </Alert>
      </Snackbar>
    </Dialog>
  );
};

export default ProjectDetailModal;
