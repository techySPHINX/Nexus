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
  getPostStatsService,
  getPostCommentsService,
  createCommentService,
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
  actionLoading: Record<string, boolean>;
  isActionLoading: (key: string) => boolean;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  clearUserPosts: () => void;
  createPost: (
    subject: string,
    content: string,
    image?: string | File,
    subCommunityId?: string,
    type?: string
  ) => Promise<void>;
  updatePost: (
    id: string,
    subject?: string,
    content?: string,
    image?: string | File,
    subCommunityId?: string
  ) => Promise<void>;
  deletePost: (id: string) => Promise<void>;
  getPost: (id: string) => Promise<void>;
  getPostStats: (postId: string) => Promise<{
    upvotes: number;
    downvotes: number;
    comments: number;
  }>;
  getPostComments: (postId: string) => Promise<void>;
  createComment: (postId: string, content: string) => Promise<void>;
  incrementCurrentPostComments: (amount?: number) => void;
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

const PostProvider: React.FC<{ children: React.ReactNode }> = ({
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

  // Per-action loading flags (e.g. creating a post) to avoid global UI
  // blocking when only a small part of the page should update.
  const [actionLoading, setActionLoading] = useState<Record<string, boolean>>(
    {}
  );

  const setActionLoadingFlag = useCallback((key: string, value: boolean) => {
    setActionLoading((prev) => ({ ...prev, [key]: value }));
  }, []);

  const isActionLoading = useCallback(
    (key: string) => !!actionLoading[key],
    [actionLoading]
  );

  const createPost = useCallback(
    async (
      subject: string,
      content: string,
      image?: string | File,
      subCommunityId?: string,
      type?: string
    ) => {
      try {
        if (!subCommunityId) {
          if (user?.role !== 'ADMIN' && user?.role !== 'ALUM') {
            throw new Error(
              'Unauthorized: Only admins and alumni can perform this action'
            );
          }
        }
        const key = `createPost:${subCommunityId ?? 'global'}`;
        setActionLoadingFlag(key, true);
        clearError();
        const response = await createPostService(
          subject,
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
            role: user?.role || 'STUDENT',
            profile: {
              avatarUrl: null,
              bio: null,
            },
          },
        };

        setPosts((prev) => [normalizedPost, ...prev]);
        setFeed((prev) => [normalizedPost, ...prev]);
        setActionLoadingFlag(`createPost:${subCommunityId ?? 'global'}`, false);
        return normalizedPost;
      } catch (err) {
        const errorMessage = getErrorMessage(err);
        setError(errorMessage);
        setActionLoadingFlag(`createPost:${subCommunityId ?? 'global'}`, false);
        throw new Error(errorMessage);
      }
    },
    [user, clearError, setActionLoadingFlag]
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
        const response = await getPostByUserIdService(userId, page, limit);

        const posts = response.posts || [];
        const paginationData = response.pagination || {
          page,
          limit,
          total: posts.length,
          totalPages: Math.ceil(posts.length / limit),
          hasNext: false,
          hasPrev: false,
        };

        setUserPosts((prev) => {
          const newPosts = page === 1 ? posts : [...prev, ...posts];
          return newPosts;
        });

        setPagination(paginationData);
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

  const clearUserPosts = useCallback(() => {
    setUserPosts([]);
    setPagination({
      page: 1,
      limit: 10,
      total: 0,
      totalPages: 0,
      hasNext: false,
      hasPrev: false,
    });
  }, []);

  const getPost = useCallback(
    async (id: string) => {
      try {
        if (!user) return;
        setLoading(true);
        clearError();
        const data = await getPostByIdService(id);
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
    [user, clearError]
  );

  const getPostStats = useCallback(
    async (postId: string) => {
      try {
        setLoading(true);
        clearError();
        const stats = await getPostStatsService(postId);
        setLoading(false);
        return stats;
      } catch (err) {
        const errorMessage = getErrorMessage(err);
        setError(errorMessage);
        setLoading(false);
        throw new Error(errorMessage);
      }
    },
    [clearError]
  );

  // Add these to your PostContext
  const getPostComments = useCallback(async (postId: string) => {
    try {
      const response = await getPostCommentsService(postId);
      return response.comments || response.data || response;
    } catch (err) {
      const errorMessage = getErrorMessage(err);
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, []);

  const createComment = useCallback(async (postId: string, content: string) => {
    try {
      const response = await createCommentService(postId, content);
      return response.comment || response.data || response;
    } catch (err) {
      const errorMessage = getErrorMessage(err);
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, []);

  // Increment the comment count on the locally stored currentPost
  const incrementCurrentPostComments = useCallback((amount = 1) => {
    setCurrentPost((prev) => {
      if (!prev) return prev;
      const prevCount = prev._count || { Vote: 0, Comment: 0 };
      return {
        ...prev,
        _count: {
          ...prevCount,
          Comment: (prevCount.Comment || 0) + amount,
        },
      } as Post;
    });
  }, []);

  const updatePost = useCallback(
    async (
      id: string,
      subject?: string,
      content?: string,
      image?: string | File,
      type?: string,
      subCommunityId?: string
    ) => {
      try {
        setLoading(true);
        clearError();
        const { data } = await updatePostService(
          id,
          subject,
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
        actionLoading,
        isActionLoading,
        error,
        pagination,
        createPost,
        updatePost,
        deletePost,
        getPost,
        getPostStats,
        getPostComments,
        createComment,
        getFeed,
        getSubCommunityFeed,
        getUserPosts,
        clearUserPosts,
        searchPosts,
        approvePost,
        rejectPost,
        getPendingPosts,
        incrementCurrentPostComments,
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

export default PostProvider;
