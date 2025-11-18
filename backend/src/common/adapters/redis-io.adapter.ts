import { IoAdapter } from '@nestjs/platform-socket.io';
import { ServerOptions } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { createClient } from 'redis';
import { INestApplicationContext, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * Redis-based Socket.IO Adapter for Horizontal Scalability
 *
 * This adapter enables multi-server WebSocket communication by using Redis Pub/Sub.
 * All server instances connect to the same Redis instance, allowing messages to be
 * broadcast across all servers.
 *
 * Benefits:
 * - Horizontal scaling: Run multiple server instances behind a load balancer
 * - Cross-server messaging: Users connected to different servers can communicate
 * - High availability: If one server goes down, users can reconnect to another
 * - Session persistence: Redis stores connection state across servers
 */
export class RedisIoAdapter extends IoAdapter {
  private adapterConstructor: ReturnType<typeof createAdapter>;
  private readonly logger = new Logger(RedisIoAdapter.name);
  private readonly configService: ConfigService;

  constructor(app: INestApplicationContext) {
    super(app);
    this.configService = app.get(ConfigService);
  }

  async connectToRedis(): Promise<void> {
    const redisUrl = this.configService.get('REDIS_URL');

    this.logger.log('🔌 Connecting to Redis for Socket.IO adapter...');

    try {
      // Create Redis clients for pub/sub
      const pubClient = redisUrl
        ? createClient({ url: redisUrl })
        : createClient();

      const subClient = pubClient.duplicate();

      // Handle connection events
      pubClient.on('error', (err) => {
        this.logger.error('❌ Redis Pub Client Error:', err);
      });

      subClient.on('error', (err) => {
        this.logger.error('❌ Redis Sub Client Error:', err);
      });

      pubClient.on('connect', () => {
        this.logger.log('✅ Redis Pub Client connected');
      });

      subClient.on('connect', () => {
        this.logger.log('✅ Redis Sub Client connected');
      });

      // Connect to Redis
      await Promise.all([pubClient.connect(), subClient.connect()]);

      this.logger.log('🚀 Redis adapter configured successfully');

      // Create the adapter
      this.adapterConstructor = createAdapter(pubClient, subClient);
    } catch (error) {
      this.logger.error('❌ Failed to connect to Redis:', error);
      this.logger.warn(
        '⚠️ Falling back to in-memory adapter (single-server mode)',
      );
      // If Redis connection fails, the adapter will fall back to default in-memory adapter
    }
  }

  createIOServer(port: number, options?: ServerOptions): any {
    const server = super.createIOServer(port, options);

    // Apply Redis adapter if available
    if (this.adapterConstructor) {
      server.adapter(this.adapterConstructor);
      this.logger.log(
        '✅ Socket.IO server using Redis adapter (multi-server mode)',
      );
    } else {
      this.logger.warn(
        '⚠️ Socket.IO server using default adapter (single-server mode)',
      );
    }

    return server;
  }
}
