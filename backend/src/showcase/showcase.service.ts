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
    private readonly prisma: PrismaService,
    private readonly notificationService: NotificationService,
  ) {}

  async createProject(userId: string, createProjectDto: CreateProjectDto) {
    const { description, ...rest } = createProjectDto;
    const htmlDescription = marked.parse(description) as string;
    return this.prisma.project.create({
      data: {
        ownerId: userId,
        description: htmlDescription,
        ...rest,
      },
    });
  }

  async updateProject(
    userId: string,
    projectId: string,
    updateProjectDto: UpdateProjectDto,
  ) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
    });
    if (!project || project.ownerId !== userId) {
      throw new Error('Project not found or you are not the owner');
    }

    if (updateProjectDto.description) {
      updateProjectDto.description = marked.parse(
        updateProjectDto.description,
      ) as string;
    }

    return this.prisma.project.update({
      where: { id: projectId },
      data: updateProjectDto,
    });
  }

  async deleteProject(userId: string, projectId: string) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
    });
    if (!project || project.ownerId !== userId) {
      throw new Error('Project not found or you are not the owner');
    }
    return this.prisma.project.delete({ where: { id: projectId } });
  }

  async getProjects(userId: string, filterProjectDto: FilterProjectDto) {
    const { tags, sortBy, search, personalize, status, seeking } =
      filterProjectDto;
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

    return this.prisma.project.findMany({
      where,
      orderBy,
      include: {
        owner: true,
        supporters: true,
        followers: true,
        comments: true,
      },
    });
  }

  async getProjectById(projectId: string) {
    return this.prisma.project.findUnique({
      where: { id: projectId },
      include: {
        owner: true,
        supporters: true,
        followers: true,
        collaborationRequests: true,
        comments: true,
        teamMembers: true,
        updates: true,
      },
    });
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
      include: { user: true },
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

    const comment = await this.prisma.projectComment.create({
      data: {
        userId,
        projectId,
        ...createCommentDto,
      },
    });

    await this.notificationService.create({
      userId: project.ownerId,
      message: `Your project "${project.title}" has a new comment.`,
      type: 'PROJECT_COMMENT',
    });

    return comment;
  }

  async getComments(projectId: string) {
    return this.prisma.projectComment.findMany({
      where: { projectId },
      include: { user: true },
    });
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
}
