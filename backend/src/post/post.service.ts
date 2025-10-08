import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { PostStatus, Role, VoteTargetType, VoteType } from '@prisma/client';

/**
 * Service for managing posts, including creation, retrieval, updates, and moderation.
 */
@Injectable()
export class PostService {
  constructor(private prisma: PrismaService) {}

  /**
   * Creates a new post.
   * Students' posts are set to PENDING status, while others are APPROVED.
   * @param userId - The ID of the author.
   * @param dto - The data for creating the post.
   * @returns A promise that resolves to the created post.
   * @throws {NotFoundException} If the user is not found.
   * @throws {BadRequestException} If content is empty or too long.
   */
  async create(
    userId: string,
    dto: {
      subject: string;
      content: string;
      imageUrl?: string;
      type?: string;
      subCommunityId?: string;
    },
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

    if (!dto.subject || dto.subject.trim().length === 0) {
      throw new BadRequestException('Post subject cannot be empty');
    }

    if (dto.subject.length > 200) {
      throw new BadRequestException(
        'Post subject too long (max 200 characters)',
      );
    }

    // If subCommunityId is provided, check if the user is a member of that sub-community
    if (dto.subCommunityId) {
      const member = await this.prisma.subCommunityMember.findFirst({
        where: {
          userId: userId,
          subCommunityId: dto.subCommunityId,
        },
      });
      if (!member) {
        throw new ForbiddenException(
          'You must be a member of the sub-community to post in it.',
        );
      }
    }

    const postStatus = PostStatus.PENDING;

    return this.prisma.post.create({
      data: {
        subject: dto.subject.trim(),
        content: dto.content.trim(),
        imageUrl: dto.imageUrl,
        type: dto.type || 'UPDATE',
        authorId: userId,
        status: postStatus,
        subCommunityId: dto.subCommunityId,
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
            Vote: true,
            Comment: true,
          },
        },
      },
    });
  }

  /**
   * Retrieves a personalized feed of approved posts for a user.
   * Posts are ranked based on connections, interests, skills, and engagement.
   * @param userId - The ID of the user requesting the feed.
   * @param page - The page number for pagination.
   * @param limit - The number of posts per page.
   * @returns A promise that resolves to an object containing paginated posts and pagination details.
   * @throws {BadRequestException} If pagination parameters are invalid.
   * @throws {NotFoundException} If the user is not found.
   */
  async getFeed(userId: string, page = 1, limit = 10, subCommunityId?: string) {
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
        subCommunityMemberships: {
          select: { subCommunityId: true },
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

    const whereClause: any = {
      status: PostStatus.APPROVED,
      subCommunityId: null, // Ensure only non-subcommunity posts appear on the main feed
    };

    if (subCommunityId) {
      // If a specific subCommunityId is provided, filter posts for that sub-community
      // And ensure the user is a member of that sub-community
      const isMember = user.subCommunityMemberships.some(
        (membership) => membership.subCommunityId === subCommunityId,
      );
      if (!isMember) {
        throw new ForbiddenException(
          'You are not a member of this sub-community.',
        );
      }
      whereClause.subCommunityId = subCommunityId;
    } else {
      // For the universal feed, exclude posts that belong to any sub-community
      whereClause.subCommunityId = null;
    }

    const posts = await this.prisma.post.findMany({
      where: whereClause,
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
            Vote: true,
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
        const authorSkills =
          post.author.profile?.skills.map((s) => s.name.toLowerCase()) || [];

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
        score += (post._count.Vote + post._count.Comment) * 0.1;

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
  }

  async getSubCommunityFeed(
    subCommunityId: string,
    userId: string,
    page = 1,
    limit = 10,
  ) {
    if (page < 1 || limit < 1 || limit > 50) {
      throw new BadRequestException('Invalid pagination parameters');
    }

    // Check if the user is a member of the sub-community
    const member = await this.prisma.subCommunityMember.findFirst({
      where: {
        userId: userId,
        subCommunityId: subCommunityId,
      },
    });

    if (!member) {
      throw new ForbiddenException(
        'You are not a member of this sub-community.',
      );
    }

    const skip = (page - 1) * limit;

    const [posts, total] = await Promise.all([
      this.prisma.post.findMany({
        where: {
          subCommunityId: subCommunityId,
          status: PostStatus.APPROVED, // Only approved posts are visible in the sub-community feed
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          author: {
            select: {
              id: true,
              name: true,
              role: true,
              profile: {
                select: { bio: true, avatarUrl: true },
              },
            },
          },
          Vote: userId
            ? {
                where: { userId, targetType: VoteTargetType.POST },
                select: { id: true, type: true },
              }
            : false,
          _count: {
            select: {
              Vote: true,
              Comment: true,
            },
          },
        },
      }),
      this.prisma.post.count({
        where: {
          subCommunityId: subCommunityId,
          status: PostStatus.APPROVED,
        },
      }),
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

  /**
   * Retrieves a single post by its ID.
   * Optionally checks if the current user has liked the post.
   * @param id - The ID of the post to retrieve.
   * @param userId - Optional. The ID of the current user.
   * @returns A promise that resolves to the post object with like status.
   * @throws {NotFoundException} If the post is not found.
   */
  async findOne(id: string, userId?: string) {
    const post = await this.prisma.post.findUnique({
      where: { id },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            role: true,
            profile: {
              select: { bio: true, avatarUrl: true },
            },
          },
        },
        Vote: userId
          ? {
              where: { userId, targetType: VoteTargetType.POST },
              select: { id: true, type: true },
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
            Vote: true,
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
      userVote: userId ? (post as any).Vote?.[0] || null : null,
    };
  }

  /**
   * Retrieves all posts by a specific user with pagination.
   * @param userId - The ID of the user whose posts are to be retrieved.
   * @param page - The page number for pagination.
   * @param limit - The number of posts per page.
   * @returns A promise that resolves to an object containing paginated posts and pagination details.
   * @throws {NotFoundException} If the user is not found.
   * @throws {BadRequestException} If pagination parameters are invalid.
   */
  async findByUser(
    userId: string,
    currentUserId: string,
    page = 1,
    limit = 10,
  ) {
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

    // Only allow all posts if it's the current user's profile
    const whereCondition: any = { authorId: userId };

    if (currentUserId !== userId) {
      whereCondition.status = 'APPROVED';
    }

    const [posts, total] = await Promise.all([
      this.prisma.post.findMany({
        where: whereCondition,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          author: {
            select: {
              id: true,
              name: true,
              role: true,
              profile: {
                select: { bio: true, avatarUrl: true },
              },
            },
          },
          _count: {
            select: {
              Vote: true,
              Comment: true,
            },
          },
        },
      }),
      this.prisma.post.count({ where: whereCondition }),
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

  /**
   * Updates an existing post.
   * Only the author of the post can update it.
   * @param id - The ID of the post to update.
   * @param userId - The ID of the user attempting to update the post.
   * @param dto - The data to update the post with.
   * @returns A promise that resolves to the updated post.
   * @throws {NotFoundException} If the post is not found.
   * @throws {ForbiddenException} If the user is not the author of the post.
   * @throws {BadRequestException} If content is empty or too long.
   */
  async update(
    id: string,
    userId: string,
    dto: {
      subject?: string;
      content?: string;
      imageUrl?: string;
      type?: string;
      subCommunityId?: string;
    },
  ) {
    const post = await this.prisma.post.findUnique({
      where: { id },
      select: { authorId: true, subCommunityId: true },
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const isAdmin = user.role === Role.ADMIN;

    if (post.authorId !== userId && !isAdmin) {
      throw new ForbiddenException('You can only update your own posts');
    }

    // If subCommunityId is being changed, ensure user is member of new sub-community
    if (dto.subCommunityId && dto.subCommunityId !== post.subCommunityId) {
      const member = await this.prisma.subCommunityMember.findFirst({
        where: {
          userId: userId,
          subCommunityId: dto.subCommunityId,
        },
      });
      if (!member) {
        throw new ForbiddenException(
          'You must be a member of the target sub-community to move the post to it.',
        );
      }
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

    if (dto.subject !== undefined) {
      if (!dto.subject || dto.subject.trim().length === 0) {
        throw new BadRequestException('Post subject cannot be empty');
      }

      if (dto.subject.length > 200) {
        throw new BadRequestException(
          'Post subject too long (max 200 characters)',
        );
      }
    }

    const dataToUpdate: any = {
      ...(dto.subject && { subject: dto.subject.trim() }),
      ...(dto.content && { content: dto.content.trim() }),
      ...(dto.imageUrl !== undefined && { imageUrl: dto.imageUrl }),
      ...(dto.type && { type: dto.type }),
      ...(dto.subCommunityId !== undefined && {
        subCommunityId: dto.subCommunityId,
      }),
      updatedAt: new Date(),
    };

    if (isAdmin) {
      dataToUpdate.status = PostStatus.PENDING;
      dataToUpdate.isUrgent = true;
    }

    return this.prisma.post.update({
      where: { id },
      data: dataToUpdate,
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
            Vote: true,
            Comment: true,
          },
        },
      },
    });
  }

  /**
   * Deletes a post.
   * Only the author of the post can delete it.
   * @param id - The ID of the post to delete.
   * @param userId - The ID of the user attempting to delete the post.
   * @returns A promise that resolves to a success message.
   * @throws {NotFoundException} If the post is not found.
   * @throws {ForbiddenException} If the user is not the author of the post.
   */
  async remove(id: string, userId: string) {
    const post = await this.prisma.post.findUnique({
      where: { id },
      select: { authorId: true },
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const isAdmin = user.role === Role.ADMIN;

    if (post.authorId !== userId && !isAdmin) {
      throw new ForbiddenException('You can only delete your own posts');
    }

    await this.prisma.post.delete({ where: { id } });

    return { message: 'Post deleted successfully' };
  }

  /**
   * Retrieves engagement statistics (upvotes, downvotes, and comments) for a specific post.
   * @param id - The ID of the post to retrieve stats for.
   * @returns A promise that resolves to an object containing upvote, downvote, and comment counts.
   * @throws {NotFoundException} If the post is not found.
   */
  async getPostStats(id: string) {
    const stats = await this.prisma.post.findUnique({
      where: { id },
      select: {
        _count: {
          select: {
            Vote: {
              where: { type: VoteType.UPVOTE },
            },
            Comment: true,
          },
        },
      },
    });

    if (!stats) {
      throw new NotFoundException('Post not found');
    }

    const downvotes = await this.prisma.vote.count({
      where: {
        postId: id,
        type: VoteType.DOWNVOTE,
      },
    });

    return {
      upvotes: stats._count.Vote,
      downvotes: downvotes,
      comments: stats._count.Comment,
    };
  }

  /**
   * Searches for approved posts based on a query string with pagination.
   * @param query - The search query string.
   * @param page - The page number for pagination.
   * @param limit - The number of posts per page.
   * @returns A promise that resolves to an object containing paginated posts, the query, and pagination details.
   * @throws {BadRequestException} If the search query is empty or pagination parameters are invalid.
   */
  async searchPosts(
    query: string,
    page = 1,
    limit = 10,
    subCommunityId?: string,
  ) {
    if (!query || query.trim().length === 0) {
      throw new BadRequestException('Search query cannot be empty');
    }

    if (page < 1 || limit < 1 || limit > 50) {
      throw new BadRequestException('Invalid pagination parameters');
    }

    const whereClause: any = {
      content: {
        contains: query.trim(),
        mode: 'insensitive',
      },
      status: PostStatus.APPROVED,
    };

    if (subCommunityId) {
      // If subCommunityId is provided, search only within that sub-community
      whereClause.subCommunityId = subCommunityId;
    } else {
      // For universal search, exclude posts that belong to any sub-community
      whereClause.subCommunityId = null;
    }

    const skip = (page - 1) * limit;

    const [posts, total] = await Promise.all([
      this.prisma.post.findMany({
        where: whereClause,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          author: {
            select: {
              id: true,
              name: true,
              role: true,
              profile: {
                select: { bio: true, avatarUrl: true },
              },
            },
          },
          _count: {
            select: {
              Vote: true,
              Comment: true,
            },
          },
        },
      }),
      this.prisma.post.count({
        where: whereClause,
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

  /**
   * Retrieves all posts that are pending approval with pagination.
   * @param page - The page number for pagination.
   * @param limit - The number of posts per page.
   * @returns A promise that resolves to an object containing paginated pending posts and pagination details.
   * @throws {BadRequestException} If pagination parameters are invalid.
   */
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
        orderBy: [{ isUrgent: 'desc' }, { createdAt: 'desc' }],
        include: {
          author: {
            select: {
              id: true,
              name: true,
              role: true,
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

  /**
   * Approves a post, changing its status from PENDING to APPROVED.
   * @param id - The ID of the post to approve.
   * @returns A promise that resolves to the updated post.
   * @throws {NotFoundException} If the post is not found.
   * @throws {BadRequestException} If the post is not in PENDING status.
   */
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
      data: {
        status: PostStatus.APPROVED,
        // Don't update updatedAt for approval - only when owner edits the post
      },
    });
  }

  /**
   * Rejects a post, changing its status from PENDING to REJECTED.
   * @param id - The ID of the post to reject.
   * @returns A promise that resolves to the updated post.
   * @throws {NotFoundException} If the post is not found.
   * @throws {BadRequestException} If the post is not in PENDING status.
   */
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
      data: {
        status: PostStatus.REJECTED,
        // Don't update updatedAt for rejection - only when owner edits the post
      },
    });
  }
}
