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
import { Role, VoteType } from '@prisma/client';

/**
 * Controller for handling user engagement with posts, including likes and comments.
 * All endpoints are protected by JWT authentication and role-based access control.
 */
@Controller('engagement')
@UseGuards(JwtAuthGuard, RolesGuard)
export class EngagementController {
  constructor(private readonly service: EngagementService) {}

  /**
   * Allows a user to vote on a specific post.
   * @param postId - The ID of the post to vote on.
   * @param userId - The ID of the user voting.
   * @param voteType - The type of vote (UPVOTE or DOWNVOTE).
   * @returns A promise that resolves to the created or updated vote record.
   */
  @Post(':postId/vote')
  @Roles(Role.STUDENT, Role.ALUM, Role.ADMIN)
  voteOnPost(
    @Param('postId') postId: string,
    @GetCurrentUser('sub') userId: string,
    @Body('voteType') voteType: VoteType,
  ) {
    return this.service.voteOnPost(userId, postId, voteType);
  }

  /**
   * Allows a user to vote on a specific comment.
   * @param commentId - The ID of the comment to vote on.
   * @param userId - The ID of the user voting.
   * @param voteType - The type of vote (UPVOTE or DOWNVOTE).
   * @returns A promise that resolves to the created or updated vote record.
   */
  @Post(':commentId/vote-comment')
  @Roles(Role.STUDENT, Role.ALUM, Role.ADMIN)
  voteOnComment(
    @Param('commentId') commentId: string,
    @GetCurrentUser('sub') userId: string,
    @Body('voteType') voteType: VoteType,
  ) {
    return this.service.voteOnComment(userId, commentId, voteType);
  }

  /**
   * Allows a user to remove their vote from a specific post or comment.
   * @param voteId - The ID of the vote to remove.
   * @param userId - The ID of the user removing the vote.
   * @returns A promise that resolves to a success message.
   */
  @Delete(':voteId/remove-vote')
  @Roles(Role.STUDENT, Role.ALUM, Role.ADMIN)
  removeVote(
    @Param('voteId') voteId: string,
    @GetCurrentUser('sub') userId: string,
  ) {
    return this.service.removeVote(userId, voteId);
  }

  /**
   * Adds a comment to a specific post, optionally as a reply to another comment.
   * @param postId - The ID of the post to comment on.
   * @param userId - The ID of the user making the comment.
   * @param content - The content of the comment.
   * @param parentId - Optional. The ID of the parent comment if this is a reply.
   * @returns A promise that resolves to the created comment record.
   */
  @Post(':postId/comment')
  @Roles(Role.STUDENT, Role.ALUM, Role.ADMIN)
  comment(
    @Param('postId') postId: string,
    @GetCurrentUser('sub') userId: string,
    @Body('content') content: string,
    @Body('parentId') parentId?: string,
  ) {
    return this.service.commentOnPost(userId, postId, content, parentId);
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
