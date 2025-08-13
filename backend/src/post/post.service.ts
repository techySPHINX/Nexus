'''import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { PostStatus, Role } from '@prisma/client';

@Injectable()
export class PostService {
  constructor(private prisma: PrismaService) {}

  async create(
    userId: string,
    dto: { content: string; imageUrl?: string; type?: string },
  ) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (!dto.content || dto.content.trim().length === 0) {
      throw new BadRequestException('Post content cannot be empty');
    }

    if (dto.content.length > 2000) {
      throw new BadRequestException(
        'Post content too long (max 2000 characters)',
      );
    }

    const postStatus =
      user.role === Role.STUDENT ? PostStatus.PENDING : PostStatus.APPROVED;

    return this.prisma.post.create({
      data: {
        content: dto.content.trim(),
        imageUrl: dto.imageUrl,
        type: dto.type || 'UPDATE',
        authorId: userId,
        status: postStatus,
      },
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
          select: {
            Like: true,
            Comment: true,
          },
        },
      },
    });
  }

  '''async getFeed(userId: string, page = 1, limit = 10) {
    if (page < 1 || limit < 1 || limit > 50) {
      throw new BadRequestException('Invalid pagination parameters');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        profile: {
          include: {
            skills: true,
          },
        },
        requestedConnections: {
          where: { status: 'ACCEPTED' },
          select: { recipientId: true },
        },
        receivedConnections: {
          where: { status: 'ACCEPTED' },
          select: { requesterId: true },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const connectionIds = [
      ...user.requestedConnections.map((c) => c.recipientId),
      ...user.receivedConnections.map((c) => c.requesterId),
    ];

    const userInterests = user.profile?.interests?.split(',') || [];
    const userSkills = user.profile?.skills.map((s) => s.name) || [];

    const posts = await this.prisma.post.findMany({
      where: {
        status: PostStatus.APPROVED,
      },
      include: {
        author: {
          include: {
            profile: {
              include: {
                skills: true,
              },
            },
          },
        },
        _count: {
          select: {
            Like: true,
            Comment: true,
          },
        },
      },
    });

    const rankedPosts = posts
      .map((post) => {
        let score = 0;

        // Connection Score
        if (connectionIds.includes(post.authorId)) {
          score += 3;
        }

        // Interest Score
        const postContent = post.content.toLowerCase();
        const authorSkills = post.author.profile?.skills.map((s) => s.name.toLowerCase()) || [];

        for (const interest of userInterests) {
          if (postContent.includes(interest.toLowerCase())) {
            score += 2;
          }
        }

        for (const skill of userSkills) {
          if (authorSkills.includes(skill.toLowerCase())) {
            score += 2;
          }
        }

        // Content-Type Score
        if (post.imageUrl) {
          score += 1;
        }

        // Engagement Score
        score += (post._count.Like + post._count.Comment) * 0.1;

        return { ...post, score };
      })
      .sort((a, b) => b.score - a.score);

    const skip = (page - 1) * limit;
    const paginatedPosts = rankedPosts.slice(skip, skip + limit);

    return {
      posts: paginatedPosts,
      pagination: {
        page,
        limit,
        total: posts.length,
        totalPages: Math.ceil(posts.length / limit),
        hasNext: page < Math.ceil(posts.length / limit),
        hasPrev: page > 1,
      },
    };
  }'''

  async findOne(id: string, userId?: string) {
    const post = await this.prisma.post.findUnique({
      where: { id },
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
        Like: userId
          ? {
              where: { userId },
              select: { id: true },
            }
          : false,
        Comment: {
          take: 5,
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
        },
        _count: {
          select: {
            Like: true,
            Comment: true,
          },
        },
      },
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    return {
      ...post,
      isLiked: userId ? post.Like.length > 0 : false,
    };
  }

  async findByUser(userId: string, page = 1, limit = 10) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (page < 1 || limit < 1 || limit > 50) {
      throw new BadRequestException('Invalid pagination parameters');
    }

    const skip = (page - 1) * limit;

    const [posts, total] = await Promise.all([
      this.prisma.post.findMany({
        where: { authorId: userId },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
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
            select: {
              Like: true,
              Comment: true,
            },
          },
        },
      }),
      this.prisma.post.count({ where: { authorId: userId } }),
    ]);

    return {
      posts,
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

  async update(
    id: string,
    userId: string,
    dto: { content?: string; imageUrl?: string; type?: string },
  ) {
    const post = await this.prisma.post.findUnique({
      where: { id },
      select: { authorId: true },
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    if (post.authorId !== userId) {
      throw new ForbiddenException('You can only update your own posts');
    }

    if (dto.content !== undefined) {
      if (!dto.content || dto.content.trim().length === 0) {
        throw new BadRequestException('Post content cannot be empty');
      }

      if (dto.content.length > 2000) {
        throw new BadRequestException(
          'Post content too long (max 2000 characters)',
        );
      }
    }

    return this.prisma.post.update({
      where: { id },
      data: {
        ...(dto.content && { content: dto.content.trim() }),
        ...(dto.imageUrl !== undefined && { imageUrl: dto.imageUrl }),
        ...(dto.type && { type: dto.type }),
      },
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
          select: {
            Like: true,
            Comment: true,
          },
        },
      },
    });
  }

  async remove(id: string, userId: string) {
    const post = await this.prisma.post.findUnique({
      where: { id },
      select: { authorId: true },
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    if (post.authorId !== userId) {
      throw new ForbiddenException('You can only delete your own posts');
    }

    await this.prisma.post.delete({ where: { id } });

    return { message: 'Post deleted successfully' };
  }

  async getPostStats(id: string) {
    const stats = await this.prisma.post.findUnique({
      where: { id },
      select: {
        _count: {
          select: {
            Like: true,
            Comment: true,
          },
        },
      },
    });

    if (!stats) {
      throw new NotFoundException('Post not found');
    }

    return {
      likes: stats._count.Like,
      comments: stats._count.Comment,
    };
  }

  async searchPosts(query: string, page = 1, limit = 10) {
    if (!query || query.trim().length === 0) {
      throw new BadRequestException('Search query cannot be empty');
    }

    if (page < 1 || limit < 1 || limit > 50) {
      throw new BadRequestException('Invalid pagination parameters');
    }

    const skip = (page - 1) * limit;

    const [posts, total] = await Promise.all([
      this.prisma.post.findMany({
        where: {
          content: {
            contains: query.trim(),
            mode: 'insensitive',
          },
          status: PostStatus.APPROVED,
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
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
            select: {
              Like: true,
              Comment: true,
            },
          },
        },
      }),
      this.prisma.post.count({
        where: {
          content: {
            contains: query.trim(),
            mode: 'insensitive',
          },
          status: PostStatus.APPROVED,
        },
      }),
    ]);

    return {
      posts,
      query: query.trim(),
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

  async getPendingPosts(page = 1, limit = 10) {
    if (page < 1 || limit < 1 || limit > 50) {
      throw new BadRequestException('Invalid pagination parameters');
    }

    const skip = (page - 1) * limit;

    const [posts, total] = await Promise.all([
      this.prisma.post.findMany({
        where: { status: PostStatus.PENDING },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
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
        },
      }),
      this.prisma.post.count({ where: { status: PostStatus.PENDING } }),
    ]);

    return {
      posts,
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

  async approvePost(id: string) {
    const post = await this.prisma.post.findUnique({
      where: { id },
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    if (post.status !== PostStatus.PENDING) {
      throw new BadRequestException('Post is not pending approval');
    }

    return this.prisma.post.update({
      where: { id },
      data: { status: PostStatus.APPROVED },
    });
  }

  async rejectPost(id: string) {
    const post = await this.prisma.post.findUnique({
      where: { id },
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    if (post.status !== PostStatus.PENDING) {
      throw new BadRequestException('Post is not pending approval');
    }

    return this.prisma.post.update({
      where: { id },
      data: { status: PostStatus.REJECTED },
    });
  }
}
''
