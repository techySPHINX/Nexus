import React from 'react';
import { Grid, Box, Typography, CircularProgress, Alert } from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import { ProjectInterface } from '@/types/ShowcaseType';
import ProjectCard from './ProjectCard';

interface ProjectsGridProps {
  projects: ProjectInterface[];
  loading: boolean;
  error: string | null;
  currentUserId?: string;
  onSupport: (projectId: string, isSupported: boolean) => void;
  onFollow: (projectId: string, isFollowing: boolean) => void;
  onCollaborate: (project: ProjectInterface) => void;
  onEdit: (project: ProjectInterface) => void;
  onDelete: (projectId: string) => void;
  onManageTeam: (project: ProjectInterface) => void;
  onViewDetails: (projectId: string) => void;
}

const ProjectsGrid: React.FC<ProjectsGridProps> = ({
  projects,
  loading,
  error,
  currentUserId,
  onSupport,
  onFollow,
  onCollaborate,
  onEdit,
  onDelete,
  onManageTeam,
  onViewDetails,
}) => {
  if (loading) {
    return (
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
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 3 }}>
        {error}
      </Alert>
    );
  }

  if (projects.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 8 }}>
        <Typography variant="h6" color="text.secondary">
          No projects found. Create the first one!
        </Typography>
      </Box>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <Grid container spacing={3}>
        <AnimatePresence>
          {projects.map((project, index) => (
            <Grid
              item
              xs={12}
              sm={6}
              lg={4}
              key={project.id}
              component={motion.div}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              layout
            >
              <ProjectCard
                project={project}
                currentUserId={currentUserId}
                onSupport={onSupport}
                onFollow={onFollow}
                onCollaborate={onCollaborate}
                onEdit={onEdit}
                onDelete={onDelete}
                onManageTeam={onManageTeam}
                onViewDetails={onViewDetails}
              />
            </Grid>
          ))}
        </AnimatePresence>
      </Grid>
    </motion.div>
  );
};

export default ProjectsGrid;
