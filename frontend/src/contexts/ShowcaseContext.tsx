import { ShowcaseService } from '@/services/ShowcaseService';
import {
  CollaborationRequestInterface,
  CollaborationStatus,
  CreateCollaborationRequestInterface,
  CreateProjectInterface,
  CreateProjectUpdateInterface,
  FilterProjectInterface,
  ProjectInterface,
  ProjectTeam,
  ProjectUpdateInterface,
} from '@/types/ShowcaseType';
import React from 'react';
import { useAuth } from './AuthContext';

// Define the context type with all exposed functions
export interface ShowcaseContextType {
  //states
  projects: ProjectInterface[];
  projectById: ProjectInterface | null;
  projectByIdUpdates: ProjectUpdateInterface[];
  collaborationRequests: CollaborationRequestInterface[];
  loading: boolean;

  //Actions
  createProject: (data: ProjectInterface) => Promise<void>;
  updateProject: (
    projectId: string,
    data: Partial<ProjectInterface>
  ) => Promise<void>;
  deleteProject: (projectId: string) => Promise<void>;
  getAllProjects: (
    filterProjectDto?: FilterProjectInterface | undefined
  ) => Promise<void>;
  getProjectById: (projectId: string) => Promise<void>;
  createProjectUpdate: (
    projectId: string,
    data: ProjectUpdateInterface
  ) => Promise<void>;
  getProjectUpdates: (projectId: string) => Promise<void>;
  supportProject: (projectId: string) => Promise<void>;
  unsupportProject: (projectId: string) => Promise<void>;
  followProject: (projectId: string) => Promise<void>;
  unfollowProject: (projectId: string) => Promise<void>;
  requestCollaboration: (
    projectId: string,
    data: CollaborationRequestInterface
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

  //actions
  createProject: async () => {},
  updateProject: async () => {},
  deleteProject: async () => {},
  getAllProjects: async () => {},
  getProjectById: async () => {},
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
  const [loading, setLoading] = React.useState<boolean>(false);
  const { user } = useAuth();
  const [projects, setProjects] = React.useState<ProjectInterface[]>([]);
  const [projectById, setProjectById] = React.useState<ProjectInterface | null>(
    null
  );
  const [projectByIdUpdates, setProjectByIdUpdates] = React.useState<
    ProjectUpdateInterface[]
  >([]);
  const [collaborationRequests, setCollaborationRequests] = React.useState<
    CollaborationRequestInterface[]
  >([]);

  const createProject = async (data: CreateProjectInterface) => {
    if (!user) {
      throw new Error('User not authenticated');
    }
    setLoading(true);
    try {
      const response = await ShowcaseService.createProject(data);
      setProjects((prev) => [...prev, response]);
    } catch (error) {
      throw new Error('Failed to create project with error: ' + error);
    } finally {
      setLoading(false);
    }
  };

  const updateProject = async (
    projectId: string,
    data: Partial<CreateProjectInterface>
  ) => {
    if (!user) {
      throw new Error('User not authenticated');
    }
    setLoading(true);
    try {
      const response = await ShowcaseService.updateProject(projectId, data);
      setProjects((prev) =>
        prev.map((project) => (project.id === projectId ? response : project))
      );
    } catch (error) {
      throw new Error('Failed to update project with error: ' + error);
    } finally {
      setLoading(false);
    }
  };

  const deleteProject = async (projectId: string) => {
    try {
      if (!user) {
        throw new Error('User not authenticated');
      }
      setLoading(true);
      const response = await ShowcaseService.deleteProject(projectId);
      setProjects((prev) =>
        prev.filter((project) => project.id !== response.id)
      );
    } catch (error) {
      throw new Error('Failed to delete project with error: ' + error);
    } finally {
      setLoading(false);
    }
  };

  const getAllProjects = async (
    filterProjectDto?: FilterProjectInterface | undefined
  ) => {
    if (!user) {
      throw new Error('User not authenticated');
    }
    setLoading(true);
    try {
      const response = await ShowcaseService.getAllProjects(filterProjectDto);
      setProjects(response);
    } catch (error) {
      throw new Error('Failed to get projects with error: ' + error);
    } finally {
      setLoading(false);
    }
  };

  const getProjectById = async (projectId: string) => {
    if (!user) {
      throw new Error('User not authenticated');
    }
    setLoading(true);
    try {
      const response = await ShowcaseService.getProjectById(projectId);
      setProjectById(response);
      setProjectByIdUpdates(response.updates || []);
    } catch (error) {
      throw new Error('Failed to get project by ID with error: ' + error);
    } finally {
      setLoading(false);
    }
  };

  const createProjectUpdate = async (
    projectId: string,
    data: CreateProjectUpdateInterface
  ) => {
    if (!user) {
      throw new Error('User not authenticated');
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
    } catch (error) {
      throw new Error('Failed to create project update with error: ' + error);
    } finally {
      setLoading(false);
    }
  };

  // isn't this redundant with the updates in getProjectById?
  const getProjectUpdates = async (projectId: string) => {
    if (!user) {
      throw new Error('User not authenticated');
    }
    setLoading(true);
    try {
      const response = await ShowcaseService.getProjectUpdates(projectId);
      setProjectByIdUpdates(response);
    } catch (error) {
      throw new Error('Failed to get project updates with error: ' + error);
    } finally {
      setLoading(false);
    }
  };

  const supportProject = async (projectId: string) => {
    if (!user) {
      throw new Error('User not authenticated');
    }
    setLoading(true);
    try {
      await ShowcaseService.supportProject(projectId);
    } catch (error) {
      throw new Error('Failed to support project with error: ' + error);
    } finally {
      setLoading(false);
    }
  };

  const unsupportProject = async (projectId: string) => {
    if (!user) {
      throw new Error('User not authenticated');
    }
    setLoading(true);
    try {
      await ShowcaseService.unsupportProject(projectId);
    } catch (error) {
      throw new Error('Failed to unsupport project with error: ' + error);
    } finally {
      setLoading(false);
    }
  };

  const followProject = async (projectId: string) => {
    if (!user) {
      throw new Error('User not authenticated');
    }
    setLoading(true);
    try {
      await ShowcaseService.followProject(projectId);
    } catch (error) {
      throw new Error('Failed to follow project with error: ' + error);
    } finally {
      setLoading(false);
    }
  };

  const unfollowProject = async (projectId: string) => {
    if (!user) {
      throw new Error('User not authenticated');
    }
    setLoading(true);
    try {
      await ShowcaseService.unfollowProject(projectId);
    } catch (error) {
      throw new Error('Failed to unfollow project with error: ' + error);
    } finally {
      setLoading(false);
    }
  };

  const requestCollaboration = async (
    projectId: string,
    data: CreateCollaborationRequestInterface
  ) => {
    if (!user) {
      throw new Error('User not authenticated');
    }
    setLoading(true);
    try {
      await ShowcaseService.requestCollaboration(projectId, data);
    } catch (error) {
      throw new Error('Failed to request collaboration with error: ' + error);
    } finally {
      setLoading(false);
    }
  };

  const updateStatusCollaboration = async (
    projectId: string,
    status: CollaborationStatus
  ) => {
    if (!user) {
      throw new Error('User not authenticated');
    }
    setLoading(true);
    try {
      await ShowcaseService.updateStatusCollaboration(projectId, status);
    } catch (error) {
      throw new Error(
        'Failed to update status collaboration with error: ' + error
      );
    } finally {
      setLoading(false);
    }
  };

  const getCollaborationRequests = async (projectId: string) => {
    if (!user) {
      throw new Error('User not authenticated');
    }
    setLoading(true);
    try {
      const response =
        await ShowcaseService.getCollaborationRequests(projectId);
      setCollaborationRequests(response);
    } catch (error) {
      throw new Error(
        'Failed to get collaboration requests with error: ' + error
      );
    } finally {
      setLoading(false);
    }
  };

  const createComment = async (projectId: string, data: string) => {
    if (!user) {
      throw new Error('User not authenticated');
    }
    setLoading(true);
    try {
      const response = await ShowcaseService.createComment(projectId, data);
      return response;
    } catch (error) {
      throw new Error('Failed to create comment with error: ' + error);
    } finally {
      setLoading(false);
    }
  };

  const getComments = async (projectId: string) => {
    try {
      const response = await ShowcaseService.getComments(projectId);
      return response;
    } catch (error) {
      throw new Error('Failed to get comments with error: ' + error);
    }
  };

  const createProjectTeamMember = async (
    projectId: string,
    data: ProjectTeam
  ) => {
    try {
      const response = await ShowcaseService.createProjectTeamMember(
        projectId,
        data
      );
      return response;
    } catch (error) {
      throw new Error(
        'Failed to create project team member with error: ' + error
      );
    }
  };

  const getProjectTeamMembers = async (projectId: string) => {
    try {
      const response = await ShowcaseService.getProjectTeamMembers(projectId);
      return response;
    } catch (error) {
      throw new Error(
        'Failed to get project team members with error: ' + error
      );
    }
  };

  const removeProjectTeamMember = async (projectId: string, userId: string) => {
    try {
      const response = await ShowcaseService.removeProjectTeamMember(
        projectId,
        userId
      );
      return response;
    } catch (error) {
      throw new Error(
        'Failed to remove project team member with error: ' + error
      );
    }
  };

  const state: ShowcaseContextType = {
    projects,
    projectById,
    projectByIdUpdates,
    collaborationRequests,
    loading,

    //actions
    createProject,
    updateProject,
    deleteProject,
    getAllProjects,
    getProjectById,
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
  };

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
