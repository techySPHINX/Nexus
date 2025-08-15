import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSubCommunityRequestDto } from './dto/create-sub-community-request.dto';
import { RequestStatus } from '@prisma/client';
import { SubCommunityService } from '../sub-community/sub-community.service';

@Injectable()
export class SubCommunityRequestService {
  constructor(
    private prisma: PrismaService,
    private subCommunityService: SubCommunityService,
  ) {}

  async createRequest(dto: CreateSubCommunityRequestDto, requesterId: string) {
    // Check if a sub-community with the same name already exists (even if pending request)
    const existingSubCommunity = await this.prisma.subCommunity.findUnique({
      where: { name: dto.name },
    });

    if (existingSubCommunity) {
      throw new BadRequestException(
        `Sub-community with name '${dto.name}' already exists.`,
      );
    }

    // Check if there's an existing pending request for the same sub-community name
    const existingPendingRequest =
      await this.prisma.subCommunityCreationRequest.findFirst({
        where: {
          name: dto.name,
          status: RequestStatus.PENDING,
        },
      });

    if (existingPendingRequest) {
      throw new BadRequestException(
        `A pending request for sub-community '${dto.name}' already exists.`,
      );
    }

    return this.prisma.subCommunityCreationRequest.create({
      data: {
        ...dto,
        requester: {
          connect: { id: requesterId },
        },
        status: RequestStatus.PENDING,
      },
    });
  }

  async findAllRequests(status?: RequestStatus) {
    return this.prisma.subCommunityCreationRequest.findMany({
      where: status ? { status } : {},
      include: {
        requester: { select: { id: true, name: true, email: true } },
        admin: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async approveRequest(requestId: string, adminId: string) {
    const request = await this.prisma.subCommunityCreationRequest.findUnique({
      where: { id: requestId },
    });

    if (!request) {
      throw new NotFoundException(
        `Sub-community creation request with ID ${requestId} not found.`,
      );
    }

    if (request.status !== RequestStatus.PENDING) {
      throw new BadRequestException(
        `Request is not in PENDING status and cannot be approved.`,
      );
    }

    // Create the sub-community using the subCommunityService
    const newSubCommunity =
      await this.subCommunityService.createSubCommunityInternal({
        name: request.name,
        description: request.description,
        isPrivate: false, // Default to public for now, can be part of request DTO later
        ownerId: request.requesterId,
        subCommunityCreationRequestId: request.id,
      });

    // Update the request status and link to the created sub-community
    return this.prisma.subCommunityCreationRequest.update({
      where: { id: requestId },
      data: {
        status: RequestStatus.APPROVED,
        admin: { connect: { id: adminId } },
        subCommunity: { connect: { id: newSubCommunity.id } },
      },
    });
  }

  async rejectRequest(requestId: string, adminId: string) {
    const request = await this.prisma.subCommunityCreationRequest.findUnique({
      where: { id: requestId },
    });

    if (!request) {
      throw new NotFoundException(
        `Sub-community creation request with ID ${requestId} not found.`,
      );
    }

    if (request.status !== RequestStatus.PENDING) {
      throw new BadRequestException(
        `Request is not in PENDING status and cannot be rejected.`,
      );
    }

    return this.prisma.subCommunityCreationRequest.update({
      where: { id: requestId },
      data: {
        status: RequestStatus.REJECTED,
        admin: { connect: { id: adminId } },
      },
    });
  }
}
