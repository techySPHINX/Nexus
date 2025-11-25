import { Controller, Post, Body, UseGuards, Get, ParseIntPipe, DefaultValuePipe, Query } from '@nestjs/common';
import { ReportService } from './report.service';
import { CreateReportDto } from './dto/create-report.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetCurrentUser } from '../common/decorators/get-current-user.decorator';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';

@Controller('reports')
export class ReportController {
  constructor(private readonly reportService: ReportService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  create(
    @Body() createReportDto: CreateReportDto,
    @GetCurrentUser('userId') reporterId: string,
  ) {
    return this.reportService.createReport(createReportDto, reporterId);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async getReports(
    @Query('pageSize', new DefaultValuePipe(20), ParseIntPipe) pageSize: number,
    @GetCurrentUser('userId') userId: string,
    @Query('cursor') cursor?: string,
  ) {
    return this.reportService.getAllReports(userId, pageSize, cursor);
  }
}
