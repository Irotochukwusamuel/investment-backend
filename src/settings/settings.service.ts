import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Settings, SettingsDocument } from '../schemas/settings.schema';

@Injectable()
export class SettingsService {
  constructor(
    @InjectModel(Settings.name) private settingsModel: Model<SettingsDocument>,
  ) {}

  async getSettings() {
    const doc = await this.settingsModel.findOne({ key: 'platform' });
    if (doc) return doc.value;
    // fallback to defaults
    return {
      withdrawalLimits: { minAmount: 1000, maxAmount: 1000000 },
      depositLimits: { minAmount: 100, maxAmount: 1000000 },
      fees: { withdrawalFee: 2.5, depositFee: 0, transactionFee: 1.0 },
      security: { requireEmailVerification: true, requirePhoneVerification: false, twoFactorAuth: false, sessionTimeout: 24 },
      notifications: { emailNotifications: true, smsNotifications: false, pushNotifications: true },
      maintenance: { maintenanceMode: false, maintenanceMessage: '' },
      autoPayout: false,
      bonusWithdrawalPeriod: 15,
      bonusWithdrawalUnit: 'minutes',
      bonusWithdrawalPeriodMs: 15 * 60 * 1000, // 15 minutes in milliseconds
      // USDT Feature Toggles
      usdtWithdrawalEnabled: false,
      usdtInvestmentEnabled: false,
    };
  }

  async getWithdrawalSettings() {
    const doc = await this.settingsModel.findOne({ key: 'platform' });
    console.log('🔍 getWithdrawalSettings - Raw DB document:', doc);
    
    if (doc) {
      const result = {
        minWithdrawalAmount: doc.value.withdrawalLimits.minAmount,
        maxWithdrawalAmount: doc.value.withdrawalLimits.maxAmount,
        withdrawalFee: doc.value.fees.withdrawalFee,
        processingTime: doc.value.processingTime,
        autoPayout: doc.value.autoPayout,
      };
      console.log('🔍 getWithdrawalSettings - Returning:', result);
      return result;
    }
    
    const defaultResult = {
      minWithdrawalAmount: 1000,
      maxWithdrawalAmount: 1000000,
      withdrawalFee: 2.5,
      processingTime: 24,
      autoPayout: false,
    };
    console.log('🔍 getWithdrawalSettings - Using defaults:', defaultResult);
    return defaultResult;
  }

  async getUsdtFeatureSettings() {
    const doc = await this.settingsModel.findOne({ key: 'platform' });
    if (doc && doc.value) {
      return {
        usdtWithdrawalEnabled: doc.value.usdtWithdrawalEnabled ?? false,
        usdtInvestmentEnabled: doc.value.usdtInvestmentEnabled ?? false,
      };
    }
    // Default: both disabled
    return {
      usdtWithdrawalEnabled: false,
      usdtInvestmentEnabled: false,
    };
  }

  async updateUsdtFeatureSettings(settings: { usdtWithdrawalEnabled?: boolean; usdtInvestmentEnabled?: boolean }) {
    const doc = await this.settingsModel.findOne({ key: 'platform' });
    let value = doc?.value || {};
    value = { ...value, ...settings };
    await this.settingsModel.updateOne(
      { key: 'platform' },
      { value },
      { upsert: true }
    );
    return value;
  }

  async getBonusWithdrawalPeriod() {
    const settings = await this.getSettings();
    const value = settings.bonusWithdrawalPeriod ?? 15;
    const unit = settings.bonusWithdrawalUnit ?? 'days';
    
    // Calculate periodMs based on the unit
    let periodMs: number;
    switch (unit) {
      case 'minutes':
        periodMs = value * 60 * 1000;
        break;
      case 'hours':
        periodMs = value * 60 * 60 * 1000;
        break;
      case 'days':
      default:
        periodMs = value * 24 * 60 * 60 * 1000;
        break;
    }
    
    return { value, unit, periodMs };
  }

  // Testing Mode Configuration Methods
  async getTestingModeSettings() {
    const doc = await this.settingsModel.findOne({ key: 'roi-testing-mode' });
    if (doc && doc.value) {
      return doc.value;
    }
    // Default testing mode settings
    return {
      enabled: false,
      hourlyUpdateInterval: 60 * 60 * 1000,        // 1 hour (60 minutes)
      dailyCycleInterval: 24 * 60 * 60 * 1000,     // 24 hours
      monthlyCycleInterval: 30 * 24 * 60 * 60 * 1000, // 30 days
      overdueThreshold: 60 * 60 * 1000,             // 1 hour
      minUpdateInterval: 30 * 1000,                 // 30 seconds
      countdownUpdateThreshold: 60 * 1000,          // 1 minute
    };
  }

