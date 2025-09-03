import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { VoteTargetType, VoteType } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';

import { NotificationService } from '../notification/notification.service';

/**
 * Service for managing user engagement with posts, including likes and comments.
 */
@Injectable()
export class EngagementService {
  constructor(
    private prisma: PrismaService,
    private notificationService: NotificationService,
  ) {}

  /**
   * Allows a user to vote on a specific post.
   * If a vote already exists, it updates the vote or removes it if the same vote type is provided.
   * @param userId - The ID of the user voting.
   * @param postId - The ID of the post to vote on.
   * @param voteType - The type of vote (UPVOTE or DOWNVOTE).
   * @returns A promise that resolves to the created or updated vote record.
   * @throws {NotFoundException} If the post is not found.
   */
  async voteOnPost(userId: string, postId: string, voteType: VoteType) {
    const post = await this.prisma.post.findUnique({ where: { id: postId } });
    if (!post) {
      throw new NotFoundException('Post not found');
    }

    // Use findFirst to find existing vote for this post
    const existingVote = await this.prisma.vote.findFirst({
      where: {
        userId,
        postId,
        commentId: null,
      },
    });

    if (existingVote) {
      if (existingVote.type === voteType) {
        return this.prisma.vote.delete({
          where: { id: existingVote.id },
        });
      } else {
        return this.prisma.vote.update({
          where: { id: existingVote.id },
          data: { type: voteType },
        });
      }
    } else {
      return this.prisma.vote.create({
        data: {
          userId,
          postId,
          type: voteType,
          targetType: VoteTargetType.POST,
          commentId: null,
        },
      });
    }
  }

  /**
   * Allows a user to vote on a specific comment.
   * If a vote already exists, it updates the vote or removes it if the same vote type is provided.
   * @param userId - The ID of the user voting.
   * @param commentId - The ID of the comment to vote on.
   * @param voteType - The type of vote (UPVOTE or DOWNVOTE).
   * @returns A promise that resolves to the created or updated vote record.
   * @throws {NotFoundException} If the comment is not found.
   */
  async voteOnComment(userId: string, commentId: string, voteType: VoteType) {
    const comment = await this.prisma.comment.findUnique({
      where: { id: commentId },
    });
    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    // Use findFirst to find existing vote for this comment
    const existingVote = await this.prisma.vote.findFirst({
      where: {
        userId,
        commentId,
        postId: null,
      },
    });

    if (existingVote) {
      if (existingVote.type === voteType) {
        return this.prisma.vote.delete({
          where: { id: existingVote.id },
        });
      } else {
        return this.prisma.vote.update({
          where: { id: existingVote.id },
          data: { type: voteType },
        });
      }
    } else {
      return this.prisma.vote.create({
        data: {
          userId,
          commentId,
          type: voteType,
          targetType: VoteTargetType.COMMENT,
          postId: null,
        },
      });
    }
  }

  /**
   * Allows a user to remove their vote from a specific post or comment.
   * @param userId - The ID of the user removing the vote.
   * @param voteId - The ID of the vote to remove.
   * @returns A promise that resolves to the deleted vote record.
   * @throws {NotFoundException} If the vote is not found.
   * @throws {ForbiddenException} If the user is not the author of the vote.
   */
  async removeVote(userId: string, voteId: string) {
    const existingVote = await this.prisma.vote.findUnique({
      where: { id: voteId },
    });

    if (!existingVote) {
      throw new NotFoundException('Vote not found');
    }

    if (existingVote.userId !== userId) {
      throw new ForbiddenException('You can only remove your own votes');
    }

    return this.prisma.vote.delete({
      where: { id: voteId },
    });
  }

  /**
   * Allows a user to add a comment to a specific post, optionally as a reply to another comment.
   * @param userId - The ID of the user making the comment.
   * @param postId - The ID of the post to comment on.
   * @param content - The content of the comment.
   * @param parentId - Optional. The ID of the parent comment if this is a reply.
   * @returns A promise that resolves to the created comment record.
   * @throws {NotFoundException} If the post or parent comment is not found.
   * @throws {BadRequestException} If the comment content is empty or too long, or if parentId is invalid.
   */
  async commentOnPost(
    userId: string,
    postId: string,
    content: string,
    parentId?: string,
  ) {
    const post = await this.prisma.post.findUnique({ where: { id: postId } });
    if (!post) {
      throw new NotFoundException('Post not found');
    }

    if (!content || content.trim().length === 0) {
      throw new BadRequestException('Comment content cannot be empty');
    }

    if (content.length > 500) {
      throw new BadRequestException(
        'Comment content too long (max 500 characters)',
      );
    }

    if (parentId) {
      const parentComment = await this.prisma.comment.findUnique({
        where: { id: parentId },
      });
      if (!parentComment) {
        throw new NotFoundException('Parent comment not found');
      }
      if (parentComment.postId !== postId) {
        throw new BadRequestException(
          'Parent comment does not belong to the same post',
        );
      }
    }

    const mentionedUsernames =
      content.match(/@(\w+)/g)?.map((mention) => mention.substring(1)) || [];
    const mentionedUsers = await this.prisma.user.findMany({
      where: { name: { in: mentionedUsernames } },
    });

    const newComment = await this.prisma.comment.create({
      data: {
        userId,
        postId,
        content: content.trim(),
        parentId,
        mentionedUsers: {
          connect: mentionedUsers.map((user) => ({ id: user.id })),
        },
      },
    });

    const currentUser = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    for (const user of mentionedUsers) {
      await this.notificationService.createMentionNotification(
        user.id,
        currentUser.name,
        post.id,
      );
    }

    return newComment;
  }

