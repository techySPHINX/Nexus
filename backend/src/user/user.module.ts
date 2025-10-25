import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { GdprController } from './gdpr.controller';
import { PrismaService } from 'src/prisma/prisma.service';
import { JwtStrategy } from 'src/auth/strategies/jwt.strategy';
import { GdprService } from '../common/services/gdpr.service';
import { AuditLogService } from '../common/services/audit-log.service';
import { WinstonLoggerService } from '../common/logger/winston-logger.service';

@Module({
  controllers: [UserController, GdprController],
  providers: [
    UserService,
    PrismaService,
    JwtStrategy,
    GdprService,
    AuditLogService,
    WinstonLoggerService,
  ],
  exports: [UserService],
})
export class UserModule { }
