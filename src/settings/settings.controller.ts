import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { SettingsService } from './settings.service';

@ApiTags('Public Settings')
@Controller('settings')
export class PublicSettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get('usdt-features')
  @ApiOperation({ summary: 'Get USDT feature settings' })
  @ApiResponse({ status: 200, description: 'USDT feature settings retrieved successfully' })
  async getUsdtFeatureSettings() {
    return this.settingsService.getUsdtFeatureSettings();
  }

  @Get('withdrawal')
  @ApiOperation({ summary: 'Get withdrawal settings' })
  @ApiResponse({ status: 200, description: 'Withdrawal settings retrieved successfully' })
  async getWithdrawalSettings() {
    return this.settingsService.getWithdrawalSettings();
  }

  @Get('bonus-withdrawal-period')
  @ApiOperation({ summary: 'Get bonus withdrawal period settings' })
  @ApiResponse({ status: 200, description: 'Bonus withdrawal period settings retrieved successfully' })
  async getBonusWithdrawalPeriod() {
    return this.settingsService.getBonusWithdrawalPeriod();
  }

  @Get('maintenance')
  @ApiOperation({ summary: 'Get maintenance status' })
  @ApiResponse({ status: 200, description: 'Maintenance status retrieved successfully' })
  async getMaintenanceStatus() {
    return this.settingsService.getMaintenanceStatus();
  }
} 