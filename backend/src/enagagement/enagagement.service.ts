import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class EngagementService {
  constructor(private prisma: PrismaService) {}

  async likePost(userId: string, postId: string) {
    return this.prisma.like.upsert({
      where: { userId_postId: { userId, postId } },
      update: {},
      create: { userId, postId },
    });
  }

  async unlikePost(userId: string, postId: string) {
    return this.prisma.like.delete({
      where: { userId_postId: { userId, postId } },
    });
  }

  async commentOnPost(userId: string, postId: string, content: string) {
    return this.prisma.comment.create({
      data: {
        userId,
        postId,
        content,
      },
    });
  }

  async getRecommendedFeed() {
    return this.prisma.post.findMany({
      orderBy: [{ createdAt: 'desc' }, { likes: { _count: 'desc' } }],
      include: {
        author: true,
        _count: {
          select: { likes: true, comments: true },
        },
      },
    });
  }
}
