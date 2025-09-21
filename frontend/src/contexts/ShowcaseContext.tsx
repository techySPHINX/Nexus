import { ShowcaseService } from '@/services/ShowcaseService';
import {
  CollaborationRequestInterface,
  CollaborationStatus,
  CreateCollaborationRequestInterface,
  CreateProjectInterface,
  CreateProjectUpdateInterface,
  FilterProjectInterface,
  ProjectComment,
  ProjectInterface,
  ProjectTeam,
  ProjectUpdateInterface,
} from '@/types/ShowcaseType';
import React, { useCallback, useMemo, useState } from 'react';
import { useAuth } from './AuthContext';

// Define the context type with all exposed functions
export interface ShowcaseContextType {
  //states
  projects: ProjectInterface[];
  projectById: ProjectInterface | null;
  projectByIdUpdates: ProjectUpdateInterface[];
  collaborationRequests: CollaborationRequestInterface[];
  loading: boolean;
  comments: ProjectComment[];
  teamMembers: ProjectTeam[];
  error: string | null;
  clearError: () => void;

  //Actions
  createProject: (data: CreateProjectInterface) => Promise<void>;
  updateProject: (
    projectId: string,
    data: Partial<CreateProjectInterface>
  ) => Promise<void>;
  deleteProject: (projectId: string) => Promise<void>;
  getAllProjects: (
    filterProjectDto?: FilterProjectInterface | undefined
  ) => Promise<void>;
  getProjectById: (projectId: string) => Promise<void>;
  createProjectUpdate: (
    projectId: string,
    data: CreateProjectUpdateInterface
  ) => Promise<void>;
  getProjectIDComments: (projectId: string) => Promise<void>;
  getProjectUpdates: (projectId: string) => Promise<void>;
  supportProject: (projectId: string) => Promise<void>;
  unsupportProject: (projectId: string) => Promise<void>;
  followProject: (projectId: string) => Promise<void>;
  unfollowProject: (projectId: string) => Promise<void>;
  requestCollaboration: (
    projectId: string,
    data: CreateCollaborationRequestInterface
  ) => Promise<void>;
  updateStatusCollaboration: (
    projectId: string,
    status: CollaborationStatus
  ) => Promise<void>;
  getCollaborationRequests: (projectId: string) => Promise<void>;
  createComment: (projectId: string, comment: string) => Promise<void>;
  getComments: (projectId: string) => Promise<void>;
  createProjectTeamMember: (
    projectId: string,
    data: ProjectTeam
  ) => Promise<void>;
  getProjectTeamMembers: (projectId: string) => Promise<void>;
  removeProjectTeamMember: (projectId: string, userId: string) => Promise<void>;
}

const ShowcaseContext = React.createContext<ShowcaseContextType>({
  projects: [],
  projectById: null,
  projectByIdUpdates: [],
  collaborationRequests: [],
  loading: false,
  comments: [],
  teamMembers: [],
  error: null,
  clearError: () => {},

  //actions
  createProject: async () => {},
  updateProject: async () => {},
  deleteProject: async () => {},
  getAllProjects: async () => {},
  getProjectById: async () => {},
  getProjectIDComments: async () => {},
  createProjectUpdate: async () => {},
  getProjectUpdates: async () => {},
  supportProject: async () => {},
  unsupportProject: async () => {},
  followProject: async () => {},
  unfollowProject: async () => {},
  requestCollaboration: async () => {},
  updateStatusCollaboration: async () => {},
  getCollaborationRequests: async () => {},
  createComment: async () => {},
  getComments: async () => {},
  createProjectTeamMember: async () => {},
  getProjectTeamMembers: async () => {},
  removeProjectTeamMember: async () => {},
});

