import React, { useState, useEffect, useCallback } from 'react';
import { useShowcase } from '@/contexts/ShowcaseContext';
import { useAuth } from '@/contexts/AuthContext';
import {
  ProjectInterface,
  FilterProjectInterface,
  CreateProjectInterface,
  CreateCollaborationRequestInterface,
  ProjectsResponse,
} from '@/types/ShowcaseType';

// Material-UI Components
import {
  Box,
  Typography,
  Grid,
  CircularProgress,
  Tabs,
  Tab,
  Chip,
  Button,
  Snackbar,
  Alert,
  Fade,
  Container,
  Pagination,
} from '@mui/material';
import { Add } from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';

// Custom Components
import ProjectCard from '@/components/Project/ProjectCard';
import ProjectFilter from '@/components/Project/ProjectFilter';
import ProjectModal from '@/components/Project/ProjectModal';
import CollaborationModal from '@/components/Project/CollaborationModal';
import ProjectDetailModal from '@/components/Project/ProjectDetailModal';

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
    projectById,
    getProjectById,
    loading: projectLoading,
    loading,
    error,
    getAllProjects,
    createProject,
    updateProject,
    deleteProject,
    supportProject,
    unsupportProject,
    followProject,
    unfollowProject,
    requestCollaboration,
    clearError,
    getProjectIDComments,
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
  const [projectDetails, setProjectDetails] = useState<ProjectInterface | null>(
    null
  );
  const [projectComments, setProjectComments] = useState<any[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [editingProject, setEditingProject] = useState<ProjectInterface | null>(
    null
  );
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 15,
    total: 0,
    totalPages: 1,
    hasNext: false,
    hasPrev: false,
  });

  const [filteredProjects, setFilteredProjects] = useState<{
    owned: ProjectInterface[];
    supported: ProjectInterface[];
    following: ProjectInterface[];
    all: ProjectInterface[];
  }>({ owned: [], supported: [], following: [], all: [] });

  useEffect(() => {
    getAllProjects(filters);
  }, [getAllProjects, filters]);

  useEffect(() => {
    if (error) {
      setSnackbarOpen(true);
    }
  }, [error]);

  useEffect(() => {
    // Update pagination when projects change
    if (projects && 'pagination' in projects) {
      const projectsResponse = projects as ProjectsResponse;
      setPagination(projectsResponse.pagination);
      setFilteredProjectsFromResponse(projectsResponse.data);
    } else if (Array.isArray(projects)) {
      setPagination({
        page: 1,
        pageSize: 15,
        total: projects.length,
        totalPages: 1,
        hasNext: false,
        hasPrev: false,
      });
      setFilteredProjectsFromResponse(projects);
    }
  }, [projects, user]);

  const setFilteredProjectsFromResponse = (
    projectsList: ProjectInterface[]
  ) => {
    if (!user) {
      setFilteredProjects({
        owned: [],
        supported: [],
        following: [],
        all: projectsList,
      });
      return;
    }

    const owned: ProjectInterface[] = [];
    const supported: ProjectInterface[] = [];
    const following: ProjectInterface[] = [];

    projectsList.forEach((project) => {
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
      const isFollowing = project.followers?.some((f) => f?.userId === user.id);
      if (isFollowing) {
        following.push(project);
      }
    });

    setFilteredProjects({
      owned,
      supported,
      following,
      all: projectsList,
    });
  };

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const handlePageChange = (
    _event: React.ChangeEvent<unknown>,
    page: number
  ) => {
    setFilters((prev) => ({ ...prev, page }));
  };

  const handleCloseSnackbar = () => {
    setSnackbarOpen(false);
    clearError();
  };

  const handleCreateProject = useCallback(
    async (data: CreateProjectInterface) => {
      try {
        await createProject(data);
        setShowCreateModal(false);
        setSnackbarOpen(true);
      } catch (err) {
        console.error('Failed to create project:', err);
      }
    },
    [createProject]
  );

  const handleUpdateProject = useCallback(
    async (projectId: string, data: Partial<CreateProjectInterface>) => {
      try {
        await updateProject(projectId, data);
        setEditingProject(null);
        setSnackbarOpen(true);
      } catch (err) {
        console.error('Failed to update project:', err);
      }
    },
    [updateProject]
  );

  const handleDeleteProject = useCallback(
    async (projectId: string) => {
      if (window.confirm('Are you sure you want to delete this project?')) {
        try {
          await deleteProject(projectId);
          setSnackbarOpen(true);
        } catch (err) {
          console.error('Failed to delete project:', err);
        }
      }
    },
    [deleteProject]
  );

  const handleViewProjectDetails = async (project: ProjectInterface) => {
    setSelectedProject(project);
    setSelectedProjectId(project.id);
    setLoadingComments(true);
    try {
      await getProjectById(project.id);
      // Load comments only when needed
      // const comments = await getProjectComments(project.id);
      // setProjectComments(comments);
    } catch (err) {
      console.error('Failed to load project details:', err);
    } finally {
      setLoadingComments(false);
    }
  };

  const handleLoadComments = async (projectId: string) => {
    setLoadingComments(true);
    try {
      const comments = await getProjectComments(projectId);
      setProjectComments(comments);
    } catch (err) {
      console.error('Failed to load comments:', err);
    } finally {
      setLoadingComments(false);
    }
  };

  const handleCloseProjectDetails = () => {
    setSelectedProjectId(null);
    setSelectedProject(null);
    setProjectDetails(null);
    setProjectComments([]);
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
        setSnackbarOpen(true);
      } catch (err) {
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

  if (
    loading &&
    (!projects || (Array.isArray(projects) && projects.length === 0))
  ) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '60vh',
        }}
      >
        <CircularProgress size={60} thickness={4} />
      </Box>
    );
  }

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
            user={user}
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
              user={user}
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

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
            <Pagination
              count={pagination.totalPages}
              page={pagination.page}
              onChange={handlePageChange}
              color="primary"
              size="large"
            />
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

          {editingProject && (
            <ProjectModal
              project={editingProject}
              onClose={() => setEditingProject(null)}
              onSubmit={(data) =>
                handleUpdateProject(editingProject?.id || '', data)
              }
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
                projectById || selectedProject || ({} as ProjectInterface)
              }
              open={!!selectedProjectId}
              onClose={handleCloseProjectDetails}
              loading={projectLoading}
              currentUserId={user?.id}
              comments={projectComments}
              loadingComments={loadingComments}
              onLoadComments={() => handleLoadComments(selectedProjectId)}
              onSupport={(isSupported) => {
                handleSupport(selectedProjectId, isSupported);
              }}
              onFollow={(isFollowing) => {
                handleFollow(selectedProjectId, isFollowing);
              }}
              onCollaborate={() => {
                setSelectedProject(projectById || selectedProject);
                setShowCollaborationModal(true);
                handleCloseProjectDetails();
              }}
            />
          )}
        </AnimatePresence>

        {/* Snackbar for error messages */}
        <Snackbar
          open={snackbarOpen}
          autoHideDuration={6000}
          onClose={handleCloseSnackbar}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
          TransitionComponent={Fade}
        >
          <Alert
            onClose={handleCloseSnackbar}
            severity="error"
            variant="filled"
            sx={{ width: '100%' }}
          >
            {error}
          </Alert>
        </Snackbar>
      </motion.div>
    </Container>
  );
};

// Helper component for project grid
const ProjectGrid: React.FC<{
  projects: ProjectInterface[];
  user: any;
  isProjectOwner: (project: ProjectInterface | null) => boolean;
  onSupport: (projectId: string, isSupported: boolean) => void;
  onFollow: (projectId: string, isFollowing: boolean) => void;
  onCollaborate: (project: ProjectInterface) => void;
  onViewDetails: (project: ProjectInterface) => void;
  emptyMessage: {
    title: string;
    description: string;
    action: () => void;
    actionText: string;
  };
}> = ({
  projects,
  user,
  isProjectOwner,
  onSupport,
  onFollow,
  onCollaborate,
  onViewDetails,
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

export default ProjectsMainPage;
