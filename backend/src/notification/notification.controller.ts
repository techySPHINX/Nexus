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
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { NotificationService } from './notification.service';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { NotificationQueryDto } from './dto/notification-query.dto';
import { PushNotificationService } from '../common/services/push-notification.service';

/**
 * Controller for handling notification-related requests.
 * All endpoints are protected by JWT authentication.
 */
@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationController {
  constructor(
    private readonly notificationService: NotificationService,
    private readonly pushNotificationService: PushNotificationService,
  ) { }

  /**
   * Creates a new notification.
   * @param dto - The data for creating the notification.
   * @returns A promise that resolves to the created notification.
   */
  @Post()
  create(@Body() dto: CreateNotificationDto) {
    return this.notificationService.create(dto);
  }

  /**
   * Retrieves all notifications for the authenticated user with pagination and filtering options.
   * @param query - Query parameters for filtering and pagination.
   * @param req - The request object containing user information.
   * @returns A promise that resolves to an object containing notifications, unread count, and pagination details.
   */
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

  /**
   * Retrieves the count of unread notifications for the authenticated user.
   * @param req - The request object containing user information.
   * @returns A promise that resolves to an object containing the unread count.
   */
  @Get('count/unread')
  getUnreadCount(@Req() req): Promise<{ unreadCount: any }> {
    return this.notificationService.getUnreadCount(req.user.userId);
  }

  /**
   * Retrieves various statistics about notifications for the authenticated user.
   * @param req - The request object containing user information.
   * @returns A promise that resolves to an object containing notification statistics.
   */
  @Get('stats')
  getStats(@Req() req): Promise<{
    total: number;
    unread: number;
    read: number;
    recent24h: number;
    byCategory: {
      ALL: number;
      CONNECTION: number;
      POST: number;
      MESSAGE: number;
      SYSTEM: number;
      EVENT: number;
      REFERRAL: number;
    };
  }> {
    return this.notificationService.getNotificationStats(req.user.userId);
  }

  /**
   * Marks a specific notification as read.
   * @param id - The ID of the notification to mark as read.
   * @param req - The request object containing user information.
   * @returns A promise that resolves to a success message.
   */
  @Patch(':id/read')
  markAsRead(
    @Param('id') id: string,
    @Req() req,
  ): Promise<{ message: string }> {
    return this.notificationService.markAsRead(id, req.user.userId);
  }

  /**
   * Marks a specific notification as unread.
   * @param id - The ID of the notification to mark as unread.
   * @param req - The request object containing user information.
   * @returns A promise that resolves to a success message.
   */
  @Patch(':id/unread')
  markAsUnread(
    @Param('id') id: string,
    @Req() req,
  ): Promise<{ message: string }> {
    return this.notificationService.markAsUnread(id, req.user.userId);
  }

  /**
   * Marks all notifications for the authenticated user as read.
   * @param req - The request object containing user information.
   * @returns A promise that resolves to a success message and the count of updated notifications.
   */
  @Patch('read/all')
  markAllAsRead(@Req() req): Promise<{ message: string; count: any }> {
    return this.notificationService.markAllAsRead(req.user.userId);
  }

  /**
   * Deletes a specific notification.
   * @param id - The ID of the notification to delete.
   * @param req - The request object containing user information.
   * @returns A promise that resolves to a success message.
   */
  @Delete(':id')
  remove(@Param('id') id: string, @Req() req): Promise<{ message: string }> {
    return this.notificationService.remove(id, req.user.userId);
  }

  /**
   * Deletes all read notifications for the authenticated user.
   * @param req - The request object containing user information.
   * @returns A promise that resolves to a success message and the count of deleted notifications.
   */
  @Delete('read/all')
  removeAllRead(@Req() req): Promise<{ message: string; count: any }> {
    return this.notificationService.removeAllRead(req.user.userId);
  }

  /**
   * Deletes all notifications for the authenticated user.
   * @param req - The request object containing user information.
   * @returns A promise that resolves to a success message and the count of deleted notifications.
   */
  @Delete('all')
  removeAll(@Req() req): Promise<{ message: string; count: any }> {
    return this.notificationService.removeAll(req.user.userId);
  }

  /**
   * Register device token for push notifications
   * @param req - The request object containing user information
   * @param body - The request body containing FCM token
   * @returns Success message
   */
  @Post('device-token')
  @HttpCode(HttpStatus.OK)
  async registerDeviceToken(
    @Req() req,
    @Body() body: { token: string },
  ): Promise<{ message: string }> {
    await this.pushNotificationService.registerDeviceToken(
      req.user.userId,
      body.token,
    );
    return { message: 'Device token registered successfully' };
  }

  /**
   * Unregister device token for push notifications
   * @param req - The request object containing user information
   * @returns Success message
   */
  @Delete('device-token')
  @HttpCode(HttpStatus.OK)
  async unregisterDeviceToken(@Req() req): Promise<{ message: string }> {
    await this.pushNotificationService.unregisterDeviceToken(req.user.userId);
    return { message: 'Device token unregistered successfully' };
  }
}
