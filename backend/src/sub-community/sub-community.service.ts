import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSubCommunityDto } from './dto/create-sub-community.dto';
import { UpdateSubCommunityDto } from './dto/update-sub-community.dto';
import { ApproveJoinRequestDto } from './dto/approve-join-request.dto';
import {
  Role,
  SubCommunityStatus,
  SubCommunityRole,
  ReportStatus,
  ReportedContentType,
  Prisma,
} from '@prisma/client';

@Injectable()
export class SubCommunityService {
  constructor(private prisma: PrismaService) {}

  private async getOrCreateTypeId(typeName?: string) {
    if (!typeName) return null;
    const name = typeName.toUpperCase();
    let type = await this.prisma.subCommunityType.findUnique({
      where: { name },
    });
    if (!type) {
      type = await this.prisma.subCommunityType.create({
        data: { name },
      });
    }
    return type.id;
  }
  async createSubCommunityInternal(data: {
    name: string;
    description: string;
    type: string;
    isPrivate: boolean;
    ownerId: string;
    subCommunityCreationRequestId?: string;
  }) {
    const typeId = await this.getOrCreateTypeId(data.type);
    const subCommunity = await this.prisma.subCommunity.create({
      data: {
        name: data.name,
        description: data.description,
        typeId,
        isPrivate: data.isPrivate,
        ownerId: data.ownerId,
        subCommunityCreationRequestId: data.subCommunityCreationRequestId,
      },
      include: { owner: true },
    });

    // Add the owner as a member with OWNER role
    await this.prisma.subCommunityMember.create({
      data: {
        userId: data.ownerId,
        subCommunityId: subCommunity.id,
        role: SubCommunityRole.OWNER,
      },
    });

    return subCommunity;
  }

  async createSubCommunity(dto: CreateSubCommunityDto) {
    const typeId = dto.typeId || (await this.getOrCreateTypeId(dto.type));
    const subCommunity = await this.prisma.subCommunity.create({
      data: {
        name: dto.name,
        description: dto.description,
        typeId,
        isPrivate: dto.isPrivate,
        ownerId: dto.ownerId,
      },
      include: { owner: true },
    });

    await this.prisma.subCommunityMember.create({
      data: {
        userId: dto.ownerId,
        subCommunityId: subCommunity.id,
        role: SubCommunityRole.OWNER,
      },
    });

    return subCommunity;
  }

