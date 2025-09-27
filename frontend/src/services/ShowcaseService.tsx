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

export const ShowcaseService = {
  createProject: async (data: CreateProjectInterface) => {
    try {
      const response = await api.post('/showcase/project', data);
      return response.data;
    } catch (error) {
      throw new Error('Failed to create project with error: ' + error);
    }
  },

  updateProject: async (
    projectId: string,
    data: Partial<CreateProjectInterface>
  ) => {
    try {
      const response = await api.put(`/showcase/project/${projectId}`, data);
      return response.data;
    } catch (error) {
      throw new Error('Failed to update project with error: ' + error);
    }
  },

  deleteProject: async (projectId: string) => {
    try {
      const response = await api.delete(`/showcase/project/${projectId}`);
      return response.data;
    } catch (error) {
      throw new Error('Failed to delete project with error: ' + error);
    }
  },

  getAllProjects: async (filterProjectDto?: FilterProjectInterface) => {
    try {
      console.log('API call - getAllProjects with filters:', filterProjectDto);
      const response = await api.get('/showcase/project', {
        params: filterProjectDto,
      });
      return response.data;
    } catch (error) {
      throw new Error('Failed to get projects with error: ' + error);
    }
  },

  getProjectById: async (projectId: string) => {
    try {
      console.log('API call - getProjectById with ID');
      const response = await api.get(`/showcase/project/${projectId}`);
      return response.data;
    } catch (error) {
      throw new Error('Failed to get project by ID with error: ' + error);
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
      throw new Error('Failed to create Project update with error ' + error);
    }
  },

  getProjectUpdates: async (projectId: string) => {
    try {
      const response = await api.get(`/showcase/project/${projectId}/updates`);
      return response.data;
    } catch (error) {
      throw new Error('Failed to get Project updates with error ' + error);
    }
  },

  supportProject: async (projectId: string) => {
    try {
      await api.post(`/showcase/${projectId}/support`);
    } catch (error) {
      throw new Error('Failed to support project with error: ' + error);
    }
  },

  unsupportProject: async (projectId: string) => {
    try {
      await api.delete(`/showcase/${projectId}/support`);
    } catch (error) {
      throw new Error('Failed to unsupport project with error: ' + error);
    }
  },

  followProject: async (projectId: string) => {
    try {
      await api.post(`/showcase/${projectId}/follow`);
    } catch (error) {
      throw new Error('Failed to follow project with error: ' + error);
    }
  },

  unfollowProject: async (projectId: string) => {
    try {
      await api.delete(`/showcase/${projectId}/follow`);
    } catch (error) {
      throw new Error('Failed to unfollow project with error: ' + error);
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
        'Failed to create collaboration request with error: ' + error
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
        'Failed to update collaboration request status with error: ' + error
      );
    }
  },

  getCollaborationRequests: async (projectId: string) => {
    try {
      const response = await api.get(`/showcase/${projectId}/collaborate`);
      return response.data;
    } catch (error) {
      throw new Error(
        'Failed to get collaboration requests with error: ' + error
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
      throw new Error('Failed to create comment with error: ' + error);
    }
  },

  // Add this method to your ShowcaseService
  async getComments(
    projectId: string,
    page: number = 1
  ): Promise<ProjectCommentsResponse> {
    try {
      const response = await api.get(`/showcase/${projectId}/comments`, {
        params: { page },
      });
      return response.data;
    } catch (error) {
      throw new Error('Failed to get project comments with error: ' + error);
    }
  },

  createProjectTeamMember: async (projectId: string, data: ProjectTeam) => {
    try {
      const response = await api.post(`/showcase/${projectId}/team`, data);
      return response.data;
    } catch (error) {
      throw new Error('Failed to add team member with error: ' + error);
    }
  },

  getProjectTeamMembers: async (projectId: string) => {
    try {
      const response = await api.get(`/showcase/${projectId}/team`);
      return response.data;
    } catch (error) {
      throw new Error('Failed to get project team with error: ' + error);
    }
  },

  removeProjectTeamMember: async (projectId: string, userId: string) => {
    try {
      const response = await api.delete(
        `/showcase/${projectId}/team/${userId}`
      );
      return response.data;
    } catch (error) {
      throw new Error('Failed to remove team member with error: ' + error);
    }
  },
};
