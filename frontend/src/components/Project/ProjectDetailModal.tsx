import React, { useState } from 'react';
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
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import {
  ProjectInterface,
  status,
  ProjectComment,
  ProjectTeam,
  ProjectUpdateInterface,
} from '@/types/ShowcaseType';

interface ProjectDetailModalProps {
  project: ProjectInterface;
  open: boolean;
  onClose: () => void;
  loading?: boolean;
  currentUserId?: string;
  onSupport: (isSupported: boolean) => void;
  onFollow: (isFollowing: boolean) => void;
  onCollaborate: () => void;
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

const ProjectDetailModal: React.FC<ProjectDetailModalProps> = ({
  project,
  open,
  onClose,
  loading = false,
  currentUserId,
  onSupport,
  onFollow,
  onCollaborate,
}) => {
  const [activeTab, setActiveTab] = useState(0);
  const isSupported = project.supporters?.some(
    (s) => s.userId === currentUserId
  );
  const isFollowing = project.followers?.some(
    (f) => f.userId === currentUserId
  );
  console.log('Project owner id:', project.owner.id);
  console.log('Current user id:', currentUserId);
  const isOwner = currentUserId && project.owner.id === currentUserId;

  const statusColors = {
    [status.IDEA]: 'default',
    [status.IN_PROGRESS]: 'primary',
    [status.COMPLETED]: 'success',
  };

  const statusLabels = {
    [status.IDEA]: 'Idea',
    [status.IN_PROGRESS]: 'In Progress',
    [status.COMPLETED]: 'Completed',
  };

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const handleExternalLink = (url: string | undefined) => {
    if (url) {
      window.open(url, '_blank');
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperComponent={motion.div}
      PaperProps={{
        initial: { opacity: 0, scale: 0.9 },
        animate: { opacity: 1, scale: 1 },
        exit: { opacity: 0, scale: 0.9 },
        transition: { duration: 0.3 },
        sx: {
          borderRadius: 3,
          maxHeight: '90vh',
          overflow: 'hidden',
        },
      }}
    >
      {loading ? (
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: 400,
          }}
        >
          <CircularProgress size={60} thickness={4} />
        </Box>
      ) : (
        <>
          <DialogTitle
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              pb: 1,
            }}
          >
            <Box sx={{ flex: 1, pr: 2 }}>
              <Typography
                variant="h4"
                component="h2"
                sx={{ fontWeight: 700, mb: 1 }}
              >
                {project.title}
              </Typography>
              <Box
                sx={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: 1,
                  alignItems: 'center',
                }}
              >
                <Chip
                  label={statusLabels[project.status]}
                  color={statusColors[project.status] as any}
                  size="small"
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
              </Box>
            </Box>
            <IconButton onClick={onClose} size="large">
              <Close />
            </IconButton>
          </DialogTitle>

          <DialogContent dividers sx={{ overflowY: 'auto' }}>
            {/* Project Header with Image */}
            {project.imageUrl && (
              <Box sx={{ mb: 3, borderRadius: 2, overflow: 'hidden' }}>
                <img
                  src={project.imageUrl}
                  alt={project.title}
                  style={{ width: '100%', maxHeight: 300, objectFit: 'cover' }}
                />
              </Box>
            )}

            {/* Owner Info */}
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
              <Avatar src={project.owner.avatarUrl} sx={{ mr: 2 }}>
                <Person />
              </Avatar>
              <Box>
                <Typography variant="subtitle1" fontWeight={600}>
                  {project.owner.username || project.owner.email}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Project Owner
                </Typography>
              </Box>
            </Box>

            {/* Description */}
            <Box sx={{ mb: 3 }}>
              <Typography
                variant="h6"
                gutterBottom
                sx={{ display: 'flex', alignItems: 'center' }}
              >
                <Code sx={{ mr: 1 }} /> Description
              </Typography>
              <Typography variant="body1" paragraph>
                {project.description}
              </Typography>
            </Box>

            {/* External Links */}
            {(project.githubUrl || project.websiteUrl) && (
              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Links
                </Typography>
                <Stack direction="row" spacing={2}>
                  {project.githubUrl && (
                    <Button
                      variant="outlined"
                      startIcon={<GitHub />}
                      onClick={() => handleExternalLink(project.githubUrl)}
                    >
                      GitHub Repository
                    </Button>
                  )}
                  {project.websiteUrl && (
                    <Button
                      variant="outlined"
                      startIcon={<Language />}
                      onClick={() => handleExternalLink(project.websiteUrl)}
                    >
                      Live Website
                    </Button>
                  )}
                </Stack>
              </Box>
            )}

            {/* Seeking Help */}
            {project.seeking && (
              <Box sx={{ mb: 3, p: 2, bgcolor: 'info.main', borderRadius: 2 }}>
                <Typography variant="h6" gutterBottom color="info.contrastText">
                  🤝 Looking for Help
                </Typography>
                <Typography variant="body1" color="info.contrastText">
                  {project.seeking}
                </Typography>
              </Box>
            )}

