import { Controller, Get, Res } from '@nestjs/common';
import { Response } from 'express';
import { ApiExcludeController } from '@nestjs/swagger';
import { MetricsService } from './metrics.service';

/**
 * Exposes a single GET /metrics endpoint in the Prometheus text exposition
 * format (version 0.0.4).  This endpoint is scraped by the Prometheus service
 * defined in docker-compose.production.yml and prometheus.yml.
 *
 * IMPORTANT: This endpoint MUST NOT be reachable from the public internet.
 * Restrict access at the nginx / firewall level so only the Prometheus
 * container (on the nexus-network) can reach it.
 *
 * Swagger docs are excluded to avoid leaking internal metric names publicly.
 */
@ApiExcludeController()
@Controller('metrics')
export class MetricsController {
  constructor(private readonly metricsService: MetricsService) {}

  @Get()
  async scrape(@Res() res: Response): Promise<void> {
    const [metrics, contentType] = await Promise.all([
      this.metricsService.getMetrics(),
      Promise.resolve(this.metricsService.getContentType()),
    ]);
    res.set('Content-Type', contentType);
    res.end(metrics);
  }
}
