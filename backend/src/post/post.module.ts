import { Module } from '@nestjs/common';
import { PostService } from './post.service';
import { PostController } from './post.controller';
import { PrismaModule } from 'src/prisma/prisma.module';
import { FilesModule } from 'src/files/files.module';
import { GamificationModule } from 'src/gamification/gamification.module';

@Module({
  imports: [PrismaModule, FilesModule, GamificationModule],
  controllers: [PostController],
  providers: [PostService],
})
export class PostModule {}
