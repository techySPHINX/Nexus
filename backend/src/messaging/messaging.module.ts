import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MessagingService } from './messaging.service';
import { MessagingController } from './messaging.controller';
import { ImprovedMessagingGateway } from './messaging.gateway.improved';
// FastChatGateway is superseded by ImprovedMessagingGateway (Issue #170).
import { PrismaModule } from 'src/prisma/prisma.module';
import { AuthModule } from 'src/auth/auth.module';
import { CommonModule } from '../common/common.module';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    CommonModule,
    ConfigModule,
    // Use registerAsync so the JWT secret is always read from ConfigService
    // (which validates it via Joi at startup) — no fallback string permitted.
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.getOrThrow<string>('JWT_SECRET'),
        signOptions: { expiresIn: '24h' },
      }),
    }),
  ],
  controllers: [MessagingController],
  providers: [
    MessagingService,
    // ImprovedMessagingGateway is the canonical chat gateway (Issue #170).
    // FastChatGateway has been removed — its functionality is covered here.
    ImprovedMessagingGateway,
  ],
  exports: [ImprovedMessagingGateway, MessagingService],
})
export class MessagingModule {}
