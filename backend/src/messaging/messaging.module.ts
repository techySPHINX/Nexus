import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { MessagingService } from './messaging.service';
import { MessagingController } from './messaging.controller';
import { ImprovedMessagingGateway } from './messaging.gateway.improved';
import { FastChatGateway } from './fast-chat.gateway';
import { PrismaModule } from 'src/prisma/prisma.module';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'fallback-secret',
      signOptions: { expiresIn: '24h' },
    }),
  ],
  controllers: [MessagingController],
  providers: [
    MessagingService,
    ImprovedMessagingGateway,
    FastChatGateway, // Add the fast chat gateway
  ],
  exports: [ImprovedMessagingGateway, FastChatGateway, MessagingService],
})
export class MessagingModule {}