  /**
   * Retrieves all top-level comments for a specific post with pagination, and their nested replies.
   * @param postId - The ID of the post to retrieve comments for.
   * @param page - The page number for pagination.
   * @param limit - The number of comments per page.
   * @returns A promise that resolves to an object containing paginated comments and pagination details.
   * @throws {NotFoundException} If the post is not found.
   * @throws {BadRequestException} If pagination parameters are invalid.
   */
  async getCommentsForPost(postId: string, page = 1, limit = 10) {
    const post = await this.prisma.post.findUnique({ where: { id: postId } });
    if (!post) {
      throw new NotFoundException('Post not found');
    }

    if (page < 1 || limit < 1 || limit > 50) {
      throw new BadRequestException('Invalid pagination parameters');
    }

    const skip = (page - 1) * limit;

    const [comments, total] = await Promise.all([
      this.prisma.comment.findMany({
        where: { postId, parentId: null },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true, // Make sure to include name
              profile: {
                select: { avatarUrl: true },
              },
            },
          },
          votes: true, // Add this line to include votes
          replies: {
            include: {
              user: {
                select: {
                  id: true,
                  email: true,
                  name: true, // Make sure to include name
                  profile: {
                    select: { avatarUrl: true },
                  },
                },
              },
              votes: true, // Add this for replies too
              // Include nested replies up to a certain depth (e.g., 3 levels)
              replies: {
                include: {
                  user: {
                    select: {
                      id: true,
                      email: true,
                      name: true, // Make sure to include name
                      profile: {
                        select: { avatarUrl: true },
                      },
                    },
                  },
                  votes: true, // Add this for nested replies
                  replies: {
                    include: {
                      user: {
                        select: {
                          id: true,
                          email: true,
                          name: true, // Make sure to include name
                          profile: {
                            select: { avatarUrl: true },
                          },
                        },
                      },
                      votes: true, // Add this for deeply nested replies
                    },
                  },
                },
              },
            },
          },
        },
      }),
      this.prisma.comment.count({ where: { postId, parentId: null } }),
    ]);

    return {
      comments,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1,
      },
    };
  }

  /**
   * Updates an existing comment.
   * Only the author of the comment can update it.
   * @param commentId - The ID of the comment to update.
   * @param userId - The ID of the user attempting to update the comment.
   * @param content - The new content for the comment.
   * @returns A promise that resolves to the updated comment record.
   * @throws {NotFoundException} If the comment is not found.
   * @throws {ForbiddenException} If the user is not the author of the comment.
   * @throws {BadRequestException} If the comment content is empty or too long.
   */
  async updateComment(commentId: string, userId: string, content: string) {
    const comment = await this.prisma.comment.findUnique({
      where: { id: commentId },
    });

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    if (comment.userId !== userId) {
      throw new ForbiddenException('You can only update your own comments');
    }

    if (!content || content.trim().length === 0) {
      throw new BadRequestException('Comment content cannot be empty');
    }

    if (content.length > 500) {
      throw new BadRequestException(
        'Comment content too long (max 500 characters)',
      );
    }

    return this.prisma.comment.update({
      where: { id: commentId },
      data: { content: content.trim() },
    });
  }

  /**
   * Deletes an existing comment.
   * Only the author of the comment can delete it.
   * @param commentId - The ID of the comment to delete.
   * @param userId - The ID of the user attempting to delete the comment.
   * @returns A promise that resolves to a success message.
   * @throws {NotFoundException} If the comment is not found.
   * @throws {ForbiddenException} If the user is not the author of the comment.
   */
  async deleteComment(commentId: string, userId: string) {
    const comment = await this.prisma.comment.findUnique({
      where: { id: commentId },
    });

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    if (comment.userId !== userId) {
      throw new ForbiddenException('You can only delete your own comments');
    }

    await this.prisma.comment.delete({ where: { id: commentId } });
    return { message: 'Comment deleted successfully' };
  }

  /**
   * Retrieves a recommended feed of posts, ordered by creation date and then by like count.
   * This is a basic recommendation logic and can be expanded.
   * @returns A promise that resolves to an array of recommended posts.
   */
  async getRecommendedFeed() {
    return this.prisma.post.findMany({
      orderBy: [{ createdAt: 'desc' }, { Vote: { _count: 'desc' } }],
      include: {
        author: {
          select: {
            id: true,
            email: true,
            profile: {
              select: { bio: true, avatarUrl: true },
            },
          },
        },
        _count: {
          select: { Vote: true, Comment: true },
        },
      },
    });
  }
}
