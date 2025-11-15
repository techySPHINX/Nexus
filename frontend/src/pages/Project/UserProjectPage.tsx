import React, { useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, IconButton, Skeleton, Stack } from '@mui/material';
import { ArrowBack } from '@mui/icons-material';
import { useShowcase } from '@/contexts/ShowcaseContext';
import ProjectGrid from '@/components/Project/ProjectGrid';

const UserProjectPage: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();

  const {
    projectsByUserId,
    getProjectsByUserId,
    loading,
    supportProject,
    unsupportProject,
    followProject,
    unfollowProject,
  } = useShowcase();

  useEffect(() => {
    if (!userId) return;
    getProjectsByUserId(userId).catch(() => {});
  }, [userId, getProjectsByUserId]);

  const onSupport = useCallback(
    (projectId: string, isSupported: boolean) => {
      if (isSupported) unsupportProject(projectId);
      else supportProject(projectId);
    },
    [supportProject, unsupportProject]
  );

  const onFollow = useCallback(
    (projectId: string, isFollowing: boolean) => {
      if (isFollowing) unfollowProject(projectId);
      else followProject(projectId);
    },
    [followProject, unfollowProject]
  );

  const onCollaborate = () => {
    // Collaboration handled via project detail modal elsewhere
  };

  const onViewDetails = (project: { id: string }) => {
    navigate(`/projects/${project.id}`);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 3 }}>
        <IconButton onClick={() => navigate(-1)} aria-label="back">
          <ArrowBack />
        </IconButton>
        {loading && projectsByUserId.data.length === 0 && (
          <Skeleton variant="text" width={220} />
          // ) : (
          //   <Typography variant="h5" sx={{ fontWeight: 700 }}>
          //     {`Projects by ${userId ?? 'user'}`}
          //   </Typography>
        )}
      </Stack>

      <ProjectGrid
        projects={projectsByUserId.data}
        tab={1}
        loading={loading}
        error={null}
        isProjectOwner={() => null}
        user={{ id: userId || null }}
        emptyMessage={{
          title: 'No projects found',
          description: 'This user has not published any projects yet.',
          action: () => navigate('/projects'),
          actionText: 'Back to projects',
        }}
        onSupport={onSupport}
        onFollow={onFollow}
        onCollaborate={onCollaborate}
        onViewDetails={onViewDetails}
      />
    </Box>
  );
};

export default UserProjectPage;
