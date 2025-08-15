import { Controller, Post, Body, UseGuards, Put, Get, Param, Delete, Query } from '@nestjs/common';
import { ShowcaseService } from './showcase.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { CreateCollaborationRequestDto } from './dto/create-collaboration-request.dto';
import { UpdateCollaborationRequestDto } from './dto/update-collaboration-request.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetCurrentUser } from '../common/decorators/get-current-user.decorator';
import { FilterProjectDto } from './dto/filter-project.dto';
import { CreateCommentDto } from './dto/create-comment.dto';
import { AddTeamMemberDto } from './dto/add-team-member.dto';

@Controller('showcase')
@UseGuards(JwtAuthGuard)
export class ShowcaseController {
  constructor(private readonly showcaseService: ShowcaseService) {}

  @Post()
  createProject(@GetCurrentUser('sub') userId: string, @Body() createProjectDto: CreateProjectDto) {
    return this.showcaseService.createProject(userId, createProjectDto);
  }

  @Put(':id')
  updateProject(
    @GetCurrentUser('sub') userId: string,
    @Param('id') projectId: string,
    @Body() updateProjectDto: UpdateProjectDto,
  ) {
    return this.showcaseService.updateProject(userId, projectId, updateProjectDto);
  }

  @Delete(':id')
  deleteProject(@GetCurrentUser('sub') userId: string, @Param('id') projectId: string) {
    return this.showcaseService.deleteProject(userId, projectId);
  }

  @Get()
  getProjects(@Query() filterProjectDto: FilterProjectDto) {
    return this.showcaseService.getProjects(filterProjectDto);
  }

  @Get(':id')
  getProjectById(@Param('id') projectId: string) {
    return this.showcaseService.getProjectById(projectId);
  }

  @Post(':id/support')
  supportProject(@GetCurrentUser('sub') userId: string, @Param('id') projectId: string) {
    return this.showcaseService.supportProject(userId, projectId);
  }

  @Delete(':id/support')
  unsupportProject(@GetCurrentUser('sub') userId: string, @Param('id') projectId: string) {
    return this.showcaseService.unsupportProject(userId, projectId);
  }

  @Post(':id/follow')
  followProject(@GetCurrentUser('sub') userId: string, @Param('id') projectId: string) {
    return this.showcaseService.followProject(userId, projectId);
  }

  @Delete(':id/follow')
  unfollowProject(@GetCurrentUser('sub') userId: string, @Param('id') projectId: string) {
    return this.showcaseService.unfollowProject(userId, projectId);
  }

  @Post(':id/collaborate')
  createCollaborationRequest(
    @GetCurrentUser('sub') userId: string,
    @Param('id') projectId: string,
    @Body() createCollaborationRequestDto: CreateCollaborationRequestDto,
  ) {
    return this.showcaseService.createCollaborationRequest(userId, projectId, createCollaborationRequestDto);
  }

  @Put('collaborate/:id')
  updateCollaborationRequest(
    @GetCurrentUser('sub') userId: string,
    @Param('id') requestId: string,
    @Body() updateCollaborationRequestDto: UpdateCollaborationRequestDto,
  ) {
    return this.showcaseService.updateCollaborationRequest(userId, requestId, updateCollaborationRequestDto);
  }

  @Get(':id/collaborate')
  getCollaborationRequests(@GetCurrentUser('sub') userId: string, @Param('id') projectId: string) {
    return this.showcaseService.getCollaborationRequests(userId, projectId);
  }

  @Post(':id/comments')
  createComment(
    @GetCurrentUser('sub') userId: string,
    @Param('id') projectId: string,
    @Body() createCommentDto: CreateCommentDto,
  ) {
    return this.showcaseService.createComment(userId, projectId, createCommentDto);
  }

  @Get(':id/comments')
  getComments(@Param('id') projectId: string) {
    return this.showcaseService.getComments(projectId);
  }

  @Post(':id/team')
  addTeamMember(
    @GetCurrentUser('sub') userId: string,
    @Param('id') projectId: string,
    @Body() addTeamMemberDto: AddTeamMemberDto,
  ) {
    return this.showcaseService.addTeamMember(userId, projectId, addTeamMemberDto);
  }

  @Delete(':id/team/:memberId')
  removeTeamMember(
    @GetCurrentUser('sub') userId: string,
    @Param('id') projectId: string,
    @Param('memberId') memberId: string,
  ) {
    return this.showcaseService.removeTeamMember(userId, projectId, memberId);
  }

  @Get(':id/team')
  getTeamMembers(@Param('id') projectId: string) {
    return this.showcaseService.getTeamMembers(projectId);
  }
}
