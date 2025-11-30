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

    // ensure the provided id matches the report type
    if (type === ReportedContentType.POST && !postId) {
      throw new BadRequestException('postId must be provided for POST reports.');
    }
    if (type === ReportedContentType.COMMENT && !commentId) {
      throw new BadRequestException(
        'commentId must be provided for COMMENT reports.',
      );
    }

    let subCommunityId: string | null = null;

    if (type === ReportedContentType.POST) {
      const post = await this.prisma.post.findUnique({
        where: { id: postId },
      });
      if (!post) {
        throw new NotFoundException('Post not found');
      }
      // allow null subCommunityId
      subCommunityId = post.subCommunityId ?? null;
    } else if (type === ReportedContentType.COMMENT) {
      const comment = await this.prisma.comment.findUnique({
        where: { id: commentId },
        include: { post: true },
      });
      if (!comment) {
        throw new NotFoundException('Comment not found');
      }
      // allow null subCommunityId (if comment.post is null or has no subCommunityId)
      subCommunityId = comment.post?.subCommunityId ?? null;
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

  async getAllReports(
    userId: string,
    pageSize = 20,
    cursor: string | null,
  ) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true },
    });

    if (!user || user.role !== 'ADMIN') {
      throw new BadRequestException('Only admins can access reports.');
    }

    const limit = Math.max(1, Math.min(pageSize || 20, 50)); // enforce 1..50
    const take = limit + 1; // fetch one extra to detect next cursor

    const reports = await this.prisma.contentReport.findMany({
      take,
      cursor: cursor ? { id: cursor } : undefined,
      skip: cursor ? 1 : 0,
      orderBy: { createdAt: 'desc' },
      include: {
        reporter: {
          select: { id: true, email: true, name: true, role: true },
        },
        post: {
          select: { id: true, subject: true, subCommunityId: true },
        },
        comment: {
          select: { id: true, content: true, postId: true },
        },
      },
    });

    let nextCursor: string | null = null;
    if (reports.length > limit) {
      const next = reports.pop();
      nextCursor = next?.id ?? null;
    }

    return { items: reports, nextCursor };
  }
}
