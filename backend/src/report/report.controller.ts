import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { ReportService } from './report.service';
import { CreateReportDto } from './dto/create-report.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetCurrentUser } from '../common/decorators/get-current-user.decorator';

@Controller('reports')
export class ReportController {
  constructor(private readonly reportService: ReportService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  create(
    @Body() createReportDto: CreateReportDto,
    @GetCurrentUser('id') reporterId: string,
  ) {
    return this.reportService.createReport(createReportDto, reporterId);
  }
}
