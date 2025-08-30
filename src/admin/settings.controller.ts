import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { SettingsService } from '../settings/settings.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../users/enums/role.enum';

@ApiTags('Admin Settings')
@Controller('admin/settings')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get('withdrawal')
  @Roles(Role.ADMIN)
  async getWithdrawalSettings() {
    return this.settingsService.getWithdrawalSettings();
  }

  @Get('bonus-withdrawal-period')
  @Roles(Role.ADMIN)
  async getBonusWithdrawalPeriod() {
    return this.settingsService.getBonusWithdrawalPeriod();
  }

  // Add public endpoint for maintenance mode
  @Get('maintenance-status')
  @Roles(Role.ADMIN)
  async getMaintenanceStatus() {
    return this.settingsService.getMaintenanceStatus();
  }

  // ROI Testing Mode Management
  @Get('roi-testing-mode')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Get ROI testing mode settings' })
  @ApiResponse({ status: 200, description: 'ROI testing mode settings retrieved successfully' })
  async getTestingModeSettings() {
    return this.settingsService.getTestingModeSettings();
  }

  @Post('roi-testing-mode/enable')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Enable ROI testing mode with accelerated timings' })
  @ApiResponse({ status: 200, description: 'ROI testing mode enabled successfully' })
  async enableTestingMode() {
    const settings = await this.settingsService.enableTestingMode();
    return { 
      message: 'ROI testing mode enabled successfully',
      settings 
    };
  }

  @Post('roi-testing-mode/disable')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Disable ROI testing mode and return to production timings' })
  @ApiResponse({ status: 200, description: 'ROI testing mode disabled successfully' })
  async disableTestingMode() {
    const settings = await this.settingsService.disableTestingMode();
    return { 
      message: 'ROI testing mode disabled successfully',
      settings 
    };
  }

  @Post('roi-testing-mode/toggle')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Toggle ROI testing mode on/off' })
  @ApiResponse({ status: 200, description: 'ROI testing mode toggled successfully' })
  async toggleTestingMode() {
    const settings = await this.settingsService.toggleTestingMode();
    const status = settings.enabled ? 'enabled' : 'disabled';
    return { 
      message: `ROI testing mode ${status} successfully`,
      settings 
    };
  }

  @Post('roi-testing-mode/update')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Update ROI testing mode settings with custom values' })
  @ApiResponse({ status: 200, description: 'ROI testing mode settings updated successfully' })
  async updateTestingModeSettings(@Body() settings: {
    enabled?: boolean;
    hourlyUpdateInterval?: number;
    dailyCycleInterval?: number;
    monthlyCycleInterval?: number;
    overdueThreshold?: number;
    minUpdateInterval?: number;
    countdownUpdateThreshold?: number;
  }) {
    const updatedSettings = await this.settingsService.updateTestingModeSettings(settings);
    return { 
      message: 'ROI testing mode settings updated successfully',
      settings: updatedSettings 
    };
  }
} 