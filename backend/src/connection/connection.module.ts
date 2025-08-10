import { Module } from '@nestjs/common';
import { ConnectionService } from './connection.service';
import { ConnectionController } from './connection.controller';
import { PrismaService } from 'src/prisma/prisma.service';
import { NotificationService } from 'src/notification/notification.service';

@Module({
  controllers: [ConnectionController],
  providers: [ConnectionService, PrismaService, NotificationService],
  exports: [ConnectionService],
})
export class ConnectionModule {}
