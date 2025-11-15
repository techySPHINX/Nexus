import {
  Controller,
  Post,
  Body,
  UseGuards,
  Put,
  Get,
  Param,
  Delete,
  Query,
} from '@nestjs/common';
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
import { CreateStartupDto } from './dto/create-startup.dto';
import { UpdateStartupDto } from './dto/update-startup.dto';
import { CreateProjectUpdateDto } from './dto/create-project-update.dto';

@Controller('showcase')
@UseGuards(JwtAuthGuard)
export class ShowcaseController {
  constructor(private readonly showcaseService: ShowcaseService) {}

  @Post('project')
  createProject(
    @GetCurrentUser('userId') userId: string,
    @Body() createProjectDto: CreateProjectDto,
  ) {
    return this.showcaseService.createProject(userId, createProjectDto);
  }

  @Put('project/:id')
  updateProject(
    @GetCurrentUser('userId') userId: string,
    @Param('id') projectId: string,
    @Body() updateProjectDto: UpdateProjectDto,
  ) {
    return this.showcaseService.updateProject(
      userId,
      projectId,
      updateProjectDto,
    );
  }

  @Delete('project/:id')
  deleteProject(
    @GetCurrentUser('userId') userId: string,
    @Param('id') projectId: string,
  ) {
    return this.showcaseService.deleteProject(userId, projectId);
  }

  @Get('project/count')
  getProjectCounts(@GetCurrentUser('userId') userId: string) {
    return this.showcaseService.getProjectCounts(userId);
  }

  @Get('project')
  getProjects(
    @GetCurrentUser('userId') userId: string,
    @Query() filterProjectDto: FilterProjectDto,
  ) {
    return this.showcaseService.getProjects(userId, filterProjectDto);
  }

  @Get('project/:id')
  getProjectById(
    @Param('id') projectId: string,
    @Query('detailed') detailed?: boolean,
    @GetCurrentUser('userId') userId?: string,
  ) {
    return this.showcaseService.getProjectById(projectId, detailed, userId);
  }

  @Get('project/my/projects')
  getMyProjects(
    @GetCurrentUser('userId') userId: string,
    @Query() filterProjectDto: FilterProjectDto,
  ) {
    console.log('UserId in getMyProjects controller:', userId);
    return this.showcaseService.getMyProjects(userId, filterProjectDto);
  }

  @Get('project/owner/:ownerId')
  getProjectsByOwner(
    @Param('ownerId') ownerId: string,
    @Query() filterProjectDto: FilterProjectDto,
  ) {
    return this.showcaseService.getProjectsByOwner(ownerId, filterProjectDto);
  }

  @Get('project/my/supported')
  getSupportedProjects(
    @GetCurrentUser('userId') userId: string,
    @Query() filterProjectDto: FilterProjectDto,
  ) {
    return this.showcaseService.getSupportedProjects(userId, filterProjectDto);
  }

  @Get('project/my/followed')
  getFollowedProjects(
    @GetCurrentUser('userId') userId: string,
    @Query() filterProjectDto: FilterProjectDto,
  ) {
    return this.showcaseService.getFollowedProjects(userId, filterProjectDto);
  }

  @Post('project/:id/update')
  createProjectUpdate(
    @GetCurrentUser('userId') userId: string,
    @Param('id') projectId: string,
    @Body() createProjectUpdateDto: CreateProjectUpdateDto,
  ) {
    return this.showcaseService.createProjectUpdate(
      userId,
      projectId,
      createProjectUpdateDto,
    );
  }

  @Get('project/:id/updates')
  getProjectUpdates(@Param('id') projectId: string) {
    return this.showcaseService.getProjectUpdates(projectId);
  }

  @Post('startup')
  createStartup(
    @GetCurrentUser('userId') userId: string,
    @Body() createStartupDto: CreateStartupDto,
  ) {
    return this.showcaseService.createStartup(userId, createStartupDto);
  }

  @Put('startup/:id')
  updateStartup(
    @GetCurrentUser('userId') userId: string,
    @Param('id') startupId: string,
    @Body() updateStartupDto: UpdateStartupDto,
  ) {
    return this.showcaseService.updateStartup(
      userId,
      startupId,
      updateStartupDto,
    );
  }

  @Delete('startup/:id')
  deleteStartup(
    @GetCurrentUser('userId') userId: string,
    @Param('id') startupId: string,
  ) {
    return this.showcaseService.deleteStartup(userId, startupId);
  }

  @Get('startup')
  getStartups(
    @GetCurrentUser('userId') userId: string,
    @Query() filterStartupDto?: { search?: string; status?: string; cursor?: string; pageSize?: number },
  ) {
    return this.showcaseService.getStartups(userId, filterStartupDto);
  }

  @Get('startup/my')
  getMyStartups(
    @GetCurrentUser('userId') userId: string,
    @Query() filterStartupDto?: { search?: string; status?: string; cursor?: string; pageSize?: number },
  ) {
    return this.showcaseService.getMyStartups(userId, filterStartupDto);
  }

