import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateReportDto } from './dto/create-report.dto';
import { ReportedContentType } from '@prisma/client';

@Injectable()
export class ReportService {
  constructor(private prisma: PrismaService) {}

  async createReport(dto: CreateReportDto, reporterId: string) {
    const { type, reason, postId, commentId } = dto;

    if (!postId && !commentId) {
      throw new BadRequestException(
        'Either postId or commentId must be provided.',
      );
    }

    if (postId && commentId) {
      throw new BadRequestException(
        'Cannot report both a post and a comment simultaneously.',
      );
    }

    let subCommunityId: string;

    if (type === ReportedContentType.POST) {
      const post = await this.prisma.post.findUnique({
        where: { id: postId },
      });
      if (!post || !post.subCommunityId) {
        throw new NotFoundException(
          'Post not found or does not belong to a sub-community.',
        );
      }
      subCommunityId = post.subCommunityId;
    } else if (type === ReportedContentType.COMMENT) {
      const comment = await this.prisma.comment.findUnique({
        where: { id: commentId },
        include: { post: true },
      });
      if (!comment || !comment.post.subCommunityId) {
        throw new NotFoundException(
          'Comment not found or does not belong to a sub-community.',
        );
      }
      subCommunityId = comment.post.subCommunityId;
    }

    // This will fail if the database is not migrated.
    return this.prisma.contentReport.create({
      data: {
        reporterId,
        reason,
        type,
        postId,
        commentId,
        subCommunityId,
      },
    });
  }
}
