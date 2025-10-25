import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { WinstonLoggerService } from '../logger/winston-logger.service';

export enum AuditAction {
  // Authentication
  LOGIN = 'LOGIN',
  LOGOUT = 'LOGOUT',
  LOGIN_FAILED = 'LOGIN_FAILED',
  PASSWORD_CHANGE = 'PASSWORD_CHANGE',
  PASSWORD_RESET_REQUEST = 'PASSWORD_RESET_REQUEST',
  PASSWORD_RESET = 'PASSWORD_RESET',
  EMAIL_VERIFIED = 'EMAIL_VERIFIED',
  TWO_FACTOR_ENABLED = 'TWO_FACTOR_ENABLED',
  TWO_FACTOR_DISABLED = 'TWO_FACTOR_DISABLED',
  TWO_FACTOR_VERIFIED = 'TWO_FACTOR_VERIFIED',
  TOKEN_REFRESH = 'TOKEN_REFRESH',
  TOKEN_REVOKED = 'TOKEN_REVOKED',

  // Account Management
  ACCOUNT_CREATED = 'ACCOUNT_CREATED',
  ACCOUNT_UPDATED = 'ACCOUNT_UPDATED',
  ACCOUNT_DELETED = 'ACCOUNT_DELETED',
  ACCOUNT_LOCKED = 'ACCOUNT_LOCKED',
  ACCOUNT_UNLOCKED = 'ACCOUNT_UNLOCKED',
  ACCOUNT_SUSPENDED = 'ACCOUNT_SUSPENDED',
  ACCOUNT_ACTIVATED = 'ACCOUNT_ACTIVATED',

  // Document Verification
  DOCUMENT_UPLOADED = 'DOCUMENT_UPLOADED',
  DOCUMENT_APPROVED = 'DOCUMENT_APPROVED',
  DOCUMENT_REJECTED = 'DOCUMENT_REJECTED',

  // Admin Actions
  USER_ROLE_CHANGED = 'USER_ROLE_CHANGED',
  USER_PERMISSIONS_CHANGED = 'USER_PERMISSIONS_CHANGED',
  ADMIN_ACCESS = 'ADMIN_ACCESS',

  // Data Privacy
  DATA_EXPORT_REQUESTED = 'DATA_EXPORT_REQUESTED',
  DATA_EXPORTED = 'DATA_EXPORTED',
  DATA_DELETION_REQUESTED = 'DATA_DELETION_REQUESTED',
  DATA_DELETED = 'DATA_DELETED',

  // Security Events
  SUSPICIOUS_ACTIVITY = 'SUSPICIOUS_ACTIVITY',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  UNAUTHORIZED_ACCESS_ATTEMPT = 'UNAUTHORIZED_ACCESS_ATTEMPT',
  SESSION_EXPIRED = 'SESSION_EXPIRED',
}

export interface AuditLogMetadata {
  action: AuditAction;
  userId?: string;
  targetUserId?: string;
  ipAddress?: string;
  userAgent?: string;
  resource?: string;
  resourceId?: string;
  changes?: any;
  reason?: string;
  status?: 'success' | 'failure';
  errorMessage?: string;
  [key: string]: any;
}

/**
 * Service for comprehensive audit logging
 */
@Injectable()
export class AuditLogService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: WinstonLoggerService,
  ) { }

  /**
   * Log an audit event
   */
  async log(metadata: AuditLogMetadata): Promise<void> {
    const {
      action,
      userId,
      targetUserId,
      ipAddress,
      userAgent,
      resource,
      resourceId,
      changes,
      reason,
      status = 'success',
      errorMessage,
      ...rest
    } = metadata;

    try {
      // Store in Winston logs
      this.logger.audit(action, userId || 'system', {
        targetUserId,
        ipAddress,
        userAgent,
        resource,
        resourceId,
        changes,
        reason,
        status,
        errorMessage,
        ...rest,
      });

      // Store in database as security event
      if (userId) {
        await this.prisma.securityEvent.create({
          data: {
            userId,
            eventType: action as any,
            ipAddress: ipAddress || 'unknown',
            userAgent,
            metadata: {
              targetUserId,
              resource,
              resourceId,
              changes,
              reason,
              status,
              errorMessage,
              ...rest,
            },
          },
        });
      }
    } catch (error) {
      // Fail silently but log the error
      this.logger.error(
        `Failed to create audit log: ${error.message}`,
        error.stack,
        'AuditLogService',
      );
    }
  }

  /**
   * Log authentication events
   */
  async logAuth(
    action: AuditAction,
    userId: string,
    ipAddress: string,
    userAgent: string,
    status: 'success' | 'failure',
    reason?: string,
  ): Promise<void> {
    await this.log({
      action,
      userId,
      ipAddress,
      userAgent,
      status,
      reason,
    });
  }

  /**
   * Log admin actions
   */
  async logAdminAction(
    action: AuditAction,
    adminId: string,
    targetUserId: string,
    ipAddress: string,
    changes?: any,
    reason?: string,
  ): Promise<void> {
    await this.log({
      action,
      userId: adminId,
      targetUserId,
      ipAddress,
      changes,
      reason,
      resource: 'user',
      resourceId: targetUserId,
    });
  }

  /**
   * Log data privacy actions
   */
  async logDataPrivacy(
    action: AuditAction,
    userId: string,
    ipAddress: string,
    metadata?: any,
  ): Promise<void> {
    await this.log({
      action,
      userId,
      ipAddress,
      resource: 'user_data',
      resourceId: userId,
      ...metadata,
    });
  }

  /**
   * Log security events
   */
  async logSecurityEvent(
    action: AuditAction,
    userId: string | undefined,
    ipAddress: string,
    metadata?: any,
  ): Promise<void> {
    await this.log({
      action,
      userId,
      ipAddress,
      status: 'failure',
      ...metadata,
    });
  }

  /**
   * Get audit logs for a user
   */
  async getUserAuditLogs(
    userId: string,
    limit: number = 100,
    offset: number = 0,
  ) {
    return this.prisma.securityEvent.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    });
  }

  /**
   * Get audit logs by action type
   */
  async getAuditLogsByAction(
    action: AuditAction,
    limit: number = 100,
    offset: number = 0,
  ) {
    return this.prisma.securityEvent.findMany({
      where: { eventType: action as any },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
          },
        },
      },
    });
  }

  /**
   * Get recent security events
   */
  async getRecentSecurityEvents(hours: number = 24) {
    const since = new Date(Date.now() - hours * 60 * 60 * 1000);

    return this.prisma.securityEvent.findMany({
      where: {
        createdAt: { gte: since },
        eventType: {
          in: [
            'LOGIN_FAILED',
            'ACCOUNT_LOCKED',
          ],
        },
      },
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
    });
  }
}