  @Get('startup/followed')
  getFollowedStartups(
    @GetCurrentUser('userId') userId: string,
    @Query() filterStartupDto?: { search?: string; status?: string; cursor?: string; pageSize?: number },
  ) {
    return this.showcaseService.getFollowedStartups(userId, filterStartupDto);
  }

  @Get('startup/:id')
  getStartupById(@Param('id') startupId: string) {
    return this.showcaseService.getStartupById(startupId);
  }

  @Post('startup/:id/follow')
  followStartup(
    @GetCurrentUser('userId') userId: string,
    @Param('id') startupId: string,
  ) {
    return this.showcaseService.followStartup(userId, startupId);
  }

  @Delete('startup/:id/follow')
  unfollowStartup(
    @GetCurrentUser('userId') userId: string,
    @Param('id') startupId: string,
  ) {
    return this.showcaseService.unfollowStartup(userId, startupId);
  }

  @Post('startup/:id/comments')
  createStartupComment(
    @GetCurrentUser('userId') userId: string,
    @Param('id') startupId: string,
    @Body() createCommentDto: CreateCommentDto,
  ) {
    return this.showcaseService.createStartupComment(
      userId,
      startupId,
      createCommentDto.comment,
    );
  }

  @Get('startup/:id/comments')
  getStartupComments(
    @Param('id') startupId: string,
    @Query('page') page = 1,
  ) {
    return this.showcaseService.getStartupComments(startupId, page);
  }

  @Post(':id/support')
  supportProject(
    @GetCurrentUser('userId') userId: string,
    @Param('id') projectId: string,
  ) {
    return this.showcaseService.supportProject(userId, projectId);
  }

  @Delete(':id/support')
  unsupportProject(
    @GetCurrentUser('userId') userId: string,
    @Param('id') projectId: string,
  ) {
    return this.showcaseService.unsupportProject(userId, projectId);
  }

  @Post(':id/follow')
  followProject(
    @GetCurrentUser('userId') userId: string,
    @Param('id') projectId: string,
  ) {
    return this.showcaseService.followProject(userId, projectId);
  }

  @Delete(':id/follow')
  unfollowProject(
    @GetCurrentUser('userId') userId: string,
    @Param('id') projectId: string,
  ) {
    return this.showcaseService.unfollowProject(userId, projectId);
  }

  @Post(':id/collaborate')
  createCollaborationRequest(
    @GetCurrentUser('userId') userId: string,
    @Param('id') projectId: string,
    @Body() createCollaborationRequestDto: CreateCollaborationRequestDto,
  ) {
    return this.showcaseService.createCollaborationRequest(
      userId,
      projectId,
      createCollaborationRequestDto,
    );
  }

  @Put(':id/collaborate')
  updateCollaborationRequest(
    @GetCurrentUser('userId') userId: string,
    @Param('id') requestId: string,
    @Body() updateCollaborationRequestDto: UpdateCollaborationRequestDto,
  ) {
    return this.showcaseService.updateCollaborationRequest(
      userId,
      requestId,
      updateCollaborationRequestDto,
    );
  }

  @Get(':id/collaborate')
  getCollaborationRequests(
    @GetCurrentUser('userId') userId: string,
    @Param('id') projectId: string,
  ) {
    return this.showcaseService.getCollaborationRequests(userId, projectId);
  }

  @Post(':id/comments')
  createComment(
    @GetCurrentUser('userId') userId: string,
    @Param('id') projectId: string,
    @Body() createCommentDto: CreateCommentDto,
  ) {
    return this.showcaseService.createComment(
      userId,
      projectId,
      createCommentDto,
    );
  }

  @Get(':id/comments')
  getComments(@Param('id') projectId: string, @Query('page') page = 1) {
    return this.showcaseService.getComments(projectId, page);
  }

  @Post(':id/team')
  addTeamMember(
    @GetCurrentUser('userId') userId: string,
    @Param('id') projectId: string,
    @Body() addTeamMemberDto: AddTeamMemberDto,
  ) {
    return this.showcaseService.addTeamMember(
      userId,
      projectId,
      addTeamMemberDto,
    );
  }

  @Delete(':id/team/:memberId')
  removeTeamMember(
    @GetCurrentUser('userId') userId: string,
    @Param('id') projectId: string,
    @Param('memberId') memberId: string,
  ) {
    return this.showcaseService.removeTeamMember(userId, projectId, memberId);
  }

  @Get(':id/team')
  getTeamMembers(@Param('id') projectId: string) {
    return this.showcaseService.getTeamMembers(projectId);
  }

  @Get(':id/seeking-status')
  getSeekingStatus(@Param('id') projectId: string) {
    return this.showcaseService.getSeekingOptions(projectId);
  }

  @Get('tags')
  async getAllTags() {
    return this.showcaseService.getAllTags();
  }
}
