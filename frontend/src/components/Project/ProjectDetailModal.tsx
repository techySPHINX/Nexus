// ProjectDetailModal.tsx
import React, { useEffect, useRef, useState } from 'react';
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
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import {
  status,
  ProjectComment,
  ProjectTeam,
  ProjectUpdateInterface,
  ProjectDetailInterface,
} from '@/types/ShowcaseType';

interface ProjectDetailModalProps {
  project: ProjectDetailInterface;
  open: boolean;
  comments?: ProjectComment[];
  loading?: boolean;
  loadingComments?: boolean;
  currentUserId?: string;
  onClose: () => void;
  onSupport: (isSupported: boolean) => void;
  onFollow: (isFollowing: boolean) => void;
  onCollaborate: () => void;
  onLoadComments: (page?: number, forceRefresh?: boolean) => void;
  onCreateComment: (comment: string) => Promise<void>;
  onRefresh: () => void;
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
  comments = [],
  loading = false,
  loadingComments = false,
  currentUserId,
  onClose,
  onSupport,
  onFollow,
  onCollaborate,
  onLoadComments,
  onCreateComment,
  onRefresh,
}) => {
  const theme = useTheme();
  const [activeTab, setActiveTab] = useState(0);
  const [commentText, setCommentText] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const submitDebounce = useRef<number | null>(null);

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

  const statusColors: Record<status, 'default' | 'primary' | 'success'> = {
    [status.IDEA]: 'default',
    [status.IN_PROGRESS]: 'primary',
    [status.COMPLETED]: 'success',
  };

  const statusLabels = {
    [status.IDEA]: 'Idea',
    [status.IN_PROGRESS]: 'In Progress',
    [status.COMPLETED]: 'Completed',
  };

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
    // lazy load comments when user switches to comments tab
    if (newValue === 2 && comments.length === 0 && !loadingComments) {
      onLoadComments(1, false);
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
                  label={statusLabels[project.status]}
                  color={statusColors[project.status]}
                  size="small"
                  sx={{ fontWeight: 700 }}
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
                    {format(new Date(project.createdAt), 'MMM d, yyyy')}
                  </Typography>
                </Box>
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
                      <Box sx={{ mb: 2 }}>
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

                    {project.seeking && project.seeking.length > 0 && (
                      <Box
                        sx={{
                          mt: 2,
                          p: 2,
                          bgcolor: 'info.light',
                          borderRadius: 2,
                        }}
                      >
                        <Typography
                          variant="h6"
                          gutterBottom
                          color="info.main"
                          fontWeight={700}
                        >
                          🤝 Looking for Help
                        </Typography>
                        <Typography variant="body1" color="info.main">
                          {Array.isArray(project.seeking)
                            ? project.seeking.join(', ')
                            : project.seeking}
                        </Typography>
                      </Box>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

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
                  label="Team"
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
                <Tab
                  icon={<Favorite />}
                  label={`Supporters (${project._count?.supporters ?? 0})`}
                  id="project-detail-tab-4"
                  aria-controls="project-detail-tabpanel-4"
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
                    Skills Required
                  </Typography>
                  <Box
                    sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 3 }}
                  >
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

                  <Typography variant="h6" gutterBottom>
                    Project Tags
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
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
                </Box>
              </motion.div>
            </TabPanel>

            <TabPanel value={activeTab} index={1}>
              <motion.div
                initial="hidden"
                animate="visible"
                variants={containerStagger}
              >
                <List>
                  <motion.div
                    variants={containerStagger}
                    initial="hidden"
                    animate="visible"
                  >
                    <motion.div variants={listItemVariants} custom={0}>
                      <ListItem>
                        <ListItemAvatar>
                          <Avatar src={project.owner?.profile?.avatarUrl}>
                            <Person />
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={project.owner?.name || 'Owner'}
                          secondary="Owner"
                        />
                      </ListItem>
                    </motion.div>
                    {(project.teamMembers ?? []).length ? (
                      (project.teamMembers ?? []).map(
                        (member: ProjectTeam, i: number) => (
                          <motion.div
                            key={member.userId}
                            variants={listItemVariants}
                            custom={i + 1}
                          >
                            <ListItem>
                              <ListItemAvatar>
                                <Avatar src={member.user?.profile?.avatarUrl}>
                                  <Person />
                                </Avatar>
                              </ListItemAvatar>
                              <ListItemText
                                primary={
                                  member.user?.name || `User ${member.userId}`
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
                  <AnimatePresence initial={false}>
                    <motion.ul
                      style={{ listStyle: 'none', padding: 0, margin: 0 }}
                      variants={containerStagger}
                      initial="hidden"
                      animate="visible"
                      exit="hidden"
                    >
                      {(comments ?? []).length ? (
                        (comments ?? []).map(
                          (comment: ProjectComment, idx: number) => (
                            <motion.li
                              key={comment.id ?? idx}
                              variants={listItemVariants}
                              custom={idx}
                            >
                              <ListItem
                                alignItems="flex-start"
                                sx={{ alignItems: 'flex-start' }}
                              >
                                <ListItemAvatar>
                                  <Avatar
                                    src={comment.user?.profile?.avatarUrl}
                                  >
                                    <Person />
                                  </Avatar>
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
                                      <Typography variant="subtitle2">
                                        {comment.user?.name || 'Anonymous'}
                                      </Typography>
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
                                    <Typography variant="body1" sx={{ mt: 1 }}>
                                      {comment.comment}
                                    </Typography>
                                  }
                                />
                              </ListItem>
                              {idx < (comments?.length ?? 0) - 1 && (
                                <Divider variant="inset" component="li" />
                              )}
                            </motion.li>
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
                    </motion.ul>
                  </AnimatePresence>
                )}
              </Box>
            </TabPanel>

            <TabPanel value={activeTab} index={3}>
              <Box sx={listContainerSx}>
                <List>
                  {(project.updates ?? []).length ? (
                    (project.updates ?? []).map(
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
                                    {format(
                                      new Date(update.createdAt),
                                      'MMM d, yyyy • h:mm a'
                                    )}
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
            </TabPanel>

            <TabPanel value={activeTab} index={4}>
              <Box sx={listContainerSx}>
                <Typography variant="h6" sx={{ mb: 1 }}>
                  <Favorite color="error" sx={{ mr: 1 }} />
                  Supporters ({project.supporters?.length ?? 0})
                </Typography>
                <List>
                  {(project.supporters ?? []).length ? (
                    (project.supporters ?? []).map((s, i) => (
                      <motion.div
                        key={s.userId ?? i}
                        variants={listItemVariants}
                        custom={i}
                      >
                        <ListItem>
                          <ListItemAvatar>
                            <Avatar>
                              <Person />
                            </Avatar>
                          </ListItemAvatar>
                          <ListItemText primary={`User ${s.userId}`} />
                        </ListItem>
                        <Divider variant="inset" component="li" />
                      </motion.div>
                    ))
                  ) : (
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ py: 2, textAlign: 'center' }}
                    >
                      No supporters yet
                    </Typography>
                  )}
                </List>
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
                        onClick={() => onSupport(isSupported)}
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
                        onClick={() => onFollow(isFollowing)}
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
                onClick={onRefresh}
                variant="outlined"
                size="small"
                aria-label="Refresh project details"
              >
                Refresh
              </Button>
              <Button
                onClick={onClose}
                variant="outlined"
                aria-label="Close project modal"
              >
                Close
              </Button>
            </Box>
          </DialogActions>
        </>
      )}
    </Dialog>
  );
};

export default ProjectDetailModal;
