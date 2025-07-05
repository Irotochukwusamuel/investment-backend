import { Controller, Post, Get, Body, UseGuards, Request, Param, Patch, Delete } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { WithdrawalsService } from './withdrawals.service';
import { CreateWithdrawalDto } from './dto/create-withdrawal.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('Withdrawals')
@Controller('withdrawals')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class WithdrawalsController {
  constructor(private readonly withdrawalsService: WithdrawalsService) {}

  @Post()
  @ApiOperation({ summary: 'Create withdrawal request' })
  @ApiResponse({ status: 201, description: 'Withdrawal request created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async createWithdrawal(@Request() req: any, @Body() createWithdrawalDto: CreateWithdrawalDto) {
    return this.withdrawalsService.createWithdrawal(req.user.id, createWithdrawalDto);
  }

  @Get('my')
  @ApiOperation({ summary: 'Get user withdrawals' })
  @ApiResponse({ status: 200, description: 'User withdrawals retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getUserWithdrawals(@Request() req: any) {
    return this.withdrawalsService.getUserWithdrawals(req.user.id);
  }

  @Get('my/:id')
  @ApiOperation({ summary: 'Get specific user withdrawal' })
  @ApiResponse({ status: 200, description: 'Withdrawal retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Withdrawal not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getUserWithdrawal(@Request() req: any, @Param('id') id: string) {
    return this.withdrawalsService.getUserWithdrawal(req.user.id, id);
  }

  @Patch('my/:id/cancel')
  @ApiOperation({ summary: 'Cancel user withdrawal' })
  @ApiResponse({ status: 200, description: 'Withdrawal cancelled successfully' })
  @ApiResponse({ status: 400, description: 'Cannot cancel withdrawal' })
  @ApiResponse({ status: 404, description: 'Withdrawal not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async cancelWithdrawal(@Request() req: any, @Param('id') id: string) {
    return this.withdrawalsService.cancelWithdrawal(req.user.id, id);
  }

  @Post('admin/:id/trigger-payout')
  @UseGuards(RolesGuard)
  @Roles('admin')
  @ApiOperation({ summary: 'Admin: Trigger payout for pending withdrawal' })
  @ApiResponse({ status: 200, description: 'Payout triggered successfully' })
  @ApiResponse({ status: 400, description: 'Cannot trigger payout' })
  @ApiResponse({ status: 404, description: 'Withdrawal not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin access required' })
  async triggerPayout(@Param('id') id: string) {
    return this.withdrawalsService.triggerPayout(id);
  }
} 