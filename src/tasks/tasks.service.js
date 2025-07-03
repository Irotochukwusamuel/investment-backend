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
var TasksService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.TasksService = void 0;
const common_1 = require("@nestjs/common");
const schedule_1 = require("@nestjs/schedule");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const investment_schema_1 = require("../investments/schemas/investment.schema");
const transaction_schema_1 = require("../transactions/schemas/transaction.schema");
const wallet_service_1 = require("../wallet/wallet.service");
const email_service_1 = require("../email/email.service");
const wallet_schema_1 = require("../wallet/schemas/wallet.schema");
let TasksService = TasksService_1 = class TasksService {
    investmentModel;
    transactionModel;
    walletService;
    emailService;
    logger = new common_1.Logger(TasksService_1.name);
    constructor(investmentModel, transactionModel, walletService, emailService) {
        this.investmentModel = investmentModel;
        this.transactionModel = transactionModel;
        this.walletService = walletService;
        this.emailService = emailService;
    }
    async updateInvestmentRoi() {
        this.logger.log('Starting hourly ROI update task');
        try {
            const activeInvestments = await this.investmentModel.find({
                status: investment_schema_1.InvestmentStatus.ACTIVE,
                endDate: { $gt: new Date() },
                nextRoiUpdate: { $lte: new Date() },
            }).populate('userId', 'email firstName lastName').populate('planId', 'name');
            for (const investment of activeInvestments) {
                try {
                    const dailyRoiAmount = (investment.amount * investment.dailyRoi) / 100;
                    const hourlyRoiAmount = dailyRoiAmount / 24;
                    investment.earnedAmount += hourlyRoiAmount;
                    investment.lastRoiUpdate = new Date();
                    const nextRoiUpdate = new Date();
                    nextRoiUpdate.setHours(nextRoiUpdate.getHours() + 1);
                    investment.nextRoiUpdate = nextRoiUpdate;
                    if (new Date() >= investment.endDate) {
                        investment.status = investment_schema_1.InvestmentStatus.COMPLETED;
                        const completionTransaction = await this.createRoiTransaction(investment, hourlyRoiAmount, 'completion');
                        if (investment.userId && typeof investment.userId === 'object' && 'email' in investment.userId) {
                            const user = investment.userId;
                            const planName = typeof investment.planId === 'object' && 'name' in investment.planId
                                ? investment.planId.name
                                : 'Investment Plan';
                            await this.emailService.sendInvestmentCompletion(user.email, user.firstName, {
                                planName: planName,
                                currency: investment.currency,
                                initialAmount: investment.amount,
                                totalRoi: investment.earnedAmount,
                                completionDate: new Date(),
                                duration: investment.duration,
                                investmentId: investment._id.toString(),
                            });
                        }
                    }
                    else {
                        const currentHour = new Date().getHours();
                        if (currentHour === 0 && investment.userId && typeof investment.userId === 'object' && 'email' in investment.userId) {
                            const user = investment.userId;
                            const planName = typeof investment.planId === 'object' && 'name' in investment.planId
                                ? investment.planId.name
                                : 'Investment Plan';
                            const roiTransaction = await this.createRoiTransaction(investment, dailyRoiAmount, 'daily');
                            await this.emailService.sendRoiPaymentNotification(user.email, user.firstName, {
                                currency: investment.currency,
                                amount: dailyRoiAmount,
                                investmentName: planName,
                                paymentDate: new Date(),
                                paymentType: 'Daily ROI',
                                transactionId: roiTransaction._id.toString(),
                            });
                        }
                        else {
                            await this.createRoiTransaction(investment, hourlyRoiAmount, 'hourly');
                        }
                    }
                    await investment.save();
                    if (investment.currency === 'naira') {
                        await this.walletService.deposit(investment.userId.toString(), {
                            walletType: wallet_schema_1.WalletType.PROFIT,
                            amount: hourlyRoiAmount,
                            currency: 'naira',
                            description: `Hourly ROI payment for investment`,
                        });
                    }
                    else {
                        await this.walletService.deposit(investment.userId.toString(), {
                            walletType: wallet_schema_1.WalletType.PROFIT,
                            amount: hourlyRoiAmount,
                            currency: 'usdt',
                            description: `Hourly ROI payment for investment`,
                        });
                    }
                }
                catch (error) {
                    this.logger.error(`Error updating ROI for investment ${investment._id}:`, error);
                }
            }
            this.logger.log(`Updated ROI for ${activeInvestments.length} investments`);
        }
        catch (error) {
            this.logger.error('Error in updateInvestmentRoi task:', error);
        }
    }
    async processPendingTransactions() {
        this.logger.log('Starting pending transactions processing task');
        try {
            const pendingTransactions = await this.transactionModel.find({
                status: transaction_schema_1.TransactionStatus.PENDING,
                createdAt: { $lt: new Date(Date.now() - 30 * 60 * 1000) },
            }).populate('userId', 'email firstName lastName');
            for (const transaction of pendingTransactions) {
                try {
                    if (transaction.isOverdue) {
                        transaction.status = transaction_schema_1.TransactionStatus.FAILED;
                        transaction.failedAt = new Date();
                        transaction.failureReason = 'Transaction timeout - overdue';
                        await transaction.save();
                        this.logger.warn(`Marked overdue transaction ${transaction._id} as failed`);
                        continue;
                    }
                    switch (transaction.type) {
                        case 'deposit':
                            await this.processDepositTransaction(transaction);
                            break;
                        case 'withdrawal':
                            await this.processWithdrawalTransaction(transaction);
                            break;
                        case 'investment':
                            await this.processInvestmentTransaction(transaction);
                            break;
                        default:
                            this.logger.warn(`Unknown transaction type: ${transaction.type}`);
                    }
                }
                catch (error) {
                    this.logger.error(`Error processing transaction ${transaction._id}:`, error);
                    transaction.retryCount += 1;
                    if (transaction.retryCount >= 3) {
                        transaction.status = transaction_schema_1.TransactionStatus.FAILED;
                        transaction.failedAt = new Date();
                        transaction.failureReason = `Max retries exceeded: ${error.message}`;
                        await transaction.save();
                    }
                    else {
                        transaction.nextRetryAt = new Date(Date.now() + (transaction.retryCount * 30 * 60 * 1000));
                        await transaction.save();
                    }
                }
            }
            this.logger.log(`Processed ${pendingTransactions.length} pending transactions`);
        }
        catch (error) {
            this.logger.error('Error in processPendingTransactions task:', error);
        }
    }
    async cleanupOldData() {
        this.logger.log('Starting daily cleanup task');
        try {
            const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
            const deletedTransactions = await this.transactionModel.deleteMany({
                status: transaction_schema_1.TransactionStatus.FAILED,
                createdAt: { $lt: thirtyDaysAgo },
            });
            this.logger.log(`Cleaned up ${deletedTransactions.deletedCount} old failed transactions`);
        }
        catch (error) {
            this.logger.error('Error in cleanupOldData task:', error);
        }
    }
    async generateWeeklyReports() {
        this.logger.log('Starting weekly report generation task');
        try {
            const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
            const weeklyStats = await this.transactionModel.aggregate([
                {
                    $match: {
                        createdAt: { $gte: oneWeekAgo },
                        status: transaction_schema_1.TransactionStatus.SUCCESS,
                    }
                },
                {
                    $group: {
                        _id: '$type',
                        count: { $sum: 1 },
                        totalAmount: { $sum: '$amount' },
                    }
                }
            ]);
            this.logger.log('Weekly statistics:', weeklyStats);
        }
        catch (error) {
            this.logger.error('Error in generateWeeklyReports task:', error);
        }
    }
    async createRoiTransaction(investment, amount, type) {
        const transaction = new this.transactionModel({
            userId: investment.userId,
            type: 'roi',
            status: transaction_schema_1.TransactionStatus.SUCCESS,
            amount: amount,
            currency: investment.currency,
            description: `${type === 'completion' ? 'Final' : type === 'hourly' ? 'Hourly' : 'Daily'} ROI payment for investment`,
            reference: `ROI-${investment._id}-${Date.now()}`,
            investmentId: investment._id,
            planId: investment.planId,
            processedAt: new Date(),
            isAutomated: true,
        });
        return transaction.save();
    }
    async processDepositTransaction(transaction) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        transaction.status = transaction_schema_1.TransactionStatus.SUCCESS;
        transaction.processedAt = new Date();
        await transaction.save();
        await this.walletService.deposit(transaction.userId.toString(), {
            walletType: wallet_schema_1.WalletType.MAIN,
            amount: transaction.amount,
            currency: transaction.currency,
            description: transaction.description,
        });
        if (transaction.userId && typeof transaction.userId === 'object' && 'email' in transaction.userId) {
            const user = transaction.userId;
            try {
                await this.emailService.sendDepositConfirmedEmail(user.email, user.firstName || user.email, {
                    amount: transaction.amount,
                    currency: transaction.currency,
                    paymentMethod: transaction.paymentMethod || 'bank_transfer',
                    reference: transaction.reference,
                    confirmationDate: transaction.processedAt,
                    transactionHash: transaction.externalReference,
                });
            }
            catch (error) {
                this.logger.error(`Failed to send deposit confirmed email to ${user.email}:`, error);
            }
        }
    }
    async processWithdrawalTransaction(transaction) {
        await new Promise(resolve => setTimeout(resolve, 2000));
        transaction.status = transaction_schema_1.TransactionStatus.SUCCESS;
        transaction.processedAt = new Date();
        await transaction.save();
        await this.walletService.withdraw(transaction.userId.toString(), {
            walletType: wallet_schema_1.WalletType.MAIN,
            amount: transaction.amount,
            currency: transaction.currency,
            description: transaction.description,
        });
        if (transaction.userId && typeof transaction.userId === 'object' && 'email' in transaction.userId) {
            const user = transaction.userId;
            try {
                await this.emailService.sendWithdrawalCompletedEmail(user.email, user.firstName || user.email, {
                    amount: transaction.amount,
                    currency: transaction.currency,
                    withdrawalMethod: transaction.paymentMethod || 'bank_transfer',
                    reference: transaction.reference,
                    completionDate: transaction.processedAt,
                    accountDetails: transaction.paymentDetails ? JSON.stringify(transaction.paymentDetails) : undefined,
                    transactionHash: transaction.externalReference,
                });
            }
            catch (error) {
                this.logger.error(`Failed to send withdrawal completed email to ${user.email}:`, error);
            }
        }
    }
    async processInvestmentTransaction(transaction) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        transaction.status = transaction_schema_1.TransactionStatus.SUCCESS;
        transaction.processedAt = new Date();
        await transaction.save();
        await this.walletService.withdraw(transaction.userId.toString(), {
            walletType: wallet_schema_1.WalletType.MAIN,
            amount: transaction.amount,
            currency: transaction.currency,
            description: transaction.description,
        });
        if (transaction.userId && typeof transaction.userId === 'object' && 'email' in transaction.userId) {
            const user = transaction.userId;
            await this.emailService.sendInvestmentConfirmation(user.email, user.firstName, {
                planName: transaction.description,
                currency: transaction.currency,
                amount: transaction.amount,
                duration: 30,
                expectedRoi: 2.5,
                startDate: transaction.processedAt,
            });
        }
    }
};
exports.TasksService = TasksService;
__decorate([
    (0, schedule_1.Cron)(schedule_1.CronExpression.EVERY_HOUR),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], TasksService.prototype, "updateInvestmentRoi", null);
__decorate([
    (0, schedule_1.Cron)(schedule_1.CronExpression.EVERY_5_MINUTES),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], TasksService.prototype, "processPendingTransactions", null);
__decorate([
    (0, schedule_1.Cron)(schedule_1.CronExpression.EVERY_DAY_AT_MIDNIGHT),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], TasksService.prototype, "cleanupOldData", null);
__decorate([
    (0, schedule_1.Cron)(schedule_1.CronExpression.EVERY_WEEK),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], TasksService.prototype, "generateWeeklyReports", null);
exports.TasksService = TasksService = TasksService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(investment_schema_1.Investment.name)),
    __param(1, (0, mongoose_1.InjectModel)(transaction_schema_1.Transaction.name)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        mongoose_2.Model,
        wallet_service_1.WalletService,
        email_service_1.EmailService])
], TasksService);
//# sourceMappingURL=tasks.service.js.map