import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Investment, InvestmentDocument, InvestmentStatus } from '../investments/schemas/investment.schema';
import { Transaction, TransactionDocument, TransactionStatus } from '../transactions/schemas/transaction.schema';
import { WalletService } from '../wallet/wallet.service';
import { EmailService } from '../email/email.service';
import { WalletType } from '../wallet/schemas/wallet.schema';

@Injectable()
export class TasksService {
  private readonly logger = new Logger(TasksService.name);

  constructor(
    @InjectModel(Investment.name) private investmentModel: Model<InvestmentDocument>,
    @InjectModel(Transaction.name) private transactionModel: Model<TransactionDocument>,
    private readonly walletService: WalletService,
    private readonly emailService: EmailService,
  ) {}

  @Cron(CronExpression.EVERY_HOUR)
  async updateInvestmentRoi() {
    this.logger.log('Starting hourly ROI update task');
    
    try {
      const activeInvestments = await this.investmentModel.find({
        status: InvestmentStatus.ACTIVE,
        endDate: { $gt: new Date() },
        nextRoiUpdate: { $lte: new Date() },
      }).populate('userId', 'email firstName lastName').populate('planId', 'name');

      for (const investment of activeInvestments) {
        try {
          // Calculate hourly ROI (daily ROI divided by 24 hours)
          const dailyRoiAmount = (investment.amount * investment.dailyRoi) / 100;
          const hourlyRoiAmount = dailyRoiAmount / 24;
          
          // Update investment ROI
          investment.earnedAmount += hourlyRoiAmount;
          investment.lastRoiUpdate = new Date();
          
          // Set next ROI update to next hour
          const nextRoiUpdate = new Date();
          nextRoiUpdate.setHours(nextRoiUpdate.getHours() + 1);
          investment.nextRoiUpdate = nextRoiUpdate;
          
          // Check if investment is completed
          if (new Date() >= investment.endDate) {
            investment.status = InvestmentStatus.COMPLETED;
            
            // Create completion transaction
            const completionTransaction = await this.createRoiTransaction(investment, hourlyRoiAmount, 'completion');
            
            // Send completion email
            if (investment.userId && typeof investment.userId === 'object' && 'email' in investment.userId) {
              const user = investment.userId as any;
              const planName = typeof investment.planId === 'object' && 'name' in investment.planId 
                ? (investment.planId as any).name 
                : 'Investment Plan';
              
              await this.emailService.sendInvestmentCompletion(
                user.email,
                user.firstName,
                {
                  planName: planName,
                  currency: investment.currency,
                  initialAmount: investment.amount,
                  totalRoi: investment.earnedAmount,
                  completionDate: new Date(),
                  duration: investment.duration,
                  investmentId: investment._id.toString(),
                }
              );
            }
          } else {
            // Send ROI notification email only once per day (at midnight)
            const currentHour = new Date().getHours();
            if (currentHour === 0 && investment.userId && typeof investment.userId === 'object' && 'email' in investment.userId) {
              const user = investment.userId as any;
              const planName = typeof investment.planId === 'object' && 'name' in investment.planId 
                ? (investment.planId as any).name 
                : 'Investment Plan';
              
              // Create ROI transaction first to get the transaction ID
              const roiTransaction = await this.createRoiTransaction(investment, dailyRoiAmount, 'daily');
              
              await this.emailService.sendRoiPaymentNotification(
                user.email,
                user.firstName,
                {
                  currency: investment.currency,
                  amount: dailyRoiAmount, // Send daily total in email
                  investmentName: planName,
                  paymentDate: new Date(),
                  paymentType: 'Daily ROI',
                  transactionId: roiTransaction._id.toString(),
                }
              );
            } else {
              // Create regular hourly ROI transaction
              await this.createRoiTransaction(investment, hourlyRoiAmount, 'hourly');
            }
          }
          
          await investment.save();
          
          // Update user's profit wallet
          if (investment.currency === 'naira') {
            await this.walletService.deposit(investment.userId.toString(), {
              walletType: WalletType.PROFIT,
              amount: hourlyRoiAmount,
              currency: 'naira',
              description: `Hourly ROI payment for investment`,
            });
          } else {
            await this.walletService.deposit(investment.userId.toString(), {
              walletType: WalletType.PROFIT,
              amount: hourlyRoiAmount,
              currency: 'usdt',
              description: `Hourly ROI payment for investment`,
            });
          }
          
        } catch (error) {
          this.logger.error(`Error updating ROI for investment ${investment._id}:`, error);
        }
      }
      
      this.logger.log(`Updated ROI for ${activeInvestments.length} investments`);
    } catch (error) {
      this.logger.error('Error in updateInvestmentRoi task:', error);
    }
  }

