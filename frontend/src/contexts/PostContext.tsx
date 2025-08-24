import React, { createContext, useContext, useState, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Post } from '../types/post';
import {
  createPostService,
  getFeedService,
  getSubCommunityFeedService,
  getPendingPostsService,
  getPostByUserIdService,
  getPostByIdService,
  updatePostService,
  approvePostService,
  rejectPostService,
  deletePostService,
  searchPostsService,
} from '../services/PostService';
import { getErrorMessage } from '@/utils/errorHandler';

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
  const { user } = useAuth();
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

  const clearError = useCallback(() => setError(null), []);

  const createPost = useCallback(
    async (
      content: string,
      image?: File,
      subCommunityId?: string,
      type?: string
    ) => {
      try {
        if (user?.role !== 'ADMIN' && user?.role !== 'ALUM') {
          throw new Error(
            'Unauthorized: Only admins and alumni can perform this action'
          );
        }
        setLoading(true);
        clearError();
        const response = await createPostService(
          content,
          image,
          subCommunityId,
          type
        );

        // The created post might be in response.data or directly in response
        const createdPost = response.data || response;

        // Ensure the post has the proper structure
        const normalizedPost = {
          ...createdPost,
          _count: createdPost._count || { Vote: 0, Comment: 0 },
          author: createdPost.author || {
            id: user?.id || 'unknown',
            name: user?.name || 'Unknown User',
            profile: {
              avatarUrl: null,
              bio: null,
            },
          },
        };

        setPosts((prev) => [normalizedPost, ...prev]);
        setFeed((prev) => [normalizedPost, ...prev]);
        setLoading(false);
        return normalizedPost;
      } catch (err) {
        const errorMessage = getErrorMessage(err);
        setError(errorMessage);
        setLoading(false);
        throw new Error(errorMessage);
      }
    },
    [user, clearError]
  );

  const getFeed = useCallback(
    async (page = 1, limit = 10) => {
      if (!user) return;
      try {
        setLoading(true);
        clearError();
        const response = await getFeedService(page, limit);

        // Use the correct structure from your API response
        const posts = response.posts || []; // response has posts array directly
        const paginationData = response.pagination || {
          page,
          limit,
          total: posts.length,
          totalPages: Math.ceil(posts.length / limit),
          hasNext: false,
          hasPrev: false,
        };

        if (page === 1) {
          setFeed(posts);
        } else {
          setFeed((prev) => [...prev, ...posts]);
        }
        setPagination({
          page: paginationData.page,
          limit: paginationData.limit,
          total: paginationData.total,
          totalPages: paginationData.totalPages,
          hasNext: paginationData.hasNext,
          hasPrev: paginationData.hasPrev,
        });
        setLoading(false);
        return response;
      } catch (err) {
        const errorMessage = getErrorMessage(err);
        setError(errorMessage);
        setLoading(false);
        throw new Error(errorMessage);
      }
    },
    [user, clearError]
  );

  const getSubCommunityFeed = useCallback(
    async (subCommunityId: string, page = 1, limit = 10) => {
      if (!user) return;
      try {
        setLoading(true);
        clearError();
        const response = await getSubCommunityFeedService(
          subCommunityId,
          page,
          limit
        );

        const posts = response.posts || [];
        const paginationData = response.pagination || {
          page,
          limit,
          total: posts.length,
          totalPages: Math.ceil(posts.length / limit),
          hasNext: false,
          hasPrev: false,
        };

        if (page === 1) {
          setSubCommunityFeed(posts);
        } else {
          setSubCommunityFeed((prev) => [...prev, ...posts]);
        }
        setPagination({
          page: paginationData.page,
          limit: paginationData.limit,
          total: paginationData.total,
          totalPages: paginationData.totalPages,
          hasNext: paginationData.hasNext,
          hasPrev: paginationData.hasPrev,
        });
        setLoading(false);
        return response;
      } catch (err) {
        const errorMessage = getErrorMessage(err);
        setError(errorMessage);
        setLoading(false);
        throw new Error(errorMessage);
      }
    },
    [user, clearError]
  );

  const getPendingPosts = useCallback(
    async (page = 1, limit = 10) => {
      if (user?.role !== 'ADMIN') {
        throw new Error('Unauthorized: Only admins can view pending posts');
      }
      try {
        setLoading(true);
        clearError();
        const response = await getPendingPostsService(page, limit);

        const posts = response.posts || [];
        const paginationData = response.pagination || {
          page,
          limit,
          total: posts.length,
          totalPages: Math.ceil(posts.length / limit),
          hasNext: false,
          hasPrev: false,
        };

        if (page === 1) {
          setPendingPosts(posts);
        } else {
          setPendingPosts((prev) => [...prev, ...posts]);
        }
        setPagination({
          page: paginationData.page,
          limit: paginationData.limit,
          total: paginationData.total,
          totalPages: paginationData.totalPages,
          hasNext: paginationData.hasNext,
          hasPrev: paginationData.hasPrev,
        });
        setLoading(false);
        return response;
      } catch (err) {
        const errorMessage = getErrorMessage(err);
        setError(errorMessage);
        setLoading(false);
        throw new Error(errorMessage);
      }
    },
    [user, clearError]
  );

  const getUserPosts = useCallback(
    async (userId: string, page = 1, limit = 10) => {
      if (!user) return;
      try {
        setLoading(true);
        clearError();
        const { data } = await getPostByUserIdService(userId, page, limit);
        if (page === 1) {
          setUserPosts(data.posts);
        } else {
          setUserPosts((prev) => [...prev, ...data.posts]);
        }
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
        const errorMessage = getErrorMessage(err);
        setError(errorMessage);
        setLoading(false);
        throw new Error(errorMessage);
      }
    },
    [user, clearError]
  );

  const getPost = useCallback(
    async (id: string) => {
      try {
        setLoading(true);
        clearError();
        const { data } = await getPostByIdService(id);
        setCurrentPost(data);
        setLoading(false);
        return data;
      } catch (err) {
        const errorMessage = getErrorMessage(err);
        setError(errorMessage);
        setLoading(false);
        throw new Error(errorMessage);
      }
    },
    [clearError]
  );

  const updatePost = useCallback(
    async (
      id: string,
      content: string,
      image?: File,
      type?: string,
      subCommunityId?: string
    ) => {
      try {
        setLoading(true);
        clearError();
        const { data } = await updatePostService(
          id,
          content,
          image,
          type,
          subCommunityId
        );

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
        const errorMessage = getErrorMessage(err);
        setError(errorMessage);
        setLoading(false);
        throw new Error(errorMessage);
      }
    },
    [currentPost, clearError]
  );

  const approvePost = useCallback(
    async (id: string) => {
      if (user?.role !== 'ADMIN') {
        throw new Error('Unauthorized: Only admins can approve posts');
      }
      try {
        setLoading(true);
        clearError();
        await approvePostService(id);
        setPendingPosts((prev) => prev.filter((post) => post.id !== id));
        setLoading(false);
      } catch (err) {
        const errorMessage = getErrorMessage(err);
        setError(errorMessage);
        setLoading(false);
        throw new Error(errorMessage);
      }
    },
    [user, clearError]
  );

  const rejectPost = useCallback(
    async (id: string) => {
      if (user?.role !== 'ADMIN') {
        throw new Error('Unauthorized: Only admins can reject posts');
      }
      try {
        setLoading(true);
        clearError();
        await rejectPostService(id);
        setPendingPosts((prev) => prev.filter((post) => post.id !== id));
        setLoading(false);
      } catch (err) {
        const errorMessage = getErrorMessage(err);
        setError(errorMessage);
        setLoading(false);
        throw new Error(errorMessage);
      }
    },
    [user, clearError]
  );

  const deletePost = useCallback(
    async (id: string) => {
      if (user?.role !== 'ADMIN' && user?.role !== 'ALUM') {
        throw new Error(
          'Unauthorized: Only admins and alumni can delete posts'
        );
      }
      try {
        setLoading(true);
        clearError();
        await deletePostService(id);
        setPosts((prev) => prev.filter((post) => post.id !== id));
        setFeed((prev) => prev.filter((post) => post.id !== id));
        setSubCommunityFeed((prev) => prev.filter((post) => post.id !== id));
        setUserPosts((prev) => prev.filter((post) => post.id !== id));
        setSearchResults((prev) => prev.filter((post) => post.id !== id));
        if (currentPost?.id === id) setCurrentPost(null);
        setLoading(false);
      } catch (err) {
        const errorMessage = getErrorMessage(err);
        setError(errorMessage);
        setLoading(false);
        throw new Error(errorMessage);
      }
    },
    [user, currentPost, clearError]
  );

  const searchPosts = useCallback(
    async (query: string, page = 1, limit = 10, subCommunityId?: string) => {
      try {
        setLoading(true);
        clearError();
        const { data } = await searchPostsService(
          query,
          page,
          limit,
          subCommunityId
        );
        if (page === 1) {
          setSearchResults(data.posts);
        } else {
          setSearchResults((prev) => [...prev, ...data.posts]);
        }
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
        const errorMessage = getErrorMessage(err);
        setError(errorMessage);
        setLoading(false);
        throw new Error(errorMessage);
      }
    },
    [clearError]
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
