import { Controller, Post, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { TasksService } from './tasks.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../users/enums/role.enum';

@ApiTags('Tasks')
@Controller('tasks')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Post('trigger-roi-update')
  @Roles(Role.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Manually trigger ROI update for all investments' })
  @ApiResponse({ status: 200, description: 'ROI update triggered successfully' })
  async triggerRoiUpdate() {
    await this.tasksService.triggerRoiUpdate();
    return { message: 'ROI update triggered successfully' };
  }

  @Post('trigger-hourly-roi-accumulation')
  @Roles(Role.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Manually trigger hourly ROI accumulation' })
  @ApiResponse({ status: 200, description: 'Hourly ROI accumulation triggered successfully' })
  async triggerHourlyRoiAccumulation() {
    await this.tasksService.triggerHourlyRoiAccumulation();
    return { message: 'Hourly ROI accumulation triggered successfully' };
  }

  @Post('trigger-total-roi-recalculation')
  @Roles(Role.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Manually trigger total ROI recalculation for all investments' })
  @ApiResponse({ status: 200, description: 'Total ROI recalculation triggered successfully' })
  async triggerTotalRoiRecalculation() {
    await this.tasksService.triggerTotalRoiRecalculation();
    return { message: 'Total ROI recalculation triggered successfully' };
  }

  @Post('trigger-pending-transactions-processing')
  @Roles(Role.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Manually trigger pending transactions processing' })
  @ApiResponse({ status: 200, description: 'Pending transactions processing triggered successfully' })
  async triggerPendingTransactionsProcessing() {
    await this.tasksService.triggerPendingTransactionsProcessing();
    return { message: 'Pending transactions processing triggered successfully' };
  }

  @Post('trigger-countdown-management')
  @Roles(Role.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Manually trigger countdown management and synchronization' })
  @ApiResponse({ status: 200, description: 'Countdown management triggered successfully' })
  async triggerCountdownManagement() {
    await this.tasksService.triggerCountdownManagement();
    return { message: 'Countdown management triggered successfully' };
  }

  @Post('trigger-roi-integrity-check')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Manually trigger ROI integrity check' })
  @ApiResponse({ status: 200, description: 'ROI integrity check triggered successfully' })
  async triggerRoiIntegrityCheck() {
    await this.tasksService.triggerRoiIntegrityCheck();
    return { message: 'ROI integrity check triggered successfully' };
  }


} 