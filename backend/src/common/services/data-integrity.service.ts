import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

/**
 * Service for database data integrity validation
 * Provides methods to check and maintain data consistency
 */
@Injectable()
export class DataIntegrityService {
  constructor(private prisma: PrismaService) {}

  /**
   * Validates that all foreign key relationships are intact
   */
  async validateForeignKeyIntegrity(): Promise<{
    valid: boolean;
    errors: string[];
  }> {
    const errors: string[] = [];

    try {
      // Check orphaned messages (messages with non-existent users)
      const orphanedMessages = await this.prisma.$queryRaw<any[]>`
        SELECT m.id, m."senderId", m."receiverId"
        FROM message m
        LEFT JOIN users s ON m."senderId" = s.id
        LEFT JOIN users r ON m."receiverId" = r.id
        WHERE s.id IS NULL OR r.id IS NULL
        LIMIT 10
      `;

      if (orphanedMessages.length > 0) {
        errors.push(`Found ${orphanedMessages.length} orphaned messages`);
      }

      // Check orphaned connections
      const orphanedConnections = await this.prisma.$queryRaw<any[]>`
        SELECT c.id, c."requesterId", c."recipientId"
        FROM connection c
        LEFT JOIN users req ON c."requesterId" = req.id
        LEFT JOIN users rec ON c."recipientId" = rec.id
        WHERE req.id IS NULL OR rec.id IS NULL
        LIMIT 10
      `;

      if (orphanedConnections.length > 0) {
        errors.push(`Found ${orphanedConnections.length} orphaned connections`);
      }

      // Check orphaned referral applications
      const orphanedApplications = await this.prisma.$queryRaw<any[]>`
        SELECT ra.id, ra."referralId", ra."applicantId"
        FROM referral_applications ra
        LEFT JOIN referrals r ON ra."referralId" = r.id
        LEFT JOIN users u ON ra."applicantId" = u.id
        WHERE r.id IS NULL OR u.id IS NULL
        LIMIT 10
      `;

      if (orphanedApplications.length > 0) {
        errors.push(
          `Found ${orphanedApplications.length} orphaned referral applications`,
        );
      }

      return {
        valid: errors.length === 0,
        errors,
      };
    } catch (error) {
      return {
        valid: false,
        errors: [`Database integrity check failed: ${error.message}`],
      };
    }
  }

  /**
   * Validates data consistency rules
   */
  async validateDataConsistency(): Promise<{
    valid: boolean;
    errors: string[];
  }> {
    const errors: string[] = [];

    try {
      // Check for duplicate connections (shouldn't exist with unique constraint)
      const duplicateConnections = await this.prisma.$queryRaw<any[]>`
        SELECT "requesterId", "recipientId", COUNT(*) as count
        FROM connection
        GROUP BY "requesterId", "recipientId"
        HAVING COUNT(*) > 1
      `;

      if (duplicateConnections.length > 0) {
        errors.push(
          `Found ${duplicateConnections.length} duplicate connections`,
        );
      }

      // Check for duplicate referral applications
      const duplicateApplications = await this.prisma.$queryRaw<any[]>`
        SELECT "referralId", "applicantId", COUNT(*) as count
        FROM referral_applications
        GROUP BY "referralId", "applicantId"
        HAVING COUNT(*) > 1
      `;

      if (duplicateApplications.length > 0) {
        errors.push(
          `Found ${duplicateApplications.length} duplicate referral applications`,
        );
      }

      // Check for messages between non-connected users
      const invalidMessages = await this.prisma.$queryRaw<any[]>`
        SELECT m.id, m."senderId", m."receiverId"
        FROM message m
        WHERE NOT EXISTS (
          SELECT 1 FROM connection c
          WHERE c.status = 'ACCEPTED'
          AND (
            (c."requesterId" = m."senderId" AND c."recipientId" = m."receiverId")
            OR (c."requesterId" = m."receiverId" AND c."recipientId" = m."senderId")
          )
        )
        LIMIT 10
      `;

      if (invalidMessages.length > 0) {
        errors.push(
          `Found ${invalidMessages.length} messages between non-connected users`,
        );
      }

      return {
        valid: errors.length === 0,
        errors,
      };
    } catch (error) {
      return {
        valid: false,
        errors: [`Data consistency check failed: ${error.message}`],
      };
    }
  }

  /**
   * Runs a full database integrity check
   */
  async runFullIntegrityCheck(): Promise<{
    valid: boolean;
    results: {
      foreignKeys: { valid: boolean; errors: string[] };
      consistency: { valid: boolean; errors: string[] };
    };
  }> {
    const foreignKeys = await this.validateForeignKeyIntegrity();
    const consistency = await this.validateDataConsistency();

    return {
      valid: foreignKeys.valid && consistency.valid,
      results: {
        foreignKeys,
        consistency,
      },
    };
  }

  /**
   * Gets database statistics
   */
  async getDatabaseStats(): Promise<any> {
    const stats = await this.prisma.$queryRaw<any[]>`
      SELECT 
        schemaname,
        tablename,
        pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size,
        n_live_tup AS row_count
      FROM pg_stat_user_tables
      WHERE schemaname = 'public'
      ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
    `;

    return stats;
  }
}
