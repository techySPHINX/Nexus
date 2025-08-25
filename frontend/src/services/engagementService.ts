import axios, { AxiosError } from 'axios';
import { Comment, VoteType, Post } from '../types/engagement';
import { getErrorMessage } from '@/utils/errorHandler';

export class EngagementService {
  private baseURL: string;

  constructor(baseURL: string = '/engagement') {
    this.baseURL = baseURL;
  }

  private getAuthHeaders() {
    const token = localStorage.getItem('token');
    return {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    };
  }

  // engagementService.ts - Update the error handling
  private handleServiceError(error: AxiosError): never {
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
      const response = await axios.post(
        `${this.baseURL}/${postId}/vote`,
        { voteType },
        this.getAuthHeaders()
      );
      return response.data;
    } catch (error) {
      this.handleServiceError(error as AxiosError);
    }
  }

  async voteOnComment(commentId: string, voteType: VoteType): Promise<void> {
    try {
      const response = await axios.post(
        `${this.baseURL}/${commentId}/vote-comment`,
        { voteType },
        this.getAuthHeaders()
      );
      return response.data;
    } catch (error) {
      this.handleServiceError(error as AxiosError);
    }
  }

  async removeVote(voteId: string): Promise<void> {
    try {
      const response = await axios.delete(
        `${this.baseURL}/${voteId}/remove-vote`,
        this.getAuthHeaders()
      );
      return response.data;
    } catch (error) {
      this.handleServiceError(error as AxiosError);
    }
  }

  async commentOnPost(
    postId: string,
    content: string,
    parentId?: string
  ): Promise<Comment> {
    try {
      const response = await axios.post(
        `${this.baseURL}/${postId}/comment`,
        { content, parentId },
        this.getAuthHeaders()
      );
      return response.data;
    } catch (error) {
      this.handleServiceError(error as AxiosError);
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
      const response = await axios.get(
        `${this.baseURL}/${postId}/comments?page=${page}&limit=${limit}`,
        this.getAuthHeaders()
      );
      return response.data;
    } catch (error) {
      this.handleServiceError(error as AxiosError);
    }
  }

  async updateComment(commentId: string, content: string): Promise<Comment> {
    try {
      const response = await axios.patch(
        `${this.baseURL}/comments/${commentId}`,
        { content },
        this.getAuthHeaders()
      );
      return response.data;
    } catch (error) {
      this.handleServiceError(error as AxiosError);
    }
  }

  async deleteComment(commentId: string): Promise<void> {
    try {
      const response = await axios.delete(
        `${this.baseURL}/comments/${commentId}`,
        this.getAuthHeaders()
      );
      return response.data;
    } catch (error) {
      this.handleServiceError(error as AxiosError);
    }
  }

  async getRecommendedFeed(): Promise<Post[]> {
    try {
      const response = await axios.get(
        `${this.baseURL}/feed`,
        this.getAuthHeaders()
      );
      return response.data;
    } catch (error) {
      this.handleServiceError(error as AxiosError);
    }
  }
}
