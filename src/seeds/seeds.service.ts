import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { InvestmentPlan, InvestmentPlanDocument, InvestmentPlanStatus } from '../investment-plans/schemas/investment-plan.schema';
import { User, UserDocument } from '../users/schemas/user.schema';
import { Settings } from '../schemas/settings.schema';
import { Role } from '../users/enums/role.enum';
import * as bcrypt from 'bcrypt';

@Injectable()
export class SeedsService {
  private readonly logger = new Logger(SeedsService.name);

  constructor(
    @InjectModel(InvestmentPlan.name) private planModel: Model<InvestmentPlanDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Settings.name) private settingsModel: Model<any>,
  ) {}

  async seedAll() {
    this.logger.log('Starting database seeding...');
    
    try {
      await this.seedInvestmentPlans();
      await this.seedAdminUser();
      await this.seedDefaultSettings();
      
      this.logger.log('Database seeding completed successfully!');
    } catch (error) {
      this.logger.error('Database seeding failed:', error);
      throw error;
    }
  }

  async seedInvestmentPlans() {
    this.logger.log('Seeding investment plans...');

    const plans = [
      {
        name: 'Cadet',
        description: 'Perfect for beginners looking to start their investment journey with minimal risk.',
        currency: 'naira' as const,
        minAmount: 5000,
        maxAmount: 25000,
        dailyRoi: 5.0,
        totalRoi: 150,
        duration: 30,
        welcomeBonus: 2.5,
        referralBonus: 3.5,
        features: [
          'Daily returns',
          'Low minimum investment',
          'Welcome bonus',
          'Flexible withdrawal',
          '24/7 support'
        ],
        popularity: 85,
        priority: 1,
        status: InvestmentPlanStatus.ACTIVE,
        icon: '🌱',
        color: '#10B981',
        autoReinvestEnabled: true,
        earlyWithdrawalPenalty: 5,
        minWithdrawalAmount: 1000,
        maxWithdrawalAmount: 25000,
        withdrawalProcessingTime: 24,
        featured: true,
      },
      {
        name: 'Captain',
        description: 'Ideal for investors seeking steady growth with moderate returns over time.',
        currency: 'naira' as const,
        minAmount: 26000,
        maxAmount: 35000,
        dailyRoi: 5.8,
        totalRoi: 174,
        duration: 30,
        welcomeBonus: 3.0,
        referralBonus: 4.0,
        features: [
          'Higher daily returns',
          'Priority support',
          'Bonus rewards',
          'Auto-reinvest option',
          'Detailed analytics'
        ],
        popularity: 75,
        priority: 2,
        status: InvestmentPlanStatus.ACTIVE,
        icon: '📈',
        color: '#3B82F6',
        autoReinvestEnabled: true,
        earlyWithdrawalPenalty: 3,
        minWithdrawalAmount: 5000,
        maxWithdrawalAmount: 35000,
        withdrawalProcessingTime: 12,
        featured: true,
      },
      {
        name: 'General',
        description: 'For serious investors who want maximum returns with premium features and support.',
        currency: 'naira' as const,
        minAmount: 36000,
        maxAmount: 45000,
        dailyRoi: 6.25,
        totalRoi: 187.5,
        duration: 30,
        welcomeBonus: 3.5,
        referralBonus: 4.5,
        features: [
          'Premium returns',
          'Dedicated manager',
          'VIP support',
          'Advanced analytics',
          'Priority processing',
          'Exclusive bonuses'
        ],
        popularity: 65,
        priority: 3,
        status: InvestmentPlanStatus.ACTIVE,
        icon: '💎',
        color: '#8B5CF6',
        autoReinvestEnabled: true,
        earlyWithdrawalPenalty: 2,
        minWithdrawalAmount: 10000,
        maxWithdrawalAmount: 45000,
        withdrawalProcessingTime: 6,
        featured: true,
      },
      {
        name: 'Vanguard',
        description: 'Exclusive plan for high-net-worth individuals with maximum returns and elite benefits.',
        currency: 'naira' as const,
        minAmount: 46000,
        maxAmount: 55000,
        dailyRoi: 6.7,
        totalRoi: 201,
        duration: 30,
        welcomeBonus: 4.0,
        referralBonus: 5.0,
        features: [
          'Maximum returns',
          'Personal advisor',
          'White-glove service',
          'Custom strategies',
          'Instant withdrawals',
          'Elite status perks',
          'Market insights'
        ],
        popularity: 95,
        priority: 4,
        status: InvestmentPlanStatus.ACTIVE,
        icon: '👑',
        color: '#F59E0B',
        autoReinvestEnabled: true,
        earlyWithdrawalPenalty: 1,
        minWithdrawalAmount: 50000,
        maxWithdrawalAmount: 55000,
        withdrawalProcessingTime: 1,
        featured: true,
      },
      {
        name: 'Admiral',
        description: 'Ultimate plan for elite investors with the highest returns and exclusive benefits.',
        currency: 'naira' as const,
        minAmount: 156000,
        maxAmount: 250000,
        dailyRoi: 7.1,
        totalRoi: 213,
        duration: 30,
        welcomeBonus: 4.5,
        referralBonus: 6.0,
        features: [
          'Ultimate returns',
          'Personal wealth manager',
          'Exclusive access',
          'Custom investment strategies',
          'Instant processing',
          'VIP concierge service',
          'Market intelligence',
          'Priority support'
        ],
        popularity: 100,
        priority: 5,
        status: InvestmentPlanStatus.ACTIVE,
        icon: '⭐',
        color: '#DC2626',
        autoReinvestEnabled: true,
        earlyWithdrawalPenalty: 0,
        minWithdrawalAmount: 100000,
        maxWithdrawalAmount: 250000,
        withdrawalProcessingTime: 1,
        featured: true,
      },
      // USDT Plans
      {
        name: 'USDT Cadet',
        description: 'Entry-level USDT investment plan with stable returns in cryptocurrency.',
        currency: 'usdt' as const,
        minAmount: 5,
        maxAmount: 20,
        dailyRoi: 5.0,
        totalRoi: 150,
        duration: 30,
        welcomeBonus: 2.5,
        referralBonus: 3.5,
        features: [
          'USD-stable returns',
          'Low entry barrier',
          'Crypto benefits',
          'Global accessibility',
          'Fast transactions'
        ],
        popularity: 70,
        priority: 6,
        status: InvestmentPlanStatus.ACTIVE,
        icon: '💰',
        color: '#059669',
        autoReinvestEnabled: true,
        earlyWithdrawalPenalty: 5,
        minWithdrawalAmount: 1,
        maxWithdrawalAmount: 20,
        withdrawalProcessingTime: 24,
        featured: false,
      },
      {
        name: 'USDT Captain',
        description: 'Advanced USDT investment plan for experienced crypto investors.',
        currency: 'usdt' as const,
        minAmount: 21,
        maxAmount: 35,
        dailyRoi: 5.8,
        totalRoi: 174,
        duration: 30,
        welcomeBonus: 3.0,
        referralBonus: 4.0,
        features: [
          'Enhanced crypto returns',
          'Stable USD value',
          'DeFi integration',
          'Smart contracts',
          'Yield farming',
          'Liquidity rewards'
        ],
        popularity: 80,
        priority: 7,
        status: InvestmentPlanStatus.ACTIVE,
        icon: '🚀',
        color: '#DC2626',
        autoReinvestEnabled: true,
        earlyWithdrawalPenalty: 3,
        minWithdrawalAmount: 5,
        maxWithdrawalAmount: 35,
        withdrawalProcessingTime: 12,
        featured: false,
      },
      {
        name: 'USDT General',
        description: 'Premium USDT investment plan for serious crypto investors.',
        currency: 'usdt' as const,
        minAmount: 36,
        maxAmount: 50,
        dailyRoi: 6.25,
        totalRoi: 187.5,
        duration: 30,
        welcomeBonus: 3.5,
        referralBonus: 4.5,
        features: [
          'Premium crypto returns',
          'Advanced DeFi strategies',
          'Portfolio management',
          'Risk assessment',
          'Market analysis',
          'Exclusive crypto benefits'
        ],
        popularity: 85,
        priority: 8,
        status: InvestmentPlanStatus.ACTIVE,
        icon: '💎',
        color: '#8B5CF6',
        autoReinvestEnabled: true,
        earlyWithdrawalPenalty: 2,
        minWithdrawalAmount: 10,
        maxWithdrawalAmount: 50,
        withdrawalProcessingTime: 6,
        featured: false,
      },
      {
        name: 'USDT Vanguard',
        description: 'Elite USDT investment plan for high-net-worth crypto investors.',
        currency: 'usdt' as const,
        minAmount: 51,
        maxAmount: 99,
        dailyRoi: 6.7,
        totalRoi: 201,
        duration: 30,
        welcomeBonus: 4.0,
        referralBonus: 5.0,
        features: [
          'Elite crypto returns',
          'Personal crypto advisor',
          'Custom DeFi strategies',
          'Institutional access',
          'Priority processing',
          'Exclusive market insights'
        ],
        popularity: 90,
        priority: 9,
        status: InvestmentPlanStatus.ACTIVE,
        icon: '👑',
        color: '#F59E0B',
        autoReinvestEnabled: true,
        earlyWithdrawalPenalty: 1,
        minWithdrawalAmount: 20,
        maxWithdrawalAmount: 99,
        withdrawalProcessingTime: 1,
        featured: false,
      },
      {
        name: 'USDT Admiral',
        description: 'Ultimate USDT investment plan for elite crypto investors.',
        currency: 'usdt' as const,
        minAmount: 100,
        maxAmount: 150,
        dailyRoi: 7.1,
        totalRoi: 213,
        duration: 30,
        welcomeBonus: 4.5,
        referralBonus: 6.0,
        features: [
          'Ultimate crypto returns',
          'Personal wealth manager',
          'Exclusive crypto access',
          'Custom blockchain strategies',
          'Instant processing',
          'VIP crypto concierge',
          'Market intelligence',
          'Priority support'
        ],
        popularity: 95,
        priority: 10,
        status: InvestmentPlanStatus.ACTIVE,
        icon: '⭐',
        color: '#DC2626',
        autoReinvestEnabled: true,
        earlyWithdrawalPenalty: 0,
        minWithdrawalAmount: 50,
        maxWithdrawalAmount: 150,
        withdrawalProcessingTime: 1,
        featured: false,
      }
    ];

    for (const planData of plans) {
      try {
        const existingPlan = await this.planModel.findOne({ name: planData.name });
        
        if (!existingPlan) {
          const plan = new this.planModel(planData);
          await plan.save();
          this.logger.log(`Created investment plan: ${planData.name}`);
        } else {
          // Update existing plan with new data
          await this.planModel.findByIdAndUpdate(existingPlan._id, planData);
          this.logger.log(`Updated investment plan: ${planData.name}`);
        }
      } catch (error) {
        this.logger.error(`Failed to create/update plan ${planData.name}:`, error);
      }
    }

    this.logger.log('Investment plans seeding completed.');
  }

  async seedAdminUser() {
    this.logger.log('Seeding admin user...');

    const adminEmail = process.env.ADMIN_EMAIL || 'admin@kltmines.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';

    try {
      const existingAdmin = await this.userModel.findOne({ email: adminEmail });

      if (!existingAdmin) {
        const hashedPassword = await bcrypt.hash(adminPassword, 12);
        
        const adminUser = new this.userModel({
          email: adminEmail,
          password: hashedPassword,
          firstName: 'Admin',
          lastName: 'User',
          role: Role.ADMIN,
          isEmailVerified: true,
          isActive: true,
        });

        await adminUser.save();
        this.logger.log(`Created admin user: ${adminEmail}`);
      } else {
        this.logger.log(`Admin user already exists: ${adminEmail}`);
      }
    } catch (error) {
      this.logger.error('Failed to create admin user:', error);
    }
  }

  async seedDefaultSettings() {
    this.logger.log('Seeding default platform and withdrawal settings...');
    // Platform settings
    const platform = await this.settingsModel.findOne({ key: 'platform' });
    if (!platform) {
      await this.settingsModel.create({
        key: 'platform',
        value: {
          withdrawalLimits: { minAmount: 100, maxAmount: 1000000 },
          depositLimits: { minAmount: 100, maxAmount: 1000000 },
          fees: { withdrawalFee: 2.5, depositFee: 0, transactionFee: 1.0 },
          security: { requireEmailVerification: true, requirePhoneVerification: false, twoFactorAuth: false, sessionTimeout: 24 },
          notifications: { emailNotifications: true, smsNotifications: false, pushNotifications: true },
          maintenance: { maintenanceMode: false, maintenanceMessage: '' },
          autoPayout: false,
          bonusWithdrawalPeriod: 15, // Days required before bonus can be withdrawn
        }
      });
      this.logger.log('Seeded default platform settings.');
    }
    // Withdrawal settings
    const withdrawal = await this.settingsModel.findOne({ key: 'withdrawal' });
    if (!withdrawal) {
      await this.settingsModel.create({
        key: 'withdrawal',
        value: {
          minWithdrawalAmount: 100,
          maxWithdrawalAmount: 1000000,
          withdrawalFee: 2.5,
          processingTime: 24,
        }
      });
      this.logger.log('Seeded default withdrawal settings.');
    }
  }

  async clearDatabase() {
    this.logger.log('Clearing database...');
    
    try {
      await this.planModel.deleteMany({});
      await this.userModel.deleteMany({ role: Role.ADMIN });
      
      this.logger.log('Database cleared successfully.');
    } catch (error) {
      this.logger.error('Failed to clear database:', error);
      throw error;
    }
  }

  async resetAndSeed() {
    this.logger.log('Resetting and seeding database...');
    
    try {
      await this.clearDatabase();
      await this.seedAll();
      
      this.logger.log('Database reset and seeding completed successfully!');
    } catch (error) {
      this.logger.error('Database reset and seeding failed:', error);
      throw error;
    }
  }
} 