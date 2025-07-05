import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { UpdateNotificationDto } from './dto/update-notification.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { User } from '../users/schemas/user.schema';
import { NotificationCategory } from './schemas/notification.schema';
import { NotificationsSeed } from './notifications.seed';

@ApiTags('notifications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(
    private readonly notificationsService: NotificationsService,
    private readonly notificationsSeed: NotificationsSeed,
  ) {}

  @Post('seed')
  @ApiOperation({ summary: 'Seed sample notifications (Development only)' })
  @ApiResponse({ status: 201, description: 'Sample notifications created' })
  async seedNotifications() {
    await this.notificationsSeed.seedNotifications();
    return { message: 'Sample notifications created successfully' };
  }

  @Post()
  @ApiOperation({ summary: 'Create a new notification (Admin only)' })
  @ApiResponse({ status: 201, description: 'Notification created successfully' })
  create(@Body() createNotificationDto: CreateNotificationDto) {
    return this.notificationsService.create(createNotificationDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all notifications for current user' })
  @ApiResponse({ status: 200, description: 'Notifications retrieved successfully' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page' })
  @ApiQuery({ name: 'unreadOnly', required: false, type: Boolean, description: 'Show only unread notifications' })
  @ApiQuery({ name: 'category', required: false, enum: NotificationCategory, description: 'Filter by category' })
  async findAll(
    @GetUser() user: User,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
    @Query('unreadOnly') unreadOnly?: boolean,
    @Query('category') category?: NotificationCategory,
  ) {
    return this.notificationsService.findAllForUser(user._id, {
      page,
      limit,
      unreadOnly: unreadOnly === true,
      category,
    });
  }

  @Get('unread-count')
  @ApiOperation({ summary: 'Get unread notifications count' })
  @ApiResponse({ status: 200, description: 'Unread count retrieved successfully' })
  async getUnreadCount(@GetUser() user: User) {
    const count = await this.notificationsService.getUnreadCount(user._id);
    return { count };
  }

  @Patch(':id/read')
  @ApiOperation({ summary: 'Mark a notification as read' })
  @ApiResponse({ status: 200, description: 'Notification marked as read' })
  markAsRead(@Param('id') id: string, @GetUser() user: User) {
    return this.notificationsService.markAsRead(id, user._id);
  }

  @Patch('mark-all-read')
  @ApiOperation({ summary: 'Mark all notifications as read' })
  @ApiResponse({ status: 200, description: 'All notifications marked as read' })
  markAllAsRead(@GetUser() user: User) {
    return this.notificationsService.markAllAsRead(user._id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a notification' })
  @ApiResponse({ status: 200, description: 'Notification deleted successfully' })
  async delete(@Param('id') id: string, @GetUser() user: User) {
    await this.notificationsService.delete(id, user._id);
    return { message: 'Notification deleted successfully' };
  }

  @Delete()
  @ApiOperation({ summary: 'Delete all notifications for current user' })
  @ApiResponse({ status: 200, description: 'All notifications deleted successfully' })
  deleteAll(@GetUser() user: User) {
    return this.notificationsService.deleteAllForUser(user._id);
  }
} 