import {
  Controller,
  Post,
  Body,
  UseGuards,
  Req,
  Patch,
  Get,
} from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { ConnectionService } from './connection.service';
import {
  CreateConnectionDto,
  UpdateConnectionStatusDto,
} from './dto/connection.dto';

@Controller('connection')
@UseGuards(JwtAuthGuard)
export class ConnectionController {
  constructor(private readonly connectionService: ConnectionService) {}

  @Post('send')
  sendRequest(@Body() dto: CreateConnectionDto, @Req() req) {
    return this.connectionService.sendRequest(req.user.id, dto.recipientId);
  }

  @Patch('status')
  updateStatus(@Body() dto: UpdateConnectionStatusDto, @Req() req) {
    return this.connectionService.updateStatus(req.user.id, dto);
  }

  @Get()
  getConnections(@Req() req) {
    return this.connectionService.getConnections(req.user.id);
  }

  @Get('pending')
  getPending(@Req() req) {
    return this.connectionService.getPendingRequests(req.user.id);
  }
}
