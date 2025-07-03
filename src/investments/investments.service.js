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
Object.defineProperty(exports, "__esModule", { value: true });
exports.InvestmentsService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const investment_schema_1 = require("./schemas/investment.schema");
const investment_plan_schema_1 = require("../investment-plans/schemas/investment-plan.schema");
const wallet_service_1 = require("../wallet/wallet.service");
const wallet_schema_1 = require("../wallet/schemas/wallet.schema");
const users_service_1 = require("../users/users.service");
const transactions_service_1 = require("../transactions/transactions.service");
const transaction_schema_1 = require("../transactions/schemas/transaction.schema");
const email_service_1 = require("../email/email.service");
let InvestmentsService = class InvestmentsService {
    investmentModel;
    investmentPlanModel;
    walletService;
    usersService;
    transactionsService;
    emailService;
    constructor(investmentModel, investmentPlanModel, walletService, usersService, transactionsService, emailService) {
        this.investmentModel = investmentModel;
        this.investmentPlanModel = investmentPlanModel;
        this.walletService = walletService;
        this.usersService = usersService;
        this.transactionsService = transactionsService;
        this.emailService = emailService;
    }
    async createFromRequest(createInvestmentRequestDto, userId) {
        const plan = await this.investmentPlanModel.findById(createInvestmentRequestDto.planId);
        if (!plan) {
            throw new common_1.NotFoundException('Investment plan not found');
        }
        const activeInvestments = await this.investmentModel.countDocuments({
            userId: new mongoose_2.Types.ObjectId(userId),
            status: investment_schema_1.InvestmentStatus.ACTIVE
        });
        if (activeInvestments >= 3) {
            throw new common_1.BadRequestException('You can only have a maximum of 3 active investment plans at a time');
        }
        if (createInvestmentRequestDto.amount < plan.minAmount || createInvestmentRequestDto.amount > plan.maxAmount) {
            throw new common_1.BadRequestException(`Investment amount must be between ${plan.minAmount} and ${plan.maxAmount}`);
        }
        if (createInvestmentRequestDto.currency !== plan.currency) {
            throw new common_1.BadRequestException(`Investment currency must be ${plan.currency}`);
        }
        const hasBalance = await this.walletService.checkBalance(userId, createInvestmentRequestDto.amount, createInvestmentRequestDto.currency, wallet_schema_1.WalletType.MAIN);
        if (!hasBalance) {
            const currentBalance = await this.walletService.getBalance(userId, createInvestmentRequestDto.currency, wallet_schema_1.WalletType.MAIN);
            throw new common_1.BadRequestException(`Insufficient balance. Current balance: ${currentBalance} ${createInvestmentRequestDto.currency.toUpperCase()}, Required: ${createInvestmentRequestDto.amount} ${createInvestmentRequestDto.currency.toUpperCase()}`);
        }
        const startDate = new Date();
        const endDate = new Date();
        endDate.setDate(startDate.getDate() + plan.duration);
        const expectedReturn = (createInvestmentRequestDto.amount * plan.totalRoi) / 100;
        const nextRoiUpdate = new Date();
        nextRoiUpdate.setHours(nextRoiUpdate.getHours() + 1);
        nextRoiUpdate.setMinutes(0, 0, 0);
        const welcomeBonus = (createInvestmentRequestDto.amount * plan.welcomeBonus) / 100;
        const referralBonus = (createInvestmentRequestDto.amount * plan.referralBonus) / 100;
        const createInvestmentDto = {
            planId: createInvestmentRequestDto.planId,
            amount: createInvestmentRequestDto.amount,
            currency: createInvestmentRequestDto.currency,
            dailyRoi: plan.dailyRoi,
            totalRoi: plan.totalRoi,
            duration: plan.duration,
            startDate,
            endDate,
            expectedReturn,
            nextRoiUpdate,
            autoReinvest: createInvestmentRequestDto.autoReinvest || false,
            welcomeBonus,
            referralBonus,
        };
        const investment = await this.create(createInvestmentDto, userId);
        await this.usersService.setFirstActiveInvestmentDate(userId);
        await this.walletService.withdraw(userId, {
            walletType: wallet_schema_1.WalletType.MAIN,
            amount: createInvestmentRequestDto.amount,
            currency: createInvestmentRequestDto.currency,
            description: `Investment in ${plan.name}`,
        });
        const user = await this.usersService.findById(userId);
        if (user.referredBy && referralBonus > 0) {
            await this.walletService.deposit(user.referredBy.toString(), {
                walletType: wallet_schema_1.WalletType.PROFIT,
                amount: referralBonus,
                currency: createInvestmentRequestDto.currency,
                description: `Referral bonus from ${user.firstName} ${user.lastName}`,
            });
            await this.usersService.updateReferralStats(user.referredBy.toString(), referralBonus);
            await this.transactionsService.create({
                userId: user.referredBy.toString(),
                type: transaction_schema_1.TransactionType.REFERRAL,
                amount: referralBonus,
                currency: createInvestmentRequestDto.currency,
                description: `Referral bonus from ${user.firstName} ${user.lastName}`,
                status: transaction_schema_1.TransactionStatus.SUCCESS,
                investmentId: investment._id.toString(),
            });
        }
        try {
            await this.emailService.sendInvestmentConfirmation(user.email, user.firstName || user.email, {
                planName: plan.name,
                amount: createInvestmentRequestDto.amount,
                currency: createInvestmentRequestDto.currency,
                dailyRoi: plan.dailyRoi,
                duration: plan.duration,
                startDate: startDate,
                expectedTotalRoi: expectedReturn,
                investmentId: investment._id.toString(),
            });
        }
        catch (error) {
            console.error('Failed to send investment confirmation email:', error);
        }
        return investment;
    }
    async create(createInvestmentDto, userId) {
        const investment = new this.investmentModel({
            ...createInvestmentDto,
            userId: new mongoose_2.Types.ObjectId(userId),
            planId: new mongoose_2.Types.ObjectId(createInvestmentDto.planId),
            transactionId: createInvestmentDto.transactionId ? new mongoose_2.Types.ObjectId(createInvestmentDto.transactionId) : undefined,
        });
        return investment.save();
    }
    async findAll(query = {}) {
        const { userId, status, currency, limit = 50, page = 1 } = query;
        const filter = {};
        if (userId) {
            filter.userId = new mongoose_2.Types.ObjectId(userId);
        }
        if (status) {
            filter.status = status;
        }
        if (currency) {
            filter.currency = currency;
        }
        const skip = (page - 1) * limit;
        return this.investmentModel
            .find(filter)
            .populate('userId', 'firstName lastName email')
            .populate('planId', 'name description dailyRoi totalRoi')
            .populate('transactionId', 'amount currency type status')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .exec();
    }
    async findOne(id) {
        if (!mongoose_2.Types.ObjectId.isValid(id)) {
            throw new common_1.BadRequestException('Invalid investment ID');
        }
        const investment = await this.investmentModel
            .findById(id)
            .populate('userId', 'firstName lastName email')
            .populate('planId', 'name description dailyRoi totalRoi')
            .populate('transactionId', 'amount currency type status')
            .exec();
        if (!investment) {
            throw new common_1.NotFoundException('Investment not found');
        }
        return investment;
    }
    async findByUserId(userId, query = {}) {
        const { status, currency, limit = 50, page = 1 } = query;
        const filter = { userId: new mongoose_2.Types.ObjectId(userId) };
        if (status) {
            filter.status = status;
        }
        if (currency) {
            filter.currency = currency;
        }
        const skip = (page - 1) * limit;
        return this.investmentModel
            .find(filter)
            .populate('planId', 'name description dailyRoi totalRoi')
            .populate('transactionId', 'amount currency type status')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .exec();
    }
    async update(id, updateInvestmentDto) {
        if (!mongoose_2.Types.ObjectId.isValid(id)) {
            throw new common_1.BadRequestException('Invalid investment ID');
        }
        const investment = await this.investmentModel
            .findByIdAndUpdate(id, {
            ...updateInvestmentDto,
            planId: updateInvestmentDto.planId ? new mongoose_2.Types.ObjectId(updateInvestmentDto.planId) : undefined,
            transactionId: updateInvestmentDto.transactionId ? new mongoose_2.Types.ObjectId(updateInvestmentDto.transactionId) : undefined,
        }, { new: true, runValidators: true })
            .populate('userId', 'firstName lastName email')
            .populate('planId', 'name description dailyRoi totalRoi')
            .populate('transactionId', 'amount currency type status')
            .exec();
        if (!investment) {
            throw new common_1.NotFoundException('Investment not found');
        }
        return investment;
    }
    async remove(id) {
        if (!mongoose_2.Types.ObjectId.isValid(id)) {
            throw new common_1.BadRequestException('Invalid investment ID');
        }
        const investment = await this.investmentModel.findByIdAndDelete(id).exec();
        if (!investment) {
            throw new common_1.NotFoundException('Investment not found');
        }
    }
    async updateRoi(id, earnedAmount) {
        if (!mongoose_2.Types.ObjectId.isValid(id)) {
            throw new common_1.BadRequestException('Invalid investment ID');
        }
        const investment = await this.investmentModel
            .findByIdAndUpdate(id, {
            $inc: { earnedAmount },
            lastRoiUpdate: new Date(),
            nextRoiUpdate: new Date(Date.now() + 60 * 60 * 1000),
        }, { new: true, runValidators: true })
            .exec();
        if (!investment) {
            throw new common_1.NotFoundException('Investment not found');
        }
        return investment;
    }
    async completeInvestment(id) {
        if (!mongoose_2.Types.ObjectId.isValid(id)) {
            throw new common_1.BadRequestException('Invalid investment ID');
        }
        const investment = await this.investmentModel
            .findByIdAndUpdate(id, {
            status: investment_schema_1.InvestmentStatus.COMPLETED,
            endDate: new Date(),
        }, { new: true, runValidators: true })
            .exec();
        if (!investment) {
            throw new common_1.NotFoundException('Investment not found');
        }
        return investment;
    }
    async cancelInvestment(id, reason) {
        if (!mongoose_2.Types.ObjectId.isValid(id)) {
            throw new common_1.BadRequestException('Invalid investment ID');
        }
        const existingInvestment = await this.investmentModel.findById(id).exec();
        if (!existingInvestment) {
            throw new common_1.NotFoundException('Investment not found');
        }
        const updatedNotes = reason
            ? `${existingInvestment.notes || ''}\nCancelled: ${reason}`.trim()
            : existingInvestment.notes;
        const investment = await this.investmentModel
            .findByIdAndUpdate(id, {
            status: investment_schema_1.InvestmentStatus.CANCELLED,
            notes: updatedNotes,
        }, { new: true, runValidators: true })
            .exec();
        if (!investment) {
            throw new common_1.NotFoundException('Investment not found');
        }
        return investment;
    }
    async getInvestmentsForRoiUpdate() {
        const now = new Date();
        return this.investmentModel
            .find({
            status: investment_schema_1.InvestmentStatus.ACTIVE,
            nextRoiUpdate: { $lte: now },
        })
            .populate('planId', 'dailyRoi')
            .exec();
    }
    async getInvestmentStats(userId) {
        const filter = {};
        if (userId) {
            filter.userId = new mongoose_2.Types.ObjectId(userId);
        }
        const stats = await this.investmentModel.aggregate([
            { $match: filter },
            {
                $group: {
                    _id: null,
                    totalInvestments: { $sum: 1 },
                    totalAmount: { $sum: '$amount' },
                    totalEarned: { $sum: '$earnedAmount' },
                    totalExpectedReturn: { $sum: '$expectedReturn' },
                    activeInvestments: {
                        $sum: { $cond: [{ $eq: ['$status', investment_schema_1.InvestmentStatus.ACTIVE] }, 1, 0] }
                    },
                    completedInvestments: {
                        $sum: { $cond: [{ $eq: ['$status', investment_schema_1.InvestmentStatus.COMPLETED] }, 1, 0] }
                    },
                    cancelledInvestments: {
                        $sum: { $cond: [{ $eq: ['$status', investment_schema_1.InvestmentStatus.CANCELLED] }, 1, 0] }
                    },
                }
            }
        ]);
        return stats[0] || {
            totalInvestments: 0,
            totalAmount: 0,
            totalEarned: 0,
            totalExpectedReturn: 0,
            activeInvestments: 0,
            completedInvestments: 0,
            cancelledInvestments: 0,
        };
    }
    async getInvestmentsByCurrency(currency) {
        return this.investmentModel
            .find({ currency })
            .populate('userId', 'firstName lastName email')
            .populate('planId', 'name description')
            .sort({ createdAt: -1 })
            .exec();
    }
    async getActiveInvestments() {
        return this.investmentModel
            .find({ status: investment_schema_1.InvestmentStatus.ACTIVE })
            .populate('userId', 'firstName lastName email')
            .populate('planId', 'name description dailyRoi')
            .sort({ nextRoiUpdate: 1 })
            .exec();
    }
    async withdrawBonus(userId) {
        const bonusStatus = await this.usersService.canWithdrawBonus(userId);
        if (!bonusStatus.canWithdraw) {
            return {
                success: false,
                message: `Bonus can only be withdrawn after 15 days. You have ${bonusStatus.daysLeft} days remaining.`
            };
        }
        const activeInvestments = await this.investmentModel.find({
            userId: new mongoose_2.Types.ObjectId(userId),
            status: investment_schema_1.InvestmentStatus.ACTIVE
        });
        if (activeInvestments.length === 0) {
            return {
                success: false,
                message: 'You must have at least one active investment to withdraw bonuses.'
            };
        }
        const totalBonus = activeInvestments.reduce((sum, investment) => {
            return sum + (investment.welcomeBonus || 0) + (investment.referralBonus || 0);
        }, 0);
        if (totalBonus <= 0) {
            return {
                success: false,
                message: 'No bonuses available for withdrawal.'
            };
        }
        const user = await this.usersService.findById(userId);
        const currency = activeInvestments[0]?.currency || 'naira';
        await this.walletService.deposit(userId, {
            walletType: wallet_schema_1.WalletType.PROFIT,
            amount: totalBonus,
            currency,
            description: 'Bonus withdrawal (Welcome + Referral bonuses)',
        });
        await this.usersService.recordBonusWithdrawal(userId);
        await this.transactionsService.create({
            userId,
            type: transaction_schema_1.TransactionType.BONUS,
            amount: totalBonus,
            currency,
            description: 'Bonus withdrawal (Welcome + Referral bonuses)',
            status: transaction_schema_1.TransactionStatus.SUCCESS,
        });
        return {
            success: true,
            message: `Successfully withdrawn ${totalBonus} ${currency.toUpperCase()} in bonuses.`,
            amount: totalBonus
        };
    }
};
exports.InvestmentsService = InvestmentsService;
exports.InvestmentsService = InvestmentsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(investment_schema_1.Investment.name)),
    __param(1, (0, mongoose_1.InjectModel)(investment_plan_schema_1.InvestmentPlan.name)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        mongoose_2.Model,
        wallet_service_1.WalletService,
        users_service_1.UsersService,
        transactions_service_1.TransactionsService,
        email_service_1.EmailService])
], InvestmentsService);
//# sourceMappingURL=investments.service.js.map