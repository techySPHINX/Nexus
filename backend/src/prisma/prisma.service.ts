import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

/**
 * Service for interacting with the Prisma database client.
 * Extends PrismaClient to manage database connections throughout the application lifecycle.
 */
@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  /**
   * Connects to the database when the module is initialized.
   */
  async onModuleInit() {
    await this.$connect();
  }

  /**
   * Disconnects from the database when the module is destroyed.
   */
  async onModuleDestroy() {
    await this.$disconnect();
  }
}
