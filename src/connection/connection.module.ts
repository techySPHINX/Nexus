import { Module } from '@nestjs/common';
import { ConnectionService } from './connection.service';
import { ConnectionController } from './connection.controller';
import { PrismaService } from 'src/prisma/prisma.service';

@Module({
  controllers: [ConnectionController],
  providers: [ConnectionService, PrismaService],
})
export class ConnectionModule {}
