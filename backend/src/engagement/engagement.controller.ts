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

@Controller('engagement')
@UseGuards(JwtAuthGuard, RolesGuard)
export class EngagementController {
  constructor(private readonly service: EngagementService) {}

  @Post(':postId/like')
  @Roles(Role.STUDENT, Role.ALUM, Role.ADMIN)
  likePost(
    @Param('postId') postId: string,
    @GetCurrentUser('sub') userId: string,
  ) {
    return this.service.likePost(userId, postId);
  }

  @Delete(':postId/unlike')
  @Roles(Role.STUDENT, Role.ALUM, Role.ADMIN)
  unlikePost(
    @Param('postId') postId: string,
    @GetCurrentUser('sub') userId: string,
  ) {
    return this.service.unlikePost(userId, postId);
  }

  @Post(':postId/comment')
  @Roles(Role.STUDENT, Role.ALUM, Role.ADMIN)
  comment(
    @Param('postId') postId: string,
    @GetCurrentUser('sub') userId: string,
    @Body('content') content: string,
  ) {
    return this.service.commentOnPost(userId, postId, content);
  }

  @Get(':postId/comments')
  getCommentsForPost(
    @Param('postId') postId: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ) {
    return this.service.getCommentsForPost(postId, page, limit);
  }

  @Patch('comments/:commentId')
  @Roles(Role.STUDENT, Role.ALUM, Role.ADMIN)
  updateComment(
    @Param('commentId') commentId: string,
    @GetCurrentUser('sub') userId: string,
    @Body('content') content: string,
  ) {
    return this.service.updateComment(commentId, userId, content);
  }

  @Delete('comments/:commentId')
  @Roles(Role.STUDENT, Role.ALUM, Role.ADMIN)
  deleteComment(
    @Param('commentId') commentId: string,
    @GetCurrentUser('sub') userId: string,
  ) {
    return this.service.deleteComment(commentId, userId);
  }

  @Get('feed')
  getFeed() {
    return this.service.getRecommendedFeed();
  }
}
