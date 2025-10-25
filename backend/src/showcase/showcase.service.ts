import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { CreateCollaborationRequestDto } from './dto/create-collaboration-request.dto';
import { UpdateCollaborationRequestDto } from './dto/update-collaboration-request.dto';
import { FilterProjectDto } from './dto/filter-project.dto';
import { CreateCommentDto } from './dto/create-comment.dto';
import { AddTeamMemberDto } from './dto/add-team-member.dto';
import { NotificationService } from '../notification/notification.service';
import { CreateStartupDto } from './dto/create-startup.dto';
import { UpdateStartupDto } from './dto/update-startup.dto';
import { marked } from 'marked';
import { CreateProjectUpdateDto } from './dto/create-project-update.dto';

@Injectable()
export class ShowcaseService {
  constructor(
    private prisma: PrismaService,
    private notificationService: NotificationService,
  ) {}

  async createProject(userId: string, createProjectDto: CreateProjectDto) {
    const project = await this.prisma.project.create({
      data: {
        ownerId: userId,
        ...createProjectDto,
        teamMembers: {
          create: {
            userId,
            role: 'OWNER',
          },
        },
      },
    });

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        name: true,
        id: true,
        role: true,
        profile: { select: { avatarUrl: true } },
      },
    });

    return {
      id: project.id,
      title: project.title,
      imageUrl: project.imageUrl,
      githubUrl: project.githubUrl,
      tags: project.tags,
      status: project.status,
      seeking: project.seeking,
      createdAt: project.createdAt,
      owner: user,
      _count: { supporters: 0, followers: 0 },
    };
  }

  async updateProject(
    userId: string,
    projectId: string,
    updateProjectDto: UpdateProjectDto,
  ) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      select: { ownerId: true },
    });
    if (!project) {
      throw new Error('Project not found');
    }
    if (project.ownerId !== userId) {
      throw new Error('You are not the owner of this project');
    }

    const updated = await this.prisma.project.update({
      where: { id: projectId },
      data: updateProjectDto,
      select: {
        id: true,
        ...Object.fromEntries(
          Object.keys(updateProjectDto).map((key) => [key, true]),
        ),
      },
    });
    return updated;
  }

  async deleteProject(userId: string, projectId: string) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      select: { ownerId: true },
    });

    if (!project) {
      throw new Error('Project not found');
    }

    console.log('ProjectId to delete:', projectId);

    if (project.ownerId !== userId) {
      throw new Error('You are not the owner of this project');
    }
    return this.prisma.project.delete({ where: { id: projectId } });
  }

  /**
   * optimized to fetch all counts in a single query
   * only 1 lookup to project table and 2 lookups to projectSupport and projectFollower tables
   */
  async getProjectCounts(userId: string) {
    const [projectCounts, supportedCount, followedCount] = await Promise.all([
      this.prisma.project.groupBy({
        by: ['ownerId'],
        _count: { _all: true },
      }),
      this.prisma.projectSupport.count({ where: { userId } }),
      this.prisma.projectFollower.count({ where: { userId } }),
    ]);

    // totalProjects = all rows in project table
    const totalProjects = projectCounts.reduce(
      (sum, row) => sum + row._count._all,
      0,
    );

    // myProjects = count where ownerId = userId
    const myProjects =
      projectCounts.find((row) => row.ownerId === userId)?._count._all ?? 0;

    return {
      totalProjects,
      myProjects,
      supportedProjects: supportedCount,
      followedProjects: followedCount,
    };
  }

  async getProjects(userId: string, filterProjectDto: FilterProjectDto) {
    const {
      tags,
      sortBy,
      search,
      personalize,
      status,
      seeking,
      pageSize,
      cursor,
    } = filterProjectDto;
    const where: any = {};
    let orderBy: any = {};

    if (personalize) {
      const userProfile = await this.prisma.profile.findUnique({
        where: { userId },
        include: { skills: true },
      });
      if (userProfile && userProfile.skills.length > 0) {
        where.skills = {
          hasSome: userProfile.skills.map((s) => s.name),
        };
      }
      // Exclude own projects when personalize is true
      where.ownerId = { not: userId };
    }

    if (tags) {
      where.tags = {
        hasSome: tags,
      };
    }

    if (status) {
      where.status = status;
    }

    if (seeking) {
      where.seeking = {
        hasSome: seeking,
      };
    }

    if (search) {
      where.OR = [
        {
          title: {
            contains: search,
            mode: 'insensitive',
          },
        },
        {
          description: {
            contains: search,
            mode: 'insensitive',
          },
        },
      ];
    }

    if (sortBy === 'supporters') {
      orderBy = {
        supporters: {
          _count: 'desc',
        },
      };
    } else if (sortBy === 'followers') {
      orderBy = {
        followers: {
          _count: 'desc',
        },
      };
    } else if (sortBy === 'comments') {
      orderBy = {
        comments: {
          _count: 'desc',
        },
      };
    } else if (sortBy === 'updatedAt') {
      orderBy = {
        updatedAt: 'desc',
      };
    } else {
      orderBy = {
        createdAt: 'desc',
      };
    }

    const projects = await this.prisma.project.findMany({
      where,
      orderBy,
      take: pageSize,
      cursor: cursor ? { id: cursor } : undefined,
      skip: cursor ? 1 : 0, // skip the cursor itself
      select: {
        id: true,
        title: true,
        imageUrl: true,
        githubUrl: true,
        tags: true,
        status: true,
        seeking: true,
        createdAt: true,
        updatedAt: true,
        owner: {
          select: {
            id: true,
            name: true,
            role: true,
            profile: { select: { avatarUrl: true } },
          },
        },
        _count: {
          select: {
            supporters: true,
            followers: true,
          },
        },
        supporters:
          userId !== undefined
            ? {
                where: { userId },
                select: { userId: true },
              }
            : false,
        followers:
          userId !== undefined
            ? {
                where: { userId },
                select: { userId: true },
              }
            : false,
      },
    });

    return {
      data: projects,
      pagination: {
        nextCursor: projects.length ? projects[projects.length - 1].id : null,
        hasNext: projects.length === pageSize,
      },
    };
  }

  async getProjectById(projectId: string) {
    return this.prisma.project.findUnique({
      where: { id: projectId },
      select: {
        id: true,
        description: true,
        videoUrl: true,
        websiteUrl: true,
        skills: true,
        updatedAt: true,
        seeking: true,
        _count: {
          select: {
            comments: true,
            teamMembers: true,
            updates: true,
          },
        },
        teamMembers: {
          select: {
            userId: true,
            role: true,
            user: {
              select: {
                name: true,
                role: true,
                profile: { select: { avatarUrl: true } },
              },
            },
          },
        },
        updates: {
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
      },
    });
  }

  async getMyProjects(userId: string, filterProjectDto: FilterProjectDto) {
    const { tags, sortBy, search, status, seeking, pageSize, cursor } =
      filterProjectDto;

    const where: any = { ownerId: userId };
    console.log('UserId in getMyProjects:', userId);

    if (tags) where.tags = { hasSome: tags };
    if (status) where.status = status;
    if (seeking) where.seeking = { hasSome: seeking };
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    let orderBy: any = {};
    if (sortBy === 'supporters') orderBy = { supporters: { _count: 'desc' } };
    else if (sortBy === 'followers')
      orderBy = { followers: { _count: 'desc' } };
    else if (sortBy === 'updatedAt') orderBy = { updatedAt: 'desc' };
    else orderBy = { createdAt: 'desc' };

    const projects = await this.prisma.project.findMany({
      where,
      orderBy,
      take: pageSize,
      cursor: cursor ? { id: cursor } : undefined,
      skip: cursor ? 1 : 0, // skip the cursor itself
      select: {
        id: true,
        title: true,
        imageUrl: true,
        githubUrl: true,
        tags: true,
        status: true,
        seeking: true,
        createdAt: true,
        updatedAt: true,
        owner: {
          select: {
            id: true,
            name: true,
            role: true,
            profile: { select: { avatarUrl: true } },
          },
        },
        _count: {
          select: {
            supporters: true,
            followers: true,
            collaborationRequests: true,
          },
        },
      },
    });

    return {
      data: projects,
      pagination: {
        nextCursor: projects.length ? projects[projects.length - 1].id : null,
        hasNext: projects.length === pageSize,
      },
    };
  }

  async getProjectsByOwner(
    ownerId: string,
    filterProjectDto: FilterProjectDto,
  ) {
    const { tags, sortBy, search, status, seeking, pageSize, cursor } =
      filterProjectDto;

    const where: any = { ownerId };
    console.log('OwnerId in getProjectsByOwner:', ownerId);

    if (tags) where.tags = { hasSome: tags };
    if (status) where.status = status;
    if (seeking) where.seeking = { hasSome: seeking };
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    let orderBy: any = {};
    if (sortBy === 'supporters') orderBy = { supporters: { _count: 'desc' } };
    else if (sortBy === 'followers')
      orderBy = { followers: { _count: 'desc' } };
    else if (sortBy === 'updatedAt') orderBy = { updatedAt: 'desc' };
    else orderBy = { createdAt: 'desc' };

    const projects = await this.prisma.project.findMany({
      where,
      orderBy,
      take: pageSize,
      cursor: cursor ? { id: cursor } : undefined,
      skip: cursor ? 1 : 0,
      select: {
        id: true,
        title: true,
        imageUrl: true,
        githubUrl: true,
        tags: true,
        status: true,
        seeking: true,
        createdAt: true,
        updatedAt: true,
        owner: {
          select: {
            id: true,
            name: true,
            role: true,
            profile: { select: { avatarUrl: true } },
          },
        },
        _count: { select: { supporters: true, followers: true } },
      },
    });

    return {
      data: projects,
      pagination: {
        nextCursor: projects.length ? projects[projects.length - 1].id : null,
        hasNext: projects.length === pageSize,
      },
    };
  }

  async getSupportedProjects(
    userId: string,
    filterProjectDto: FilterProjectDto,
  ) {
    const { tags, sortBy, search, status, seeking, pageSize, cursor } =
      filterProjectDto;

    // Find supported project IDs using projectSupport table
    const supportedProjects = await this.prisma.projectSupport.findMany({
      where: { userId },
      select: { projectId: true },
    });

    const projectIds = supportedProjects.map((p) => p.projectId);
    if (projectIds.length === 0) {
      return {
        data: [],
        pagination: {
          pageSize,
          nextCursor: null,
        },
      };
    }

    const where: any = { id: { in: projectIds } };

    if (tags) where.tags = { hasSome: tags };
    if (status) where.status = status;
    if (seeking) where.seeking = { hasSome: seeking };
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    let orderBy: any = { createdAt: 'desc' };
    if (sortBy === 'supporters') orderBy = { supporters: { _count: 'desc' } };
    else if (sortBy === 'followers')
      orderBy = { followers: { _count: 'desc' } };
    else if (sortBy === 'updatedAt') orderBy = { updatedAt: 'desc' };

    const projects = await this.prisma.project.findMany({
      where,
      orderBy,
      take: pageSize,
      cursor: cursor ? { id: cursor } : undefined,
      skip: cursor ? 1 : 0, // skip the cursor itself
      select: {
        id: true,
        title: true,
        imageUrl: true,
        githubUrl: true,
        tags: true,
        status: true,
        seeking: true,
        createdAt: true,
        updatedAt: true,
        owner: {
          select: {
            id: true,
            name: true,
            role: true,
            profile: { select: { avatarUrl: true } },
          },
        },
        _count: {
          select: {
            supporters: true,
            followers: true,
          },
        },
      },
    });

    return {
      data: projects,
      pagination: {
        pageSize,
        nextCursor: projects.length ? projects[projects.length - 1].id : null,
      },
    };
  }

  async getFollowedProjects(
    userId: string,
    filterProjectDto: FilterProjectDto,
  ) {
    const { tags, sortBy, search, status, seeking, pageSize, cursor } =
      filterProjectDto;

    // Find followed project IDs using projectFollower table
    const followedProjects = await this.prisma.projectFollower.findMany({
      where: { userId },
      select: { projectId: true },
    });

    const projectIds = followedProjects.map((p) => p.projectId);
    if (projectIds.length === 0) {
      return {
        data: [],
        pagination: {
          pageSize,
          nextCursor: null,
        },
      };
    }

    const where: any = { id: { in: projectIds } };

    if (tags) where.tags = { hasSome: tags };
    if (status) where.status = status;
    if (seeking) where.seeking = { hasSome: seeking };
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    let orderBy: any = { createdAt: 'desc' };
    if (sortBy === 'supporters') orderBy = { supporters: { _count: 'desc' } };
    else if (sortBy === 'followers')
      orderBy = { followers: { _count: 'desc' } };
    else if (sortBy === 'updatedAt') orderBy = { updatedAt: 'desc' };

    const projects = await this.prisma.project.findMany({
      where,
      orderBy,
      take: pageSize,
      cursor: cursor ? { id: cursor } : undefined,
      skip: cursor ? 1 : 0, // skip the cursor itself
      select: {
        id: true,
        title: true,
        imageUrl: true,
        githubUrl: true,
        tags: true,
        status: true,
        seeking: true,
        createdAt: true,
        updatedAt: true,
        owner: {
          select: {
            id: true,
            name: true,
            role: true,
            profile: { select: { avatarUrl: true } },
          },
        },
        _count: {
          select: {
            supporters: true,
            followers: true,
          },
        },
      },
    });

    return {
      data: projects,
      pagination: {
        pageSize,
        nextCursor: projects.length ? projects[projects.length - 1].id : null,
      },
    };
  }

  async createProjectUpdate(
    userId: string,
    projectId: string,
    createProjectUpdateDto: CreateProjectUpdateDto,
  ) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
    });
    if (!project || project.ownerId !== userId) {
      throw new Error('Project not found or you are not the owner');
    }

    const projectUpdate = await this.prisma.projectUpdate.create({
      data: {
        projectId,
        authorId: userId,
        ...createProjectUpdateDto,
      },
    });

    const followers = await this.prisma.projectFollower.findMany({
      where: { projectId },
    });

    for (const follower of followers) {
      await this.notificationService.create({
        userId: follower.userId,
        message: `The project "${project.title}" has a new update: "${projectUpdate.title}"`,
        type: 'PROJECT_UPDATE',
      });
    }

    return projectUpdate;
  }

  async getProjectUpdates(projectId: string) {
    return this.prisma.projectUpdate.findMany({
      where: { projectId },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async createStartup(userId: string, createStartupDto: CreateStartupDto) {
    const { description, ...rest } = createStartupDto;
    const htmlDescription = marked.parse(description) as string;
    return this.prisma.startup.create({
      data: {
        founderId: userId,
        description: htmlDescription,
        ...rest,
      },
    });
  }

  async updateStartup(
    userId: string,
    startupId: string,
    updateStartupDto: UpdateStartupDto,
  ) {
    const startup = await this.prisma.startup.findUnique({
      where: { id: startupId },
    });
    if (!startup || startup.founderId !== userId) {
      throw new Error('Startup not found or you are not the founder');
    }

    if (updateStartupDto.description) {
      updateStartupDto.description = marked.parse(
        updateStartupDto.description,
      ) as string;
    }

    return this.prisma.startup.update({
      where: { id: startupId },
      data: updateStartupDto,
    });
  }

  async deleteStartup(userId: string, startupId: string) {
    const startup = await this.prisma.startup.findUnique({
      where: { id: startupId },
    });
    if (!startup || startup.founderId !== userId) {
      throw new Error('Startup not found or you are not the founder');
    }
    return this.prisma.startup.delete({ where: { id: startupId } });
  }

  async getStartups() {
    return this.prisma.startup.findMany({
      include: { founder: true },
    });
  }

  async getStartupById(startupId: string) {
    return this.prisma.startup.findUnique({
      where: { id: startupId },
      include: { founder: true },
    });
  }

  async supportProject(userId: string, projectId: string) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
    });
    if (!project) {
      throw new Error('Project not found');
    }

    const support = await this.prisma.projectSupport.create({
      data: {
        userId,
        projectId,
      },
    });

    await this.notificationService.create({
      userId: project.ownerId,
      message: `Your project "${project.title}" has a new supporter.`,
      type: 'PROJECT_SUPPORT',
    });

    return support;
  }

  async unsupportProject(userId: string, projectId: string) {
    return this.prisma.projectSupport.delete({
      where: {
        projectId_userId: {
          projectId,
          userId,
        },
      },
    });
  }

  async followProject(userId: string, projectId: string) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
    });
    if (!project) {
      throw new Error('Project not found');
    }

    const follow = await this.prisma.projectFollower.create({
      data: {
        userId,
        projectId,
      },
    });

    await this.notificationService.create({
      userId: project.ownerId,
      message: `Your project "${project.title}" has a new follower.`,
      type: 'PROJECT_FOLLOW',
    });

    return follow;
  }

  async unfollowProject(userId: string, projectId: string) {
    return this.prisma.projectFollower.delete({
      where: {
        projectId_userId: {
          projectId,
          userId,
        },
      },
    });
  }

  async createCollaborationRequest(
    userId: string,
    projectId: string,
    createCollaborationRequestDto: CreateCollaborationRequestDto,
  ) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
    });
    if (!project) {
      throw new Error('Project not found');
    }

    const request = await this.prisma.projectCollaborationRequest.create({
      data: {
        userId,
        projectId,
        ...createCollaborationRequestDto,
      },
    });

    await this.notificationService.create({
      userId: project.ownerId,
      message: `You have a new collaboration request for your project "${project.title}".`,
      type: 'PROJECT_COLLABORATION_REQUEST',
    });

    return request;
  }

  async updateCollaborationRequest(
    userId: string,
    requestId: string,
    updateCollaborationRequestDto: UpdateCollaborationRequestDto,
  ) {
    const request = await this.prisma.projectCollaborationRequest.findUnique({
      where: { id: requestId },
      include: { project: true, user: true },
    });
    if (!request || request.project.ownerId !== userId) {
      throw new Error('Request not found or you are not the project owner');
    }

    const updatedRequest = await this.prisma.projectCollaborationRequest.update(
      {
        where: { id: requestId },
        data: { status: updateCollaborationRequestDto.status },
      },
    );

    await this.notificationService.create({
      userId: request.userId,
      message: `Your collaboration request for the project "${request.project.title}" has been ${updatedRequest.status.toLowerCase()}.`,
      type: 'PROJECT_COLLABORATION_REQUEST_UPDATE',
    });

    return updatedRequest;
  }

  async getCollaborationRequests(userId: string, projectId: string) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
    });
    if (!project || project.ownerId !== userId) {
      throw new Error('Project not found or you are not the owner');
    }
    return this.prisma.projectCollaborationRequest.findMany({
      where: { projectId },
      select: {
        id: true,
        message: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        user: {
          select: {
            id: true,
            name: true,
            role: true,
            profile: { select: { avatarUrl: true } },
          },
        },
      },
    });
  }

  async createComment(
    userId: string,
    projectId: string,
    createCommentDto: CreateCommentDto,
  ) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
    });
    if (!project) {
      throw new Error('Project not found');
    }

    const mentionedUsernames =
      createCommentDto.comment
        .match(/@(\w+)/g)
        ?.map((mention) => mention.substring(1)) || [];
    const mentionedUsers = await this.prisma.user.findMany({
      where: { name: { in: mentionedUsernames } },
    });

    const comment = await this.prisma.projectComment.create({
      data: {
        userId,
        projectId,
        comment: createCommentDto.comment,
        // mentionedUsers: {
        //   connect: mentionedUsers.map((user) => ({ id: user.id })),
        // },
      },
    });

    // Store mentioned user IDs in a separate table or handle mentions differently
    // For now, we'll skip the mentionedUsers relationship update
    // You may need to add a ProjectCommentMention model or update your schema

    const currentUser = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    for (const user of mentionedUsers) {
      await this.notificationService.createMentionNotification(
        user.id,
        currentUser.name,
        project.id,
      );
    }

    await this.notificationService.create({
      userId: project.ownerId,
      message: `Your project "${project.title}" has a new comment.`,
      type: 'PROJECT_COMMENT',
    });

    return comment;
  }

  async getComments(projectId: string, page = 1) {
    const pageSize = 10;
    // Ensure page is a number
    const pageNum = typeof page === 'string' ? parseInt(page, 10) : page;

    const comments = await this.prisma.projectComment.findMany({
      where: { projectId },
      orderBy: { createdAt: 'desc' },
      skip: (pageNum - 1) * pageSize,
      take: pageSize,
      select: {
        id: true,
        comment: true,
        createdAt: true,
        user: {
          select: {
            id: true,
            name: true,
            role: true,
            profile: { select: { avatarUrl: true } },
          },
        },
      },
    });

    const total = await this.prisma.projectComment.count({
      where: { projectId },
    });
    return {
      comments: comments,
      pagination: {
        page: pageNum,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
        hasNext: pageNum * pageSize < total,
        hasPrev: pageNum > 1,
      },
    };
  }

  async addTeamMember(
    userId: string,
    projectId: string,
    addTeamMemberDto: AddTeamMemberDto,
  ) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
    });
    if (!project || project.ownerId !== userId) {
      throw new Error('Project not found or you are not the owner');
    }
    return this.prisma.projectTeamMember.create({
      data: {
        projectId,
        ...addTeamMemberDto,
      },
    });
  }

  async removeTeamMember(
    userId: string,
    projectId: string,
    teamMemberId: string,
  ) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
    });
    if (!project || project.ownerId !== userId) {
      throw new Error('Project not found or you are not the owner');
    }
    return this.prisma.projectTeamMember.delete({
      where: { id: teamMemberId },
    });
  }

  async getTeamMembers(projectId: string) {
    return this.prisma.projectTeamMember.findMany({
      where: { projectId },
      include: { user: true },
    });
  }

  async getAllTags() {
    return this.prisma.tag.findMany({
      orderBy: { name: 'asc' },
    });
  }
}
