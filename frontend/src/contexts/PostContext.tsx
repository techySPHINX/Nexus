import React, { createContext, useContext, useState, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import type { AxiosError } from 'axios';

interface Post {
  id: string;
  content: string;
  imageUrl?: string;
  type: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt: string;
  updatedAt: string;
  author: {
    id: string;
    name: string;
    profile: {
      bio?: string;
      avatarUrl?: string;
    };
  };
  _count: {
    Like: number;
    Comment: number;
  };
  subCommunityId?: string;
  subCommunity?: {
    id: string;
    name: string;
    description: string;
  };
}

interface PostContextType {
  posts: Post[];
  pendingPosts: Post[];
  feed: Post[];
  subCommunityFeed: Post[];
  userPosts: Post[];
  searchResults: Post[];
  currentPost: Post | null;
  loading: boolean;
  error: string | null;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  createPost: (
    content: string,
    image?: File,
    subCommunityId?: string,
    type?: string
  ) => Promise<void>;
  updatePost: (
    id: string,
    content: string,
    image?: File,
    subCommunityId?: string
  ) => Promise<void>;
  deletePost: (id: string) => Promise<void>;
  getPost: (id: string) => Promise<void>;
  getFeed: (page?: number, limit?: number) => Promise<void>;
  getSubCommunityFeed: (
    subCommunityId: string,
    page?: number,
    limit?: number
  ) => Promise<void>;
  getUserPosts: (
    userId: string,
    page?: number,
    limit?: number
  ) => Promise<void>;
  searchPosts: (
    query: string,
    page?: number,
    limit?: number,
    subCommunityId?: string
  ) => Promise<void>;
  approvePost: (id: string) => Promise<void>;
  rejectPost: (id: string) => Promise<void>;
  getPendingPosts: (page?: number, limit?: number) => Promise<void>;
  clearError: () => void;
}

const PostContext = createContext<PostContextType | undefined>(undefined);

export const PostProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
export const PostProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [pendingPosts, setPendingPosts] = useState<Post[]>([]);
  const [feed, setFeed] = useState<Post[]>([]);
  const [subCommunityFeed, setSubCommunityFeed] = useState<Post[]>([]);
  const [userPosts, setUserPosts] = useState<Post[]>([]);
  const [searchResults, setSearchResults] = useState<Post[]>([]);
  const [currentPost, setCurrentPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
    hasNext: false,
    hasPrev: false,
  });

  const { token } = useAuth();
  const { token } = useAuth();

  const api = axios.create({
    baseURL: 'http://localhost:3000',
    baseURL: 'http://localhost:3000',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const handleError = (err: AxiosError | Error) => {
    if (
      'response' in err &&
      err.response &&
      (err as AxiosError).response?.data
    ) {
      const errorData = (err as AxiosError).response?.data as
        | { message?: string }
        | undefined;
      setError(errorData?.message || err.message || 'Something went wrong');
    } else {
      setError(err.message || 'Something went wrong');
    }
    setLoading(false);
    throw err;
  };

  const clearError = () => setError(null);

  const createPost = async (
    content: string,
    image?: File,
    subCommunityId?: string,
    type = 'UPDATE'
  ) => {
    try {
      setLoading(true);
      const formData = new FormData();
      formData.append('content', content);
      formData.append('type', type);
      if (subCommunityId) formData.append('subCommunityId', subCommunityId);
      if (image) formData.append('image', image);

        const { data } = await api.post('/posts', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });

      setPosts((prev) => [data, ...prev]);
      setLoading(false);
      return data;
    } catch (err) {
      handleError(err);
    }
  };

  const updatePost = async (
    id: string,
    content: string,
    image?: File,
    subCommunityId?: string
  ) => {
    try {
      setLoading(true);
      const formData = new FormData();
      formData.append('content', content);
      if (subCommunityId) formData.append('subCommunityId', subCommunityId);
      if (image) formData.append('image', image);

        const { data } = await api.patch(`/posts/${id}`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });

      setPosts((prev) => prev.map((post) => (post.id === id ? data : post)));
      setFeed((prev) => prev.map((post) => (post.id === id ? data : post)));
      setSubCommunityFeed((prev) =>
        prev.map((post) => (post.id === id ? data : post))
      );
      setUserPosts((prev) =>
        prev.map((post) => (post.id === id ? data : post))
      );
      setSearchResults((prev) =>
        prev.map((post) => (post.id === id ? data : post))
      );
      if (currentPost?.id === id) setCurrentPost(data);
      setLoading(false);
      return data;
    } catch (err) {
      handleError(err);
    }
  };
  const deletePost = async (id: string) => {
    try {
      setLoading(true);
      await api.delete(`/posts/${id}`);
      setPosts((prev) => prev.filter((post) => post.id !== id));
      setFeed((prev) => prev.filter((post) => post.id !== id));
      setSubCommunityFeed((prev) => prev.filter((post) => post.id !== id));
      setUserPosts((prev) => prev.filter((post) => post.id !== id));
      setSearchResults((prev) => prev.filter((post) => post.id !== id));
      setPosts((prev) => prev.filter((post) => post.id !== id));
      setFeed((prev) => prev.filter((post) => post.id !== id));
      setSubCommunityFeed((prev) => prev.filter((post) => post.id !== id));
      setUserPosts((prev) => prev.filter((post) => post.id !== id));
      setSearchResults((prev) => prev.filter((post) => post.id !== id));
      if (currentPost?.id === id) setCurrentPost(null);
      setLoading(false);
    } catch (err) {
      handleError(err);
    }
  };

  const getPost = async (id: string) => {
    try {
      setLoading(true);
      const { data } = await api.get(`/posts/${id}`);
      setCurrentPost(data);
      setLoading(false);
      return data;
    } catch (err) {
      handleError(err);
    }
  };

  const getFeed = useCallback(
    async (page = 1, limit = 10) => {
      if (!token) {
        console.error('No token available');
        return;
      }
      try {
        setLoading(true);
        const { data } = await api.get('/posts/feed', {
          params: { page, limit },
        });
        console.log('Feed data:', data);
        setFeed(data.posts);
        setPagination({
          page,
          limit,
          total: data.pagination.total,
          totalPages: data.pagination.totalPages,
          hasNext: data.pagination.hasNext,
          hasPrev: data.pagination.hasPrev,
        });
        setLoading(false);
        return data;
      } catch (err) {
        handleError(err);
      }
    },
    [api, token]
  );

  const getSubCommunityFeed = useCallback(
    async (subCommunityId: string, page = 1, limit = 10) => {
      if (!token) return;
      try {
        setLoading(true);
        const { data } = await api.get(
          `/posts/subcommunity/${subCommunityId}/feed`,
          {
            params: { page, limit },
          }
        );
        setSubCommunityFeed(data.posts);
        setPagination({
          page,
          limit,
          total: data.pagination.total,
          totalPages: data.pagination.totalPages,
          hasNext: data.pagination.hasNext,
          hasPrev: data.pagination.hasPrev,
        });
        setLoading(false);
        return data;
      } catch (err) {
        handleError(err);
      }
    },
    [api, token]
  );

  const getUserPosts = useCallback(
    async (userId: string, page = 1, limit = 10) => {
      if (!token) return;
      try {
        setLoading(true);
        const { data } = await api.get(`/posts/user/${userId}`, {
          params: { page, limit },
        });
        setUserPosts(data.posts);
        setPagination({
          page,
          limit,
          total: data.pagination.total,
          totalPages: data.pagination.totalPages,
          hasNext: data.pagination.hasNext,
          hasPrev: data.pagination.hasPrev,
        });
        setLoading(false);
        return data;
      } catch (err) {
        handleError(err);
      }
    },
    [api, token]
  );

  const searchPosts = async (
    query: string,
    page = 1,
    limit = 10,
    subCommunityId?: string
  ) => {
    try {
      setLoading(true);
      const { data } = await api.get('/posts/search', {
        params: { query, page, limit, subCommunityId },
      });
      setSearchResults(data.posts);
      setPagination({
        page,
        limit,
        total: data.pagination.total,
        totalPages: data.pagination.totalPages,
        hasNext: data.pagination.hasNext,
        hasPrev: data.pagination.hasPrev,
      });
      setLoading(false);
      return data;
    } catch (err) {
      handleError(err);
    }
  };

  const approvePost = useCallback(
    async (id: string) => {
      if (!token) return;
      try {
        setLoading(true);
        await api.patch(`/posts/${id}/approve`);
        setPendingPosts((prev) => prev.filter((post) => post.id !== id));
        setLoading(false);
      } catch (err) {
        handleError(err);
      }
    },
    [api, token]
  );

  const rejectPost = useCallback(
    async (id: string) => {
      if (!token) return;
      try {
        setLoading(true);
        await api.patch(`/posts/${id}/reject`);
        setPendingPosts((prev) => prev.filter((post) => post.id !== id));
        setLoading(false);
      } catch (err) {
        handleError(err);
      }
    },
    [api, token]
  );

  const getPendingPosts = useCallback(
    async (page = 1, limit = 10) => {
      if (!token) return;
      try {
        setLoading(true);
        const { data } = await api.get('/posts/pending', {
          params: { page, limit },
        });
        setPendingPosts(data.posts);
        setPagination({
          page,
          limit,
          total: data.pagination.total,
          totalPages: data.pagination.totalPages,
          hasNext: data.pagination.hasNext,
          hasPrev: data.pagination.hasPrev,
        });
        setLoading(false);
        return data;
      } catch (err) {
        handleError(err);
      }
    },
    [api, token]
  );

  return (
    <PostContext.Provider
      value={{
        posts,
        pendingPosts,
        feed,
        subCommunityFeed,
        userPosts,
        searchResults,
        currentPost,
        loading,
        error,
        pagination,
        createPost,
        updatePost,
        deletePost,
        getPost,
        getFeed,
        getSubCommunityFeed,
        getUserPosts,
        searchPosts,
        approvePost,
        rejectPost,
        getPendingPosts,
        clearError,
      }}
    >
      {children}
    </PostContext.Provider>
  );
};

export const usePosts = () => {
  const context = useContext(PostContext);
  if (context === undefined) {
    throw new Error('usePosts must be used within a PostProvider');
  }
  return context;
};