  @Cron(CronExpression.EVERY_5_MINUTES)
  async processPendingTransactions() {
    this.logger.log('Starting pending transactions processing task');
    
    try {
      const pendingTransactions = await this.transactionModel.find({
        status: TransactionStatus.PENDING,
        createdAt: { $lt: new Date(Date.now() - 30 * 60 * 1000) }, // Older than 30 minutes
      }).populate('userId', 'email firstName lastName');

      for (const transaction of pendingTransactions) {
        try {
          // Check if transaction is overdue
          if (transaction.isOverdue) {
            transaction.status = TransactionStatus.FAILED;
            transaction.failedAt = new Date();
            transaction.failureReason = 'Transaction timeout - overdue';
            await transaction.save();
            this.logger.warn(`Marked overdue transaction ${transaction._id} as failed`);
            continue;
          }

          // Process based on transaction type
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
        } catch (error) {
          this.logger.error(`Error processing transaction ${transaction._id}:`, error);
          
          // Increment retry count
          transaction.retryCount += 1;
          if (transaction.retryCount >= 3) {
            transaction.status = TransactionStatus.FAILED;
            transaction.failedAt = new Date();
            transaction.failureReason = `Max retries exceeded: ${error.message}`;
            await transaction.save();
          } else {
            transaction.nextRetryAt = new Date(Date.now() + (transaction.retryCount * 30 * 60 * 1000));
            await transaction.save();
          }
        }
      }
      
      this.logger.log(`Processed ${pendingTransactions.length} pending transactions`);
    } catch (error) {
      this.logger.error('Error in processPendingTransactions task:', error);
    }
  }

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async cleanupOldData() {
    this.logger.log('Starting daily cleanup task');
    
    try {
      // Clean up old failed transactions (older than 30 days)
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const deletedTransactions = await this.transactionModel.deleteMany({
        status: TransactionStatus.FAILED,
        createdAt: { $lt: thirtyDaysAgo },
      });
      
      this.logger.log(`Cleaned up ${deletedTransactions.deletedCount} old failed transactions`);
    } catch (error) {
      this.logger.error('Error in cleanupOldData task:', error);
    }
  }

  @Cron(CronExpression.EVERY_WEEK)
  async generateWeeklyReports() {
    this.logger.log('Starting weekly report generation task');
    
    try {
      const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      
      // Get weekly statistics
      const weeklyStats = await this.transactionModel.aggregate([
        {
          $match: {
            createdAt: { $gte: oneWeekAgo },
            status: TransactionStatus.SUCCESS,
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
      
      // Here you could send weekly reports to admin or store them
      // await this.emailService.sendWeeklyReport(adminEmail, weeklyStats);
      
    } catch (error) {
      this.logger.error('Error in generateWeeklyReports task:', error);
    }
  }

  private async createRoiTransaction(investment: InvestmentDocument, amount: number, type: 'daily' | 'completion' | 'hourly'): Promise<TransactionDocument> {
    const transaction = new this.transactionModel({
      userId: investment.userId,
      type: 'roi',
      status: TransactionStatus.SUCCESS,
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

  private async processDepositTransaction(transaction: TransactionDocument): Promise<void> {
    // Simulate deposit processing
    await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate processing time
    
    transaction.status = TransactionStatus.SUCCESS;
    transaction.processedAt = new Date();
    await transaction.save();
    
    // Update user wallet
    await this.walletService.deposit(transaction.userId.toString(), {
      walletType: WalletType.MAIN,
      amount: transaction.amount,
      currency: transaction.currency,
      description: transaction.description,
    });
    
    // Send deposit confirmed email
    if (transaction.userId && typeof transaction.userId === 'object' && 'email' in transaction.userId) {
      const user = transaction.userId as any;
      try {
        await this.emailService.sendDepositConfirmedEmail(
          user.email,
          user.firstName || user.email,
          {
            amount: transaction.amount,
            currency: transaction.currency,
            paymentMethod: transaction.paymentMethod || 'bank_transfer',
            reference: transaction.reference,
            confirmationDate: transaction.processedAt,
            transactionHash: transaction.externalReference,
          }
        );
      } catch (error) {
        this.logger.error(`Failed to send deposit confirmed email to ${user.email}:`, error);
      }
    }
  }

  private async processWithdrawalTransaction(transaction: TransactionDocument): Promise<void> {
    // Simulate withdrawal processing
    await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate processing time
    
    transaction.status = TransactionStatus.SUCCESS;
    transaction.processedAt = new Date();
    await transaction.save();
    
    // Update user wallet (deduct amount)
    await this.walletService.withdraw(transaction.userId.toString(), {
      walletType: WalletType.MAIN,
      amount: transaction.amount,
      currency: transaction.currency,
      description: transaction.description,
    });
    
    // Send withdrawal completed email
    if (transaction.userId && typeof transaction.userId === 'object' && 'email' in transaction.userId) {
      const user = transaction.userId as any;
      try {
        await this.emailService.sendWithdrawalCompletedEmail(
          user.email,
          user.firstName || user.email,
          {
            amount: transaction.amount,
            currency: transaction.currency,
            withdrawalMethod: transaction.paymentMethod || 'bank_transfer',
            reference: transaction.reference,
            completionDate: transaction.processedAt,
            accountDetails: transaction.paymentDetails ? JSON.stringify(transaction.paymentDetails) : undefined,
            transactionHash: transaction.externalReference,
          }
        );
      } catch (error) {
        this.logger.error(`Failed to send withdrawal completed email to ${user.email}:`, error);
      }
    }
  }

  private async processInvestmentTransaction(transaction: TransactionDocument): Promise<void> {
    // Simulate investment processing
    await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate processing time
    
    transaction.status = TransactionStatus.SUCCESS;
    transaction.processedAt = new Date();
    await transaction.save();
    
    // Update user wallet (deduct amount)
    await this.walletService.withdraw(transaction.userId.toString(), {
      walletType: WalletType.MAIN,
      amount: transaction.amount,
      currency: transaction.currency,
      description: transaction.description,
    });
    
    // Send confirmation email
    if (transaction.userId && typeof transaction.userId === 'object' && 'email' in transaction.userId) {
      const user = transaction.userId as any;
      await this.emailService.sendInvestmentConfirmation(
        user.email,
        user.firstName,
        {
          planName: transaction.description,
          currency: transaction.currency,
          amount: transaction.amount,
          duration: 30, // This should come from the investment plan
          expectedRoi: 2.5, // This should come from the investment plan
          startDate: transaction.processedAt,
        }
      );
    }
  }
}