"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var SeedsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SeedsService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const investment_plan_schema_1 = require("../investment-plans/schemas/investment-plan.schema");
const user_schema_1 = require("../users/schemas/user.schema");
const role_enum_1 = require("../users/enums/role.enum");
const bcrypt = require("bcrypt");
let SeedsService = SeedsService_1 = class SeedsService {
    planModel;
    userModel;
    logger = new common_1.Logger(SeedsService_1.name);
    constructor(planModel, userModel) {
        this.planModel = planModel;
        this.userModel = userModel;
    }
    async seedAll() {
        this.logger.log('Starting database seeding...');
        try {
            await this.seedInvestmentPlans();
            await this.seedAdminUser();
            this.logger.log('Database seeding completed successfully!');
        }
        catch (error) {
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
                currency: 'naira',
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
                status: investment_plan_schema_1.InvestmentPlanStatus.ACTIVE,
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
                currency: 'naira',
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
                status: investment_plan_schema_1.InvestmentPlanStatus.ACTIVE,
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
                currency: 'naira',
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
                status: investment_plan_schema_1.InvestmentPlanStatus.ACTIVE,
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
                currency: 'naira',
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
                status: investment_plan_schema_1.InvestmentPlanStatus.ACTIVE,
                icon: '👑',
                color: '#F59E0B',
                autoReinvestEnabled: true,
                earlyWithdrawalPenalty: 1,
                minWithdrawalAmount: 50000,
                maxWithdrawalAmount: 10000000,
                withdrawalProcessingTime: 1,
                featured: true,
            },
            {
                name: 'USDT Starter',
                description: 'Entry-level USDT investment plan with stable returns in cryptocurrency.',
                currency: 'usdt',
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
                status: investment_plan_schema_1.InvestmentPlanStatus.ACTIVE,
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
                currency: 'usdt',
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
                status: investment_plan_schema_1.InvestmentPlanStatus.ACTIVE,
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
                }
                else {
                    await this.planModel.findByIdAndUpdate(existingPlan._id, planData);
                    this.logger.log(`Updated investment plan: ${planData.name}`);
                }
            }
            catch (error) {
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
                    role: role_enum_1.Role.ADMIN,
                    isEmailVerified: true,
                    isActive: true,
                });
                await adminUser.save();
                this.logger.log(`Created admin user: ${adminEmail}`);
            }
            else {
                this.logger.log(`Admin user already exists: ${adminEmail}`);
            }
        }
        catch (error) {
            this.logger.error('Failed to create admin user:', error);
        }
    }
    async clearDatabase() {
        this.logger.log('Clearing database...');
        try {
            await this.planModel.deleteMany({});
            await this.userModel.deleteMany({ role: role_enum_1.Role.ADMIN });
            this.logger.log('Database cleared successfully.');
        }
        catch (error) {
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
        }
        catch (error) {
            this.logger.error('Database reset and seeding failed:', error);
            throw error;
        }
    }
};
exports.SeedsService = SeedsService;
exports.SeedsService = SeedsService = SeedsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(investment_plan_schema_1.InvestmentPlan.name)),
    __param(1, (0, mongoose_1.InjectModel)(user_schema_1.User.name)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        mongoose_2.Model])
], SeedsService);
//# sourceMappingURL=seeds.service.js.map