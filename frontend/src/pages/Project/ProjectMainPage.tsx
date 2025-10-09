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
    projects,
    pagination,
    projectById,
    loading,
    actionLoading,
    error,
    getAllProjects,
    getProjectById,
    createProject,
    deleteProject,
    // updateProject,
    supportProject,
    unsupportProject,
    followProject,
    unfollowProject,
    requestCollaboration,
    clearError,
    getComments,
    createComment,
    // clearSpecificCache,
  } = useShowcase();

  const { user } = useAuth();
  const [filters, setFilters] = useState<FilterProjectInterface>({
    page: 1,
    pageSize: 15,
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

  const [filteredProjects, setFilteredProjects] = useState<{
    owned: ProjectInterface[];
    supported: ProjectInterface[];
    following: ProjectInterface[];
    all: ProjectInterface[];
  }>({ owned: [], supported: [], following: [], all: [] });

  // Load projects initially
  useEffect(() => {
    getAllProjects(filters);
  }, [getAllProjects, filters]);

  const loadMoreProjects = useCallback(async () => {
    if (loading || isLoadingMore || !pagination.hasNext) return;

    setIsLoadingMore(true);
    try {
      await getAllProjects(
        {
          ...filters,
          page: pagination.page + 1,
        },
        true
      );
    } catch (err) {
      console.error('Failed to load more projects:', err);
    } finally {
      setIsLoadingMore(false);
    }
  }, [
    filters,
    getAllProjects,
    isLoadingMore,
    loading,
    pagination.hasNext,
    pagination.page,
  ]);

  useEffect(() => {
    if (error) {
      setSnackbar({ open: true, message: error, severity: 'error' });
    }
  }, [error]);

  // Handle scroll for infinite loading
  useEffect(() => {
    const handleScroll = () => {
      if (loading || isLoadingMore || !pagination.hasNext) return;

      const scrollTop = document.documentElement.scrollTop;
      const scrollHeight = document.documentElement.scrollHeight;
      const clientHeight = document.documentElement.clientHeight;

      // Load more when 100px from bottom
      if (scrollTop + clientHeight >= scrollHeight) {
        loadMoreProjects();
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [loading, isLoadingMore, pagination.hasNext, loadMoreProjects]);

  // Filter projects based on user relationship
  useEffect(() => {
    if (projects && user) {
      const owned: ProjectInterface[] = [];
      const supported: ProjectInterface[] = [];
      const following: ProjectInterface[] = [];

      projects.forEach((project) => {
        if (!project) return;

        // Check if user owns this project
        if (project.owner?.id === user.id) {
          owned.push(project);
        }

        // Check if user supports this project
        const isSupported = project.supporters?.some(
          (s) => s?.userId === user.id
        );
        if (isSupported) {
          supported.push(project);
        }

        // Check if user follows this project
        const isFollowing = project.followers?.some(
          (f) => f?.userId === user.id
        );
        if (isFollowing) {
          following.push(project);
        }
      });

      setFilteredProjects({
        owned,
        supported,
        following,
        all: projects,
      });
    } else if (projects) {
      setFilteredProjects({
        owned: [],
        supported: [],
        following: [],
        all: projects,
      });
    }
  }, [projects, user]);

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
      } catch (err) {
        setSnackbar({
          open: true,
          message: 'Failed to create project',
          severity: 'error',
        });
        console.error('Failed to create project:', err);
      }
    },
    [createProject]
  );

  // const handleUpdateProject = useCallback(
  //   async (projectId: string, data: Partial<CreateProjectInterface>) => {
  //     try {
  //       await updateProject(projectId, data);
  //       setSnackbarOpen(true);
  //       clearSpecificCache(projectId);
  //     } catch (err) {
  //       console.error('Failed to update project:', err);
  //     }
  //   },
  //   [updateProject, clearSpecificCache]
  // );

  const handleViewProjectDetails = async (
    project: ProjectInterface,
    forceRefresh = false
  ) => {
    setSelectedProject(project);
    setSelectedProjectId(project.id);

    try {
      await getProjectById(project.id, forceRefresh);
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

  const isProjectOwner = useCallback(
    (project: ProjectInterface | null) => {
      return user && project?.owner?.id === user.id;
    },
    [user]
  );

  const currentProjects =
    activeTab === 0
      ? filteredProjects.all
      : activeTab === 1
        ? filteredProjects.owned
        : activeTab === 2
          ? filteredProjects.supported
          : filteredProjects.following;

  const totalProjects = filteredProjects.all?.length || 0;
  const ownedCount = filteredProjects.owned?.length || 0;
  const supportedCount = filteredProjects.supported?.length || 0;
  const followingCount = filteredProjects.following?.length || 0;

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        {/* Header Section */}
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6 }}
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

            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
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
          </Box>
        </motion.div>

        {/* Summary Stats */}
        {totalProjects > 0 && user && (
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
              <Chip
                label={`${totalProjects} Total Projects`}
                color="primary"
                variant="filled"
                sx={{ fontWeight: 600, px: 1 }}
              />
              <Chip
                label={`${ownedCount} Owned`}
                color="secondary"
                variant="filled"
                sx={{ fontWeight: 600, px: 1 }}
              />
              <Chip
                label={`${supportedCount} Supported`}
                color="success"
                variant="filled"
                sx={{ fontWeight: 600, px: 1 }}
              />
              <Chip
                label={`${followingCount} Following`}
                color="info"
                variant="filled"
                sx={{ fontWeight: 600, px: 1 }}
              />
            </Box>
          </motion.div>
        )}

        {/* Filter Section */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <ProjectFilter filters={filters} onFilterChange={setFilters} />
        </motion.div>

        {/* Tabs for different views */}
        {user && (
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
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
                      {totalProjects > 0 && (
                        <Chip
                          label={totalProjects}
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
                      My Projects
                      {ownedCount > 0 && (
                        <Chip label={ownedCount} size="small" sx={{ ml: 1 }} />
                      )}
                    </Box>
                  }
                />
                <Tab
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      Supported
                      {supportedCount > 0 && (
                        <Chip
                          label={supportedCount}
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
                      {followingCount > 0 && (
                        <Chip
                          label={followingCount}
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
            loading={loading}
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
              loading={loading}
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
        {pagination.hasNext && !isLoadingMore && (
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
        {isLoadingMore && (
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
        {!pagination.hasNext && projects.length > 0 && (
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
              comments={[]} // Will be loaded separately
              loadingComments={actionLoading.comment.has(selectedProjectId)}
              onLoadComments={(page, forceRefresh) =>
                getComments(selectedProjectId, page, forceRefresh)
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

export default ProjectsMainPage;