  async updateTestingModeSettings(settings: {
    enabled?: boolean;
    hourlyUpdateInterval?: number;
    dailyCycleInterval?: number;
    monthlyCycleInterval?: number;
    overdueThreshold?: number;
    minUpdateInterval?: number;
    countdownUpdateThreshold?: number;
  }) {
    const doc = await this.settingsModel.findOne({ key: 'roi-testing-mode' });
    let value = doc?.value || {};
    value = { ...value, ...settings };
    
    await this.settingsModel.updateOne(
      { key: 'roi-testing-mode' },
      { value },
      { upsert: true }
    );
    
    return value;
  }

  async enableTestingMode() {
    const testingSettings = {
      enabled: true,
      hourlyUpdateInterval: 60 * 1000,              // 60 seconds (1 minute)
      dailyCycleInterval: 60 * 60 * 1000,          // 60 minutes (1 hour)
      monthlyCycleInterval: 3 * 60 * 60 * 1000,    // 3 hours
      overdueThreshold: 60 * 1000,                  // 60 seconds
      minUpdateInterval: 10 * 1000,                 // 10 seconds
      countdownUpdateThreshold: 10 * 1000,          // 10 seconds
    };
    
    return await this.updateTestingModeSettings(testingSettings);
  }

  async disableTestingMode() {
    const productionSettings = {
      enabled: false,
      hourlyUpdateInterval: 60 * 60 * 1000,        // 1 hour (60 minutes)
      dailyCycleInterval: 24 * 60 * 60 * 1000,     // 24 hours
      monthlyCycleInterval: 30 * 24 * 60 * 60 * 1000, // 30 days
      overdueThreshold: 60 * 60 * 1000,             // 1 hour
      minUpdateInterval: 30 * 1000,                 // 30 seconds
      countdownUpdateThreshold: 60 * 1000,          // 1 minute
    };
    
    return await this.updateTestingModeSettings(productionSettings);
  }

  async toggleTestingMode() {
    const currentSettings = await this.getTestingModeSettings();
    if (currentSettings.enabled) {
      return await this.disableTestingMode();
    } else {
      return await this.enableTestingMode();
    }
  }

  async getMaintenanceStatus() {
    const settings = await this.getSettings();
    return {
      maintenanceMode: settings.maintenance?.maintenanceMode ?? false,
      maintenanceMessage: settings.maintenance?.maintenanceMessage ?? '',
    };
  }

  // New method to get current ROI cycle status
  async getRoiCycleStatus() {
    const testingSettings = await this.getTestingModeSettings();
    const isTesting = testingSettings.enabled;
    
    return {
      isTesting,
      currentMode: isTesting ? 'TESTING' : 'PRODUCTION',
      hourlyInterval: testingSettings.hourlyUpdateInterval,
      dailyInterval: testingSettings.dailyCycleInterval,
      monthlyInterval: testingSettings.monthlyCycleInterval,
      hourlyIntervalFormatted: `${Math.floor(testingSettings.hourlyUpdateInterval / 1000)} seconds`,
      dailyIntervalFormatted: `${Math.floor(testingSettings.dailyCycleInterval / 60000)} minutes`,
      monthlyIntervalFormatted: `${Math.floor(testingSettings.monthlyCycleInterval / 3600000)} hours`,
      nextHourlyUpdate: new Date(Date.now() + testingSettings.hourlyUpdateInterval),
      nextDailyCycle: new Date(Date.now() + testingSettings.dailyCycleInterval),
      nextMonthlyCycle: new Date(Date.now() + testingSettings.monthlyCycleInterval),
    };
  }

  // New method to validate ROI cycle settings
  async validateRoiCycleSettings() {
    const testingSettings = await this.getTestingModeSettings();
    
    const validation = {
      isValid: true,
      errors: [] as string[],
      warnings: [] as string[],
    };
    
    // Check if intervals are reasonable
    if (testingSettings.hourlyUpdateInterval < 1000) {
      validation.errors.push('Hourly update interval cannot be less than 1 second');
      validation.isValid = false;
    }
    
    if (testingSettings.dailyCycleInterval < testingSettings.hourlyUpdateInterval) {
      validation.errors.push('Daily cycle interval cannot be less than hourly update interval');
      validation.isValid = false;
    }
    
    if (testingSettings.monthlyCycleInterval < testingSettings.dailyCycleInterval) {
      validation.errors.push('Monthly cycle interval cannot be less than daily cycle interval');
      validation.isValid = false;
    }
    
    // Check for potential performance issues
    if (testingSettings.hourlyUpdateInterval < 5000) {
      validation.warnings.push('Very short hourly intervals may impact system performance');
    }
    
    if (testingSettings.dailyCycleInterval < 60000) {
      validation.warnings.push('Very short daily cycles may impact system performance');
    }
    
    return validation;
  }
} 