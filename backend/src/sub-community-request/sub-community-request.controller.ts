import {
  Controller,
  Post,
  Body,
  UseGuards,
  Get,
  Patch,
  Param,
} from '@nestjs/common';
import { SubCommunityRequestService } from './sub-community-request.service';
import { CreateSubCommunityRequestDto } from './dto/create-sub-community-request.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { GetCurrentUser } from '../common/decorators/get-current-user.decorator';

@Controller('sub-community-requests')
export class SubCommunityRequestController {
  constructor(
    private readonly subCommunityRequestService: SubCommunityRequestService,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ALUM)
  createRequest(
    @Body() createSubCommunityRequestDto: CreateSubCommunityRequestDto,
    @GetCurrentUser('id') requesterId: string,
  ) {
    return this.subCommunityRequestService.createRequest(
      createSubCommunityRequestDto,
      requesterId,
    );
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  findAllRequests() {
    return this.subCommunityRequestService.findAllRequests();
  }

  @Patch(':id/approve')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  approveRequest(
    @Param('id') requestId: string,
    @GetCurrentUser('id') adminId: string,
  ) {
    return this.subCommunityRequestService.approveRequest(requestId, adminId);
  }

  @Patch(':id/reject')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  rejectRequest(
    @Param('id') requestId: string,
    @GetCurrentUser('id') adminId: string,
  ) {
    return this.subCommunityRequestService.rejectRequest(requestId, adminId);
  }
}
