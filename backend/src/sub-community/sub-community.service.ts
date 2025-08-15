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
import { Role } from '@prisma/client'; // Assuming Role enum is available from Prisma client

@Injectable()
export class SubCommunityService {
  constructor(private prisma: PrismaService) {}

  async createSubCommunityInternal(data: {
    name: string;
    description: string;
    isPrivate: boolean;
    ownerId: string;
    subCommunityCreationRequestId?: string;
  }) {
    const subCommunity = await this.prisma.subCommunity.create({
      data: {
        name: data.name,
        description: data.description,
        isPrivate: data.isPrivate,
        ownerId: data.ownerId,
        subCommunityCreationRequestId: data.subCommunityCreationRequestId,
      },
    });

    // Add the owner as a member with OWNER role
    await this.prisma.subCommunityMember.create({
      data: {
        userId: data.ownerId,
        subCommunityId: subCommunity.id,
        role: 'OWNER',
      },
    });

    return subCommunity;
  }

  // --- SubCommunity CRUD Operations ---

  async createSubCommunity(dto: CreateSubCommunityDto) {
    // This method is now primarily for direct admin creation or testing, not for alumni requests.
    // It does not handle the creation request flow.
    const subCommunity = await this.prisma.subCommunity.create({ data: dto });

    // Add the creator as an OWNER member
    await this.prisma.subCommunityMember.create({
      data: {
        userId: dto.ownerId,
        subCommunityId: subCommunity.id,
        role: 'OWNER',
      },
    });

    return subCommunity;
  }

  async findAllSubCommunities() {
    return this.prisma.subCommunity.findMany({
      include: {
        owner: { select: { id: true, name: true } },
        _count: { select: { members: true, posts: true } },
      },
    });
  }

  async findOneSubCommunity(id: string) {
    const subCommunity = await this.prisma.subCommunity.findUnique({
      where: { id },
      include: {
        owner: { select: { id: true, name: true } },
        members: { include: { user: { select: { id: true, name: true } } } },
        posts: { orderBy: { createdAt: 'desc' } },
      },
    });
    if (!subCommunity) {
      throw new NotFoundException('Sub-community not found.');
    }
    return subCommunity;
  }

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
      (await this.prisma.user.findUnique({ where: { id: userId } }))?.role ===
      Role.ADMIN;

    if (!isOwner && !isAdmin) {
      throw new ForbiddenException(
        'You do not have permission to update this sub-community.',
      );
    }

    return this.prisma.subCommunity.update({
      where: { id },
      data: dto,
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
      (await this.prisma.user.findUnique({ where: { id: userId } }))?.role ===
      Role.ADMIN;

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

    // Always create a PENDING join request, regardless of subCommunity.isPrivate
    return this.prisma.joinRequest.create({
      data: {
        userId: userId,
        subCommunityId: subCommunityId,
        status: 'PENDING',
      },
    });
  }

  async getPendingJoinRequests(subCommunityId: string, userId: string) {
    const subCommunity = await this.prisma.subCommunity.findUnique({
      where: { id: subCommunityId },
    });
    if (!subCommunity) {
      throw new NotFoundException('Sub-community not found.');
    }

    // Only the owner/lead of the sub-community can view pending join requests
    const isOwner = subCommunity.ownerId === userId;
    const member = await this.prisma.subCommunityMember.findFirst({
      where: { userId: userId, subCommunityId: subCommunityId, role: 'ADMIN' },
    });
    const isAdmin = member && member.role === 'ADMIN';

    if (!isOwner && !isAdmin) {
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
    const isOwner = subCommunity.ownerId === userId;
    const member = await this.prisma.subCommunityMember.findFirst({
      where: {
        userId: userId,
        subCommunityId: subCommunity.id,
        role: { in: ['OWNER', 'ADMIN'] },
      },
    });
    const isAdminOfSubCommunity =
      member && (member.role === 'OWNER' || member.role === 'ADMIN');

    if (!isOwner && !isAdminOfSubCommunity) {
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
        requestingUserMember.role !== 'ADMIN')
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

    if (memberToRemove.role === 'OWNER') {
      throw new BadRequestException(
        'Cannot remove the owner of the sub-community.',
      );
    }

    // Admins cannot remove other admins or owners
    if (
      requestingUserMember.role === 'ADMIN' &&
      memberToRemove.role === 'ADMIN'
    ) {
      throw new ForbiddenException('Admins cannot remove other admins.');
    }

    return this.prisma.subCommunityMember.delete({
      where: { id: memberToRemove.id },
    });
  }
}
