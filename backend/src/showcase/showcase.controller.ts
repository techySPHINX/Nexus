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
    @GetCurrentUser('sub') userId: string,
    @Body() createProjectDto: CreateProjectDto,
  ) {
    return this.showcaseService.createProject(userId, createProjectDto);
  }

  @Put('project/:id')
  updateProject(
    @GetCurrentUser('sub') userId: string,
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
    @GetCurrentUser('sub') userId: string,
    @Param('id') projectId: string,
  ) {
    return this.showcaseService.deleteProject(userId, projectId);
  }

  @Get('project')
  getProjects(
    @GetCurrentUser('sub') userId: string,
    @Query() filterProjectDto: FilterProjectDto,
  ) {
    return this.showcaseService.getProjects(userId, filterProjectDto);
  }

  @Get('project/:id')
  getProjectById(@Param('id') projectId: string) {
    return this.showcaseService.getProjectById(projectId);
  }

  @Post('project/:id/update')
  createProjectUpdate(
    @GetCurrentUser('sub') userId: string,
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
    @GetCurrentUser('sub') userId: string,
    @Body() createStartupDto: CreateStartupDto,
  ) {
    return this.showcaseService.createStartup(userId, createStartupDto);
  }

  @Put('startup/:id')
  updateStartup(
    @GetCurrentUser('sub') userId: string,
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
    @GetCurrentUser('sub') userId: string,
    @Param('id') startupId: string,
  ) {
    return this.showcaseService.deleteStartup(userId, startupId);
  }

  @Get('startup')
  getStartups() {
    return this.showcaseService.getStartups();
  }

  @Get('startup/:id')
  getStartupById(@Param('id') startupId: string) {
    return this.showcaseService.getStartupById(startupId);
  }

  @Post(':id/support')
  supportProject(
    @GetCurrentUser('sub') userId: string,
    @Param('id') projectId: string,
  ) {
    return this.showcaseService.supportProject(userId, projectId);
  }

  @Delete(':id/support')
  unsupportProject(
    @GetCurrentUser('sub') userId: string,
    @Param('id') projectId: string,
  ) {
    return this.showcaseService.unsupportProject(userId, projectId);
  }

  @Post(':id/follow')
  followProject(
    @GetCurrentUser('sub') userId: string,
    @Param('id') projectId: string,
  ) {
    return this.showcaseService.followProject(userId, projectId);
  }

  @Delete(':id/follow')
  unfollowProject(
    @GetCurrentUser('sub') userId: string,
    @Param('id') projectId: string,
  ) {
    return this.showcaseService.unfollowProject(userId, projectId);
  }

  @Post(':id/collaborate')
  createCollaborationRequest(
    @GetCurrentUser('sub') userId: string,
    @Param('id') projectId: string,
    @Body() createCollaborationRequestDto: CreateCollaborationRequestDto,
  ) {
    return this.showcaseService.createCollaborationRequest(
      userId,
      projectId,
      createCollaborationRequestDto,
    );
  }

  @Put('collaborate/:id')
  updateCollaborationRequest(
    @GetCurrentUser('sub') userId: string,
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
    @GetCurrentUser('sub') userId: string,
    @Param('id') projectId: string,
  ) {
    return this.showcaseService.getCollaborationRequests(userId, projectId);
  }

  @Post(':id/comments')
  createComment(
    @GetCurrentUser('sub') userId: string,
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
  getComments(@Param('id') projectId: string) {
    return this.showcaseService.getComments(projectId);
  }

  @Post(':id/team')
  addTeamMember(
    @GetCurrentUser('sub') userId: string,
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
