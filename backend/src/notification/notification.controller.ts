import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Patch,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { NotificationService } from './notification.service';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { NotificationQueryDto } from './dto/notification-query.dto';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Post()
  create(@Body() dto: CreateNotificationDto) {
    return this.notificationService.create(dto);
  }

  @Get()
  findAll(
    @Query() query: NotificationQueryDto,
    @Req() req,
  ): Promise<{
    notifications: any;
    unreadCount: any;
    pagination: {
      page: number;
      limit: number;
      total: any;
      totalPages: number;
      hasNext: boolean;
      hasPrev: boolean;
    };
  }> {
    return this.notificationService.findAllForUser(
      req.user.userId,
      query.page,
      query.limit,
      query.unreadOnly,
      query.type,
    );
  }

  @Get('count/unread')
  getUnreadCount(@Req() req): Promise<{ unreadCount: any }> {
    return this.notificationService.getUnreadCount(req.user.userId);
  }

  @Get('stats')
  getStats(@Req() req): Promise<{
    total: any;
    unread: any;
    read: any;
    recent24h: any;
    byType: any;
  }> {
    return this.notificationService.getNotificationStats(req.user.userId);
  }

  @Patch(':id/read')
  markAsRead(
    @Param('id') id: string,
    @Req() req,
  ): Promise<{ message: string }> {
    return this.notificationService.markAsRead(id, req.user.userId);
  }

  @Patch(':id/unread')
  markAsUnread(
    @Param('id') id: string,
    @Req() req,
  ): Promise<{ message: string }> {
    return this.notificationService.markAsUnread(id, req.user.userId);
  }

  @Patch('read/all')
  markAllAsRead(@Req() req): Promise<{ message: string; count: any }> {
    return this.notificationService.markAllAsRead(req.user.userId);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Req() req): Promise<{ message: string }> {
    return this.notificationService.remove(id, req.user.userId);
  }

  @Delete('read/all')
  removeAllRead(@Req() req): Promise<{ message: string; count: any }> {
    return this.notificationService.removeAllRead(req.user.userId);
  }

  @Delete('all')
  removeAll(@Req() req): Promise<{ message: string; count: any }> {
    return this.notificationService.removeAll(req.user.userId);
  }
}
