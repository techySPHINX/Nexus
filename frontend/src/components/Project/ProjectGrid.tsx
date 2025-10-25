import React from 'react';
import { Grid, Box, Typography, Alert, Button, Skeleton } from '@mui/material';
import { motion } from 'framer-motion';
import { ProjectInterface } from '@/types/ShowcaseType';
const ProjectCard = React.lazy(() => import('./ProjectCard'));
import { Add } from '@mui/icons-material';

interface ProjectsGridProps {
  projects: ProjectInterface[];
  loading: boolean;
  error: string | null;
  isProjectOwner: (project: ProjectInterface | null) => boolean | null;
  user: { id: string | null };
  emptyMessage: {
    title: string;
    description: string;
    action: () => void;
    actionText: string;
  };
  onSupport: (projectId: string, isSupported: boolean) => void;
  onFollow: (projectId: string, isFollowing: boolean) => void;
  onCollaborate: (project: ProjectInterface) => void;
  onViewDetails: (project: ProjectInterface) => void;
}

const ProjectGrid: React.FC<ProjectsGridProps> = ({
  projects,
  loading,
  error,
  onSupport,
  onFollow,
  onCollaborate,
  onViewDetails,
  user,
  isProjectOwner,
  emptyMessage,
}) => {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.5,
      },
    },
  };

  // Skeleton loading cards
  if (loading && projects.length === 0) {
    return (
      <Grid container spacing={3}>
        {[...Array(6)].map((_, index) => (
          <Grid item xs={12} sm={6} md={4} key={index}>
            <Box
              sx={{
                borderRadius: 3,
                overflow: 'hidden',
                height: 340,
                boxShadow: '0 10px 30px rgba(0,0,0,0.15)',
              }}
            >
              <Skeleton variant="rectangular" width="100%" height={200} />
              <Box sx={{ p: 2 }}>
                <Skeleton variant="text" width="80%" height={30} />
                <Skeleton variant="text" width="60%" height={20} />
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    mt: 2,
                  }}
                >
                  <Skeleton variant="circular" width={40} height={40} />
                  <Box sx={{ display: 'flex', gap: 2 }}>
                    <Skeleton variant="text" width={30} height={20} />
                    <Skeleton variant="text" width={30} height={20} />
                  </Box>
                </Box>
              </Box>
            </Box>
          </Grid>
        ))}
      </Grid>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 3 }}>
        {error}
      </Alert>
    );
  }

  if (!projects || projects.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 8 }}>
        <Typography
          variant="h5"
          color="text.secondary"
          gutterBottom
          sx={{ fontWeight: 600 }}
        >
          {emptyMessage.title}
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          {emptyMessage.description}
        </Typography>
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <Button
            variant="contained"
            startIcon={
              emptyMessage.actionText.includes('Create') ? <Add /> : undefined
            }
            onClick={emptyMessage.action}
            size="large"
            sx={{ borderRadius: 3, px: 3, fontWeight: 600 }}
          >
            {emptyMessage.actionText}
          </Button>
        </motion.div>
      </Box>
    );
  }

  return (
    <>
      <Typography variant="h5" gutterBottom sx={{ mb: 3, fontWeight: 600 }}>
        {emptyMessage.title.includes('own')
          ? 'Projects You Own'
          : emptyMessage.title.includes('support')
            ? 'Projects You Support'
            : emptyMessage.title.includes('follow')
              ? "Projects You're Following"
              : 'All Projects'}
      </Typography>
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <Grid container spacing={3}>
          {projects.map((project) => (
            <Grid item xs={12} sm={6} md={4} key={project?.id || Math.random()}>
              <motion.div variants={itemVariants}>
                <ProjectCard
                  project={project}
                  currentUserId={user?.id}
                  isOwner={isProjectOwner(project)}
                  onSupport={onSupport}
                  onFollow={onFollow}
                  onCollaborate={() => onCollaborate(project)}
                  onViewDetails={() => onViewDetails(project)}
                />
              </motion.div>
            </Grid>
          ))}
        </Grid>
      </motion.div>
    </>
  );
};

export default ProjectGrid;
