import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { HealthController } from './health.controller';
import { RedisHealthIndicator } from './redis-health.indicator';

/**
 * HealthModule exposes two endpoints:
 *
 *   GET /health  — liveness probe  (memory / disk)
 *   GET /ready   — readiness probe (PostgreSQL + Redis)
 *
 * PrismaModule is @Global so PrismaService is available via DI without
 * a local import. RedisService is provided by CommonModule (@Global).
 */
@Module({
  imports: [TerminusModule],
  controllers: [HealthController],
  providers: [RedisHealthIndicator],
})
export class HealthModule {}
