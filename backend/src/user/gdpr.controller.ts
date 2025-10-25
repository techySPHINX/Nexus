import {
  Controller,
  Get,
  Delete,
  Post,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { GdprService } from '../common/services/gdpr.service';
import { AuditLogService } from '../common/services/audit-log.service';
import { WinstonLoggerService } from '../common/logger/winston-logger.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetCurrentUser } from '../common/decorators/get-current-user.decorator';
import { AuditAction } from '../common/services/audit-log.service';

@Controller('user/gdpr')
@UseGuards(JwtAuthGuard)
export class GdprController {
  constructor(
    private readonly gdprService: GdprService,
    private readonly auditLog: AuditLogService,
    private readonly logger: WinstonLoggerService,
  ) { }

  @Get('export')
  async exportData(@GetCurrentUser('sub') userId: string, @Request() req) {
    this.logger.log(`User ${userId} requested data export`, 'GdprController');

    const ipAddress = req.ip || req.connection?.remoteAddress || '';
    const userData = await this.gdprService.exportUserData(userId, ipAddress);

    await this.auditLog.logDataPrivacy(
      AuditAction.DATA_EXPORTED,
      userId,
      req,
      {
        format: 'json',
        sections: Object.keys(userData).length,
      },
    );

    return {
      message: 'User data exported successfully',
      exportedAt: new Date().toISOString(),
      data: userData,
    };
  }

  @Delete('delete-account')
  @HttpCode(HttpStatus.OK)
  async deleteAccount(@GetCurrentUser('sub') userId: string, @Request() req) {
    this.logger.warn(
      `User ${userId} requested account deletion`,
      'GdprController',
    );

    await this.auditLog.logDataPrivacy(
      AuditAction.DATA_DELETED,
      userId,
      req,
      { type: 'complete_deletion' },
    );

    const ipAddress = req.ip || req.connection?.remoteAddress || '';
    await this.gdprService.deleteUserData(userId, ipAddress);

    this.logger.log(`User ${userId} account deleted`, 'GdprController');

    return {
      message: 'Account and all data deleted successfully',
      deletedAt: new Date().toISOString(),
    };
  }

  @Post('anonymize')
  async anonymizeAccount(
    @GetCurrentUser('sub') userId: string,
    @Request() req,
  ) {
    this.logger.warn(
      `User ${userId} requested account anonymization`,
      'GdprController',
    );

    await this.auditLog.logDataPrivacy(
      AuditAction.DATA_DELETED,
      userId,
      req,
      { type: 'anonymization' },
    );

    const ipAddress = req.ip || req.connection?.remoteAddress || '';
    await this.gdprService.anonymizeUserData(userId, ipAddress);

    this.logger.log(`User ${userId} account anonymized`, 'GdprController');

    return {
      message:
        'Account anonymized successfully. Personal data removed but content preserved.',
      anonymizedAt: new Date().toISOString(),
    };
  }
}
