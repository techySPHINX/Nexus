import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  HttpCode,
  HttpStatus,
  Query,
} from '@nestjs/common';
import { SubCommunityService } from './sub-community.service';
import { UpdateSubCommunityDto } from './dto/update-sub-community.dto';
import { ApproveJoinRequestDto } from './dto/approve-join-request.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { GetCurrentUser } from '../common/decorators/get-current-user.decorator';
import { Role } from '@prisma/client';
import { CreateSubCommunityDto } from './dto/create-sub-community.dto';
import { UpdateMemberRoleDto } from './dto/update-member-role.dto';
import { UpdateReportDto } from '../report/dto/update-report.dto';

@Controller('sub-community')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SubCommunityController {
  constructor(private readonly subCommunityService: SubCommunityService) {}

  // --- SubCommunity CRUD Endpoints ---

  @Post()
  @Roles(Role.ADMIN)
  async create(@Body() createSubCommunityDto: CreateSubCommunityDto) {
    return this.subCommunityService.createSubCommunity(createSubCommunityDto);
  }

  @Get()
  async findAll(
    @Query('compact') compact?: string,
    @Query('privacy') privacy?: string,
    @Query('sort') sort?: string,
    @Query('type') type?: string,
    @Query('q') q?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @GetCurrentUser('userId') userId?: string,
  ) {
    // parse compact safely from query string
    const useCompact = compact === undefined ? true : compact === 'true' || compact === '1';
    const usePrivacy = privacy ? (privacy as 'all' | 'public' | 'private') : 'all';
    const useSort = sort ? (sort as 'recommended' | 'newest' | 'members') : 'recommended';
    // if pagination params provided, parse numbers
    const p = page ? Number(page) : undefined;
    const l = limit ? Number(limit) : undefined;
    return this.subCommunityService.findAllSubCommunities(userId, {
      compact: useCompact,
      privacy: usePrivacy,
      sort: useSort,
      type: type,
      q: q,
      page: p,
      limit: l,
    });
  }

  // Get current user's communities categorized by role (owned/moderated/member)

  @Get('my/owned')
  async myOwned(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @GetCurrentUser('userId') userId?: string,
  ) {
    const p = page ? Number(page) : 1;
    const l = limit ? Number(limit) : 6;
    return this.subCommunityService.findMyOwnedSubCommunities(userId, p, l);
  }

  @Get('my/moderated')
  async myModerated(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @GetCurrentUser('userId') userId?: string,
  ) {
    const p = page ? Number(page) : 1;
    const l = limit ? Number(limit) : 6;
    return this.subCommunityService.findMyModeratedSubCommunities(userId, p, l);
  }

  @Get('my/member')
  async myMember(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @GetCurrentUser('userId') userId?: string,
  ) {
    const p = page ? Number(page) : 1;
    const l = limit ? Number(limit) : 6;
    return this.subCommunityService.findMyMemberSubCommunities(userId, p, l);
  }


  @Get(':id')
  async findOne(
    @Param('id') id: string,
    @GetCurrentUser('userId') userId: string,
  ) {
    return this.subCommunityService.findOneSubCommunity(id, userId);
  }

  @Get('type/:type')
  async findByType(
    @Param('type') type: string,
    @Query('q') q: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
    @GetCurrentUser('userId') userId: string,
  ) {
    return this.subCommunityService.findSubCommunityByType(
      type,
      q,
      page,
      limit,
      userId,
    );
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @GetCurrentUser('userId') userId: string,
    @Body() dto: UpdateSubCommunityDto,
  ) {
    return this.subCommunityService.updateSubCommunity(id, userId, dto);
  }

  @Delete(':id')
  async remove(
    @Param('id') id: string,
    @GetCurrentUser('userId') userId: string,
  ) {
    return this.subCommunityService.removeSubCommunity(id, userId);
  }

  // --- Admin Endpoints ---
  @Patch(':id/ban')
  @Roles(Role.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  async ban(@Param('id') id: string) {
    return this.subCommunityService.banSubCommunity(id);
  }

  // --- Moderation Endpoints ---
  @Get(':subCommunityId/reports')
  async getReports(
    @Param('subCommunityId') subCommunityId: string,
    @GetCurrentUser('userId') requesterId: string,
  ) {
    return this.subCommunityService.getReports(subCommunityId, requesterId);
  }

  @Patch(':subCommunityId/reports/:reportId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async handleReport(
    @Param('subCommunityId') subCommunityId: string,
    @Param('reportId') reportId: string,
    @Body() dto: UpdateReportDto,
    @GetCurrentUser('userId') handlerId: string,
  ) {
    return this.subCommunityService.handleReport(
      subCommunityId,
      reportId,
      dto.status,
      handlerId,
    );
  }

  // --- SubCommunity Membership Endpoints ---

  @Post(':id/join-request')
  async requestToJoin(
    @Param('id') subCommunityId: string,
    @GetCurrentUser('userId') userId: string,
  ) {
    return this.subCommunityService.requestToJoinSubCommunity(
      subCommunityId,
      userId,
    );
  }

  @Get(':id/join-requests/pending')
  async getPendingJoinRequests(
    @Param('id') subCommunityId: string,
    @GetCurrentUser('userId') userId: string,
  ) {
    return this.subCommunityService.getPendingJoinRequests(
      subCommunityId,
      userId,
    );
  }

  @Patch(':subCommunityId/join-requests/:joinRequestId/approve')
  async approveJoinRequest(
    @Param('subCommunityId') subCommunityId: string,
    @Param('joinRequestId') joinRequestId: string,
    @GetCurrentUser('userId') userId: string,
    @Body() dto: ApproveJoinRequestDto,
  ) {
    return this.subCommunityService.approveJoinRequest(
      joinRequestId,
      subCommunityId,
      userId,
      dto,
    );
  }

  @Patch(':subCommunityId/members/:memberId/role')
  async updateMemberRole(
    @Param('subCommunityId') subCommunityId: string,
    @Param('memberId') memberId: string,
    @Body() dto: UpdateMemberRoleDto,
    @GetCurrentUser('userId') requesterId: string,
  ) {
    return this.subCommunityService.updateMemberRole(
      subCommunityId,
      memberId,
      dto.role,
      requesterId,
    );
  }

  @Post(':id/leave')
  async leaveSubCommunity(
    @Param('id') subCommunityId: string,
    @GetCurrentUser('userId') userId: string,
  ) {
    return this.subCommunityService.leaveSubCommunity(subCommunityId, userId);
  }

  @Delete(':subCommunityId/members/:memberIdToRemove')
  async removeMember(
    @Param('subCommunityId') subCommunityId: string,
    @Param('memberIdToRemove') memberIdToRemove: string,
    @GetCurrentUser('userId') userId: string,
  ) {
    return this.subCommunityService.removeSubCommunityMember(
      subCommunityId,
      memberIdToRemove,
      userId,
    );
  }
}