  async findAllSubCommunities(
    userId: string | undefined,
    options?: { compact?: boolean; page?: number; limit?: number },
  ) {
    const where: Prisma.SubCommunityWhereInput = {
      OR: [{ isPrivate: false }, { members: { some: { userId } } }],
    };

    const compact = options?.compact ?? true;
    const page = options?.page ?? 1;
    const limit = options?.limit ?? 50;
    const skip = (page - 1) * limit;

    if (compact) {
      // Return a compact summary to minimize bandwidth: only essential fields
      return this.prisma.subCommunity.findMany({
        where,
        skip,
        take: limit,
        select: {
          id: true,
          name: true,
          description: true,
          iconUrl: true,
          isPrivate: true,
          owner: { select: { id: true, name: true } },
          _count: { select: { members: true, posts: true } },
          type: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: 'desc' },
      });
    }

    // full include when not compact
    if (userId) {
      return this.prisma.subCommunity.findMany({
        where,
        include: {
          owner: { select: { id: true, name: true, role: true } },
          type: { select: { id: true, name: true } },
          _count: {
            select: { members: true, posts: { where: { status: 'APPROVED' } } },
          },
          members: {
            where: { userId },
            select: { userId: true, role: true },
          },
          posts: true,
        },
      });
    }

    // If no userId provided, return public sub-communities with summary fields
    return this.prisma.subCommunity.findMany({
      where,
      skip,
      take: limit,
      include: {
        owner: { select: { id: true, name: true } },
        type: { select: { id: true, name: true } },
        _count: { select: { members: true, posts: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOneSubCommunity(id: string, userId?: string) {
    const subCommunity = await this.prisma.subCommunity.findUnique({
      where: { id },
      include: {
        owner: { select: { id: true, name: true, role: true, profile: { select: { avatarUrl: true } } } },
        members: {
          select: {
            id: true,
            createdAt: true,
            userId: true,
            role: true,
            user: {
              select: {
                id: true,
                name: true,
                role: true,
                profile: { select: { avatarUrl: true } },
              },
            },
          },
        },
        type: { select: { id: true, name: true } },
        _count: {
          select: { members: true, posts: { where: { status: 'APPROVED' } } },
        },
      },
    });

    if (!subCommunity) {
      throw new NotFoundException('Sub-community not found.');
    }

    if (subCommunity.isPrivate) {
      const isMember = await this.prisma.subCommunityMember.findFirst({
        where: { subCommunityId: id, userId },
      });

      if (!isMember) {
        throw new ForbiddenException(
          'You do not have permission to view this sub-community.',
        );
      }
    }

    return subCommunity;
  }

  // Service implementation
  async findSubCommunityByType(
    type: string,
    q: string | undefined,
    page: number = 1,
    limit: number = 20,
    userId?: string,
  ) {
    const skip = (page - 1) * limit;

    let user = null;
    if (userId) {
      user = await this.prisma.user.findUnique({ where: { id: userId } });
      if (!user) {
        throw new NotFoundException('User not found.');
      }
    }

    // For "ALL" type, return all subcommunities
    const whereBase =
      type.toUpperCase() === 'ALL'
        ? {}
        : ({ type: { is: { name: type.toUpperCase() } } } as any);

    const where = q
      ? {
          AND: [
            whereBase,
            {
              OR: [
                { name: { contains: q, mode: 'insensitive' } },
                { description: { contains: q, mode: 'insensitive' } },
              ],
            },
          ],
        }
      : whereBase;

    // Find sub-communities and total count, and mark if user is a member
    const [subCommunities, totalCount] = await Promise.all([
      this.prisma.subCommunity.findMany({
        where,
        skip,
        take: limit,
        include: {
          owner: { select: { id: true, name: true, role: true } },
          type: { select: { id: true, name: true } },
          _count: {
            select: { members: true, posts: { where: { status: 'APPROVED' } } },
          },
          members: userId
            ? {
                where: { userId },
                select: { userId: true, role: true },
              }
            : undefined,
        },
        orderBy: { updatedAt: 'desc' },
      }),
      this.prisma.subCommunity.count({ where }),
    ]);

    const totalPages = Math.ceil(totalCount / limit);
    const hasNext = page < totalPages;
    const hasPrev = page > 1;

    return {
      data: subCommunities,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages,
        hasNext,
        hasPrev,
      },
    };
  }

  async findMyOwnedSubCommunities(
    userId: string | undefined,
      ownedPage: number,
      ownedLimit: number,
  ) {
    if (!userId) {
      throw new NotFoundException('User not found');
    }

    const [ownedData, ownedTotal] = await Promise.all([
      this.prisma.subCommunity.findMany({
        where: { ownerId: userId },
        skip: (ownedPage - 1) * ownedLimit,
        take: ownedLimit,
        include: {
          owner: { select: { id: true, name: true, role: true } },
          type: { select: { id: true, name: true } },
          _count: {
            select: { members: true, posts: { where: { status: 'APPROVED' } } },
          },
          members: {
            where: { userId },
            select: { userId: true, role: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.subCommunity.count({ where: { ownerId: userId } }),
    ]);

    const makePagination = (page: number, limit: number, total: number) => {
      const totalPages = Math.ceil(total / limit) || 1;
      return {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      };
    };

    return {
      owned: { data: ownedData, pagination: makePagination(ownedPage, ownedLimit, ownedTotal) },
    };
  }

  async findMyModeratedSubCommunities(userId: string | undefined, moderatedPage: number, moderatedLimit: number) {
    if(!userId) {
      throw new NotFoundException('User not found');
    }

    const [moderatedData, moderatedTotal] = await Promise.all([
      this.prisma.subCommunity.findMany({
        where: { members: { some: { userId, role: 'MODERATOR' } } },
        skip: (moderatedPage - 1) * moderatedLimit,
        take: moderatedLimit,
        include: {
          owner: { select: { id: true, name: true, role: true } },
          type: { select: { id: true, name: true } },
          _count: {
            select: { members: true, posts: { where: { status: 'APPROVED' } } },
          },
          members: {
            where: { userId },
            select: { userId: true, role: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.subCommunity.count({
        where: { members: { some: { userId, role: 'MODERATOR' } } },
      }),
    ]);

    const makePagination = (page: number, limit: number, total: number) => {
      const totalPages = Math.ceil(total / limit) || 1;
      return {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      };
    };

    return {
moderated: { data: moderatedData, pagination: makePagination(moderatedPage, moderatedLimit, moderatedTotal) },
    };
  };

  async findMyMemberSubCommunities( userId: string | undefined, memberPage: number, memberLimit: number) {

    const [memberData, memberTotal] = await Promise.all([
      this.prisma.subCommunity.findMany({
      where: {
        members: { some: { userId } },
        NOT: { ownerId: userId }, // exclude sub-communities owned by the user
      },
      skip: (memberPage - 1) * memberLimit,
      take: memberLimit,
      include: {
        owner: { select: { id: true, name: true, role: true } },
        type: { select: { id: true, name: true } },
        _count: {
        select: { members: true, posts: { where: { status: 'APPROVED' } } },
        },
        members: {
        where: { userId },
        select: { userId: true, role: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      }),
      this.prisma.subCommunity.count({
      where: {
        members: { some: { userId } },
        NOT: { ownerId: userId }, // ensure count matches filtered results
      },
      }),
    ]);

    const makePagination = (page: number, limit: number, total: number) => {
      const totalPages = Math.ceil(total / limit) || 1;
      return {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      };
    };

    return {
      member: { data: memberData, pagination: makePagination(memberPage, memberLimit, memberTotal) },
    };
  };

  async updateSubCommunity(
    id: string,
    userId: string,
    dto: UpdateSubCommunityDto,
  ) {
    const subCommunity = await this.prisma.subCommunity.findUnique({
      where: { id },
    });
    if (!subCommunity) {
      throw new NotFoundException('Sub-community not found.');
    }

    // Only owner or admin can update
    const isOwner = subCommunity.ownerId === userId;
    const isAdmin =
      (
        await this.prisma.user.findUnique({
          where: { id: userId },
          select: { role: true },
        })
      )?.role === Role.ADMIN;

    if (!isOwner && !isAdmin) {
      throw new ForbiddenException(
        'You do not have permission to update this sub-community.',
      );
    }

    const dataToUpdate: any = {};
    if (dto.name) dataToUpdate.name = dto.name;
    if (dto.description) dataToUpdate.description = dto.description;
    if (dto.isPrivate !== undefined) dataToUpdate.isPrivate = dto.isPrivate;
    if (dto.ownerId) dataToUpdate.ownerId = dto.ownerId;
    if (dto.iconUrl) dataToUpdate.iconUrl = dto.iconUrl;
    if (dto.bannerUrl) dataToUpdate.bannerUrl = dto.bannerUrl;

    return this.prisma.subCommunity.update({
      where: { id },
      data: dataToUpdate,
    });
  }

  async removeSubCommunity(id: string, userId: string) {
    const subCommunity = await this.prisma.subCommunity.findUnique({
      where: { id },
    });
    if (!subCommunity) {
      throw new NotFoundException('Sub-community not found.');
    }

    // Only owner or admin can delete
    const isOwner = subCommunity.ownerId === userId;
    const isAdmin =
      (
        await this.prisma.user.findUnique({
          where: { id: userId },
          select: { role: true },
        })
      )?.role === Role.ADMIN;

    if (!isOwner && !isAdmin) {
      throw new ForbiddenException(
        'You do not have permission to delete this sub-community.',
      );
    }

    // Delete related members, join requests, posts first (Prisma cascade delete might handle some)
    await this.prisma.subCommunityMember.deleteMany({
      where: { subCommunityId: id },
    });
    await this.prisma.joinRequest.deleteMany({ where: { subCommunityId: id } });
    await this.prisma.post.updateMany({
      where: { subCommunityId: id },
      data: { subCommunityId: null },
    });

    return this.prisma.subCommunity.delete({ where: { id } });
  }

  async banSubCommunity(id: string) {
    const subCommunity = await this.prisma.subCommunity.findUnique({
      where: { id },
    });

    if (!subCommunity) {
      throw new NotFoundException(`Sub-community with ID ${id} not found.`);
    }

    return this.prisma.subCommunity.update({
      where: { id },
      data: { status: SubCommunityStatus.BANNED },
    });
  }

  async getReports(subCommunityId: string, requesterId: string) {
    const member = await this.prisma.subCommunityMember.findFirst({
      where: {
        userId: requesterId,
        subCommunityId: subCommunityId,
        role: { in: [SubCommunityRole.OWNER, SubCommunityRole.MODERATOR] },
      },
    });

    if (!member) {
      throw new ForbiddenException(
        'You do not have permission to view reports for this sub-community.',
      );
    }

    return this.prisma.contentReport.findMany({
      where: {
        subCommunityId: subCommunityId,
        status: ReportStatus.PENDING,
      },
      include: {
        reporter: { select: { id: true, name: true } },
        post: { select: { id: true, content: true } },
        comment: { select: { id: true, content: true } },
      },
    });
  }

  async handleReport(
    subCommunityId: string,
    reportId: string,
    status: ReportStatus,
    handlerId: string,
  ) {
    const member = await this.prisma.subCommunityMember.findFirst({
      where: {
        userId: handlerId,
        subCommunityId: subCommunityId,
        role: { in: [SubCommunityRole.OWNER, SubCommunityRole.MODERATOR] },
      },
    });

    if (!member) {
      throw new ForbiddenException(
        'You do not have permission to handle reports for this sub-community.',
      );
    }

    const report = await this.prisma.contentReport.findUnique({
      where: { id: reportId },
    });

    if (!report || report.subCommunityId !== subCommunityId) {
      throw new NotFoundException('Report not found in this sub-community.');
    }

    if (report.status !== ReportStatus.PENDING) {
      throw new BadRequestException('This report has already been handled.');
    }

    if (status === ReportStatus.ADDRESSED) {
      return this.prisma.$transaction(async (prisma) => {
        if (report.type === ReportedContentType.POST && report.postId) {
          await prisma.post.delete({ where: { id: report.postId } });
        } else if (
          report.type === ReportedContentType.COMMENT &&
          report.commentId
        ) {
          await prisma.comment.delete({ where: { id: report.commentId } });
        }

        return prisma.contentReport.update({
          where: { id: reportId },
          data: { status: ReportStatus.ADDRESSED, handlerId },
        });
      });
    } else if (status === ReportStatus.DISMISSED) {
      return this.prisma.contentReport.update({
        where: { id: reportId },
        data: { status: ReportStatus.DISMISSED, handlerId },
      });
    } else {
      throw new BadRequestException('Invalid status provided.');
    }
  }

  // --- SubCommunity Membership and Join Request Flow ---

  async requestToJoinSubCommunity(subCommunityId: string, userId: string) {
    const subCommunity = await this.prisma.subCommunity.findUnique({
      where: { id: subCommunityId },
    });
    if (!subCommunity) {
      throw new NotFoundException('Sub-community not found.');
    }

    const existingMember = await this.prisma.subCommunityMember.findFirst({
      where: {
        userId: userId,
        subCommunityId: subCommunityId,
      },
    });
    if (existingMember) {
      throw new BadRequestException(
        'You are already a member of this sub-community.',
      );
    }

    if (!subCommunity.isPrivate) {
      // If public, add member directly
      await this.prisma.subCommunityMember.create({
        data: {
          userId: userId,
          subCommunityId: subCommunityId,
          role: 'MEMBER',
        },
      });
      return { message: 'Successfully joined sub-community.' };
    } else {
      // If private, create a join request
      const existingJoinRequest = await this.prisma.joinRequest.findFirst({
        where: {
          userId: userId,
          subCommunityId: subCommunityId,
          status: 'PENDING',
        },
      });
      if (existingJoinRequest) {
        throw new BadRequestException(
          'You already have a pending join request for this sub-community.',
        );
      }

      return this.prisma.joinRequest.create({
        data: {
          userId: userId,
          subCommunityId: subCommunityId,
          status: 'PENDING',
        },
      });
    }
  }

  async getPendingJoinRequests(subCommunityId: string, userId: string) {
    const subCommunity = await this.prisma.subCommunity.findUnique({
      where: { id: subCommunityId },
    });
    if (!subCommunity) {
      throw new NotFoundException('Sub-community not found.');
    }

    // Only the owner/lead of the sub-community can view pending join requests
    const member = await this.prisma.subCommunityMember.findFirst({
      where: {
        userId: userId,
        subCommunityId: subCommunityId,
        role: { in: ['OWNER', 'MODERATOR'] },
      },
    });

    if (!member) {
      throw new ForbiddenException(
        'You do not have permission to view join requests for this sub-community.',
      );
    }

    return this.prisma.joinRequest.findMany({
      where: {
        subCommunityId: subCommunityId,
        status: 'PENDING',
      },
      include: { user: { select: { id: true, name: true, email: true } } },
    });
  }

  async approveJoinRequest(
    joinRequestId: string,
    subCommunityId: string,
    userId: string,
    dto: ApproveJoinRequestDto,
  ) {
    const joinRequest = await this.prisma.joinRequest.findUnique({
      where: { id: joinRequestId },
      include: { subCommunity: true },
    });

    if (!joinRequest) {
      throw new NotFoundException('Join request not found.');
    }
    if (joinRequest.subCommunityId !== subCommunityId) {
      throw new BadRequestException(
        'Join request does not belong to this sub-community.',
      );
    }
    if (joinRequest.status !== 'PENDING') {
      throw new BadRequestException(
        'This join request has already been processed.',
      );
    }

    // Only the owner/lead or admin of the sub-community can approve/reject join requests
    const subCommunity = joinRequest.subCommunity;
    const member = await this.prisma.subCommunityMember.findFirst({
      where: {
        userId: userId,
        subCommunityId: subCommunity.id,
        role: { in: ['OWNER', 'MODERATOR'] },
      },
    });

    if (!member) {
      throw new ForbiddenException(
        'You do not have permission to approve/reject join requests for this sub-community.',
      );
    }

    if (dto.approved) {
      // Check if user is already a member to prevent duplicates if race condition occurs
      const existingMember = await this.prisma.subCommunityMember.findFirst({
        where: {
          userId: joinRequest.userId,
          subCommunityId: joinRequest.subCommunityId,
        },
      });

      if (existingMember) {
        throw new BadRequestException(
          'User is already a member of this sub-community.',
        );
      }

      // Add user to sub-community members
      await this.prisma.subCommunityMember.create({
        data: {
          userId: joinRequest.userId,
          subCommunityId: joinRequest.subCommunityId,
          role: 'MEMBER',
        },
      });

      // Update join request status
      return this.prisma.joinRequest.update({
        where: { id: joinRequestId },
        data: { status: 'ACCEPTED' },
      });
    } else {
      // Reject join request
      return this.prisma.joinRequest.update({
        where: { id: joinRequestId },
        data: { status: 'REJECTED' },
      });
    }
  }

  async updateMemberRole(
    subCommunityId: string,
    memberId: string,
    role: SubCommunityRole,
    requesterId: string,
  ) {
    const subCommunity = await this.prisma.subCommunity.findUnique({
      where: { id: subCommunityId },
    });

    if (!subCommunity) {
      throw new NotFoundException('Sub-community not found.');
    }

    if (subCommunity.ownerId !== requesterId) {
      throw new ForbiddenException(
        'Only the sub-community owner can change member roles.',
      );
    }

    if (role === SubCommunityRole.OWNER) {
      throw new BadRequestException('Cannot assign OWNER role.');
    }

    const memberToUpdate = await this.prisma.subCommunityMember.findFirst({
      where: { id: memberId, subCommunityId: subCommunityId },
    });

    if (!memberToUpdate) {
      throw new NotFoundException('Member not found in this sub-community.');
    }

    if (memberToUpdate.userId === requesterId) {
      throw new BadRequestException('Owner cannot change their own role.');
    }

    return this.prisma.subCommunityMember.update({
      where: { id: memberToUpdate.id },
      data: { role },
    });
  }

  async leaveSubCommunity(subCommunityId: string, userId: string) {
    const member = await this.prisma.subCommunityMember.findFirst({
      where: { userId: userId, subCommunityId: subCommunityId },
    });

    if (!member) {
      throw new NotFoundException(
        'You are not a member of this sub-community.',
      );
    }

    if (member.role === 'OWNER') {
      throw new BadRequestException(
        'Owners cannot leave their own sub-community directly. Transfer ownership first.',
      );
    }

    return this.prisma.subCommunityMember.delete({ where: { id: member.id } });
  }

  async removeSubCommunityMember(
    subCommunityId: string,
    memberIdToRemove: string,
    userId: string,
  ) {
    const subCommunity = await this.prisma.subCommunity.findUnique({
      where: { id: subCommunityId },
    });
    if (!subCommunity) {
      throw new NotFoundException('Sub-community not found.');
    }

    const requestingUserMember = await this.prisma.subCommunityMember.findFirst(
      {
        where: { userId: userId, subCommunityId: subCommunityId },
      },
    );

    if (
      !requestingUserMember ||
      (requestingUserMember.role !== 'OWNER' &&
        requestingUserMember.role !== 'MODERATOR')
    ) {
      throw new ForbiddenException(
        'You do not have permission to remove members from this sub-community.',
      );
    }

    const memberToRemove = await this.prisma.subCommunityMember.findFirst({
      where: { userId: memberIdToRemove, subCommunityId: subCommunityId },
    });

    if (!memberToRemove) {
      throw new NotFoundException('Member not found in this sub-community.');
    }

    if (memberToRemove.role === SubCommunityRole.OWNER) {
      throw new BadRequestException(
        'Cannot remove the owner of the sub-community.',
      );
    }

    // Moderators cannot remove other moderators or owners
    if (
      requestingUserMember.role === SubCommunityRole.MODERATOR &&
      memberToRemove.role === SubCommunityRole.MODERATOR
    ) {
      throw new ForbiddenException(
        'Moderators cannot remove other moderators.',
      );
    }

    return this.prisma.subCommunityMember.delete({
      where: { id: memberToRemove.id },
    });
  }
}
