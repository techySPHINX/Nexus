import { Module } from '@nestjs/common';
import { MetricsService } from './metrics.service';
import { MetricsController } from './metrics.controller';

/**
 * MetricsModule bootstraps prom-client default metrics collection and
 * exposes the GET /metrics endpoint for Prometheus scraping.
 *
 * Import this module once in AppModule.  Because MetricsService is provided
 * here and exported, other modules can inject it to increment custom counters
 * (e.g. errorsTotal, wsConnectionsActive) without circular dependencies.
 */
@Module({
  controllers: [MetricsController],
  providers: [MetricsService],
  exports: [MetricsService],
})
export class MetricsModule {}
