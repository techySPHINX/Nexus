import { Module } from '@nestjs/common';
import { ProfileService } from './profile.service';
import { ProfileController } from './profile.controller';
import { PrismaService } from 'src/prisma/prisma.service';
import { JwtStrategy } from 'src/auth/strategies/jwt.strategy';

@Module({
  controllers: [ProfileController],
  providers: [ProfileService, PrismaService, JwtStrategy],
  exports: [ProfileService],
})
export class ProfileModule {}
