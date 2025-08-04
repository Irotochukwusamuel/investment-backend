import { Controller, Post, UseGuards, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { TasksService } from './tasks.service';

@ApiTags('Tasks')
@Controller('tasks')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Post('trigger-roi-update')
  @Roles('admin')
  @ApiOperation({ summary: 'Manually trigger ROI update' })
  @ApiResponse({ status: 200, description: 'ROI update triggered successfully' })
  async triggerRoiUpdate() {
    await this.tasksService.triggerRoiUpdate();
    return { message: 'ROI update triggered successfully' };
  }

  @Get('status')
  @Roles('admin')
  @ApiOperation({ summary: 'Get cron jobs status' })
  @ApiResponse({ status: 200, description: 'Cron jobs status' })
  async getStatus() {
    return {
      message: 'Cron jobs are running',
      scheduledJobs: [
        'ROI updates (every minute)',
        'Pending transactions processing (every 5 minutes)',
        'Daily cleanup (midnight)',
        'Weekly reports (every week)'
      ],
      timezone: 'Africa/Lagos'
    };
  }
} 