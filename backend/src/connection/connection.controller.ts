import {
  Controller,
  Post,
  Body,
  UseGuards,
  Req,
  Patch,
  Get,
  Query,
  Param,
  Delete,
} from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { ConnectionService } from './connection.service';
import {
  CreateConnectionDto,
  UpdateConnectionStatusDto,
  ConnectionQueryDto,
} from './dto/connection.dto';
import { ImprovedMessagingGateway } from '../messaging/messaging.gateway.improved';

/**
 * Controller for managing user connections (friend requests, accepted connections).
 * All endpoints are protected by JWT authentication.
 */
@Controller('connection')
@UseGuards(JwtAuthGuard)
export class ConnectionController {
  constructor(
    private readonly connectionService: ConnectionService,
    private readonly messagingGateway: ImprovedMessagingGateway,
  ) {}

  /**
   * Sends a connection request to another user.
   * Emits a WebSocket event to the recipient upon successful request.
   * @param dto - Data transfer object containing the recipient's ID.
   * @param req - The request object, containing the sender's user ID.
   * @returns A promise that resolves to the result of the connection request.
   */
  @Post('send')
  async sendRequest(@Body() dto: CreateConnectionDto, @Req() req) {
    const result = await this.connectionService.sendRequest(
      req.user.userId,
      dto.recipientId,
    );

    // Emit WebSocket event for connection request
    if (result.connection) {
      this.messagingGateway.sendToUser(dto.recipientId, 'CONNECTION_REQUEST', {
        id: result.connection.id,
        requester: {
          id: req.user.userId,
          name: req.user.name,
          email: req.user.email,
        },
        recipientId: dto.recipientId,
        status: 'PENDING',
        createdAt: new Date().toISOString(),
      });
    }

    return result;
  }

  /**
   * Updates the status of a connection request (accept or reject).
   * Emits a WebSocket event to the requester upon status update.
   * @param dto - Data transfer object containing the connection ID and new status.
   * @param req - The request object, containing the recipient's user ID.
   * @returns A promise that resolves to the updated connection.
   */
  @Patch('status')
  async updateStatus(@Body() dto: UpdateConnectionStatusDto, @Req() req) {
    const result = await this.connectionService.updateStatus(
      req.user.userId,
      dto,
    );

    // Emit WebSocket event for connection status update
    if (
      result.connection &&
      (dto.status === 'ACCEPTED' || dto.status === 'REJECTED')
    ) {
      this.messagingGateway.sendToUser(
        result.connection.requesterId,
        'CONNECTION_STATUS_UPDATE',
        {
          id: result.connection.id,
          status: dto.status,
          recipient: {
            id: req.user.userId,
            name: req.user.name,
            email: req.user.email,
          },
          requesterId: result.connection.requesterId,
          updatedAt: new Date().toISOString(),
        },
      );
    }

    return result;
  }

  /**
   * Retrieves a list of accepted connections for the authenticated user.
   * Supports pagination, filtering by role, and searching by name/email.
   * @param query - Query parameters for filtering and pagination.
   * @param req - The request object, containing the user's ID.
   * @returns A promise that resolves to an object containing connections and pagination details.
   */
  @Get()
  getConnections(@Query() query: ConnectionQueryDto, @Req() req) {
    return this.connectionService.getConnections(
      req.user.userId,
      query.page,
      query.limit,
      query.role,
      query.search,
    );
  }

  /**
   * Retrieves a list of pending connection requests received by the authenticated user.
   * Supports pagination.
   * @param query - Query parameters for pagination.
   * @param req - The request object, containing the user's ID.
   * @returns A promise that resolves to an object containing pending requests and pagination details.
   */
  @Get('pending/received')
  getPendingReceived(@Query() query: ConnectionQueryDto, @Req() req) {
    return this.connectionService.getPendingRequests(
      req.user.userId,
      query.page,
      query.limit,
    );
  }

  /**
   * Retrieves a list of pending connection requests sent by the authenticated user.
   * Supports pagination.
   * @param query - Query parameters for pagination.
   * @param req - The request object, containing the user's ID.
   * @returns A promise that resolves to an object containing sent requests and pagination details.
   */
  @Get('pending/sent')
  getPendingSent(@Query() query: ConnectionQueryDto, @Req() req) {
    return this.connectionService.getSentRequests(
      req.user.userId,
      query.page,
      query.limit,
    );
  }

  /**
   * Retrieves the connection status between the authenticated user and another specified user.
   * @param otherUserId - The ID of the other user.
   * @param req - The request object, containing the current user's ID.
   * @returns A promise that resolves to the connection status.
   */
  @Get('status/:userId')
  getConnectionStatus(@Param('userId') otherUserId: string, @Req() req) {
    return this.connectionService.getConnectionStatus(
      req.user.userId,
      otherUserId,
    );
  }

  /**
   * Retrieves connection statistics for the authenticated user.
   * @param req - The request object, containing the user's ID.
   * @returns A promise that resolves to an object containing connection statistics.
   */
  @Get('stats')
  getConnectionStats(@Req() req) {
    return this.connectionService.getConnectionStats(req.user.userId);
  }

  /**
   * Retrieves suggestions for new connections for the authenticated user.
   * @param limit - The maximum number of suggestions to return.
   * @param req - The request object, containing the user's ID.
   * @returns A promise that resolves to an array of suggested user profiles.
   */
  @Get('suggestions')
  getConnectionSuggestions(@Query('limit') limit: string, @Req() req) {
    const limitNum = limit ? parseInt(limit, 10) : 10;
    return this.connectionService.suggestConnections(req.user.userId, limitNum);
  }

  /**
   * Cancels a pending connection request sent by the authenticated user.
   * @param connectionId - The ID of the connection request to cancel.
   * @param req - The request object, containing the user's ID.
   * @returns A promise that resolves to the result of the cancellation.
   */
  @Delete('cancel/:connectionId')
  cancelRequest(@Param('connectionId') connectionId: string, @Req() req) {
    return this.connectionService.cancelRequest(req.user.userId, connectionId);
  }

  /**
   * Removes an existing connection between the authenticated user and another user.
   * @param connectionId - The ID of the connection to remove.
   * @param req - The request object, containing the user's ID.
   * @returns A promise that resolves to the result of the removal.
   */
  @Delete('remove/:connectionId')
  removeConnection(@Param('connectionId') connectionId: string, @Req() req) {
    return this.connectionService.removeConnection(
      req.user.userId,
      connectionId,
    );
  }
}
