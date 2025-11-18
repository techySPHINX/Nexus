import axios from 'axios';
import { jwtDecode } from 'jwt-decode';
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';

const api = axios.create({ baseURL: BACKEND_URL });
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

function getUser() {
  const token = localStorage.getItem('token');
  if (!token) return null;
  try {
    return jwtDecode<{ role: string }>(token);
  } catch {
    return null;
  }
}

export async function createPostService(
  subject: string,
  content: string,
  imageFile?: File,
  subCommunityId?: string,
  type?: string
) {
  const user = getUser();
  if (!subCommunityId) {
    if (user?.role !== 'ADMIN' && user?.role !== 'ALUM') {
      throw new Error(
        'Unauthorized: Only admins and alumni can perform this action'
      );
    }
  }
  try {
    const formData = new FormData();
    formData.append('content', content);
    formData.append('subject', subject);
    if (type) formData.append('type', type);
    if (subCommunityId) formData.append('subCommunityId', subCommunityId);
    if (imageFile) formData.append('image', imageFile);

    const { data } = await api.post('/posts', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return data;
  } catch (err) {
    if (axios.isAxiosError(err)) {
      throw new Error(err.response?.data?.message || 'Failed to create post');
    }
    throw new Error('Failed to create post');
  }
}

export async function getRecentPostsService(page?: number, limit?: number) {
  try {
    const { data } = await api.get('/posts/recent', {
      params: {
        page,
        limit,
      },
    });
    return data;
  } catch (err) {
    if (axios.isAxiosError(err)) {
      throw new Error(
        err.response?.data?.message || 'Failed to fetch recent posts'
      );
    }
    throw new Error('Failed to fetch recent posts');
  }
}

export async function getFeedService(page?: number, limit?: number) {
  try {
    const { data } = await api.get('/posts/feed', {
      params: {
        page,
        limit,
      },
    });
    return data;
  } catch (err) {
    if (axios.isAxiosError(err)) {
      throw new Error(err.response?.data?.message || 'Failed to fetch feed');
    }
    throw new Error('Failed to fetch feed');
  }
}

export async function getSubCommunityFeedService(
  subCommunityId: string,
  page?: number,
  limit?: number
) {
  try {
    const { data } = await api.get(
      `/posts/subcommunity/${subCommunityId}/feed`,
      {
        params: {
          page,
          limit,
        },
      }
    );
    return data;
  } catch (err) {
    if (axios.isAxiosError(err)) {
      throw new Error(
        err.response?.data?.message || 'Failed to fetch sub-community feed'
      );
    }
    throw new Error('Failed to fetch sub-community feed');
  }
}

export async function getPendingPostsService(page?: number, limit?: number) {
  const user = getUser();
  if (user?.role !== 'ADMIN') {
    throw new Error('Unauthorized: Only admins can perform this action');
  }
  try {
    const { data } = await api.get('/posts/pending', {
      params: {
        page,
        limit,
      },
    });
    return data;
  } catch (err) {
    if (axios.isAxiosError(err)) {
      throw new Error(
        err.response?.data?.message || 'Failed to fetch pending posts'
      );
    }
    throw new Error('Failed to fetch pending posts');
  }
}

export async function getPostByUserIdService(
  userId: string,
  page?: number,
  limit?: number
) {
  try {
    const { data } = await api.get(`/posts/user/${userId}`, {
      params: {
        page,
        limit,
      },
    });
    return data;
  } catch (err) {
    if (axios.isAxiosError(err)) {
      throw new Error(
        err.response?.data?.message || 'Failed to fetch user posts'
      );
    }
    throw new Error('Failed to fetch user posts');
  }
}

export async function getPostByIdService(postId: string) {
  try {
    const { data } = await api.get(`/posts/${postId}`);
    return data;
  } catch (err) {
    if (axios.isAxiosError(err)) {
      throw new Error(err.response?.data?.message || 'Failed to fetch post');
    }
    throw new Error('Failed to fetch post');
  }
}

// src/services/PostService.ts
export const getPostStatsService = async (
  postId: string
): Promise<{
  upvotes: number;
  downvotes: number;
  comments: number;
}> => {
  try {
    const response = await api.get(`/posts/${postId}/stats`);
    return response.data;
  } catch (error) {
    console.error('Error fetching post stats:', error);
    throw error;
  }
};

// services/PostService.ts
export const getPostCommentsService = async (postId: string) => {
  try {
    const response = await api.get(`/posts/${postId}/comments`);
    return response.data;
  } catch (error) {
    console.error('Error fetching post comments:', error);
    throw error;
  }
};

export const createCommentService = async (postId: string, content: string) => {
  try {
    const response = await api.post(`/posts/${postId}/comments`, { content });
    return response.data;
  } catch (error) {
    console.error('Error creating post comment:', error);
    throw error;
  }
};

export async function updatePostService(
  postId: string,
  content?: string,
  imageFile?: File,
  type?: string,
  subCommunityId?: string
) {
  const user = getUser();
  if (user?.role !== 'ADMIN' && user?.role !== 'ALUM') {
    throw new Error(
      'Unauthorized: Only admins and alumni can perform this action'
    );
  }
  try {
    const formData = new FormData();
    if (content) formData.append('content', content);
    if (imageFile) formData.append('image', imageFile);
    if (type) formData.append('type', type);
    if (subCommunityId) formData.append('subCommunityId', subCommunityId);

    const { data } = await api.patch(`/posts/${postId}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return data;
  } catch (err) {
    if (axios.isAxiosError(err)) {
      throw new Error(err.response?.data?.message || 'Failed to update post');
    }
    throw new Error('Failed to update post');
  }
}

export async function approvePostService(postId: string) {
  const user = getUser();
  if (user?.role !== 'ADMIN') {
    throw new Error('Unauthorized: Only admins can perform this action');
  }
  try {
    await api.patch(`/posts/${postId}/approve`);
  } catch (err) {
    if (axios.isAxiosError(err)) {
      throw new Error(err.response?.data?.message || 'Failed to approve post');
    }
    throw new Error('Failed to approve post');
  }
}

export async function rejectPostService(postId: string) {
  const user = getUser();
  if (user?.role !== 'ADMIN') {
    throw new Error('Unauthorized: Only admins can perform this action');
  }
  try {
    await api.patch(`/posts/${postId}/reject`);
  } catch (err) {
    if (axios.isAxiosError(err)) {
      throw new Error(err.response?.data?.message || 'Failed to reject post');
    }
    throw new Error('Failed to reject post');
  }
}

export async function deletePostService(postId: string) {
  const user = getUser();
  if (user?.role !== 'ADMIN' && user?.role !== 'ALUM') {
    throw new Error(
      'Unauthorized: Only admins and alumni can perform this action'
    );
  }
  try {
    await api.delete(`/posts/${postId}`);
  } catch (err) {
    if (axios.isAxiosError(err)) {
      throw new Error(err.response?.data?.message || 'Failed to delete post');
    }
    throw new Error('Failed to delete post');
  }
}

export async function searchPostsService(
  query: string,
  page?: number,
  limit?: number,
  subCommunityId?: string
) {
  try {
    const { data } = await api.get('/posts/search', {
      params: {
        query,
        page,
        limit,
        subCommunityId,
      },
    });
    return data;
  } catch (err) {
    if (axios.isAxiosError(err)) {
      throw new Error(err.response?.data?.message || 'Failed to search posts');
    }
    throw new Error('Failed to search posts');
  }
}
