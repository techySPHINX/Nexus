// ProjectMainPage.tsx - Updated implementation
import React, { useState, useEffect, useCallback } from 'react';
import { useShowcase } from '@/contexts/ShowcaseContext';
import { useAuth } from '@/contexts/AuthContext';
import {
  ProjectInterface,
  FilterProjectInterface,
  CreateProjectInterface,
  CreateCollaborationRequestInterface,
  ProjectDetailInterface,
} from '@/types/ShowcaseType';

// Material-UI Components
import {
  Box,
  Typography,
  CircularProgress,
  Tabs,
  Tab,
  Chip,
  Skeleton,
  Button,
  Snackbar,
  Alert,
  Fade,
  Container,
} from '@mui/material';
import { Add } from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';

// Custom Components
import ProjectFilter from '@/components/Project/ProjectFilter';
import ProjectModal from '@/components/Project/CreateProject';
import CollaborationModal from '@/components/Project/CollaborationModal';
import ProjectDetailModal from '@/components/Project/ProjectDetailsCard';
import ProjectGrid from '@/components/Project/ProjectGrid';

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
      id={`my-projects-tabpanel-${index}`}
      aria-labelledby={`my-projects-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

const ProjectsMainPage: React.FC = () => {
  const {
    projectCounts,
    allProjects,
    projectsByUserId,
    supportedProjects,
    followedProjects,
    comments,
    projectById,
    loading,
    actionLoading,
    seekingOptions,
    error,
    refreshProjects,
    getProjectCounts,
    getAllProjects,
    getProjectsByUserId,
    getSupportedProjects,
    getFollowedProjects,
    getProjectById,
    createProject,
    deleteProject,
    supportProject,
    unsupportProject,
    followProject,
    unfollowProject,
    requestCollaboration,
    clearError,
    getProjectUpdates,
    getComments,
    createComment,
    getProjectTeamMembers,
    removeProjectTeamMember,
    createProjectTeamMember,
    getSeekingOptions,
  } = useShowcase();

  const { user } = useAuth();
  const [filters, setFilters] = useState<FilterProjectInterface>({
    pageSize: 12,
  });
  const [activeTab, setActiveTab] = useState(0);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showCollaborationModal, setShowCollaborationModal] = useState(false);
  const [selectedProject, setSelectedProject] =
    useState<ProjectInterface | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(
    null
  );
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'info' | 'warning';
  }>({ open: false, message: '', severity: 'info' });

  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [tabLoading, setTabLoading] = useState(false);
  // Short-lived cache to avoid repeated refetches when an API returns empty results
  // Keyed by `${activeTab}:${JSON.stringify(filters)}` -> timestamp of last empty response
  const lastEmptyFetchRef = React.useRef<Record<string, number>>({});
  const EMPTY_FETCH_TTL = 60 * 1000; // 60 seconds

  useEffect(() => {
    getProjectCounts();
  }, [getProjectCounts]);

  // Load projects based on active tab
  useEffect(() => {
    if (!user) return;

    const loadTabData = async () => {
      setTabLoading(true);
      try {
        // Build a short-lived key for this tab + filters to prevent rapid re-fetches
        const key = `${activeTab}:${JSON.stringify(filters ?? {})}`;
        const lastEmpty = lastEmptyFetchRef.current[key] ?? 0;
        if (Date.now() - lastEmpty < EMPTY_FETCH_TTL) {
          // We recently fetched this tab+filters and it returned empty — skip refetch for TTL
          setTabLoading(false);
          return;
        }

        switch (activeTab) {
          case 0: // All Projects
            await getAllProjects(filters);
            break;
          case 1: // My Projects
            await getProjectsByUserId(user.id, filters);
            break;
          case 2: // Supported Projects
            await getSupportedProjects(filters);
            break;
          case 3: // Followed Projects
            await getFollowedProjects(filters);
            break;
        }

        // After fetching, if the resulting project list for this tab is empty, record timestamp
        // so we don't keep re-requesting the same empty set repeatedly.
        let currentDataLength = 0;
        switch (activeTab) {
          case 0:
            currentDataLength = allProjects.data.length;
            break;
          case 1:
            currentDataLength = projectsByUserId.data.length;
            break;
          case 2:
            currentDataLength = supportedProjects.data.length;
            break;
          case 3:
            currentDataLength = followedProjects.data.length;
            break;
        }
        if (currentDataLength === 0) {
          lastEmptyFetchRef.current[key] = Date.now();
        } else {
          // if we have results, clear any previous empty marker for this key
          delete lastEmptyFetchRef.current[key];
        }
      } catch (err) {
        console.error('Failed to load tab data:', err);
      } finally {
        setTabLoading(false);
      }
    };

    loadTabData();
  }, [
    activeTab,
    filters,
    user,
    getAllProjects,
    getProjectsByUserId,
    getSupportedProjects,
    getFollowedProjects,
    allProjects.data.length,
    projectsByUserId.data.length,
    supportedProjects.data.length,
    followedProjects.data.length,
    EMPTY_FETCH_TTL,
  ]);

  // Get current pagination based on active tab
  const getCurrentPagination = useCallback(() => {
    switch (activeTab) {
      case 0:
        return allProjects.pagination;
      case 1:
        return projectsByUserId.pagination;
      case 2:
        return supportedProjects.pagination;
      case 3:
        return followedProjects.pagination;
      default:
        return allProjects.pagination;
    }
  }, [
    activeTab,
    followedProjects.pagination,
    allProjects.pagination,
    projectsByUserId.pagination,
    supportedProjects.pagination,
  ]);

  const loadMoreProjects = useCallback(async () => {
    if (loading || isLoadingMore) return;

    const currentPagination = getCurrentPagination();
    if (!currentPagination.hasNext) return;

    setIsLoadingMore(true);
    try {
      const nextFilters = {
        ...filters,
        pageSize: 9,
        cursor: currentPagination.nextCursor,
      };

      switch (activeTab) {
        case 0:
          await getAllProjects(nextFilters, true);
          break;
        case 1:
          await getProjectsByUserId(user?.id, nextFilters, true);
          break;
        case 2:
          await getSupportedProjects(nextFilters, true);
          break;
        case 3:
          await getFollowedProjects(nextFilters, true);
          break;
      }
    } catch (err) {
      console.error('Failed to load more projects:', err);
    } finally {
      setIsLoadingMore(false);
    }
  }, [
    loading,
    isLoadingMore,
    getCurrentPagination,
    filters,
    activeTab,
    getAllProjects,
    getProjectsByUserId,
    user?.id,
    getSupportedProjects,
    getFollowedProjects,
  ]);

  // Get current projects based on active tab
  const getCurrentProjects = (): ProjectInterface[] => {
    switch (activeTab) {
      case 0:
        return allProjects.data;
      case 1:
        return projectsByUserId.data;
      case 2:
        return supportedProjects.data;
      case 3:
        return followedProjects.data;
      default:
        return allProjects.data;
    }
  };

  // Get counts for each tab
  const getTabCounts = () => {
    return {
      all: projectCounts.total,
      owned: projectCounts.owned,
      supported: projectCounts.supported,
      following: projectCounts.followed,
    };
  };

  useEffect(() => {
    if (error) {
      setSnackbar({ open: true, message: error, severity: 'error' });
    }
  }, [error]);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const handleCloseSnackbar = () => {
    setSnackbar((prev) => ({ ...prev, open: false }));
    clearError();
  };

  const handleCreateProject = useCallback(
    async (data: CreateProjectInterface) => {
      try {
        await createProject(data);
        setShowCreateModal(false);
        setSnackbar({
          open: true,
          message: 'Created project!',
          severity: 'success',
        });
        // Refresh my projects tab
        if (user) {
          await getProjectsByUserId(user.id, filters);
        }
      } catch (err) {
        setSnackbar({
          open: true,
          message: 'Failed to create project',
          severity: 'error',
        });
        console.error('Failed to create project:', err);
      }
    },
    [createProject, user, getProjectsByUserId, filters]
  );

  const handleViewProjectDetails = async (
    project: ProjectInterface,
    forceRefresh = false
  ) => {
    setSelectedProject(project);
    setSelectedProjectId(project.id);

    try {
      await getProjectById(project.id, forceRefresh, activeTab);
    } catch (err) {
      console.error('Failed to load project details:', err);
    }
  };

  const handleDeleteProject = async (projectId: string) => {
    try {
      await deleteProject(projectId);
      setSelectedProjectId(null);
      setSelectedProject(null);
      setSnackbar({
        open: true,
        message: 'Deleted project!',
        severity: 'success',
      });
      // Refresh all relevant tabs
      if (user) {
        await getProjectsByUserId(user.id, filters);
      }
    } catch (err) {
      setSnackbar({
        open: true,
        message: 'Failed to delete project',
        severity: 'error',
      });
      console.error('Failed to delete project:', err);
    }
  };

  const handleCreateComment = async (projectId: string, comment: string) => {
    try {
      await createComment(projectId, comment);
      setSnackbar({
        open: true,
        message: 'Comment added!',
        severity: 'success',
      });
    } catch (err) {
      setSnackbar({
        open: true,
        message: 'Failed to add comment',
        severity: 'error',
      });
      console.error('Failed to create comment:', err);
    }
  };

  const handleCloseProjectDetails = () => {
    setSelectedProjectId(null);
    setSelectedProject(null);
  };

  const handleSupport = useCallback(
    async (projectId: string, isSupported: boolean) => {
      try {
        if (isSupported) {
          await unsupportProject(projectId);
        } else {
          await supportProject(projectId);
        }
      } catch (err) {
        console.error('Failed to toggle support:', err);
      }
    },
    [supportProject, unsupportProject]
  );

  const handleFollow = useCallback(
    async (projectId: string, isFollowing: boolean) => {
      try {
        if (isFollowing) {
          await unfollowProject(projectId);
        } else {
          await followProject(projectId);
        }
      } catch (err) {
        console.error('Failed to toggle follow:', err);
      }
    },
    [followProject, unfollowProject]
  );

  const handleCollaborationRequest = useCallback(
    async (projectId: string, data: CreateCollaborationRequestInterface) => {
      try {
        await requestCollaboration(projectId, data);
        setShowCollaborationModal(false);
        setSelectedProject(null);
        setSnackbar({
          open: true,
          message: 'Collaboration request sent!',
          severity: 'success',
        });
      } catch (err) {
        setSnackbar({
          open: true,
          message: 'Failed to send collaboration request',
          severity: 'error',
        });
        console.error('Failed to send collaboration request:', err);
      }
    },
    [requestCollaboration]
  );

  const handleLoadSeekingOptions = useCallback(
    async (projectId: string) => {
      try {
        await getSeekingOptions(projectId);
      } catch (err) {
        console.error('Failed to load seeking options:', err);
      }
    },
    [getSeekingOptions]
  );

  const isProjectOwner = useCallback(
    (project: ProjectInterface | null) => {
      return user && project?.owner?.id === user.id;
    },
    [user]
  );

  const currentProjects = getCurrentProjects();
  const currentPagination = getCurrentPagination();
  const counts = getTabCounts();

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2 }}
      >
        {/* Header Section */}
        <motion.div
          initial={{ y: -8, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.25 }}
        >
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              mb: 4,
              flexWrap: 'wrap',
              gap: 2,
            }}
          >
            <Box>
              <Typography
                variant="h3"
                component="h1"
                sx={{ fontWeight: 800, mb: 1, color: 'primary.main' }}
              >
                Project Showcase
              </Typography>
              <Typography
                variant="h6"
                color="text.secondary"
                sx={{ fontWeight: 400 }}
              >
                Discover, support, and collaborate on amazing projects
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button
                  variant="contained"
                  startIcon={<Add />}
                  onClick={() => setShowCreateModal(true)}
                  sx={{
                    borderRadius: 3,
                    px: 3,
                    py: 1.2,
                    fontWeight: 600,
                    fontSize: '1rem',
                  }}
                  size="large"
                >
                  Create New Project
                </Button>
              </motion.div>
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Button
                  variant="outlined"
                  onClick={() => refreshProjects(activeTab)}
                  startIcon={
                    actionLoading.refresh ? (
                      <CircularProgress size={18} color="inherit" />
                    ) : undefined
                  }
                  sx={{
                    borderRadius: 3,
                    px: 3,
                    py: 1.2,
                    fontWeight: 600,
                    fontSize: '1rem',
                  }}
                  size="large"
                  disabled={actionLoading.refresh}
                >
                  Refresh
                </Button>
              </motion.div>
            </Box>
          </Box>
        </motion.div>

        {/* Summary Stats (show skeletons while loading to improve FCP) */}
        {user && (
          <motion.div
            initial={{ y: 8, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.2, delay: 0.05 }}
          >
            <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
              {actionLoading.count ? (
                <>
                  <Skeleton variant="text" width={140} height={40} />
                  <Skeleton variant="text" width={100} height={40} />
                  <Skeleton variant="text" width={120} height={40} />
                  <Skeleton variant="text" width={120} height={40} />
                </>
              ) : (
                <>
                  <Chip
                    label={`${counts.all} Total Projects`}
                    color="primary"
                    variant="filled"
                    sx={{ fontWeight: 600, px: 1 }}
                  />
                  <Chip
                    label={`${counts.owned} Owned`}
                    color="secondary"
                    variant="filled"
                    sx={{ fontWeight: 600, px: 1 }}
                  />
                  <Chip
                    label={`${counts.supported} Supported`}
                    color="success"
                    variant="filled"
                    sx={{ fontWeight: 600, px: 1 }}
                  />
                  <Chip
                    label={`${counts.following} Following`}
                    color="info"
                    variant="filled"
                    sx={{ fontWeight: 600, px: 1 }}
                  />
                </>
              )}
            </Box>
          </motion.div>
        )}

        {/* Filter Section */}
        <motion.div
          initial={{ y: 8, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.2, delay: 0.08 }}
        >
          <ProjectFilter filters={filters} onFilterChange={setFilters} />
        </motion.div>

        {/* Tabs for different views */}
        {user && (
          <motion.div
            initial={{ y: 8, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.2, delay: 0.1 }}
          >
            <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
              <Tabs
                value={activeTab}
                onChange={handleTabChange}
                variant="scrollable"
                scrollButtons="auto"
              >
                <Tab
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      All Projects
                      {counts.all > 0 && (
                        <Chip label={counts.all} size="small" sx={{ ml: 1 }} />
                      )}
                    </Box>
                  }
                />
                <Tab
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      My Projects
                      {counts.owned > 0 && (
                        <Chip
                          label={counts.owned}
                          size="small"
                          sx={{ ml: 1 }}
                        />
                      )}
                    </Box>
                  }
                />
                <Tab
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      Supported
                      {counts.supported > 0 && (
                        <Chip
                          label={counts.supported}
                          size="small"
                          sx={{ ml: 1 }}
                        />
                      )}
                    </Box>
                  }
                />
                <Tab
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      Following
                      {counts.following > 0 && (
                        <Chip
                          label={counts.following}
                          size="small"
                          sx={{ ml: 1 }}
                        />
                      )}
                    </Box>
                  }
                />
              </Tabs>
            </Box>
          </motion.div>
        )}

        {/* Current Tab Content */}
        <TabPanel value={activeTab} index={0}>
          <ProjectGrid
            projects={currentProjects}
            tab={activeTab}
            loading={loading || tabLoading}
            error={error}
            user={{ id: user?.id || null }}
            isProjectOwner={isProjectOwner}
            onSupport={handleSupport}
            onFollow={handleFollow}
            onCollaborate={(project) => {
              setSelectedProject(project);
              setShowCollaborationModal(true);
            }}
            onViewDetails={handleViewProjectDetails}
            emptyMessage={{
              title: 'No projects found',
              description:
                filters.search || filters.tags || filters.status
                  ? 'Try adjusting your filters to see more results'
                  : 'Be the first to create a project!',
              action: () => setShowCreateModal(true),
              actionText: 'Create First Project',
            }}
          />
        </TabPanel>

        {[1, 2, 3].map((tabIndex) => (
          <TabPanel key={tabIndex} value={activeTab} index={tabIndex}>
            <ProjectGrid
              projects={currentProjects}
              tab={activeTab}
              loading={loading || tabLoading}
              error={error}
              user={{ id: user?.id || null }}
              isProjectOwner={isProjectOwner}
              onSupport={handleSupport}
              onFollow={handleFollow}
              onCollaborate={(project) => {
                setSelectedProject(project);
                setShowCollaborationModal(true);
              }}
              onViewDetails={handleViewProjectDetails}
              emptyMessage={{
                title:
                  tabIndex === 1
                    ? "You don't own any projects yet"
                    : tabIndex === 2
                      ? "You haven't supported any projects yet"
                      : "You're not following any projects yet",
                description:
                  tabIndex === 1
                    ? 'Create your first project to showcase your work'
                    : tabIndex === 2
                      ? 'Support projects you find interesting to show your appreciation'
                      : 'Follow projects to stay updated on their progress',
                action:
                  tabIndex === 1
                    ? () => setShowCreateModal(true)
                    : () => setActiveTab(0),
                actionText:
                  tabIndex === 1
                    ? 'Create Your First Project'
                    : 'Browse Projects',
              }}
            />
          </TabPanel>
        ))}

        {/* Loading More Indicator and Load More Button */}
        {currentPagination.hasNext && !isLoadingMore && (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4, mb: 4 }}>
            <Button
              variant="contained"
              color="primary"
              size="large"
              onClick={loadMoreProjects}
              disabled={isLoadingMore || loading}
              sx={{ borderRadius: 3, px: 4, py: 1.5, fontWeight: 600 }}
            >
              Load More Projects
            </Button>
          </Box>
        )}
        {(isLoadingMore || tabLoading) && (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4, mb: 4 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <CircularProgress size={24} />
              <Typography variant="body2" color="text.secondary">
                Loading more projects...
              </Typography>
            </Box>
          </Box>
        )}

        {/* End of Results */}
        {!currentPagination.hasNext && currentProjects.length > 0 && (
          <Box sx={{ textAlign: 'center', mt: 4, mb: 4 }}>
            <Typography variant="body2" color="text.secondary">
              You've reached the end of the results
            </Typography>
          </Box>
        )}

        {/* Modals */}
        <AnimatePresence>
          {showCreateModal && (
            <ProjectModal
              onClose={() => setShowCreateModal(false)}
              onSubmit={handleCreateProject}
              loading={loading}
            />
          )}

          {showCollaborationModal && selectedProject && (
            <CollaborationModal
              project={selectedProject}
              seekingOptions={seekingOptions[selectedProject.id] || []}
              onLoadSeekingOptions={() =>
                handleLoadSeekingOptions(selectedProject.id)
              }
              onClose={() => {
                setShowCollaborationModal(false);
                setSelectedProject(null);
              }}
              onSubmit={(data) =>
                handleCollaborationRequest(selectedProject?.id || '', data)
              }
              loading={loading}
            />
          )}

          {selectedProjectId && (
            <ProjectDetailModal
              project={
                projectById || (selectedProject as ProjectDetailInterface)
              }
              open={!!selectedProjectId}
              onClose={handleCloseProjectDetails}
              loading={actionLoading.projectDetails.has(selectedProjectId)}
              currentUserId={user?.id}
              comments={comments[selectedProjectId] || []}
              loadingComments={actionLoading.comment}
              onLoadComments={(page, forceRefresh) =>
                getComments(selectedProjectId, page, forceRefresh)
              }
              onLoadTeamMembers={() => getProjectTeamMembers(selectedProjectId)}
              onLoadUpdates={() => getProjectUpdates(selectedProjectId)}
              isProjectOwner={isProjectOwner(projectById || selectedProject)}
              onCreateTeamMember={(data) =>
                createProjectTeamMember(selectedProjectId, data)
              }
              loadingTeamMembers={actionLoading.teamMembers}
              onRemoveTeamMember={(userId) =>
                removeProjectTeamMember(selectedProjectId, userId)
              }
              onCreateComment={(comment) =>
                handleCreateComment(selectedProjectId, comment)
              }
              onSupport={(isSupported) =>
                handleSupport(selectedProjectId, isSupported)
              }
              onFollow={(isFollowing) =>
                handleFollow(selectedProjectId, isFollowing)
              }
              onCollaborate={() => {
                setSelectedProject(projectById || selectedProject);
                setShowCollaborationModal(true);
                handleCloseProjectDetails();
              }}
              onRefresh={() =>
                handleViewProjectDetails(
                  selectedProject as ProjectInterface,
                  true
                )
              }
              onDelete={() => handleDeleteProject(selectedProjectId)}
            />
          )}
        </AnimatePresence>

        {/* Snackbar for messages */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={6000}
          onClose={handleCloseSnackbar}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          TransitionComponent={Fade}
        >
          <Alert
            onClose={handleCloseSnackbar}
            severity={snackbar.severity}
            variant="filled"
            sx={{ width: '100%' }}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </motion.div>
    </Container>
  );
};

export default React.memo(ProjectsMainPage);