export const ShowcaseProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [loading, setLoading] = useState<boolean>(false);
  const { user } = useAuth();
  const [projects, setProjects] = useState<ProjectInterface[]>([]);
  const [projectById, setProjectById] = useState<ProjectInterface | null>(null);
  const [projectByIdUpdates, setProjectByIdUpdates] = useState<
    ProjectUpdateInterface[]
  >([]);
  const [collaborationRequests, setCollaborationRequests] = useState<
    CollaborationRequestInterface[]
  >([]);
  const [comments, setComments] = useState<ProjectComment[]>([]);
  const [teamMembers, setTeamMembers] = useState<ProjectTeam[]>([]);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => setError(null), []);

  const createProject = useCallback(
    async (data: CreateProjectInterface) => {
      if (!user) {
        setError('User not authenticated');
        return;
      }
      setLoading(true);
      try {
        console.log('Creating project with data 2:', data);
        const response = await ShowcaseService.createProject(data);
        setProjects((prev) => [response, ...prev]);
      } catch (err) {
        setError(
          `Failed to create project: ${err instanceof Error ? err.message : String(err)}`
        );
      } finally {
        setLoading(false);
      }
    },
    [user]
  );

  const updateProject = useCallback(
    async (projectId: string, data: Partial<CreateProjectInterface>) => {
      if (!user) {
        setError('User not authenticated');
        return;
      }
      setLoading(true);
      try {
        const response = await ShowcaseService.updateProject(projectId, data);
        setProjects((prev) =>
          prev.map((project) => (project.id === projectId ? response : project))
        );
        if (projectById?.id === projectId) {
          setProjectById(response);
        }
      } catch (err) {
        setError(
          `Failed to update project: ${err instanceof Error ? err.message : String(err)}`
        );
      } finally {
        setLoading(false);
      }
    },
    [user, projectById]
  );

  const deleteProject = useCallback(
    async (projectId: string) => {
      if (!user) {
        setError('User not authenticated');
        return;
      }
      setLoading(true);
      try {
        await ShowcaseService.deleteProject(projectId);
        setProjects((prev) =>
          prev.filter((project) => project.id !== projectId)
        );
        if (projectById?.id === projectId) {
          setProjectById(null);
        }
      } catch (err) {
        setError(
          `Failed to delete project: ${err instanceof Error ? err.message : String(err)}`
        );
      } finally {
        setLoading(false);
      }
    },
    [user, projectById]
  );

  const getAllProjects = useCallback(
    async (filterProjectDto?: FilterProjectInterface | undefined) => {
      if (!user) {
        setError('User not authenticated');
        return;
      }
      setLoading(true);
      try {
        const response = await ShowcaseService.getAllProjects(filterProjectDto);
        setProjects(response);
      } catch (err) {
        setError(
          `Failed to get projects: ${err instanceof Error ? err.message : String(err)}`
        );
      } finally {
        setLoading(false);
      }
    },
    [user]
  );

  const getProjectById = useCallback(
    async (projectId: string) => {
      if (!user) {
        setError('User not authenticated');
        return;
      }
      setLoading(true);
      try {
        console.log('Fetching project by ID:', projectId);
        const response = await ShowcaseService.getProjectById(projectId);
        setProjectById(response);
        setProjectByIdUpdates(response.updates || []);
        setProjects((prev) => {
          // If the project already exists in the list, update it; otherwise, add it
          const exists = prev.some((proj) => proj.id === response.id);
          if (exists) {
            return prev.map((proj) =>
              proj.id === response.id ? response : proj
            );
          } else {
            return [response, ...prev];
          }
        });
      } catch (err) {
        setError(
          `Failed to get project by ID: ${err instanceof Error ? err.message : String(err)}`
        );
      } finally {
        setLoading(false);
      }
    },
    [user]
  );

  const getProjectIDComments = useCallback(
    async (projectId: string) => {
      if (!user) {
        setError('User not authenticated');
        return;
      }
      setLoading(true);
      try {
        const response = await ShowcaseService.getProjectComments(projectId);
        return response || [];
      } catch (err) {
        setError(
          `Failed to get project comments: ${err instanceof Error ? err.message : String(err)}`
        );
        return [];
      } finally {
        setLoading(false);
      }
    },
    [user]
  );

  const createProjectUpdate = useCallback(
    async (projectId: string, data: CreateProjectUpdateInterface) => {
      if (!user) {
        setError('User not authenticated');
        return;
      }
      setLoading(true);
      try {
        const response = await ShowcaseService.createProjectUpdate(
          projectId,
          data
        );
        setProjectById((project) =>
          project
            ? {
                ...project,
                updates: project.updates
                  ? [...project.updates, response]
                  : [response],
              }
            : project
        );
        setProjectByIdUpdates((prev) => [...prev, response]);
      } catch (err) {
        setError(
          `Failed to create project update: ${err instanceof Error ? err.message : String(err)}`
        );
      } finally {
        setLoading(false);
      }
    },
    [user]
  );

  const getProjectUpdates = useCallback(
    async (projectId: string) => {
      if (!user) {
        setError('User not authenticated');
        return;
      }
      setLoading(true);
      try {
        const response = await ShowcaseService.getProjectUpdates(projectId);
        setProjectByIdUpdates(response);
      } catch (err) {
        setError(
          `Failed to get project updates: ${err instanceof Error ? err.message : String(err)}`
        );
      } finally {
        setLoading(false);
      }
    },
    [user]
  );

  const supportProject = useCallback(
    async (projectId: string) => {
      if (!user) {
        setError('User not authenticated');
        return;
      }
      setLoading(true);
      try {
        console.log('Supporting project ID:', projectId);
        await ShowcaseService.supportProject(projectId);
        // Refresh project data
        await getProjectById(projectId);
      } catch (err) {
        setError(
          `Failed to support project: ${err instanceof Error ? err.message : String(err)}`
        );
      } finally {
        setLoading(false);
      }
    },
    [user, getProjectById]
  );

  const unsupportProject = useCallback(
    async (projectId: string) => {
      if (!user) {
        setError('User not authenticated');
        return;
      }
      setLoading(true);
      try {
        await ShowcaseService.unsupportProject(projectId);
        // Refresh project data
        await getProjectById(projectId);
      } catch (err) {
        setError(
          `Failed to unsupport project: ${err instanceof Error ? err.message : String(err)}`
        );
      } finally {
        setLoading(false);
      }
    },
    [user, getProjectById]
  );

  const followProject = useCallback(
    async (projectId: string) => {
      if (!user) {
        setError('User not authenticated');
        return;
      }
      setLoading(true);
      try {
        await ShowcaseService.followProject(projectId);
        // Refresh project data
        await getProjectById(projectId);
      } catch (err) {
        setError(
          `Failed to follow project: ${err instanceof Error ? err.message : String(err)}`
        );
      } finally {
        setLoading(false);
      }
    },
    [user, getProjectById]
  );

  const unfollowProject = useCallback(
    async (projectId: string) => {
      if (!user) {
        setError('User not authenticated');
        return;
      }
      setLoading(true);
      try {
        await ShowcaseService.unfollowProject(projectId);
        // Refresh project data
        await getProjectById(projectId);
      } catch (err) {
        setError(
          `Failed to unfollow project: ${err instanceof Error ? err.message : String(err)}`
        );
      } finally {
        setLoading(false);
      }
    },
    [user, getProjectById]
  );

  const requestCollaboration = useCallback(
    async (projectId: string, data: CreateCollaborationRequestInterface) => {
      if (!user) {
        setError('User not authenticated');
        return;
      }
      setLoading(true);
      try {
        await ShowcaseService.requestCollaboration(projectId, data);
      } catch (err) {
        setError(
          `Failed to request collaboration: ${err instanceof Error ? err.message : String(err)}`
        );
      } finally {
        setLoading(false);
      }
    },
    [user]
  );

  const getCollaborationRequests = useCallback(
    async (projectId: string) => {
      if (!user) {
        setError('User not authenticated');
        return;
      }
      setLoading(true);
      try {
        const response =
          await ShowcaseService.getCollaborationRequests(projectId);
        setCollaborationRequests(response);
      } catch (err) {
        setError(
          `Failed to get collaboration requests: ${err instanceof Error ? err.message : String(err)}`
        );
      } finally {
        setLoading(false);
      }
    },
    [user]
  );

  const updateStatusCollaboration = useCallback(
    async (projectId: string, status: CollaborationStatus) => {
      if (!user) {
        setError('User not authenticated');
        return;
      }
      setLoading(true);
      try {
        await ShowcaseService.updateStatusCollaboration(projectId, status);
        // Refresh collaboration requests
        await getCollaborationRequests(projectId);
      } catch (err) {
        setError(
          `Failed to update collaboration status: ${err instanceof Error ? err.message : String(err)}`
        );
      } finally {
        setLoading(false);
      }
    },
    [user, getCollaborationRequests]
  );

  const createComment = useCallback(
    async (projectId: string, data: string) => {
      if (!user) {
        setError('User not authenticated');
        return;
      }
      setLoading(true);
      try {
        const response = await ShowcaseService.createComment(projectId, data);
        setComments((prev) => [...prev, response]);
      } catch (err) {
        setError(
          `Failed to create comment: ${err instanceof Error ? err.message : String(err)}`
        );
      } finally {
        setLoading(false);
      }
    },
    [user]
  );

  const getComments = useCallback(
    async (projectId: string) => {
      if (!user) {
        setError('User not authenticated');
        return;
      }
      setLoading(true);
      try {
        const response = await ShowcaseService.getComments(projectId);
        setComments(response);
      } catch (err) {
        setError(
          `Failed to get comments: ${err instanceof Error ? err.message : String(err)}`
        );
      } finally {
        setLoading(false);
      }
    },
    [user]
  );

  const createProjectTeamMember = useCallback(
    async (projectId: string, data: ProjectTeam) => {
      if (!user) {
        setError('User not authenticated');
        return;
      }
      setLoading(true);
      try {
        const response = await ShowcaseService.createProjectTeamMember(
          projectId,
          data
        );
        setTeamMembers((prev) => [...prev, response]);
      } catch (err) {
        setError(
          `Failed to create team member: ${err instanceof Error ? err.message : String(err)}`
        );
      } finally {
        setLoading(false);
      }
    },
    [user]
  );

  const getProjectTeamMembers = useCallback(
    async (projectId: string) => {
      if (!user) {
        setError('User not authenticated');
        return;
      }
      setLoading(true);
      try {
        const response = await ShowcaseService.getProjectTeamMembers(projectId);
        setTeamMembers(response);
      } catch (err) {
        setError(
          `Failed to get team members: ${err instanceof Error ? err.message : String(err)}`
        );
      } finally {
        setLoading(false);
      }
    },
    [user]
  );

  const removeProjectTeamMember = useCallback(
    async (projectId: string, userId: string) => {
      if (!user) {
        setError('User not authenticated');
        return;
      }
      setLoading(true);
      try {
        await ShowcaseService.removeProjectTeamMember(projectId, userId);
        setTeamMembers((prev) =>
          prev.filter((member) => member.userId !== userId)
        );
      } catch (err) {
        setError(
          `Failed to remove team member: ${err instanceof Error ? err.message : String(err)}`
        );
      } finally {
        setLoading(false);
      }
    },
    [user]
  );

  const state: ShowcaseContextType = useMemo(
    () => ({
      projects,
      projectById,
      projectByIdUpdates,
      collaborationRequests,
      loading,
      error,
      comments,
      teamMembers,
      clearError,

      //actions
      createProject,
      updateProject,
      deleteProject,
      getAllProjects,
      getProjectById,
      getProjectIDComments,
      createProjectUpdate,
      getProjectUpdates,
      supportProject,
      unsupportProject,
      followProject,
      unfollowProject,
      requestCollaboration,
      updateStatusCollaboration,
      getCollaborationRequests,
      createComment,
      getComments,
      createProjectTeamMember,
      getProjectTeamMembers,
      removeProjectTeamMember,
    }),
    [
      projects,
      projectById,
      projectByIdUpdates,
      collaborationRequests,
      loading,
      error,
      comments,
      teamMembers,
      clearError,
      createProject,
      updateProject,
      deleteProject,
      getAllProjects,
      getProjectById,
      getProjectIDComments,
      createProjectUpdate,
      getProjectUpdates,
      supportProject,
      unsupportProject,
      followProject,
      unfollowProject,
      requestCollaboration,
      updateStatusCollaboration,
      getCollaborationRequests,
      createComment,
      getComments,
      createProjectTeamMember,
      getProjectTeamMembers,
      removeProjectTeamMember,
    ]
  );

  return (
    <ShowcaseContext.Provider value={state}>
      {children}
    </ShowcaseContext.Provider>
  );
};

export const useShowcase = (): ShowcaseContextType => {
  const context = React.useContext(ShowcaseContext);
  if (context === undefined) {
    throw new Error('useShowcase must be used within a ShowcaseProvider');
  }
  return context;
};

export default ShowcaseContext;
