import {
  Controller,
  Post,
  Body,
  UseGuards,
  Get,
  ParseIntPipe,
  DefaultValuePipe,
  Query,
  Param,
  Patch,
  Delete,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ReportService } from './report.service';
import { CreateReportDto } from './dto/create-report.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetCurrentUser } from '../common/decorators/get-current-user.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { ResolveReportDto } from './dto/resolve-report.dto';
import { TakeUserActionDto } from './dto/take-user-action.dto';
import { DeleteContentDto } from './dto/delete-content.dto';
import { FilterReportsDto } from './dto/filter-reports.dto';
import {
  BatchResolveReportsDto,
  BatchDismissReportsDto,
} from './dto/batch-operations.dto';
import { RevokeUserActionDto } from './dto/revoke-user-action.dto';

@Controller('reports')
@UseGuards(JwtAuthGuard)
export class ReportController {
  constructor(private readonly reportService: ReportService) { }

  /**
   * POST /reports - Create a new report
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(
    @Body() createReportDto: CreateReportDto,
    @GetCurrentUser('userId') reporterId: string,
  ) {
    return this.reportService.createReport(createReportDto, reporterId);
  }

  /**
   * GET /reports - Get all reports with filtering (Admin only)
   */
  @Get()
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  async getReports(
    @Query('pageSize', new DefaultValuePipe(20), ParseIntPipe) pageSize: number,
    @GetCurrentUser('userId') userId: string,
    @Query('cursor') cursor?: string,
    @Query() filters?: FilterReportsDto,
  ) {
    return this.reportService.getAllReports(userId, pageSize, cursor, filters);
  }

  /**
   * GET /reports/:id - Get single report details (Admin only)
   */
  @Get(':id')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  async getReportById(
    @Param('id') reportId: string,
    @GetCurrentUser('userId') adminId: string,
  ) {
    return this.reportService.getReportById(reportId, adminId);
  }

  /**
   * PATCH /reports/:id/resolve - Resolve or dismiss a report (Admin only)
   */
  @Patch(':id/resolve')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @HttpCode(HttpStatus.OK)
  async resolveReport(
    @Param('id') reportId: string,
    @GetCurrentUser('userId') adminId: string,
    @Body() resolveDto: ResolveReportDto,
  ) {
    return this.reportService.resolveReport(reportId, adminId, resolveDto);
  }

  /**
   * POST /reports/:id/user-action - Take action against user (Admin only)
   */
  @Post(':id/user-action')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @HttpCode(HttpStatus.CREATED)
  async takeUserAction(
    @Param('id') reportId: string,
    @GetCurrentUser('userId') adminId: string,
    @Body() actionDto: TakeUserActionDto,
  ) {
    return this.reportService.takeUserAction(reportId, adminId, actionDto);
  }

  /**
   * DELETE /reports/:id/content - Soft delete reported content (Admin only)
   */
  @Delete(':id/content')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @HttpCode(HttpStatus.OK)
  async deleteContent(
    @Param('id') reportId: string,
    @GetCurrentUser('userId') adminId: string,
    @Body() deleteDto: DeleteContentDto,
  ) {
    return this.reportService.deleteContent(reportId, adminId, deleteDto);
  }

  /**
   * POST /reports/batch/resolve - Batch resolve multiple reports (Admin only)
   */
  @Post('batch/resolve')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @HttpCode(HttpStatus.OK)
  async batchResolveReports(
    @GetCurrentUser('userId') adminId: string,
    @Body() batchDto: BatchResolveReportsDto,
  ) {
    return this.reportService.batchResolveReports(adminId, batchDto);
  }

  /**
   * POST /reports/batch/dismiss - Batch dismiss multiple reports (Admin only)
   */
  @Post('batch/dismiss')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @HttpCode(HttpStatus.OK)
  async batchDismissReports(
    @GetCurrentUser('userId') adminId: string,
    @Body() batchDto: BatchDismissReportsDto,
  ) {
    return this.reportService.batchDismissReports(adminId, batchDto);
  }

  /**
   * GET /reports/analytics - Get moderation analytics (Admin only)
   */
  @Get('analytics/dashboard')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  async getAnalytics(
    @GetCurrentUser('userId') adminId: string,
    @Query('days', new DefaultValuePipe(30), ParseIntPipe) days: number,
  ) {
    return this.reportService.getAnalytics(adminId, days);
  }

  /**
   * GET /reports/user/:userId/violations - Get user violation history (Admin only)
   */
  @Get('user/:userId/violations')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  async getUserViolations(
    @Param('userId') userId: string,
    @GetCurrentUser('userId') adminId: string,
  ) {
    return this.reportService.getUserViolations(userId, adminId);
  }

  /**
   * PATCH /reports/user-action/:actionId/revoke - Revoke a user action (Admin only)
   */
  @Patch('user-action/:actionId/revoke')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @HttpCode(HttpStatus.OK)
  async revokeUserAction(
    @Param('actionId') actionId: string,
    @GetCurrentUser('userId') adminId: string,
    @Body() revokeDto: RevokeUserActionDto,
  ) {
    return this.reportService.revokeUserAction(actionId, adminId, revokeDto);
  }
}
