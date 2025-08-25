import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { RoiNotificationsService } from './roi-notifications.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('roi-notifications')
@Controller('roi-notifications')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class RoiNotificationsController {
  constructor(private readonly roiNotificationsService: RoiNotificationsService) {}

  @Get('history')
  @ApiOperation({ summary: 'Get user ROI notification history' })
  @ApiResponse({ status: 200, description: 'ROI notification history retrieved successfully' })
  @ApiQuery({ name: 'page', required: false, description: 'Page number for pagination' })
  @ApiQuery({ name: 'limit', required: false, description: 'Number of notifications per page' })
  @ApiQuery({ name: 'investmentId', required: false, description: 'Filter by specific investment' })
  @ApiQuery({ name: 'cycleType', required: false, description: 'Filter by cycle type (24-hour, completion, manual-withdrawal)' })
  async getRoiNotificationHistory(
    @Request() req: any,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('investmentId') investmentId?: string,
    @Query('cycleType') cycleType?: string,
  ) {
    const userId = req.user.id;
    const options = {
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 20,
      investmentId,
      cycleType,
    };

    return this.roiNotificationsService.getUserRoiNotificationHistory(userId, options);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get user ROI notification statistics' })
  @ApiResponse({ status: 200, description: 'ROI notification statistics retrieved successfully' })
  async getRoiNotificationStats(@Request() req: any) {
    const userId = req.user.id;
    return this.roiNotificationsService.getUserRoiStats(userId);
  }

  @Post(':id/read')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark ROI notification as read' })
  @ApiResponse({ status: 200, description: 'ROI notification marked as read successfully' })
  async markAsRead(@Request() req: any, @Param('id') notificationId: string) {
    const userId = req.user.id;
    await this.roiNotificationsService.markRoiNotificationAsRead(notificationId, userId);
    return { message: 'ROI notification marked as read successfully' };
  }

  @Post('mark-all-read')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark all ROI notifications as read' })
  @ApiResponse({ status: 200, description: 'All ROI notifications marked as read successfully' })
  async markAllAsRead(@Request() req: any) {
    const userId = req.user.id;
    await this.roiNotificationsService.markAllRoiNotificationsAsRead(userId);
    return { message: 'All ROI notifications marked as read successfully' };
  }
}
