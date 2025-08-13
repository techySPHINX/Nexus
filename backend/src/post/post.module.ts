import { Module } from '@nestjs/common';
import { PostService } from './post.service';
import { PostController } from './post.controller';
import { PrismaModule } from 'src/prisma/prisma.module';
import { FilesModule } from 'src/files/files.module';

@Module({
  imports: [PrismaModule, FilesModule],
  controllers: [PostController],
  providers: [PostService],
})
export class PostModule {}
