import { getErrorMessage } from '@/utils/errorHandler';
import api from './api';

export const DashBoardService = {
  getProfileCompletionStats: async () => {
    try {
      const response = await api.get(`/profile/me-completion-stats`);
      console.log('Profile Completion Stats Response:', response);
      return response.data;
    } catch (error) {
      throw new Error(
        'Failed to get profile completion stats: ' + getErrorMessage(error)
      );
    }
  },
  getConnectionStats: async () => {
    try {
      const response = await api.get(`/dashboard/stats`);
      console.log('Dashboard Stats Response:', response);
      return response.data;
    } catch (error) {
      throw new Error(
        'Failed to get connection stats: ' + getErrorMessage(error)
      );
    }
  },

  getSuggestedConnections: async (limit?: 10) => {
    try {
      const response = await api.get(`/connection/suggestions`, {
        params: { limit },
      });
      console.log('Suggested Connections Response:', response);
      return response.data.suggestions;
    } catch (error) {
      throw new Error(
        'Failed to get suggested connections: ' + getErrorMessage(error)
      );
    }
  },

  getRecentPostsService: async (page?: number, limit?: number) => {
    try {
      const data = await api.get('/posts/recent', {
        params: {
          page,
          limit,
        },
      });
      return data.data;
    } catch (err) {
      throw new Error('Failed to fetch recent posts: ' + getErrorMessage(err));
    }
  },

  connectToUser: async (userId: string) => {
    try {
      await api.post(`/connection/send`, {
        recipientId: userId,
      });
    } catch (error) {
      throw new Error(
        'Failed to send connection request: ' + getErrorMessage(error)
      );
    }
  },
};

export default DashBoardService;
