import React, { createContext, useContext, useCallback } from 'react';
import { EngagementService } from '../services/engagementService';
import { Comment, VoteType, Post } from '../types/engagement';
import { getErrorMessage } from '@/utils/errorHandler';

interface EngagementContextType {
  // Vote operations
  voteOnPost: (postId: string, voteType: VoteType) => Promise<void>;
  voteOnComment: (commentId: string, voteType: VoteType) => Promise<void>;
  removeVote: (voteId: string) => Promise<void>;

  // Comment operations
  commentOnPost: (
    postId: string,
    content: string,
    parentId?: string
  ) => Promise<Comment>;
  getCommentsForPost: (
    postId: string,
    page?: number,
    limit?: number
  ) => Promise<{
    comments: Comment[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
      hasNext: boolean;
      hasPrev: boolean;
    };
  }>;
  updateComment: (commentId: string, content: string) => Promise<Comment>;
  deleteComment: (commentId: string) => Promise<void>;

  // Feed operations
  getRecommendedFeed: () => Promise<Post[]>;

  // State management
  loading: boolean;
  error: string | null;
  clearError: () => void;
}

const EngagementContext = createContext<EngagementContextType | undefined>(
  undefined
);

interface EngagementProviderProps {
  children: React.ReactNode;
  engagementService: EngagementService;
}

export const EngagementProvider: React.FC<EngagementProviderProps> = ({
  children,
  engagementService,
}) => {
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const clearError = useCallback(() => setError(null), []);

  const handleError = useCallback((err: unknown) => {
    const errorMessage = getErrorMessage(err);
    setError(errorMessage);
    throw new Error(errorMessage);
  }, []);

  const voteOnPost = useCallback(
    async (postId: string, voteType: VoteType): Promise<void> => {
      setLoading(true);
      setError(null);
      try {
        await engagementService.voteOnPost(postId, voteType);
      } catch (err) {
        handleError(err);
      } finally {
        setLoading(false);
      }
    },
    [engagementService, handleError]
  );

  const voteOnComment = useCallback(
    async (commentId: string, voteType: VoteType): Promise<void> => {
      setLoading(true);
      setError(null);
      try {
        await engagementService.voteOnComment(commentId, voteType);
      } catch (err) {
        handleError(err);
      } finally {
        setLoading(false);
      }
    },
    [engagementService, handleError]
  );

  const removeVote = useCallback(
    async (voteId: string): Promise<void> => {
      setLoading(true);
      setError(null);
      try {
        await engagementService.removeVote(voteId);
      } catch (err) {
        handleError(err);
      } finally {
        setLoading(false);
      }
    },
    [engagementService, handleError]
  );

  const commentOnPost = useCallback(
    async (
      postId: string,
      content: string,
      parentId?: string
    ): Promise<Comment> => {
      setLoading(true);
      setError(null);
      try {
        const comment = await engagementService.commentOnPost(
          postId,
          content,
          parentId
        );
        return comment;
      } catch (err) {
        return handleError(err) as never; // This will throw, so we never reach the return
      } finally {
        setLoading(false);
      }
    },
    [engagementService, handleError]
  );

  const getCommentsForPost = useCallback(
    async (postId: string, page: number = 1, limit: number = 10) => {
      setLoading(true);
      setError(null);
      try {
        const result = await engagementService.getCommentsForPost(
          postId,
          page,
          limit
        );
        return result;
      } catch (err) {
        return handleError(err) as never;
      } finally {
        setLoading(false);
      }
    },
    [engagementService, handleError]
  );

  const updateComment = useCallback(
    async (commentId: string, content: string): Promise<Comment> => {
      setLoading(true);
      setError(null);
      try {
        const comment = await engagementService.updateComment(
          commentId,
          content
        );
        return comment;
      } catch (err) {
        return handleError(err) as never;
      } finally {
        setLoading(false);
      }
    },
    [engagementService, handleError]
  );

  const deleteComment = useCallback(
    async (commentId: string): Promise<void> => {
      setLoading(true);
      setError(null);
      try {
        await engagementService.deleteComment(commentId);
      } catch (err) {
        handleError(err);
      } finally {
        setLoading(false);
      }
    },
    [engagementService, handleError]
  );

  const getRecommendedFeed = useCallback(async (): Promise<Post[]> => {
    setLoading(true);
    setError(null);
    try {
      const feed = await engagementService.getRecommendedFeed();
      return feed;
    } catch (err) {
      return handleError(err) as never;
    } finally {
      setLoading(false);
    }
  }, [engagementService, handleError]);

  const value: EngagementContextType = {
    voteOnPost,
    voteOnComment,
    removeVote,
    commentOnPost,
    getCommentsForPost,
    updateComment,
    deleteComment,
    getRecommendedFeed,
    loading,
    error,
    clearError,
  };

  return (
    <EngagementContext.Provider value={value}>
      {children}
    </EngagementContext.Provider>
  );
};

export const useEngagement = (): EngagementContextType => {
  const context = useContext(EngagementContext);
  if (context === undefined) {
    throw new Error('useEngagement must be used within an EngagementProvider');
  }
  return context;
};
