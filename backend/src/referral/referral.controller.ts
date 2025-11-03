import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Put,
  UseGuards,
  Query,
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
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { SkipThrottle } from '@nestjs/throttler';
import { GetCurrentUser } from '../common/decorators/get-current-user.decorator';
import { LegacyFilesService } from '../files/legacy-files.service';

/**
 * Controller for managing job referrals and referral applications.
 * All endpoints are protected by JWT authentication and role-based access control.
 */
@Controller('referral')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ReferralController {
  constructor(
    private readonly referralService: ReferralService,
    private readonly legacyFilesService: LegacyFilesService,
  ) {}

  // Referral Endpoints

  /**
   * Creates a new job referral. Only accessible by ALUMs.
   * @param userId - The ID of the authenticated user creating the referral.
   * @param dto - The data for creating the referral.
   * @returns A promise that resolves to the created referral.
   */
  @Post()
  @Roles(Role.ALUM)
  async createReferral(
    @GetCurrentUser('sub') userId: string,
    @Body() dto: CreateReferralDto,
  ) {
    return this.referralService.createReferral(userId, dto);
  }

  /**
   * Retrieves a single job referral by its ID.
   * @param id - The ID of the referral to retrieve.
   * @returns A promise that resolves to the referral object.
   */
  @Get(':id')
  @SkipThrottle()
  async getReferralById(@Param('id') id: string) {
    return this.referralService.getReferralById(id);
  }

  /**
   * Retrieves a list of job referrals based on provided filters.
   * @param filterDto - DTO containing filters for referral search.
   * @returns A promise that resolves to an array of filtered referrals.
   */
  @Get()
  @SkipThrottle()
  async getFilteredReferrals(@Query() filterDto: FilterReferralsDto) {
    return this.referralService.getFilteredReferrals(filterDto);
  }

  /**
   * Updates an existing job referral. Only the creator of the referral can update it.
   * @param userId - The ID of the authenticated user updating the referral.
   * @param id - The ID of the referral to update.
   * @param dto - The data to update the referral with.
   * @returns A promise that resolves to the updated referral.
   */
  @Put(':id')
  async updateReferral(
    @GetCurrentUser('sub') userId: string,
    @Param('id') id: string,
    @Body() dto: UpdateReferralDto,
  ) {
    return this.referralService.updateReferral(userId, id, dto);
  }

  /**
   * Deletes a job referral. Only the creator of the referral can delete it.
   * @param userId - The ID of the authenticated user deleting the referral.
   * @param id - The ID of the referral to delete.
   * @returns A promise that resolves to a success message.
   */
  @Delete(':id')
  async deleteReferral(
    @GetCurrentUser('sub') userId: string,
    @Param('id') id: string,
  ) {
    return this.referralService.deleteReferral(userId, id);
  }

  // Referral Application Endpoints

  /**
   * Creates a new referral application. Accessible by STUDENTs and ALUMs.
   * Requires a resume file upload.
   * @param userId - The ID of the authenticated user creating the application.
   * @param dto - The data for creating the referral application.
   * @param resume - The uploaded resume file.
   * @returns A promise that resolves to the created referral application.
   * @throws {BadRequestException} If no resume file is provided.
   */
  @Post('apply')
  @Roles(Role.STUDENT, Role.ALUM)
  @UseInterceptors(FileInterceptor('resume'))
  async createReferralApplication(
    @GetCurrentUser('sub') userId: string,
    @Body() dto: CreateReferralApplicationDto,
    @UploadedFile() resume: Express.Multer.File,
  ) {
    if (!resume) {
      throw new BadRequestException('Resume file is required.');
    }

    const resumeUrl = await this.legacyFilesService.saveFile(resume, userId);

    return this.referralService.createReferralApplication(userId, {
      ...dto,
      resumeUrl: resumeUrl,
    });
  }

  /**
   * Retrieves a single referral application by its ID.
   * @param id - The ID of the referral application to retrieve.
   * @returns A promise that resolves to the referral application object.
   */
  @Get('applications/:id')
  @SkipThrottle()
  async getReferralApplicationById(@Param('id') id: string) {
    return this.referralService.getReferralApplicationById(id);
  }

  /**
   * Retrieves a list of referral applications based on provided filters. Only accessible by ADMINs.
   * @param filterDto - DTO containing filters for referral application search.
   * @returns A promise that resolves to an array of filtered referral applications.
   */
  @Get('applications')
  @Roles(Role.ADMIN)
  @SkipThrottle()
  async getFilteredReferralApplications(
    @Query() filterDto: FilterReferralApplicationsDto,
  ) {
    return this.referralService.getFilteredReferralApplications(filterDto);
  }

  /**
   * Updates the status of a referral application. Only accessible by ADMINs.
   * @param userId - The ID of the authenticated user updating the status.
   * @param id - The ID of the referral application to update.
   * @param dto - The data to update the application status with.
   * @returns A promise that resolves to the updated referral application.
   */
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

  // Get user's own applications
  @Get('applications/my')
  @Roles(Role.STUDENT, Role.ALUM)
  @SkipThrottle()
  async getMyApplications(@GetCurrentUser('sub') userId: string) {
    return this.referralService.getMyApplications(userId);
  }

  // Get applications for a specific referral (for alumni)
  @Get(':id/applications')
  @Roles(Role.ALUM)
  @SkipThrottle()
  async getReferralApplications(
    @GetCurrentUser('sub') userId: string,
    @Param('id') referralId: string,
  ) {
    return this.referralService.getReferralApplications(referralId, userId);
  }
}
