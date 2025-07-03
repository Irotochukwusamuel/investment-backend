import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { InvestmentPlan, InvestmentPlanDocument, InvestmentPlanStatus } from '../investment-plans/schemas/investment-plan.schema';
import { User, UserDocument } from '../users/schemas/user.schema';
import { Role } from '../users/enums/role.enum';
import * as bcrypt from 'bcrypt';

@Injectable()
export class SeedsService {
  private readonly logger = new Logger(SeedsService.name);

  constructor(
    @InjectModel(InvestmentPlan.name) private planModel: Model<InvestmentPlanDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {}

  async seedAll() {
    this.logger.log('Starting database seeding...');
    
    try {
      await this.seedInvestmentPlans();
      await this.seedAdminUser();
      
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
        name: 'Starter Plan',
        description: 'Perfect for beginners looking to start their investment journey with minimal risk.',
        currency: 'naira' as const,
        minAmount: 5000,
        maxAmount: 50000,
        dailyRoi: 1.5,
        totalRoi: 45,
        duration: 30,
        welcomeBonus: 5,
        referralBonus: 2,
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
        maxWithdrawalAmount: 50000,
        withdrawalProcessingTime: 24,
        featured: true,
      },
      {
        name: 'Growth Plan',
        description: 'Ideal for investors seeking steady growth with moderate returns over time.',
        currency: 'naira' as const,
        minAmount: 50000,
        maxAmount: 500000,
        dailyRoi: 2.0,
        totalRoi: 60,
        duration: 30,
        welcomeBonus: 7,
        referralBonus: 3,
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
        maxWithdrawalAmount: 500000,
        withdrawalProcessingTime: 12,
        featured: true,
      },
      {
        name: 'Premium Plan',
        description: 'For serious investors who want maximum returns with premium features and support.',
        currency: 'naira' as const,
        minAmount: 500000,
        maxAmount: 2000000,
        dailyRoi: 2.5,
        totalRoi: 75,
        duration: 30,
        welcomeBonus: 10,
        referralBonus: 5,
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
        maxWithdrawalAmount: 2000000,
        withdrawalProcessingTime: 6,
        featured: true,
      },
      {
        name: 'Elite Plan',
        description: 'Exclusive plan for high-net-worth individuals with maximum returns and elite benefits.',
        currency: 'naira' as const,
        minAmount: 2000000,
        maxAmount: 10000000,
        dailyRoi: 3.0,
        totalRoi: 90,
        duration: 30,
        welcomeBonus: 15,
        referralBonus: 7,
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
        maxWithdrawalAmount: 10000000,
        withdrawalProcessingTime: 1,
        featured: true,
      },
      // USDT Plans
      {
        name: 'USDT Starter',
        description: 'Entry-level USDT investment plan with stable returns in cryptocurrency.',
        currency: 'usdt' as const,
        minAmount: 50,
        maxAmount: 500,
        dailyRoi: 1.2,
        totalRoi: 36,
        duration: 30,
        welcomeBonus: 3,
        referralBonus: 1.5,
        features: [
          'USD-stable returns',
          'Low entry barrier',
          'Crypto benefits',
          'Global accessibility',
          'Fast transactions'
        ],
        popularity: 70,
        priority: 5,
        status: InvestmentPlanStatus.ACTIVE,
        icon: '💰',
        color: '#059669',
        autoReinvestEnabled: true,
        earlyWithdrawalPenalty: 5,
        minWithdrawalAmount: 10,
        maxWithdrawalAmount: 500,
        withdrawalProcessingTime: 24,
        featured: false,
      },
      {
        name: 'USDT Growth',
        description: 'Advanced USDT investment plan for experienced crypto investors.',
        currency: 'usdt' as const,
        minAmount: 500,
        maxAmount: 5000,
        dailyRoi: 1.8,
        totalRoi: 54,
        duration: 30,
        welcomeBonus: 5,
        referralBonus: 2.5,
        features: [
          'Enhanced crypto returns',
          'Stable USD value',
          'DeFi integration',
          'Smart contracts',
          'Yield farming',
          'Liquidity rewards'
        ],
        popularity: 80,
        priority: 6,
        status: InvestmentPlanStatus.ACTIVE,
        icon: '🚀',
        color: '#DC2626',
        autoReinvestEnabled: true,
        earlyWithdrawalPenalty: 3,
        minWithdrawalAmount: 50,
        maxWithdrawalAmount: 5000,
        withdrawalProcessingTime: 12,
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