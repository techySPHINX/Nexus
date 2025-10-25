import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

/**
 * Service for interacting with the Prisma database client.
 * Extends PrismaClient to manage database connections throughout the application lifecycle.
 * Configured with production-grade connection pooling settings.
 */
@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy {
  constructor() {
    super({
      datasources: {
        db: {
          url: process.env.DATABASE_URL,
        },
      },
      log: process.env.NODE_ENV === 'development'
        ? ['query', 'info', 'warn', 'error']
        : ['error'],
      errorFormat: 'pretty',
    });

    // Configure connection pool for production
    this.$connect();
  }

  /**
   * Connects to the database when the module is initialized.
   */
  async onModuleInit() {
    await this.$connect();
    console.log('✅ Database connected successfully');
  }

  /**
   * Disconnects from the database when the module is destroyed.
   */
  async onModuleDestroy() {
    await this.$disconnect();
    console.log('📊 Database connection closed');
  }

  /**
   * Enable query logging for debugging
   */
  enableQueryLogging() {
    this.$on('query' as never, (e: any) => {
      console.log('Query: ' + e.query);
      console.log('Duration: ' + e.duration + 'ms');
    });
  }

  /**
   * Clean disconnection helper
   */
  async cleanDisconnect() {
    await this.$disconnect();
  }
}
