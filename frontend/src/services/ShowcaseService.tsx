import {
  CreateCollaborationRequestInterface,
  CollaborationStatus,
  CreateProjectInterface,
  CreateProjectUpdateInterface,
  FilterProjectInterface,
  ProjectTeam,
  ProjectCommentsResponse,
} from '@/types/ShowcaseType';
import api from './api';
import { getErrorMessage } from '@/utils/errorHandler';
import { Startup } from '@/types/profileType';
import { StartupSummary } from '@/types/StartupType';

export const ShowcaseService = {
  createProject: async (data: CreateProjectInterface) => {
    try {
      const response = await api.post('/showcase/project', data);
      return response.data;
    } catch (error) {
      throw new Error(
        'Failed to create project with error: ' + getErrorMessage(error)
      );
    }
  },

  updateProject: async (
    projectId: string,
    data: Partial<CreateProjectInterface>
  ) => {
    try {
      const response = await api.put(`/showcase/project/${projectId}`, data);
      return response.data.updatedProject;
    } catch (error) {
      throw new Error(
        'Failed to update project with error: ' + getErrorMessage(error)
      );
    }
  },

  deleteProject: async (projectId: string) => {
    try {
      const response = await api.delete(`/showcase/project/${projectId}`);
      return response.data;
    } catch (error) {
      throw new Error(
        'Failed to delete project with error: ' + getErrorMessage(error)
      );
    }
  },

  getProjectCounts: async () => {
    try {
      console.log('Fetching project counts');
      const response = await api.get('/showcase/project/count');
      return response.data;
    } catch (error) {
      throw new Error(
        'Failed to get project counts with error: ' + getErrorMessage(error)
      );
    }
  },

  getAllProjects: async (filterProjectDto?: FilterProjectInterface) => {
    try {
      const response = await api.get('/showcase/project', {
        params: filterProjectDto,
      });
      console.log('Fetched projects:', response.data);
      return response.data;
    } catch (error) {
      throw new Error(
        'Failed to get projects with error: ' + getErrorMessage(error)
      );
    }
  },

  getProjectById: async (projectId: string) => {
    try {
      const response = await api.get(`/showcase/project/${projectId}`);
      return response.data;
    } catch (error) {
      throw new Error(
        'Failed to get project by ID with error: ' + getErrorMessage(error)
      );
    }
  },

  getMyProjects: async (filterProjectDto?: FilterProjectInterface) => {
    try {
      console.log('Fetching my projects with filter:', filterProjectDto);
      const response = await api.get('/showcase/project/my/projects', {
        params: filterProjectDto,
      });
      return response.data;
    } catch (error) {
      throw new Error(
        'Failed to get my projects with error: ' + getErrorMessage(error)
      );
    }
  },

  getProjectsByOwner: async (
    ownerId: string,
    filterProjectDto?: FilterProjectInterface
  ) => {
    try {
      console.log('getting projects for ownerId:', ownerId);
      const response = await api.get(`/showcase/project/owner/${ownerId}`, {
        params: filterProjectDto,
      });
      return response.data;
    } catch (error) {
      throw new Error(
        'Failed to get projects by owner with error: ' + getErrorMessage(error)
      );
    }
  },

  getSupportedProjects: async (filterProjectDto?: FilterProjectInterface) => {
    try {
      console.log('Fetching supported projects with filter:', filterProjectDto);
      const response = await api.get('/showcase/project/my/supported', {
        params: filterProjectDto,
      });
      return response.data;
    } catch (error) {
      throw new Error(
        'Failed to get supported projects with error: ' + getErrorMessage(error)
      );
    }
  },

  getFollowedProjects: async (filterProjectDto?: FilterProjectInterface) => {
    try {
      console.log('Fetching followed projects with filter:', filterProjectDto);
      const response = await api.get('/showcase/project/my/followed', {
        params: filterProjectDto,
      });
      return response.data;
    } catch (error) {
      throw new Error(
        'Failed to get followed projects with error: ' + getErrorMessage(error)
      );
    }
  },

  createProjectUpdate: async (
    projectId: string,
    data: CreateProjectUpdateInterface
  ) => {
    try {
      const response = await api.post(
        `/showcase/project/${projectId}/update`,
        data
      );
      return response.data;
    } catch (error) {
      throw new Error(
        'Failed to create Project update with error ' + getErrorMessage(error)
      );
    }
  },

  getProjectUpdates: async (projectId: string) => {
    try {
      const response = await api.get(`/showcase/project/${projectId}/updates`);
      console.log('Fetched updates:', response.data);
      return response.data;
    } catch (error) {
      throw new Error(
        'Failed to get Project updates with error ' + getErrorMessage(error)
      );
    }
  },

  supportProject: async (projectId: string) => {
    try {
      await api.post(`/showcase/${projectId}/support`);
    } catch (error) {
      throw new Error(
        'Failed to support project with error: ' + getErrorMessage(error)
      );
    }
  },

  unsupportProject: async (projectId: string) => {
    try {
      await api.delete(`/showcase/${projectId}/support`);
    } catch (error) {
      throw new Error(
        'Failed to unsupport project with error: ' + getErrorMessage(error)
      );
    }
  },

  followProject: async (projectId: string) => {
    try {
      await api.post(`/showcase/${projectId}/follow`);
    } catch (error) {
      throw new Error(
        'Failed to follow project with error: ' + getErrorMessage(error)
      );
    }
  },

  unfollowProject: async (projectId: string) => {
    try {
      await api.delete(`/showcase/${projectId}/follow`);
    } catch (error) {
      throw new Error(
        'Failed to unfollow project with error: ' + getErrorMessage(error)
      );
    }
  },

  requestCollaboration: async (
    projectId: string,
    data?: CreateCollaborationRequestInterface
  ) => {
    try {
      await api.post(`/showcase/${projectId}/collaborate`, data);
    } catch (error) {
      throw new Error(
        'Failed to create collaboration request with error: ' +
          getErrorMessage(error)
      );
    }
  },

  updateStatusCollaboration: async (
    projectId: string,
    status: CollaborationStatus
  ) => {
    try {
      await api.put(`/showcase/${projectId}/collaborate`, { status });
      const response = await api.put(`/showcase/${projectId}/collaborate`, {
        status,
      });
      return response.data;
    } catch (error) {
      throw new Error(
        'Failed to update collaboration request status with error: ' +
          getErrorMessage(error)
      );
    }
  },

  getCollaborationRequests: async (projectId: string) => {
    try {
      const response = await api.get(`/showcase/${projectId}/collaborate`);
      return response.data;
    } catch (error) {
      throw new Error(
        'Failed to get collaboration requests with error: ' +
          getErrorMessage(error)
      );
    }
  },

  createComment: async (projectId: string, comment: string) => {
    try {
      const response = await api.post(`/showcase/${projectId}/comments`, {
        comment,
      });
      return response.data;
    } catch (error) {
      throw new Error(
        'Failed to create comment with error: ' + getErrorMessage(error)
      );
    }
  },

  // Add this method to your ShowcaseService
  async getComments(
    projectId: string,
    page: number = 1
  ): Promise<ProjectCommentsResponse> {
    try {
      console.log('Fetching comments for project:', projectId, 'page:', page);
      const response = await api.get(`/showcase/${projectId}/comments`, {
        params: { page },
      });
      return response.data;
    } catch (error) {
      throw new Error(
        'Failed to get project comments with error: ' + getErrorMessage(error)
      );
    }
  },

  async getUpdates(projectId: string) {
    try {
      console.log('Fetching updates for project:', projectId);
      const response = await api.get(`/showcase/project/${projectId}/updates`);
      console.log('Fetched updates:', response.data);
      return response.data;
    } catch (error) {
      throw new Error(
        'Failed to get project updates with error: ' + getErrorMessage(error)
      );
    }
  },

  createProjectTeamMember: async (projectId: string, data: ProjectTeam) => {
    try {
      const payload = {
        userId: data.user?.id,
        role: data.role,
      };
      console.log('Adding team member to project:', projectId, payload);
      await api.post(`/showcase/${projectId}/team`, payload);
    } catch (error) {
      throw new Error(
        'Failed to add team member with error: ' + getErrorMessage(error)
      );
    }
  },

  getProjectTeamMembers: async (projectId: string) => {
    try {
      console.log('Fetching team members for project:', projectId);
      const response = await api.get(`/showcase/${projectId}/team`);
      return response.data;
    } catch (error) {
      throw new Error(
        'Failed to get project team with error: ' + getErrorMessage(error)
      );
    }
  },

  removeProjectTeamMember: async (projectId: string, userId: string) => {
    try {
      const response = await api.delete(
        `/showcase/${projectId}/team/${userId}`
      );
      return response.data;
    } catch (error) {
      throw new Error(
        'Failed to remove team member with error: ' + getErrorMessage(error)
      );
    }
  },

  getSeekingOptions: async (projectId: string) => {
    try {
      console.log('Fetching seeking options for project:', projectId);
      const response = await api.get(`/showcase/${projectId}/seeking-status`);
      return response.data;
    } catch (error) {
      throw new Error(
        'Failed to get project seeking options with error: ' +
          getErrorMessage(error)
      );
    }
  },

  getAllProjectTypes: async () => {
    try {
      const response = await api.get('/showcase/tags');
      return response.data;
    } catch (error) {
      throw new Error(
        'Failed to get project types with error: ' + getErrorMessage(error)
      );
    }
  },

  // Startup related endpoints
  getStartups: async (filterStartupDto?: {
    search?: string;
    status?: string;
    cursor?: string | null;
    pageSize?: number;
  }) => {
    try {
      console.log('Fetching startups with', filterStartupDto);
      const response = await api.get('/showcase/startup', {
        params: filterStartupDto,
      });
      return response.data;
    } catch (error) {
      throw new Error('Failed to get startups: ' + getErrorMessage(error));
    }
  },

  getMyStartups: async (filterStartupDto?: {
    search?: string;
    status?: string;
    cursor?: string | null;
    pageSize?: number;
  }) => {
    try {
      const response = await api.get('/showcase/startup/my', {
        params: filterStartupDto,
      });
      return response.data;
    } catch (error) {
      throw new Error('Failed to get my startups: ' + getErrorMessage(error));
    }
  },

  getFollowedStartups: async (filterStartupDto?: {
    search?: string;
    status?: string;
    cursor?: string | null;
    pageSize?: number;
  }) => {
    try {
      const response = await api.get('/showcase/startup/followed', {
        params: filterStartupDto,
      });
      return response.data;
    } catch (error) {
      throw new Error(
        'Failed to get followed startups: ' + getErrorMessage(error)
      );
    }
  },

  createStartup: async (
    data: Partial<StartupSummary>
  ): Promise<StartupSummary> => {
    try {
      console.log('Creating startup with data:', data);
      const response = await api.post('/showcase/startup', data);
      return response.data;
    } catch (error) {
      throw new Error('Failed to create startup: ' + getErrorMessage(error));
    }
  },

  updateStartup: async (
    startupId: string,
    data: Partial<StartupSummary>
  ): Promise<StartupSummary> => {
    try {
      console.log('Updating startup ID:', startupId, 'with data:', data);
      const response = await api.put(`/showcase/startup/${startupId}`, data);
      return response.data;
    } catch (error) {
      throw new Error('Failed to update startup: ' + getErrorMessage(error));
    }
  },

  deleteStartup: async (startupId: string): Promise<void> => {
    try {
      console.log('Deleting startup ID:', startupId);
      await api.delete(`/showcase/startup/${startupId}`);
    } catch (error) {
      throw new Error('Failed to delete startup: ' + getErrorMessage(error));
    }
  },

  getStartupById: async (startupId: string): Promise<Startup> => {
    try {
      console.log('Fetching startup by ID:', startupId);
      const response = await api.get(`/showcase/startup/${startupId}`);
      return response.data;
    } catch (error) {
      throw new Error('Failed to get startup: ' + getErrorMessage(error));
    }
  },

  followStartup: async (startupId: string) => {
    try {
      console.log('Following startup with ID:', startupId);
      const response = await api.post(`/showcase/startup/${startupId}/follow`);
      return response.data;
    } catch (error) {
      throw new Error('Failed to follow startup: ' + getErrorMessage(error));
    }
  },

  unfollowStartup: async (startupId: string) => {
    try {
      console.log('Unfollowing startup with ID:', startupId);
      const response = await api.delete(
        `/showcase/startup/${startupId}/follow`
      );
      return response.data;
    } catch (error) {
      throw new Error('Failed to unfollow startup: ' + getErrorMessage(error));
    }
  },

  createStartupComment: async (startupId: string, comment: string) => {
    try {
      console.log('Creating comment for startup ID:', startupId);
      const response = await api.post(
        `/showcase/startup/${startupId}/comments`,
        { comment }
      );
      return response.data;
    } catch (error) {
      throw new Error(
        'Failed to create startup comment: ' + getErrorMessage(error)
      );
    }
  },

  getStartupComments: async (startupId: string, page: number = 1) => {
    try {
      console.log(
        'Fetching comments for startup ID:',
        startupId,
        'page:',
        page
      );
      const response = await api.get(
        `/showcase/startup/${startupId}/comments`,
        { params: { page } }
      );
      return response.data;
    } catch (error) {
      throw new Error(
        'Failed to get startup comments: ' + getErrorMessage(error)
      );
    }
  },
};
