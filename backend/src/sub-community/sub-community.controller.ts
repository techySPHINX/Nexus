import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
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

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.subCommunityService.findOneSubCommunity(id);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @GetCurrentUser('id') userId: string,
    @Body() dto: UpdateSubCommunityDto,
  ) {
    return this.subCommunityService.updateSubCommunity(id, userId, dto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @GetCurrentUser('id') userId: string) {
    return this.subCommunityService.removeSubCommunity(id, userId);
  }

  // --- SubCommunity Membership Endpoints ---

  @Post(':id/join-request')
  async requestToJoin(
    @Param('id') subCommunityId: string,
    @GetCurrentUser('id') userId: string,
  ) {
    return this.subCommunityService.requestToJoinSubCommunity(
      subCommunityId,
      userId,
    );
  }

  @Get(':id/join-requests/pending')
  async getPendingJoinRequests(
    @Param('id') subCommunityId: string,
    @GetCurrentUser('id') userId: string,
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
    @GetCurrentUser('id') userId: string,
    @Body() dto: ApproveJoinRequestDto,
  ) {
    return this.subCommunityService.approveJoinRequest(
      joinRequestId,
      subCommunityId,
      userId,
      dto,
    );
  }

  @Post(':id/leave')
  async leaveSubCommunity(
    @Param('id') subCommunityId: string,
    @GetCurrentUser('id') userId: string,
  ) {
    return this.subCommunityService.leaveSubCommunity(subCommunityId, userId);
  }

  @Delete(':subCommunityId/members/:memberIdToRemove')
  async removeMember(
    @Param('subCommunityId') subCommunityId: string,
    @Param('memberIdToRemove') memberIdToRemove: string,
    @GetCurrentUser('id') userId: string,
  ) {
    return this.subCommunityService.removeSubCommunityMember(
      subCommunityId,
      memberIdToRemove,
      userId,
    );
  }
}
