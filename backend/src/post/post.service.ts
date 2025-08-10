import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';

@Injectable()
export class PostService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, dto: CreatePostDto) {
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

    return this.prisma.post.create({
      data: {
        content: dto.content.trim(),
        imageUrl: dto.imageUrl,
        type: dto.type || 'UPDATE',
        authorId: userId,
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

  async findAll(page = 1, limit = 10, type?: string) {
    if (page < 1 || limit < 1 || limit > 50) {
      throw new BadRequestException('Invalid pagination parameters');
    }

    const skip = (page - 1) * limit;
    const where = type ? { type } : {};

    const [posts, total] = await Promise.all([
      this.prisma.post.findMany({
        where,
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
      this.prisma.post.count({ where }),
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

  async update(id: string, userId: string, dto: UpdatePostDto) {
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

  async likePost(postId: string, userId: string) {
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    const existingLike = await this.prisma.like.findUnique({
      where: {
        userId_postId: {
          userId,
          postId,
        },
      },
    });

    if (existingLike) {
      throw new BadRequestException('Post already liked');
    }

    await this.prisma.like.create({
      data: {
        userId,
        postId,
      },
    });

    return { message: 'Post liked successfully' };
  }

  async unlikePost(postId: string, userId: string) {
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    const existingLike = await this.prisma.like.findUnique({
      where: {
        userId_postId: {
          userId,
          postId,
        },
      },
    });

    if (!existingLike) {
      throw new BadRequestException('Post not liked yet');
    }

    await this.prisma.like.delete({
      where: {
        userId_postId: {
          userId,
          postId,
        },
      },
    });

    return { message: 'Post unliked successfully' };
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
}
