import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Query,
  BadRequestException,
  ValidationPipe,
  UsePipes,
  Param,
} from '@nestjs/common';
import { DocumentVerificationService } from '../auth/services/document-verification.service';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { GetCurrentUser } from '../common/decorators/get-current-user.decorator';
import {
  GetPendingDocumentsFilterDto,
  ApproveDocumentsDto,
  RejectDocumentsDto,
} from './dto';

/**
 * Admin controller for managing document verification with advanced filtering
 */
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class AdminController {
  constructor(
    private readonly documentVerificationService: DocumentVerificationService,
    private readonly adminService: AdminService,
  ) { }

  /**
   * Get all pending document verification requests with advanced filtering
   * 
   * Supports filters:
   * - Pagination: page, limit
   * - Sorting: sortBy, sortOrder
   * - User filters: graduationYear, graduationYearFrom, graduationYearTo, role, searchName, searchEmail
   * - Profile filters: department, branch, course, year, location
   * - Document filters: documentType, documentTypes
   * - Date filters: submittedAfter, submittedBefore
   * - Stats: includeStats (boolean)
   * 
   * Example: /admin/pending-documents?page=1&limit=10&role=STUDENT&department=CSE&graduationYear=2024&includeStats=true
   */
  @Get('pending-documents')
  async getPendingDocuments(
    @Query(new ValidationPipe({ transform: true, whitelist: true }))
    filters: GetPendingDocumentsFilterDto,
  ) {
    return this.documentVerificationService.getPendingDocuments(filters);
  }

  /**
   * Get document verification statistics
   */
  // NOTE: document-stats endpoint removed; frontend computes stats from pending-documents

  /**
   * Approve documents and activate user account
   */
  @Post('approve-documents')
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async approveDocuments(
    @Body() approveDto: ApproveDocumentsDto,
    @GetCurrentUser('sub') adminId: string,
  ) {
    return this.documentVerificationService.approveDocuments(
      approveDto.documentIds,
      adminId,
      approveDto.adminComments,
    );
  }

  /**
   * Reject documents with reason
   */
  @Post('reject-documents')
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async rejectDocuments(
    @Body() rejectDto: RejectDocumentsDto,
    @GetCurrentUser('sub') adminId: string,
  ) {
    return this.documentVerificationService.rejectDocuments(
      rejectDto.documentIds,
      adminId,
      rejectDto.reason,
      rejectDto.adminComments,
    );
  }

  /**
   * Get user document history
   */
  @Get('user-documents')
  async getUserDocuments(@Query('userId') userId: string) {
    if (!userId) {
      throw new BadRequestException('User ID is required');
    }

    return this.documentVerificationService.getUserDocumentStatus(userId);
  }

  /**
   * Get pending documents statistics only
   */
  @Get('pending-documents/stats')
  async getPendingDocumentsStats() {
    const filters = new GetPendingDocumentsFilterDto();
    filters.includeStats = true;
    filters.limit = 1; // Minimal data fetch for stats only

    const result = await this.documentVerificationService.getPendingDocuments(filters);
    return result.stats;
  }

  /**
   * Bulk approve documents by filters
   * Useful for approving all documents matching certain criteria
   * Now supports batch approval of multiple users simultaneously
   */
  @Post('bulk-approve')
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async bulkApproveByFilters(
    @Body() body: { filters: GetPendingDocumentsFilterDto; adminComments?: string },
    @GetCurrentUser('sub') adminId: string,
  ) {
    // First, get all documents matching the filters
    const result = await this.documentVerificationService.getPendingDocuments({
      ...body.filters,
      limit: 1000, // High limit for bulk operations
    });

    if (result.data.length === 0) {
      return {
        message: 'No documents found matching the filters',
        totalProcessed: 0,
        stats: {
          successCount: 0,
          failedCount: 0,
          alreadyApprovedCount: 0,
        },
      };
    }

    const documentIds = result.data.map(doc => doc.id);

    // Approve all matching documents (now supports multiple users)
    const approvalResult = await this.documentVerificationService.approveDocuments(
      documentIds,
      adminId,
      body.adminComments,
    );

    return approvalResult;
  }

  /**
   * Bulk reject documents by filters
   * Useful for rejecting all documents matching certain criteria
   */
  @Post('bulk-reject')
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async bulkRejectByFilters(
    @Body() body: {
      filters: GetPendingDocumentsFilterDto;
      reason: string;
      adminComments?: string;
    },
    @GetCurrentUser('sub') adminId: string,
  ) {
    if (!body.reason || body.reason.trim().length < 10) {
      throw new BadRequestException('Rejection reason must be at least 10 characters');
    }

    // Get all documents matching the filters
    const result = await this.documentVerificationService.getPendingDocuments({
      ...body.filters,
      limit: 1000,
    });

    if (result.data.length === 0) {
      return {
        message: 'No documents found matching the filters',
        totalProcessed: 0,
        stats: {
          successCount: 0,
          failedCount: 0,
        },
      };
    }

    const documentIds = result.data.map(doc => doc.id);

    // Reject all matching documents (now supports multiple users)
    const rejectionResult = await this.documentVerificationService.rejectDocuments(
      documentIds,
      adminId,
      body.reason,
      body.adminComments,
    );

    return rejectionResult;
  }

  /**
   * Get filter options for admin dashboard
   * Returns unique values for dropdown filters
   */
  @Get('filter-options')
  async getFilterOptions() {
    const allPendingUsers = await this.documentVerificationService.getPendingDocuments({
      limit: 1000,
    });

    const departments = new Set<string>();
    const branches = new Set<string>();
    const courses = new Set<string>();
    const graduationYears = new Set<number>();
    const locations = new Set<string>();

    allPendingUsers.data.forEach((doc: any) => {
      if (doc.user?.profile?.dept) departments.add(doc.user.profile.dept);
      if (doc.user?.profile?.branch) branches.add(doc.user.profile.branch);
      if (doc.user?.profile?.course) courses.add(doc.user.profile.course);
      if (doc.user?.graduationYear) graduationYears.add(doc.user.graduationYear);
      if (doc.user?.profile?.location) locations.add(doc.user.profile.location);
    });

    return {
      departments: Array.from(departments).sort(),
      branches: Array.from(branches).sort(),
      courses: Array.from(courses).sort(),
      graduationYears: Array.from(graduationYears).sort((a, b) => b - a),
      locations: Array.from(locations).sort(),
      roles: ['STUDENT', 'ALUMNI'],
      documentTypes: ['STUDENT_ID', 'ALUMNI_PROOF', 'GRADUATION_CERTIFICATE', 'ENROLLMENT_LETTER', 'OTHERS'],
    };
  }

  /**
   * Get admin dashboard statistics
   */
  @Get('dashboard/stats')
  async getDashboardStats() {
    return this.adminService.getDashboardStats();
  }

  /**
   * Get user activity report
   */
  @Get('dashboard/activity')
  async getUserActivityReport(@Query('days') days?: string) {
    const daysNum = days ? parseInt(days, 10) : 7;
    return this.adminService.getUserActivityReport(daysNum);
  }

  /**
   * Get platform health metrics
   */
  @Get('dashboard/health')
  async getPlatformHealth() {
    return this.adminService.getPlatformHealth();
  }

  /**
   * Search users with advanced filters
   */
  @Get('users/search')
  async searchUsers(
    @Query('query') query?: string,
    @Query('role') role?: string,
    @Query('accountStatus') accountStatus?: string,
    @Query('graduationYear') graduationYear?: string,
    @Query('department') department?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.adminService.searchUsers({
      query,
      role,
      accountStatus,
      graduationYear: graduationYear ? parseInt(graduationYear, 10) : undefined,
      department,
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 20,
    });
  }

  /**
   * Get detailed user information
   */
  @Get('users/:userId')
  async getUserDetails(@Param('userId') userId: string) {
    return this.adminService.getUserDetails(userId);
  }
}
