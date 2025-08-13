import {
  Controller,
  Post,
  Get,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ReferralService } from './referral.service';
import { CreateReferralDto } from './dto/create-referral.dto';
import { UpdateReferralDto } from './dto/update-referral.dto';
import { CreateReferralApplicationDto } from './dto/create-referral-application.dto';
import { UpdateReferralApplicationDto } from './dto/update-referral-application.dto';
import { FilterReferralsDto } from './dto/filter-referrals.dto';
import { FilterReferralApplicationsDto } from './dto/filter-referral-applications.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { GetCurrentUser } from 'src/common/decorators/get-current-user.decorator';
import { Roles } from 'src/common/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { FilesService } from 'src/files/files.service';

@Controller('referral')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ReferralController {
  constructor(
    private readonly referralService: ReferralService,
    private readonly filesService: FilesService,
  ) {}

  // Referral Endpoints

  @Post()
  @Roles(Role.ALUM)
  async createReferral(
    @GetCurrentUser('sub') userId: string,
    @Body() dto: CreateReferralDto,
  ) {
    return this.referralService.createReferral(userId, dto);
  }

  @Get(':id')
  async getReferralById(@Param('id') id: string) {
    return this.referralService.getReferralById(id);
  }

  @Get()
  async getFilteredReferrals(@Query() filterDto: FilterReferralsDto) {
    return this.referralService.getFilteredReferrals(filterDto);
  }

  @Put(':id')
  async updateReferral(
    @GetCurrentUser('sub') userId: string,
    @Param('id') id: string,
    @Body() dto: UpdateReferralDto,
  ) {
    return this.referralService.updateReferral(userId, id, dto);
  }

  @Delete(':id')
  async deleteReferral(
    @GetCurrentUser('sub') userId: string,
    @Param('id') id: string,
  ) {
    return this.referralService.deleteReferral(userId, id);
  }

  // Referral Application Endpoints

  @Post('apply')
  @Roles(Role.STUDENT)
  @UseInterceptors(FileInterceptor('resume'))
  async createReferralApplication(
    @GetCurrentUser('sub') userId: string,
    @Body() dto: CreateReferralApplicationDto,
    @UploadedFile() resume: Express.Multer.File,
  ) {
    if (!resume) {
      throw new BadRequestException('Resume file is required.');
    }

    const resumeUrl = await this.filesService.saveFile(resume);

    return this.referralService.createReferralApplication(userId, {
      ...dto,
      resumeUrl: resumeUrl,
    });
  }

  @Get('applications/:id')
  async getReferralApplicationById(@Param('id') id: string) {
    return this.referralService.getReferralApplicationById(id);
  }

  @Get('applications')
  @Roles(Role.ADMIN)
  async getFilteredReferralApplications(
    @Query() filterDto: FilterReferralApplicationsDto,
  ) {
    return this.referralService.getFilteredReferralApplications(filterDto);
  }

  @Put('applications/:id/status')
  @Roles(Role.ADMIN)
  async updateReferralApplicationStatus(
    @GetCurrentUser('sub') userId: string,
    @Param('id') id: string,
    @Body() dto: UpdateReferralApplicationDto,
  ) {
    return this.referralService.updateReferralApplicationStatus(
      userId,
      id,
      dto,
    );
  }
}
