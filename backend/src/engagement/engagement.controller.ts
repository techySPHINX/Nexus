import {
  Controller,
  Post,
  Body,
  Param,
  Delete,
  Get,
  UseGuards,
  Query,
  Patch,
} from '@nestjs/common';
import { EngagementService } from './engagement.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { GetCurrentUser } from 'src/common/decorators/get-current-user.decorator';
import { Roles } from 'src/common/decorators/roles.decorator';
import { Role } from '@prisma/client';

/**
 * Controller for handling user engagement with posts, including likes and comments.
 * All endpoints are protected by JWT authentication and role-based access control.
 */
@Controller('engagement')
@UseGuards(JwtAuthGuard, RolesGuard)
export class EngagementController {
  constructor(private readonly service: EngagementService) {}

  /**
   * Likes a specific post.
   * @param postId - The ID of the post to like.
   * @param userId - The ID of the user liking the post.
   * @returns A promise that resolves to the created like record.
   */
  @Post(':postId/like')
  @Roles(Role.STUDENT, Role.ALUM, Role.ADMIN)
  likePost(
    @Param('postId') postId: string,
    @GetCurrentUser('sub') userId: string,
  ) {
    return this.service.likePost(userId, postId);
  }

  /**
   * Unlikes a specific post.
   * @param postId - The ID of the post to unlike.
   * @param userId - The ID of the user unliking the post.
   * @returns A promise that resolves to a success message.
   */
  @Delete(':postId/unlike')
  @Roles(Role.STUDENT, Role.ALUM, Role.ADMIN)
  unlikePost(
    @Param('postId') postId: string,
    @GetCurrentUser('sub') userId: string,
  ) {
    return this.service.unlikePost(userId, postId);
  }

  /**
   * Adds a comment to a specific post.
   * @param postId - The ID of the post to comment on.
   * @param userId - The ID of the user making the comment.
   * @param content - The content of the comment.
   * @returns A promise that resolves to the created comment record.
   */
  @Post(':postId/comment')
  @Roles(Role.STUDENT, Role.ALUM, Role.ADMIN)
  comment(
    @Param('postId') postId: string,
    @GetCurrentUser('sub') userId: string,
    @Body('content') content: string,
  ) {
    return this.service.commentOnPost(userId, postId, content);
  }

  /**
   * Retrieves all comments for a specific post with pagination.
   * @param postId - The ID of the post to retrieve comments for.
   * @param page - The page number for pagination.
   * @param limit - The number of comments per page.
   * @returns A promise that resolves to an object containing paginated comments and pagination details.
   */
  @Get(':postId/comments')
  getCommentsForPost(
    @Param('postId') postId: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ) {
    return this.service.getCommentsForPost(postId, page, limit);
  }

  /**
   * Updates an existing comment. Only the author of the comment can update it.
   * @param commentId - The ID of the comment to update.
   * @param userId - The ID of the user attempting to update the comment.
   * @param content - The new content for the comment.
   * @returns A promise that resolves to the updated comment record.
   */
  @Patch('comments/:commentId')
  @Roles(Role.STUDENT, Role.ALUM, Role.ADMIN)
  updateComment(
    @Param('commentId') commentId: string,
    @GetCurrentUser('sub') userId: string,
    @Body('content') content: string,
  ) {
    return this.service.updateComment(commentId, userId, content);
  }

  /**
   * Deletes an existing comment. Only the author of the comment can delete it.
   * @param commentId - The ID of the comment to delete.
   * @param userId - The ID of the user attempting to delete the comment.
   * @returns A promise that resolves to a success message.
   */
  @Delete('comments/:commentId')
  @Roles(Role.STUDENT, Role.ALUM, Role.ADMIN)
  deleteComment(
    @Param('commentId') commentId: string,
    @GetCurrentUser('sub') userId: string,
  ) {
    return this.service.deleteComment(commentId, userId);
  }

  /**
   * Retrieves a recommended feed of posts. (Implementation details for recommendation logic are in the service).
   * @returns A promise that resolves to an array of recommended posts.
   */
  @Get('feed')
  getFeed() {
    return this.service.getRecommendedFeed();
  }
}
