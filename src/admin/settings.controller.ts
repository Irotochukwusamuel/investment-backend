import { Controller, Get } from '@nestjs/common';
import { SettingsService } from '../settings/settings.service';

@Controller('settings')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get('withdrawal')
  async getWithdrawalSettings() {
    return this.settingsService.getWithdrawalSettings();
  }

  @Get('bonus-withdrawal-period')
  async getBonusWithdrawalPeriod() {
    return this.settingsService.getBonusWithdrawalPeriod();
  }

  // Add public endpoint for maintenance mode
  @Get('maintenance-status')
  async getMaintenanceStatus() {
    return this.settingsService.getMaintenanceStatus();
  }
} 