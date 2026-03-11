// Use the shared api instance (from api.ts) which already configures:
//   - withCredentials: true (httpOnly cookie auth, Issue #164)
//   - X-CSRF-Token header interceptor (CSRF protection, Issue #162)
// This avoids the need for manual header attachment and ensures CSRF tokens
// are included on all mutating requests (Copilot recommendation from PR #210).
import api, { isAxiosError } from './api';
import { Comment, VoteType, Post } from '../types/engagement';
import { getErrorMessage } from '@/utils/errorHandler';

const BASE = '/engagement';

export class EngagementService {
  // engagementService.ts - Update the error handling
  private handleServiceError(error: unknown): never {
    if (!isAxiosError(error)) {
      throw new Error('An unknown error occurred');
    }

    console.error('Service error:', error.response?.data || error.message);

    if (error.response) {
      const status = error.response.status;
      const message = error.response.data || error.response.statusText;

      if (status === 401) {
        throw new Error('Authentication failed. Please login again.');
      } else if (status === 403) {
        throw new Error('You do not have permission to perform this action.');
      } else if (status === 404) {
        throw new Error('Resource not found.');
      } else if (status === 500) {
        throw new Error('Server error. Please try again later.');
      } else {
        throw new Error(getErrorMessage(message));
      }
    } else if (error.request) {
      throw new Error(
        'No response received from server. Please check your connection.'
      );
    } else {
      throw new Error(error.message || 'An unknown error occurred');
    }
  }

  async voteOnPost(postId: string, voteType: VoteType): Promise<void> {
    try {
      const response = await api.post(`${BASE}/${postId}/vote`, { voteType });
      return response.data;
    } catch (error) {
      this.handleServiceError(error);
    }
  }

  async voteOnComment(commentId: string, voteType: VoteType): Promise<void> {
    try {
      const response = await api.post(`${BASE}/${commentId}/vote-comment`, {
        voteType,
      });
      return response.data;
    } catch (error) {
      this.handleServiceError(error);
    }
  }

  async removeVote(voteId: string): Promise<void> {
    try {
      const response = await api.delete(`${BASE}/${voteId}/remove-vote`);
      return response.data;
    } catch (error) {
      this.handleServiceError(error);
    }
  }

  async commentOnPost(
    postId: string,
    content: string,
    parentId?: string
  ): Promise<Comment> {
    try {
      const response = await api.post(`${BASE}/${postId}/comment`, {
        content,
        parentId,
      });
      return response.data;
    } catch (error) {
      this.handleServiceError(error);
    }
  }

  async getCommentsForPost(
    postId: string,
    page: number = 1,
    limit: number = 10
  ): Promise<{
    comments: Comment[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
      hasNext: boolean;
      hasPrev: boolean;
    };
  }> {
    try {
      const response = await api.get(
        `${BASE}/${postId}/comments?page=${page}&limit=${limit}`
      );
      return response.data;
    } catch (error) {
      this.handleServiceError(error);
    }
  }

  async updateComment(commentId: string, content: string): Promise<Comment> {
    try {
      const response = await api.patch(`${BASE}/comments/${commentId}`, {
        content,
      });
      return response.data;
    } catch (error) {
      this.handleServiceError(error);
    }
  }

  async deleteComment(commentId: string): Promise<void> {
    try {
      const response = await api.delete(`${BASE}/comments/${commentId}`);
      return response.data;
    } catch (error) {
      this.handleServiceError(error);
    }
  }

  async getRecommendedFeed(): Promise<Post[]> {
    try {
      const response = await api.get(`${BASE}/feed`);
      return response.data;
    } catch (error) {
      this.handleServiceError(error);
    }
  }
}