            {/* Tabs for additional information */}
            <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
              <Tabs
                value={activeTab}
                onChange={handleTabChange}
                variant="scrollable"
                scrollButtons="auto"
              >
                <Tab icon={<Label />} label="Tags & Skills" />
                <Tab icon={<Group />} label="Team" />
                <Tab icon={<CommentIcon />} label="Comments" />
                <Tab icon={<Update />} label="Updates" />
                <Tab icon={<Favorite />} label="Supporters" />
              </Tabs>
            </Box>

            {/* Tags & Skills Tab */}
            <TabPanel value={activeTab} index={0}>
              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Skills
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 3 }}>
                  {project.skills.map((skill) => (
                    <Chip key={skill} label={skill} variant="outlined" />
                  ))}
                </Box>

                <Typography variant="h6" gutterBottom>
                  Tags
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {project.tags.map((tag) => (
                    <Chip
                      key={tag}
                      label={tag}
                      variant="outlined"
                      color="primary"
                    />
                  ))}
                </Box>
              </Box>
            </TabPanel>

            {/* Team Tab */}
            <TabPanel value={activeTab} index={1}>
              <List>
                <ListItem>
                  <ListItemAvatar>
                    <Avatar src={project.owner.avatarUrl}>
                      <Person />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={project.owner.username || project.owner.email}
                    secondary="Owner"
                  />
                </ListItem>
                {project.teamMembers?.map((member: ProjectTeam) => (
                  <ListItem key={member.userId}>
                    <ListItemAvatar>
                      <Avatar>
                        <Person />
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={`User ${member.userId}`}
                      secondary={member.role || 'Team Member'}
                    />
                  </ListItem>
                ))}
                {(!project.teamMembers || project.teamMembers.length === 0) && (
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ py: 2, textAlign: 'center' }}
                  >
                    No team members yet
                  </Typography>
                )}
              </List>
            </TabPanel>

            {/* Comments Tab */}
            <TabPanel value={activeTab} index={2}>
              <List>
                {project.comments?.map((comment: ProjectComment, index) => (
                  <Box key={index}>
                    <ListItem alignItems="flex-start">
                      <ListItemAvatar>
                        <Avatar>
                          <Person />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={comment.comment}
                        secondary={`User ${comment.userId}`}
                      />
                    </ListItem>
                    {index < (project.comments?.length || 0) - 1 && (
                      <Divider variant="inset" component="li" />
                    )}
                  </Box>
                ))}
                {(!project.comments || project.comments.length === 0) && (
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ py: 2, textAlign: 'center' }}
                  >
                    No comments yet
                  </Typography>
                )}
              </List>
            </TabPanel>

            {/* Updates Tab */}
            <TabPanel value={activeTab} index={3}>
              <List>
                {project.updates?.map((update: ProjectUpdateInterface) => (
                  <Box key={update.id} sx={{ mb: 2 }}>
                    <ListItem alignItems="flex-start">
                      <ListItemAvatar>
                        <Avatar>
                          <Update />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={update.title}
                        secondary={
                          <>
                            <Typography
                              variant="body2"
                              color="text.primary"
                              gutterBottom
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
                  </Box>
                ))}
                {(!project.updates || project.updates.length === 0) && (
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ py: 2, textAlign: 'center' }}
                  >
                    No updates yet
                  </Typography>
                )}
              </List>
            </TabPanel>

            {/* Supporters Tab */}
            <TabPanel value={activeTab} index={4}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Favorite color="error" sx={{ mr: 1 }} />
                <Typography variant="h6">
                  {project.supporters?.length || 0} Supporters
                </Typography>
              </Box>
              <List>
                {project.supporters?.map((supporter) => (
                  <ListItem key={supporter.id}>
                    <ListItemAvatar>
                      <Avatar>
                        <Person />
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText primary={`User ${supporter.userId}`} />
                  </ListItem>
                ))}
                {(!project.supporters || project.supporters.length === 0) && (
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ py: 2, textAlign: 'center' }}
                  >
                    No supporters yet
                  </Typography>
                )}
              </List>
            </TabPanel>
          </DialogContent>

          <DialogActions sx={{ justifyContent: 'space-between', p: 2 }}>
            <Box sx={{ display: 'flex', gap: 1 }}>
              {!isOwner && currentUserId && (
                <>
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <IconButton
                      onClick={() => onSupport(!!isSupported)}
                      color={isSupported ? 'error' : 'default'}
                      size="large"
                    >
                      {isSupported ? <Favorite /> : <FavoriteBorder />}
                    </IconButton>
                  </motion.div>
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <IconButton
                      onClick={() => onFollow(!!isFollowing)}
                      color={isFollowing ? 'primary' : 'default'}
                      size="large"
                    >
                      {isFollowing ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </motion.div>
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Button
                      variant="contained"
                      startIcon={<Handshake />}
                      onClick={onCollaborate}
                      sx={{ ml: 1 }}
                    >
                      Collaborate
                    </Button>
                  </motion.div>
                </>
              )}
            </Box>
            <Button onClick={onClose} variant="outlined">
              Close
            </Button>
          </DialogActions>
        </>
      )}
    </Dialog>
  );
};

export default ProjectDetailModal;
