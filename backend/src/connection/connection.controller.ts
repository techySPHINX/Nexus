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
import { MessagingGateway } from '../messaging/messaging.gateway';

@Controller('connection')
@UseGuards(JwtAuthGuard)
export class ConnectionController {
  constructor(
    private readonly connectionService: ConnectionService,
    private readonly messagingGateway: MessagingGateway,
  ) {}

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

  @Get('pending/received')
  getPendingReceived(@Query() query: ConnectionQueryDto, @Req() req) {
    return this.connectionService.getPendingRequests(
      req.user.userId,
      query.page,
      query.limit,
    );
  }

  @Get('pending/sent')
  getPendingSent(@Query() query: ConnectionQueryDto, @Req() req) {
    return this.connectionService.getSentRequests(
      req.user.userId,
      query.page,
      query.limit,
    );
  }

  @Get('status/:userId')
  getConnectionStatus(@Param('userId') otherUserId: string, @Req() req) {
    return this.connectionService.getConnectionStatus(
      req.user.userId,
      otherUserId,
    );
  }

  @Get('stats')
  getConnectionStats(@Req() req) {
    return this.connectionService.getConnectionStats(req.user.userId);
  }

  @Get('suggestions')
  getConnectionSuggestions(@Query('limit') limit: string, @Req() req) {
    const limitNum = limit ? parseInt(limit, 10) : 10;
    return this.connectionService.suggestConnections(req.user.userId, limitNum);
  }

  @Delete('cancel/:connectionId')
  cancelRequest(@Param('connectionId') connectionId: string, @Req() req) {
    return this.connectionService.cancelRequest(req.user.userId, connectionId);
  }

  @Delete('remove/:connectionId')
  removeConnection(@Param('connectionId') connectionId: string, @Req() req) {
    return this.connectionService.removeConnection(
      req.user.userId,
      connectionId,
    );
  }
}
