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
    return {
      bonusWithdrawalPeriod: settings.bonusWithdrawalPeriod ?? 15,
    };
  }

  async getMaintenanceStatus() {
    const settings = await this.getSettings();
    return {
      maintenanceMode: settings.maintenance?.maintenanceMode ?? false,
      maintenanceMessage: settings.maintenance?.maintenanceMessage ?? '',
    };
  }
} 