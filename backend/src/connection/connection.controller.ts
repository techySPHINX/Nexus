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

@Controller('connection')
@UseGuards(JwtAuthGuard)
export class ConnectionController {
  constructor(private readonly connectionService: ConnectionService) {}

  @Post('send')
  sendRequest(@Body() dto: CreateConnectionDto, @Req() req) {
    return this.connectionService.sendRequest(req.user.userId, dto.recipientId);
  }

  @Patch('status')
  updateStatus(@Body() dto: UpdateConnectionStatusDto, @Req() req) {
    return this.connectionService.updateStatus(req.user.userId, dto);
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
