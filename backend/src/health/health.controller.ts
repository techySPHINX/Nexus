import { Controller, Get } from '@nestjs/common';
import {
  HealthCheck,
  HealthCheckService,
  PrismaHealthIndicator,
  DiskHealthIndicator,
  MemoryHealthIndicator,
} from '@nestjs/terminus';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { PrismaService } from '../prisma/prisma.service';
import { RedisHealthIndicator } from './redis-health.indicator';

/**
 * Health check endpoints used by Docker, Kubernetes and load-balancers.
 *
 * /health  — liveness  probe: is the process alive and not OOM-killed?
 * /ready   — readiness probe: can it serve traffic? (DB + Redis connected)
 */
@ApiTags('health')
@Controller()
export class HealthController {
  constructor(
    private readonly health: HealthCheckService,
    private readonly prismaHealth: PrismaHealthIndicator,
    private readonly disk: DiskHealthIndicator,
    private readonly memory: MemoryHealthIndicator,
    private readonly redisHealth: RedisHealthIndicator,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Liveness probe — answers "is the process alive?"
   * Docker HEALTHCHECK and Kubernetes livenessProbe should target this.
   * Checks process memory so the container is restarted if it leaks severely.
   */
  @Get('health')
  @HealthCheck()
  @ApiOperation({
    summary: 'Liveness probe',
    description:
      'Returns 200 when the Node process is healthy. ' +
      'Used by Docker HEALTHCHECK and Kubernetes livenessProbe.',
  })
  @ApiResponse({ status: 200, description: 'Application is alive' })
  @ApiResponse({ status: 503, description: 'Application is unhealthy' })
  liveness() {
    return this.health.check([
      // Ensure the process hasn't exceeded 512 MB heap
      () => this.memory.checkHeap('memory_heap', 512 * 1024 * 1024),
      // Ensure at least 100 MB disk space remains on the root volume
      () =>
        this.disk.checkStorage('disk_space', {
          path: '/',
          thresholdPercent: 0.95,
        }),
    ]);
  }

  /**
   * Readiness probe — answers "can this instance serve traffic?"
   * Kubernetes readinessProbe and load-balancers should target this.
   * Returns 503 until both PostgreSQL and Redis are reachable.
   */
  @Get('ready')
  @HealthCheck()
  @ApiOperation({
    summary: 'Readiness probe',
    description:
      'Returns 200 when PostgreSQL and Redis are reachable. ' +
      'Load balancers stop routing traffic while this returns 503.',
  })
  @ApiResponse({
    status: 200,
    description: 'Application is ready to serve traffic',
  })
  @ApiResponse({ status: 503, description: 'Application is not ready' })
  readiness() {
    return this.health.check([
      () => this.prismaHealth.pingCheck('database', this.prisma),
      () => this.redisHealth.isHealthy('redis'),
    ]);
  }
}
