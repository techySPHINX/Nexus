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
  Stack,
  TextField,
  Skeleton,
  Card,
  CardContent,
  Tooltip,
  Grid,
  useTheme,
  Snackbar,
  Alert,
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
  Code,
  Label,
  Send,
  Build,
  CheckCircle,
  RocketLaunch,
} from '@mui/icons-material';
import { AddCircle, Delete } from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
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

  // action handlers show snackbar and call parent handlers
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
  // team member search / create state
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

  // normalize comments prop into an array for rendering and length checks
  const commentData: ProjectComment[] = comments?.data ?? [];

  // Accessibility: focus first action when open
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (open) {
      // delay focus to allow dialog to mount
      const t = setTimeout(() => closeButtonRef.current?.focus(), 80);
      return () => clearTimeout(t);
    }
  }, [open]);

  // handle Esc close (Dialog already handles Esc, this is defensive)
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
  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
    // lazy load comments when user switches to comments tab
    if (newValue === 2 && commentData.length === 0 && !loadingComments) {
      onLoadComments(1, false);
    }
    if (newValue === 1 && (teamMembers?.[project.id]?.length ?? 0) === 0) {
      onLoadTeamMembers();
    }
    if (newValue === 3 && (updates?.[project.id]?.length ?? 0) === 0) {
      onLoadUpdates();
    }
  };

  // debounce search for users
  useEffect(() => {
    let t: number | null = null;
    if (!userSearch || userSearch.trim().length < 2) {
      setUserOptions([]);
      return;
    }
    t = window.setTimeout(async () => {
      try {
        const resp = await apiService.users.search(userSearch.trim());
        // apiService returns an Axios response; response data likely an array of users
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
    // prevent duplicates
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
      // construct a ProjectTeam shaped payload (backend only needs userId and role)
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
      // clear inputs
      setSelectedUser(null);
      setUserSearch('');
      setUserOptions([]);
    } catch (err) {
      console.error('Failed to add team member', err);
    } finally {
      setIsAddingMember(false);
    }
  };

  // Debounced comment submit: prevents rapid double-submits
  const handleSubmitComment = async () => {
    if (!commentText.trim() || isSubmittingComment) return;

    // Simple debounce: ignore if fired within 500ms
    if (submitDebounce.current) {
      window.clearTimeout(submitDebounce.current);
    }
    submitDebounce.current = window.setTimeout(async () => {
      setIsSubmittingComment(true);
      try {
        await onCreateComment(commentText.trim());
        setCommentText('');
        // refresh comments first page to ensure latest (optionally you could just prepend)
        onLoadComments(1, true);
      } catch (err) {
        console.error('Failed to submit comment', err);
      } finally {
        setIsSubmittingComment(false);
      }
    }, 300);
  };

  // When modal closes, clear local compose state
  useEffect(() => {
    if (!open) {
      setCommentText('');
      setIsSubmittingComment(false);
    }
  }, [open]);

  // helper: lazy image fallback
  const imageProps = {
    src: project.imageUrl || '/default-project.png',
    alt: project.title || 'Project image',
    loading: 'lazy' as const,
    style: {
      width: '100%',
      maxHeight: 300,
      objectFit: 'cover' as React.CSSProperties['objectFit'],
      display: 'block',
    } as React.CSSProperties,
  };

  // Scrollable list style
  const listContainerSx = {
    maxHeight: 340,
    overflowY: 'auto' as const,
    pr: 1,
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      aria-labelledby="project-detail-title"
      aria-describedby="project-detail-description"
      role="dialog"
      // PaperComponent={motion.div}
      PaperProps={{
        initial: { opacity: 0, scale: 0.98, y: -8 },
        animate: { opacity: 1, scale: 1, y: 0 },
        exit: { opacity: 0, scale: 0.98, y: -8 },
        transition: { type: 'spring', stiffness: 300, damping: 30 },
        sx: { borderRadius: 3, maxHeight: '90vh', overflow: 'hidden' },
      }}
    >
      {loading ? (
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: 420,
          }}
        >
          <CircularProgress
            size={60}
            thickness={4}
            aria-label="Loading project"
          />
        </Box>
      ) : (
        <>
          <DialogTitle
            id="project-detail-title"
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              pb: 1,
              bgcolor: 'background.default',
              borderBottom: 1,
              borderColor: 'divider',
            }}
          >
            <Box sx={{ flex: 1, pr: 2 }}>
              <Typography
                variant="h4"
                component="h2"
                sx={{
                  fontWeight: 800,
                  mb: 1,
                  color: 'primary.main',
                  letterSpacing: 0.6,
                }}
              >
                {project.title}
              </Typography>

              <Box
                sx={{
                  display: 'flex',
                  gap: 1,
                  flexWrap: 'wrap',
                  alignItems: 'center',
                }}
              >
                <Chip
                  icon={
                    statusConfig[project.status]?.icon ?? (
                      <RocketLaunch sx={{ fontSize: 16 }} />
                    )
                  }
                  label={statusConfig[project.status]?.label ?? 'Unknown'}
                  size="small"
                  sx={{
                    // position: 'absolute',
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
                {project.websiteUrl && (
                  <Button
                    size="small"
                    startIcon={<Language />}
                    onClick={() => window.open(project.websiteUrl, '_blank')}
                  >
                    Website
                  </Button>
                )}
                {project.githubUrl && (
                  <Button
                    size="small"
                    startIcon={<GitHub />}
                    onClick={() => window.open(project.githubUrl, '_blank')}
                    aria-label="Open GitHub repository"
                  >
                    Repo
                  </Button>
                )}
              </Box>
            </Box>

            <IconButton
              onClick={onClose}
              size="large"
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
              bgcolor: 'background.paper',
              px: 4,
              py: 3,
            }}
          >
            <Grid container spacing={3}>
              {/* left: image + owner + stat chips */}
              <Grid item xs={12} md={5}>
                <Card elevation={2} sx={{ borderRadius: 3 }}>
                  <Box sx={{ borderRadius: 3, overflow: 'hidden' }}>
                    {/* lazy image + skeleton fallback */}
                    {project.imageUrl ? (
                      <img {...imageProps} alt={project.title} />
                    ) : (
                      <Box
                        sx={{
                          width: '100%',
                          height: 220,
                          bgcolor: 'grey.100',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Typography variant="subtitle1" color="text.secondary">
                          No preview
                        </Typography>
                      </Box>
                    )}
                  </Box>

                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <Avatar
                        src={project.owner?.profile?.avatarUrl}
                        sx={{ mr: 2, width: 48, height: 48 }}
                      >
                        <Person />
                      </Avatar>
                      <Box>
                        <Typography
                          variant="subtitle1"
                          fontWeight={700}
                          color="primary"
                        >
                          {project.owner?.name || 'Owner'}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Project Owner • {project.owner?.role || '—'}
                        </Typography>
                      </Box>
                    </Box>

                    <Divider sx={{ my: 2 }} />

                    <Stack
                      direction="row"
                      spacing={1}
                      justifyContent="center"
                      flexWrap="wrap"
                      sx={{ gap: 1 }}
                    >
                      <Tooltip title="Supporters">
                        <Chip
                          icon={<Favorite color="error" />}
                          label={project._count?.supporters ?? 0}
                          variant="outlined"
                        />
                      </Tooltip>
                      <Tooltip title="Followers">
                        <Chip
                          icon={<Visibility />}
                          label={project._count?.followers ?? 0}
                          variant="outlined"
                        />
                      </Tooltip>
                      <Tooltip title="Comments">
                        <Chip
                          icon={<CommentIcon />}
                          label={project._count?.comments ?? 0}
                          variant="outlined"
                        />
                      </Tooltip>
                      <Tooltip title="Team Members">
                        <Chip
                          icon={<Group />}
                          label={project._count?.teamMembers ?? 0}
                          variant="outlined"
                        />
                      </Tooltip>
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>

              {/* right: description and links */}
              <Grid item xs={12} md={7}>
                <Card
                  elevation={0}
                  sx={{ borderRadius: 3, bgcolor: 'background.default' }}
                >
                  <CardContent>
                    <Box sx={{ mb: 3 }}>
                      <Typography
                        variant="h6"
                        gutterBottom
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          fontWeight: 700,
                        }}
                      >
                        <Code sx={{ mr: 1 }} /> Description
                      </Typography>
                      <Typography
                        id="project-detail-description"
                        variant="body1"
                        color="text.primary"
                        paragraph
                      >
                        {project.description || 'No description provided.'}
                      </Typography>
                    </Box>

                    {(project.githubUrl || project.websiteUrl) && (
                      <Box sx={{ mb: 2, display: { xs: 'none', sm: 'block' } }}>
                        <Typography variant="h6" gutterBottom fontWeight={700}>
                          <Language sx={{ mr: 1 }} /> Links
                        </Typography>
                        <Stack direction="row" spacing={2}>
                          {project.githubUrl && (
                            <Button
                              variant="outlined"
                              startIcon={<GitHub />}
                              onClick={() =>
                                window.open(project.githubUrl, '_blank')
                              }
                              sx={{ borderRadius: 2 }}
                            >
                              GitHub Repository
                            </Button>
                          )}
                          {project.websiteUrl && (
                            <Button
                              variant="outlined"
                              startIcon={<Language />}
                              onClick={() =>
                                window.open(project.websiteUrl, '_blank')
                              }
                              sx={{ borderRadius: 2 }}
                            >
                              Live Website
                            </Button>
                          )}
                        </Stack>
                      </Box>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            {project.seeking && project.seeking.length > 0 && (
              <Box sx={{ mt: 2 }}>
                {/* Decorative styles + small keyframes for subtle motion */}
                <style>{`
                          @keyframes seekingPulse {
                            0% { box-shadow: 0 0 0 0 rgba(66,153,225,0.08); }
                            50% { box-shadow: 0 10px 30px rgba(66,153,225,0.06); transform: translateY(-2px); }
                            100% { box-shadow: 0 0 0 0 rgba(66,153,225,0.00); transform: translateY(0); }
                          }
                          @keyframes chipFloat {
                            0% { transform: translateY(0); }
                            50% { transform: translateY(-4px); }
                            100% { transform: translateY(0); }
                          }
                        `}</style>

                <Box
                  sx={{
                    display: 'flex',
                    gap: 2,
                    alignItems: 'center',
                    p: 2,
                    borderRadius: 2,
                    background:
                      'linear-gradient(90deg, rgba(14,165,233,0.06), rgba(99,102,241,0.04))',
                    border: '1px solid rgba(99,102,241,0.08)',
                  }}
                >
                  <Avatar
                    sx={{
                      bgcolor: 'info.main',
                      width: 56,
                      height: 56,
                      boxShadow: '0 6px 18px rgba(99,102,241,0.14)',
                      animation: 'seekingPulse 3s ease-in-out infinite',
                    }}
                  >
                    <Handshake sx={{ color: 'white' }} />
                  </Avatar>

                  <Box sx={{ flex: 1 }}>
                    <Typography
                      variant="h6"
                      gutterBottom
                      sx={{
                        fontWeight: 800,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                      }}
                    >
                      <Box component="span" aria-hidden>
                        🤝
                      </Box>
                      Looking for collaborators
                    </Typography>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ mb: 1 }}
                    >
                      This project is actively seeking help for the following
                      roles or skills — click a tag to learn more.
                    </Typography>

                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                      {(project.seeking ?? []).map((skill, idx) => (
                        <Chip
                          key={skill + idx}
                          label={skill}
                          size="small"
                          clickable
                          sx={{
                            background: 'rgba(255,255,255,0.02)',
                            color: 'text.primary',
                            border: '1px solid rgba(255,255,255,0.04)',
                            '&:hover': {
                              transform: 'translateY(-4px)',
                              boxShadow: '0 10px 24px rgba(99,102,241,0.12)',
                            },
                            animation:
                              idx % 2 === 0
                                ? 'chipFloat 3.2s ease-in-out infinite'
                                : undefined,
                          }}
                        />
                      ))}
                    </Box>
                  </Box>
                </Box>
              </Box>
            )}

            {/* TABS */}
            <Box sx={{ borderBottom: 1, borderColor: 'divider', mt: 4, mb: 2 }}>
              <Tabs
                value={activeTab}
                onChange={handleTabChange}
                variant="scrollable"
                scrollButtons="auto"
                aria-label="Project detail tabs"
              >
                <Tab
                  icon={<Label />}
                  label="Tags & Skills"
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
                  label={`Comments (${project._count?.comments ?? 0})`}
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

            {/* TAB PANELS */}
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

            <TabPanel value={activeTab} index={1}>
              <motion.div
                initial="hidden"
                animate="visible"
                variants={containerStagger}
              >
                {/* Owner-only: search & add team member */}
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
                        endAdornment: (
                          <Box
                            sx={{
                              display: 'flex',
                              gap: 1,
                              alignItems: 'center',
                            }}
                          >
                            {isAddingMember ? (
                              <CircularProgress size={20} />
                            ) : null}
                          </Box>
                        ),
                      }}
                      aria-label="Search users to add to team"
                    />

                    <TextField
                      size="small"
                      select
                      value={newMemberRole}
                      onChange={(e) =>
                        setNewMemberRole(e.target.value as 'MEMBER' | 'OWNER')
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
                {/* quick suggestions list (visible when typing) */}
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
                {loadingTeamMembers ? (
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      minHeight: 100,
                    }}
                  >
                    <CircularProgress
                      size={40}
                      thickness={4}
                      aria-label="Loading team members"
                    />
                  </Box>
                ) : (
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
                )}
              </motion.div>
            </TabPanel>

            <TabPanel value={activeTab} index={2}>
              {/* Comment composer */}
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
                    aria-label="Add a comment"
                    InputProps={{
                      endAdornment: (
                        <IconButton
                          edge="end"
                          onClick={handleSubmitComment}
                          disabled={!commentText.trim() || isSubmittingComment}
                          color="primary"
                          aria-label="Send comment"
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
              {/* top pagination removed — load more will be rendered at the bottom */}
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  mb: 2,
                  mt: 1,
                  gap: 2,
                  flexWrap: 'wrap',
                }}
              >
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    {(() => {
                      const total =
                        comments?.pagination?.total ?? commentData.length;
                      const page = comments?.pagination?.page ?? 1;
                      const perPage =
                        comments?.pagination?.pageSize ?? commentData.length;
                      const end = Math.min(page * perPage, total || 0);
                      if (!total) return 'No comments';
                      return `Showing 1-${end} of ${total} comment${total === 1 ? '' : 's'}`;
                    })()}
                  </Typography>
                </Box>
              </Box>
              {/* Comments list (scrollable) */}
              <Box sx={listContainerSx} aria-live="polite">
                {loadingComments ? (
                  <Stack spacing={2}>
                    {Array.from({ length: 4 }).map((_, i) => (
                      <Box key={i} sx={{ display: 'flex', gap: 2 }}>
                        <Skeleton variant="circular" width={40} height={40} />
                        <Box sx={{ flex: 1 }}>
                          <Skeleton variant="text" width="40%" height={20} />
                          <Skeleton variant="text" width="90%" height={40} />
                        </Box>
                      </Box>
                    ))}
                  </Stack>
                ) : (
                  <>
                    <AnimatePresence initial={false}>
                      <motion.div
                        style={{ padding: 0, margin: 0 }}
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
                                <ListItem
                                  alignItems="flex-start"
                                  sx={{ alignItems: 'flex-start' }}
                                >
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
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {/* Quick load-more for incremental UX */}
                      {comments?.pagination &&
                        (comments.pagination.page ?? 1) <
                          (comments.pagination.totalPages ?? 1) && (
                          <Button
                            size="large"
                            variant="outlined"
                            sx={{ mx: 'auto' }}
                            onClick={() =>
                              onLoadComments(
                                (comments!.pagination!.page ?? 1) + 1,
                                false
                              )
                            }
                            disabled={loadingComments}
                            aria-label="Load more comments"
                          >
                            {loadingComments ? 'Loading...' : 'Load more'}
                          </Button>
                        )}
                    </Box>
                  </>
                )}
              </Box>
            </TabPanel>

            <TabPanel value={activeTab} index={3}>
              <Box sx={listContainerSx}>
                {actionLoading?.updates ? (
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      minHeight: 160,
                    }}
                  >
                    <CircularProgress size={36} />
                  </Box>
                ) : (
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
                )}
              </Box>
            </TabPanel>
          </DialogContent>

          {/* Sticky action bar */}
          <DialogActions
            sx={{
              justifyContent: 'space-between',
              p: 2,
              position: 'sticky',
              bottom: 0,
              bgcolor: 'background.paper',
              borderTop: 1,
              borderColor: 'divider',
              zIndex: 40,
            }}
          >
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
              {!isOwner && currentUserId && (
                <>
                  <motion.div
                    whileHover={{ scale: 1.06 }}
                    whileTap={{ scale: 0.96 }}
                  >
                    <Tooltip title={isSupported ? 'Un-support' : 'Support'}>
                      <IconButton
                        aria-pressed={isSupported}
                        aria-label={
                          isSupported ? 'Un-support project' : 'Support project'
                        }
                        onClick={handleSupportClick}
                        color={isSupported ? 'error' : 'default'}
                        size="large"
                      >
                        {isSupported ? <Favorite /> : <FavoriteBorder />}
                      </IconButton>
                    </Tooltip>
                  </motion.div>

                  <motion.div
                    whileHover={{ scale: 1.06 }}
                    whileTap={{ scale: 0.96 }}
                  >
                    <Tooltip title={isFollowing ? 'Unfollow' : 'Follow'}>
                      <IconButton
                        aria-pressed={isFollowing}
                        aria-label={
                          isFollowing ? 'Unfollow project' : 'Follow project'
                        }
                        onClick={handleFollowClick}
                        color={isFollowing ? 'primary' : 'default'}
                        size="large"
                      >
                        {isFollowing ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </Tooltip>
                  </motion.div>

                  <motion.div
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Button
                      variant="contained"
                      startIcon={<Handshake />}
                      onClick={onCollaborate}
                      aria-label="Request collaboration"
                    >
                      Collaborate
                    </Button>
                  </motion.div>
                </>
              )}
            </Box>

            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                onClick={handleRefreshClick}
                variant="outlined"
                size="small"
                aria-label="Refresh project details"
              >
                Refresh
              </Button>
              {isOwner && (
                <>
                  <Button
                    onClick={() => setUpdateModalOpen(true)}
                    variant="contained"
                    size="small"
                    aria-label="Update project"
                  >
                    Update
                  </Button>

                  <Button
                    onClick={() => setConfirmDeleteOpen(true)}
                    variant="outlined"
                    color="error"
                    size="small"
                    aria-label="Delete project"
                  >
                    Delete
                  </Button>
                </>
              )}
              <Button
                onClick={onClose}
                variant="outlined"
                aria-label="Close project modal"
              >
                Close
              </Button>
            </Box>
          </DialogActions>
          {/* Lazy-loaded update modal — reuses UpdateSection component */}
          {updateModalOpen && (
            <React.Suspense
              fallback={
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    p: 2,
                  }}
                >
                  Loading editor…
                </Box>
              }
            >
              <UpdateSection
                open={updateModalOpen}
                project={project}
                onClose={() => setUpdateModalOpen(false)}
                onUpdated={() => {
                  onRefresh();
                  setUpdateModalOpen(false);
                  setSnackMsg('Project updated');
                  setSnackSeverity('success');
                  setSnackOpen(true);
                }}
              />
            </React.Suspense>
          )}
          {/* Confirm delete dialog */}
          <Dialog
            open={confirmDeleteOpen}
            onClose={() => setConfirmDeleteOpen(false)}
            aria-labelledby="confirm-delete-title"
          >
            <DialogTitle id="confirm-delete-title">Delete project?</DialogTitle>
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
                onClick={handleDeleteConfirmed}
                color="error"
                variant="contained"
                disabled={deleting}
                startIcon={deleting ? <CircularProgress size={16} /> : null}
              >
                {deleting ? 'Deleting...' : 'Delete'}
              </Button>
            </DialogActions>
          </Dialog>

          {/* Snackbar */}
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
          </Snackbar>
        </>
      )}
    </Dialog>
  );
};

export default ProjectDetailModal;
