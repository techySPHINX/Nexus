import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Query,
  BadRequestException,
} from '@nestjs/common';
import { DocumentVerificationService } from '../auth/services/document-verification.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { GetCurrentUser } from '../common/decorators/get-current-user.decorator';

/**
 * Admin controller for managing document verification
 */
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class AdminController {
  constructor(
    private readonly documentVerificationService: DocumentVerificationService,
  ) {}

  /**
   * Get all pending document verification requests
   */
  @Get('pending-documents')
  async getPendingDocuments() {
    return this.documentVerificationService.getPendingDocuments();
  }

  /**
   * Get document verification statistics
   */
  // NOTE: document-stats endpoint removed; frontend computes stats from pending-documents

  /**
   * Approve documents and activate user account
   */
  @Post('approve-documents')
  async approveDocuments(
    @Body()
    body: {
      documentIds: string[];
      adminComments?: string;
    },
    @GetCurrentUser('sub') adminId: string,
  ) {
    if (!body.documentIds || body.documentIds.length === 0) {
      throw new BadRequestException('Document IDs are required');
    }

    return this.documentVerificationService.approveDocuments(
      body.documentIds,
      adminId,
      body.adminComments,
    );
  }

  /**
   * Reject documents with reason
   */
  @Post('reject-documents')
  async rejectDocuments(
    @Body()
    body: {
      documentIds: string[];
      reason: string;
      adminComments?: string;
    },
    @GetCurrentUser('sub') adminId: string,
  ) {
    if (!body.documentIds || body.documentIds.length === 0) {
      throw new BadRequestException('Document IDs are required');
    }

    if (!body.reason) {
      throw new BadRequestException('Rejection reason is required');
    }

    return this.documentVerificationService.rejectDocuments(
      body.documentIds,
      adminId,
      body.reason,
      body.adminComments,
    );
  }

  /**
   * Get user document history
   */
  @Get('user-documents')
  async getUserDocuments(@Query('userId') userId: string) {
    if (!userId) {
      throw new BadRequestException('User ID is required');
    }

    return this.documentVerificationService.getUserDocumentStatus(userId);
  }
}
