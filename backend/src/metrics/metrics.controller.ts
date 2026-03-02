import { Controller, Get, Header, UseGuards } from '@nestjs/common';
import { MetricsService } from './metrics.service';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

/**
 * Exposes the Prometheus metrics scrape endpoint at GET /metrics.
 *
 * The endpoint is protected by JWT + ADMIN role so that metric data
 * (which can reveal internal topology) is not publicly readable.
 * Configure Prometheus to authenticate via bearer token; alternatively,
 * restrict access at the Nginx/firewall layer and remove the guard.
 */
@ApiTags('metrics')
@Controller('metrics')
export class MetricsController {
  constructor(private readonly metricsService: MetricsService) {}

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @Header('Content-Type', 'text/plain; version=0.0.4; charset=utf-8')
  @ApiOperation({
    summary: 'Prometheus metrics scrape endpoint',
    description:
      'Returns all application metrics in Prometheus text exposition format. ' +
      'Requires ADMIN role. Consumed by the Prometheus scraper.',
  })
  @ApiResponse({ status: 200, description: 'Prometheus text format metrics' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  async getMetrics(): Promise<string> {
    return this.metricsService.getMetrics();
  }
}
