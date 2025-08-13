import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

/**
 * Service for managing user engagement with posts, including likes and comments.
 */
@Injectable()
export class EngagementService {
  constructor(private prisma: PrismaService) {}

  /**
   * Allows a user to like a specific post.
   * Prevents a user from liking the same post multiple times.
   * @param userId - The ID of the user liking the post.
   * @param postId - The ID of the post to be liked.
   * @returns A promise that resolves to the created like record.
   * @throws {NotFoundException} If the post is not found.
   * @throws {BadRequestException} If the post has already been liked by the user.
   */
  async likePost(userId: string, postId: string) {
    const post = await this.prisma.post.findUnique({ where: { id: postId } });
    if (!post) {
      throw new NotFoundException('Post not found');
    }

    const existingLike = await this.prisma.like.findUnique({
      where: { userId_postId: { userId, postId } },
    });

    if (existingLike) {
      throw new BadRequestException('Post already liked');
    }

    return this.prisma.like.create({
      data: { userId, postId },
    });
  }

  /**
   * Allows a user to unlike a specific post.
   * @param userId - The ID of the user unliking the post.
   * @param postId - The ID of the post to be unliked.
   * @returns A promise that resolves to the deleted like record.
   * @throws {NotFoundException} If the post is not found.
   * @throws {BadRequestException} If the post has not been liked by the user.
   */
  async unlikePost(userId: string, postId: string) {
    const post = await this.prisma.post.findUnique({ where: { id: postId } });
    if (!post) {
      throw new NotFoundException('Post not found');
    }

    const existingLike = await this.prisma.like.findUnique({
      where: { userId_postId: { userId, postId } },
    });

    if (!existingLike) {
      throw new BadRequestException('Post not liked yet');
    }

    return this.prisma.like.delete({
      where: { userId_postId: { userId, postId } },
    });
  }

  /**
   * Allows a user to add a comment to a specific post.
   * @param userId - The ID of the user making the comment.
   * @param postId - The ID of the post to comment on.
   * @param content - The content of the comment.
   * @returns A promise that resolves to the created comment record.
   * @throws {NotFoundException} If the post is not found.
   * @throws {BadRequestException} If the comment content is empty or too long.
   */
  async commentOnPost(userId: string, postId: string, content: string) {
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

    return this.prisma.comment.create({
      data: {
        userId,
        postId,
        content: content.trim(),
      },
    });
  }

  /**
   * Retrieves all comments for a specific post with pagination.
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
        where: { postId },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              profile: {
                select: { avatarUrl: true },
              },
            },
          },
        },
      }),
      this.prisma.comment.count({ where: { postId } }),
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
      orderBy: [{ createdAt: 'desc' }, { Like: { _count: 'desc' } }],
      include: {
        author: {
          select: {
            id: true,
            name: true,
            profile: {
              select: { bio: true, avatarUrl: true },
            },
          },
        },
        _count: {
          select: { Like: true, Comment: true },
        },
      },
    });
  }
}
