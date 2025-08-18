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

@Injectable()
export class ShowcaseService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationService: NotificationService,
  ) {}

  async createProject(userId: string, createProjectDto: CreateProjectDto) {
    return this.prisma.project.create({
      data: {
        ownerId: userId,
        ...createProjectDto,
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

  async getProjects(filterProjectDto: FilterProjectDto) {
    const { tags, sortBy, search } = filterProjectDto;
    const where: any = {};
    let orderBy: any = {};

    if (tags) {
      where.tags = {
        hasSome: tags,
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
    } else {
      orderBy = {
        createdAt: 'desc',
      };
    }

    return this.prisma.project.findMany({
      where,
      orderBy,
      include: { owner: true, supporters: true, followers: true },
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
      },
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
