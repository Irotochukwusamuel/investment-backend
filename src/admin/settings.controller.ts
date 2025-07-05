import { Controller, Get } from '@nestjs/common';
import { AdminService } from './admin.service';

@Controller('api/settings')
export class SettingsController {
  constructor(private readonly adminService: AdminService) {}

  @Get('withdrawal')
  async getWithdrawalSettings() {
    // Get platform settings
    const platform = await this.adminService.getSettings();

    console.log(platform)
    return {
      minWithdrawalAmount: platform.withdrawalLimits?.minAmount ?? 1000,
      maxWithdrawalAmount: platform.withdrawalLimits?.maxAmount ?? 1000000,
      withdrawalFee: platform.fees?.withdrawalFee ?? 2.5,
      processingTime: platform.processingTime ?? 24,
      autoPayout: platform.autoPayout ?? false,
    };
  }
} 