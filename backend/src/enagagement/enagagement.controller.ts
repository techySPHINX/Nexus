import { Controller, Post, Body, Param, Delete, Get } from '@nestjs/common';
import { EngagementService } from './enagagement.service';

@Controller('engagement')
export class EngagementController {
  constructor(private readonly service: EngagementService) {}

  @Post(':postId/like')
  likePost(@Param('postId') postId: string, @Body('userId') userId: string) {
    return this.service.likePost(userId, postId);
  }

  @Delete(':postId/unlike')
  unlikePost(@Param('postId') postId: string, @Body('userId') userId: string) {
    return this.service.unlikePost(userId, postId);
  }

  @Post(':postId/comment')
  comment(
    @Param('postId') postId: string,
    @Body() body: { userId: string; content: string },
  ) {
    return this.service.commentOnPost(body.userId, postId, body.content);
  }

  @Get('feed')
  getFeed() {
    return this.service.getRecommendedFeed();
  }
}
