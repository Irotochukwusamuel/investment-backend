import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  Res,
} from '@nestjs/common';
import { Response } from 'express';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { AdminService } from './admin.service';
import { WithdrawalsService } from '../withdrawals/withdrawals.service';

@ApiTags('Admin')
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
@ApiBearerAuth()
export class AdminController {
  constructor(
    private readonly adminService: AdminService,
    private readonly withdrawalsService: WithdrawalsService
  ) {}

  // Dashboard Stats
  @Get('dashboard/stats')
  @ApiOperation({ summary: 'Get admin dashboard statistics' })
  @ApiResponse({ status: 200, description: 'Dashboard stats retrieved successfully' })
  async getDashboardStats() {
    return this.adminService.getDashboardStats();
  }

  // User Management
  @Get('users')
  @ApiOperation({ summary: 'Get all users (Admin only)' })
  @ApiResponse({ status: 200, description: 'Users retrieved successfully' })
  @ApiQuery({ name: 'status', required: false, enum: ['active', 'banned', 'suspended'] })
  @ApiQuery({ name: 'role', required: false, enum: ['user', 'admin'] })
  @ApiQuery({ name: 'verification', required: false, enum: ['verified', 'unverified'] })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'dateRange', required: false, enum: ['today', 'week', 'month', 'year'] })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getAllUsers(@Query() query: any) {
    return this.adminService.getAllUsers(query);
  }

  @Get('users/stats')
  @ApiOperation({ summary: 'Get users statistics (Admin only)' })
  @ApiResponse({ status: 200, description: 'Users stats retrieved successfully' })
  async getUsersStats() {
    return this.adminService.getUsersStats();
  }

  @Get('users/analytics')
  @ApiOperation({ summary: 'Get users analytics (Admin only)' })
  @ApiResponse({ status: 200, description: 'Users analytics retrieved successfully' })
  async getUsersAnalytics() {
    return this.adminService.getUsersAnalytics();
  }

  @Get('users/export')
  @ApiOperation({ summary: 'Export users data (Admin only)' })
  @ApiResponse({ status: 200, description: 'Users exported successfully' })
  @ApiQuery({ name: 'format', required: true, enum: ['csv', 'excel'] })
  async exportUsers(@Query() query: any, @Res() res: Response) {
    const { format, ...filters } = query;
    const data = await this.adminService.exportUsers(format, filters);
    
    res.setHeader('Content-Type', format === 'csv' ? 'text/csv' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=users-export-${new Date().toISOString().split('T')[0]}.${format}`);
    
    return res.send(data);
  }

  @Post('users/bulk-action')
  @ApiOperation({ summary: 'Perform bulk action on users (Admin only)' })
  @ApiResponse({ status: 200, description: 'Bulk action completed successfully' })
  async bulkAction(@Body() body: { userIds: string[]; action: string; reason?: string }) {
    return this.adminService.bulkAction(body.userIds, body.action, body.reason);
  }

  @Patch('users/:id')
  @ApiOperation({ summary: 'Update user (Admin only)' })
  @ApiResponse({ status: 200, description: 'User updated successfully' })
  async updateUser(@Param('id') id: string, @Body() updateData: any) {
    return this.adminService.updateUser(id, updateData);
  }

  @Delete('users/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete user (Admin only)' })
  @ApiResponse({ status: 204, description: 'User deleted successfully' })
  async deleteUser(@Param('id') id: string) {
    return this.adminService.deleteUser(id);
  }

  @Post('users/:id/reset-password')
  @ApiOperation({ summary: 'Reset user password (Admin only)' })
  @ApiResponse({ status: 200, description: 'Password reset successfully' })
  async resetUserPassword(@Param('id') id: string) {
    return this.adminService.resetUserPassword(id);
  }

  @Post('users/:id/verify')
  @ApiOperation({ summary: 'Verify user email/phone (Admin only)' })
  @ApiResponse({ status: 200, description: 'User verified successfully' })
  async verifyUser(@Param('id') id: string, @Body() body: { type: 'email' | 'phone' }) {
    return this.adminService.verifyUser(id, body.type);
  }

  @Post('users/:id/notify')
  @ApiOperation({ summary: 'Send notification to user (Admin only)' })
  @ApiResponse({ status: 200, description: 'Notification sent successfully' })
  async sendNotification(@Param('id') id: string, @Body() body: { message: string; type: string }) {
    return this.adminService.sendNotification(id, body.message, body.type);
  }

  // Investment Management
  @Get('investments')
  @ApiOperation({ summary: 'Get all investments (Admin only)' })
  @ApiResponse({ status: 200, description: 'Investments retrieved successfully' })
  @ApiQuery({ name: 'status', required: false, enum: ['pending', 'active', 'completed', 'cancelled', 'paused'] })
  @ApiQuery({ name: 'currency', required: false, enum: ['naira', 'usdt'] })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getAllInvestments(@Query() query: any) {
    return this.adminService.getAllInvestments(query);
  }

  @Get('investments/stats')
  @ApiOperation({ summary: 'Get investments statistics (Admin only)' })
  @ApiResponse({ status: 200, description: 'Investments stats retrieved successfully' })
  async getInvestmentsStats() {
    return this.adminService.getInvestmentsStats();
  }

  @Patch('investments/:id')
  @ApiOperation({ summary: 'Update investment (Admin only)' })
  @ApiResponse({ status: 200, description: 'Investment updated successfully' })
  async updateInvestment(@Param('id') id: string, @Body() updateData: any) {
    return this.adminService.updateInvestment(id, updateData);
  }

  @Post('investments/:id/reconcile')
  @ApiOperation({ summary: 'Recalculate and reconcile earnings for an investment (Admin only)' })
  @ApiResponse({ status: 200, description: 'Investment reconciled successfully' })
  async reconcileInvestment(@Param('id') id: string) {
    return this.adminService.reconcileInvestment(id);
  }

  @Post('investments/:id/test-hourly-cycle')
  @ApiOperation({ summary: 'Test hourly ROI cycle for an investment (Admin only)' })
  @ApiResponse({ status: 200, description: 'Hourly cycle test completed' })
  async testHourlyCycle(@Param('id') id: string) {
    return this.adminService.testHourlyCycle(id);
  }

  @Post('investments/:id/test-daily-cycle')
  @ApiOperation({ summary: 'Test daily ROI cycle completion for an investment (Admin only)' })
  @ApiResponse({ status: 200, description: 'Daily cycle test completed' })
  async testDailyCycle(@Param('id') id: string) {
    return this.adminService.testDailyCycle(id);
  }

  @Post('investments/:id/test-end-investment')
  @ApiOperation({ summary: 'Test end of investment (Admin only)' })
  @ApiResponse({ status: 200, description: 'Investment end test completed' })
  async testEndInvestment(@Param('id') id: string) {
    return this.adminService.testEndInvestment(id);
  }

  @Delete('investments/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete investment (Admin only)' })
  @ApiResponse({ status: 204, description: 'Investment deleted successfully' })
  async deleteInvestment(@Param('id') id: string) {
    return this.adminService.deleteInvestment(id);
  }

  // Withdrawal Management
  @Get('withdrawals')
  @ApiOperation({ summary: 'Get all withdrawals (Admin only)' })
  @ApiResponse({ status: 200, description: 'Withdrawals retrieved successfully' })
  @ApiQuery({ name: 'status', required: false, enum: ['pending', 'processing', 'completed', 'failed', 'cancelled'] })
  @ApiQuery({ name: 'currency', required: false, enum: ['naira', 'usdt'] })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getAllWithdrawals(@Query() query: any) {
    return this.adminService.getAllWithdrawals(query);
  }

  @Get('withdrawals/stats')
  @ApiOperation({ summary: 'Get withdrawals statistics (Admin only)' })
  @ApiResponse({ status: 200, description: 'Withdrawals stats retrieved successfully' })
  async getWithdrawalsStats() {
    return this.adminService.getWithdrawalsStats();
  }

  @Patch('withdrawals/:id')
  @ApiOperation({ summary: 'Update withdrawal status (Admin only)' })
  @ApiResponse({ status: 200, description: 'Withdrawal updated successfully' })
  async updateWithdrawal(@Param('id') id: string, @Body() updateData: any) {
    return this.adminService.updateWithdrawal(id, updateData);
  }

  @Delete('withdrawals/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete withdrawal (Admin only)' })
  @ApiResponse({ status: 204, description: 'Withdrawal deleted successfully' })
  async deleteWithdrawal(@Param('id') id: string) {
    return this.adminService.deleteWithdrawal(id);
  }

  @Post('withdrawals/bulk-trigger-payout')
  @ApiOperation({ summary: 'Bulk trigger payout for withdrawals (Admin only)' })
  @ApiResponse({ status: 200, description: 'Bulk payout triggered' })
  async bulkTriggerPayout(@Body() body: { withdrawalIds?: string[] }) {
    // If no IDs provided, process all pending/processing
    let ids = body.withdrawalIds;
    if (!ids || !ids.length) {
      ids = await this.withdrawalsService.getPendingOrProcessingWithdrawalIds();
    }
    return this.withdrawalsService.bulkTriggerPayout(ids);
  }

  // Wallet Management
  @Get('wallets')
  @ApiOperation({ summary: 'Get all wallets (Admin only)' })
  @ApiResponse({ status: 200, description: 'Wallets retrieved successfully' })
  @ApiQuery({ name: 'status', required: false, enum: ['active', 'suspended', 'locked'] })
  @ApiQuery({ name: 'email', required: false, type: String, description: 'Search by user email' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getAllWallets(@Query() query: any) {
    return this.adminService.getAllWallets(query);
  }

  @Get('wallets/stats')
  @ApiOperation({ summary: 'Get wallets statistics (Admin only)' })
  @ApiResponse({ status: 200, description: 'Wallets stats retrieved successfully' })
  async getWalletsStats() {
    return this.adminService.getWalletsStats();
  }

  @Post('wallets/:id/deposit')
  @ApiOperation({ summary: 'Admin deposit to wallet' })
  @ApiResponse({ status: 200, description: 'Deposit successful' })
  async adminDeposit(@Param('id') walletId: string, @Body() depositData: any) {
    return this.adminService.adminDeposit(walletId, depositData);
  }

  @Post('wallets/:id/withdraw')
  @ApiOperation({ summary: 'Admin withdraw from wallet' })
  @ApiResponse({ status: 200, description: 'Withdrawal successful' })
  async adminWithdraw(@Param('id') walletId: string, @Body() withdrawalData: any) {
    return this.adminService.adminWithdraw(walletId, withdrawalData);
  }

  @Patch('wallets/:id')
  @ApiOperation({ summary: 'Update wallet (Admin only)' })
  @ApiResponse({ status: 200, description: 'Wallet updated successfully' })
  async updateWallet(@Param('id') id: string, @Body() updateData: any) {
    return this.adminService.updateWallet(id, updateData);
  }

  // Investment Plans Management
  @Get('plans')
  @ApiOperation({ summary: 'Get all investment plans (Admin only)' })
  @ApiResponse({ status: 200, description: 'Plans retrieved successfully' })
  @ApiQuery({ name: 'status', required: false, enum: ['active', 'inactive', 'archived'] })
  @ApiQuery({ name: 'currency', required: false, enum: ['naira', 'usdt'] })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getAllPlans(@Query() query: any) {
    return this.adminService.getAllPlans(query);
  }

  @Post('plans')
  @ApiOperation({ summary: 'Create investment plan (Admin only)' })
  @ApiResponse({ status: 201, description: 'Plan created successfully' })
  async createPlan(@Body() createData: any) {
    return this.adminService.createPlan(createData);
  }

  @Patch('plans/:id')
  @ApiOperation({ summary: 'Update investment plan (Admin only)' })
  @ApiResponse({ status: 200, description: 'Plan updated successfully' })
  async updatePlan(@Param('id') id: string, @Body() updateData: any) {
    return this.adminService.updatePlan(id, updateData);
  }

  @Delete('plans/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete investment plan (Admin only)' })
  @ApiResponse({ status: 204, description: 'Plan deleted successfully' })
  async deletePlan(@Param('id') id: string) {
    return this.adminService.deletePlan(id);
  }

  @Patch('plans/:id/performance')
  @ApiOperation({ summary: 'Update plan performance metrics (Admin only)' })
  @ApiResponse({ status: 200, description: 'Performance updated successfully' })
  async updatePlanPerformance(@Param('id') id: string) {
    return this.adminService.updatePlanPerformance(id);
  }

  @Get('plans/stats')
  @ApiOperation({ summary: 'Get investment plans statistics (Admin only)' })
  @ApiResponse({ status: 200, description: 'Plans stats retrieved successfully' })
  async getPlansStats() {
    return this.adminService.getPlansStats();
  }

  @Get('plans/analytics')
  @ApiOperation({ summary: 'Get investment plans analytics (Admin only)' })
  @ApiResponse({ status: 200, description: 'Plans analytics retrieved successfully' })
  async getPlansAnalytics() {
    return this.adminService.getPlansAnalytics();
  }

  // Notices Management
  @Get('notices')
  @ApiOperation({ summary: 'Get all notices (Admin only)' })
  @ApiResponse({ status: 200, description: 'Notices retrieved successfully' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getAllNotices(@Query() query: any) {
    return this.adminService.getAllNotices(query);
  }

  @Post('notices')
  @ApiOperation({ summary: 'Create a new notice (Admin only)' })
  @ApiResponse({ status: 201, description: 'Notice created successfully' })
  async createNotice(@Body() createData: any) {
    return this.adminService.createNotice(createData);
  }

  @Patch('notices/:id')
  @ApiOperation({ summary: 'Update a notice (Admin only)' })
  @ApiResponse({ status: 200, description: 'Notice updated successfully' })
  async updateNotice(@Param('id') id: string, @Body() updateData: any) {
    return this.adminService.updateNotice(id, updateData);
  }

  @Delete('notices/:id')
  @ApiOperation({ summary: 'Delete a notice (Admin only)' })
  @ApiResponse({ status: 200, description: 'Notice deleted successfully' })
  async deleteNotice(@Param('id') id: string) {
    return this.adminService.deleteNotice(id);
  }

  // ROI Management
  @Get('plans/roi-settings')
  @ApiOperation({ summary: 'Get ROI settings for all plans (Admin only)' })
  @ApiResponse({ status: 200, description: 'ROI settings retrieved successfully' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getRoiSettings(@Query() query: any) {
    return this.adminService.getRoiSettingsPaginated(query);
  }

  @Get('plans/roi-stats')
  @ApiOperation({ summary: 'Get ROI statistics (Admin only)' })
  @ApiResponse({ status: 200, description: 'ROI stats retrieved successfully' })
  async getRoiStats() {
    return this.adminService.getRoiStats();
  }

  @Patch('plans/roi-settings/:id')
  @ApiOperation({ summary: 'Update ROI setting for a plan (Admin only)' })
  @ApiResponse({ status: 200, description: 'ROI setting updated successfully' })
  async updateRoiSetting(@Param('id') id: string, @Body() updateData: any) {
    return this.adminService.updateRoiSetting(id, updateData);
  }

  // Settings Management
  @Get('settings')
  @ApiOperation({ summary: 'Get platform settings (Admin only)' })
  @ApiResponse({ status: 200, description: 'Settings retrieved successfully' })
  async getSettings() {
    return this.adminService.getSettings();
  }

  @Patch('settings')
  @ApiOperation({ summary: 'Update platform settings (Admin only)' })
  @ApiResponse({ status: 200, description: 'Settings updated successfully' })
  async updateSettings(@Body() settingsData: any) {
    return this.adminService.updateSettings(settingsData);
  }

  // Withdrawal Settings
  @Get('withdrawals/settings')
  @ApiOperation({ summary: 'Get withdrawal settings (Admin only)' })
  @ApiResponse({ status: 200, description: 'Withdrawal settings retrieved successfully' })
  async getWithdrawalSettings() {
    return this.adminService.getWithdrawalSettings();
  }

  @Patch('withdrawals/settings')
  @ApiOperation({ summary: 'Update withdrawal settings (Admin only)' })
  @ApiResponse({ status: 200, description: 'Withdrawal settings updated successfully' })
  async updateWithdrawalSettings(@Body() settingsData: any) {
    return this.adminService.updateWithdrawalSettings(settingsData);
  }

  // Withdrawal Policy (ROI Only toggle)
  @Get('settings/withdrawal-policy')
  async getWithdrawalPolicy() {
    return this.adminService.getWithdrawalPolicy();
  }

  @Patch('settings/withdrawal-policy')
  async updateWithdrawalPolicy(@Body() body: { roiOnly: boolean }) {
    return this.adminService.updateWithdrawalPolicy(body);
  }

  // USDT Feature Settings
  @Get('settings/usdt-features')
  @ApiOperation({ summary: 'Get USDT feature settings (Admin only)' })
  @ApiResponse({ status: 200, description: 'USDT feature settings retrieved successfully' })
  async getUsdtFeatureSettings() {
    return this.adminService.getUsdtFeatureSettings();
  }

  @Patch('settings/usdt-features')
  @ApiOperation({ summary: 'Update USDT feature settings (Admin only)' })
  @ApiResponse({ status: 200, description: 'USDT feature settings updated successfully' })
  async updateUsdtFeatureSettings(@Body() body: { usdtWithdrawalEnabled?: boolean; usdtInvestmentEnabled?: boolean }) {
    return this.adminService.updateUsdtFeatureSettings(body);
  }

  @Post('process-missing-referral-bonuses')
  @ApiOperation({ summary: 'Process missing referral bonuses (Admin only)' })
  @ApiResponse({ status: 200, description: 'Missing referral bonuses processed successfully' })
  async processMissingReferralBonuses() {
    return this.adminService.processMissingReferralBonuses();
  }

  @Post('cleanup-orphaned-data')
  @ApiOperation({ summary: 'Clean up orphaned data (Admin only)' })
  @ApiResponse({ status: 200, description: 'Orphaned data cleaned up successfully' })
  async cleanupOrphanedData() {
    return this.adminService.cleanupOrphanedData();
  }

  @Post('referrals/fix-all-stats')
  @ApiOperation({ summary: 'One-time fix: update referral stats for all users' })
  @ApiResponse({ status: 200, description: 'Referral stats updated for all users' })
  async fixAllReferralStats() {
    return this.adminService.updateAllReferralStats();
  }

  @Patch('settings/bonus-withdrawal-period')
  @ApiOperation({ summary: 'Update bonus withdrawal period and handle existing users' })
  @ApiResponse({ status: 200, description: 'Bonus withdrawal period updated' })
  async updateBonusWithdrawalPeriod(@Body() body: { value: number; unit: 'hours' | 'minutes' | 'days' }) {
    return this.adminService.updateBonusWithdrawalPeriod(body);
  }
} 