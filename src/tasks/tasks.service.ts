import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';
import { Investment, InvestmentDocument, InvestmentStatus } from '../investments/schemas/investment.schema';
import { Transaction, TransactionDocument, TransactionStatus, TransactionType } from '../transactions/schemas/transaction.schema';
import { WalletService } from '../wallet/wallet.service';
import { EmailService } from '../email/email.service';
import { WalletType } from '../wallet/schemas/wallet.schema';
import { TransactionsService } from '../transactions/transactions.service';
import { NotificationsService } from '../notifications/notifications.service';
import { RoiNotificationsService } from '../notifications/roi-notifications.service';
import { NotificationType, NotificationCategory } from '../notifications/schemas/notification.schema';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { SettingsService } from '../settings/settings.service';

// Get current timing configuration from database
async function getTimingConfig(settingsService: SettingsService) {
  try {
    const settings = await settingsService.getTestingModeSettings();
    return {
      HOURLY_UPDATE_INTERVAL: settings.hourlyUpdateInterval,
      DAILY_CYCLE_INTERVAL: settings.dailyCycleInterval,
      MONTHLY_CYCLE_INTERVAL: settings.monthlyCycleInterval,
      OVERDUE_THRESHOLD: settings.overdueThreshold,
      MIN_UPDATE_INTERVAL: settings.minUpdateInterval,
      COUNTDOWN_UPDATE_THRESHOLD: settings.countdownUpdateThreshold,
      IS_TESTING_MODE: settings.enabled,
    };
  } catch (error) {
    // Fallback to production timings if database is not available
    return {
      HOURLY_UPDATE_INTERVAL: 60 * 60 * 1000,        // 1 hour (60 minutes)
      DAILY_CYCLE_INTERVAL: 24 * 60 * 60 * 1000,     // 24 hours
      MONTHLY_CYCLE_INTERVAL: 30 * 24 * 60 * 60 * 1000, // 30 days
      OVERDUE_THRESHOLD: 60 * 60 * 1000,             // 1 hour
      MIN_UPDATE_INTERVAL: 30 * 1000,                 // 30 seconds
      COUNTDOWN_UPDATE_THRESHOLD: 60 * 1000,          // 1 minute
      IS_TESTING_MODE: false,
    };
  }
}

@Injectable()
export class TasksService implements OnModuleInit {
  private readonly logger = new Logger(TasksService.name);
  private readonly fintavaClient: AxiosInstance;

  constructor(
    @InjectModel(Investment.name) private investmentModel: Model<InvestmentDocument>,
    @InjectModel(Transaction.name) private transactionModel: Model<TransactionDocument>,
    private readonly walletService: WalletService,
    private readonly emailService: EmailService,
    private readonly configService: ConfigService,
    private readonly transactionsService: TransactionsService,
    private readonly notificationsService: NotificationsService,
    private readonly roiNotificationsService: RoiNotificationsService,
    private readonly settingsService: SettingsService,
    private readonly eventEmitter: EventEmitter2,
  ) {
    // Initialize FINTAVA client
    const apiKey = this.configService.get<string>('FINTAVA_API_KEY');
    const baseUrl = this.configService.get<string>('FINTAVA_BASE_URL', 'https://dev.fintavapay.com/api/dev');
    
    if (!apiKey) {
      this.logger.error('FINTAVA_API_KEY not found in environment variables');
      throw new Error('FINTAVA_API_KEY is required');
    }

    this.fintavaClient = axios.create({
      baseURL: baseUrl,
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      timeout: 30000,
    });
  }

  async onModuleInit() {
    this.logger.log('🚀 TasksService initialized - Cron jobs are ready!');
    this.logger.log('📅 Scheduled cron jobs:');
    this.logger.log('   - ROI updates (every minute)');
    this.logger.log('   - Pending transactions processing (every 5 minutes)');
    this.logger.log('   - Daily cleanup (midnight)');
    this.logger.log('   - Daily ROI reset (midnight)');
    this.logger.log('   - Weekly reports (every week)');
  }

  // Manual trigger method for testing
  async triggerRoiUpdate() {
    this.logger.log('🔧 Manually triggering ROI update...');
    await this.updateInvestmentRoi();
  }

  // Method to show current mode and timings
  async showCurrentMode() {
    try {
      const config = await getTimingConfig(this.settingsService);
      const mode = config.IS_TESTING_MODE ? 'TESTING' : 'PRODUCTION';
      this.logger.log(`🔧 Current Mode: ${mode}`);
      this.logger.log(`📊 Current Timings:`);
      this.logger.log(`   Hourly updates: ${config.HOURLY_UPDATE_INTERVAL/1000} seconds`);
      this.logger.log(`   Daily cycles: ${config.DAILY_CYCLE_INTERVAL/60000} minutes`);
      this.logger.log(`   Monthly cycles: ${config.MONTHLY_CYCLE_INTERVAL/3600000} hours`);
      this.logger.log(`   Overdue threshold: ${config.OVERDUE_THRESHOLD/1000} seconds`);
      this.logger.log(`   Min update interval: ${config.MIN_UPDATE_INTERVAL/1000} seconds`);
    } catch (error) {
      this.logger.error('❌ Error getting current mode:', error);
    }
  }

  // Manual trigger method for testing hourly accumulation
  async triggerHourlyRoiAccumulation() {
    this.logger.log('🔧 Manually triggering hourly ROI accumulation...');
    // Note: Hourly ROI accumulation is now handled in the main updateInvestmentRoi cron job
    await this.updateInvestmentRoi();
  }

  // Manual trigger method for fixing total ROI calculations
  async triggerTotalRoiRecalculation() {
    this.logger.log('🔧 Manually triggering total ROI recalculation...');
    await this.recalculateTotalRoiForAllInvestments();
  }

  // Manual trigger method for processing pending transactions
  async triggerPendingTransactionsProcessing() {
    this.logger.log('🔧 Manually triggering pending transactions processing...');
    await this.processPendingTransactions();
  }

  // Manual trigger method for countdown management
  async triggerCountdownManagement() {
    this.logger.log('🔧 Manually triggering countdown management...');
    await this.manageCountdowns();
  }

  @Cron(CronExpression.EVERY_MINUTE, {
    name: 'updateInvestmentRoi',
    timeZone: 'Africa/Lagos'
  })
  async updateInvestmentRoi() {
    try {
      const config = await getTimingConfig(this.settingsService);
      const mode = config.IS_TESTING_MODE ? 'TESTING' : 'PRODUCTION';
      this.logger.log(`🔄 Starting ROI update task (${mode} MODE: ${config.HOURLY_UPDATE_INTERVAL/1000}s hourly, ${config.DAILY_CYCLE_INTERVAL/60000}m daily, ${config.MONTHLY_CYCLE_INTERVAL/3600000}h monthly)`);
      
      // Use a Set to track investments being processed to prevent concurrent processing
      const processingInvestments = new Set<string>();
      
      const now = new Date();
      
      // IMPROVED QUERY: Find investments that need updates OR are overdue
      const activeInvestments = await this.investmentModel.find({
        status: InvestmentStatus.ACTIVE,
        endDate: { $gt: now },
        $and: [
          // Either 24-hour cycle is due OR hourly ROI accumulation is due OR investment is overdue
          {
            $or: [
              { nextRoiCycleDate: { $lte: now } },
              { nextRoiUpdate: { $lte: now } },
              // ADD OVERDUE DETECTION: Check if investment hasn't been updated in over the configured threshold
              { 
                $and: [
                  { lastRoiUpdate: { $exists: true } },
                  { lastRoiUpdate: { $lt: new Date(now.getTime() - config.OVERDUE_THRESHOLD) } }
                ]
              }
            ]
          },
          // AND prevent processing investments that were updated in the last configured interval
          {
            $or: [
              { lastRoiUpdate: { $exists: false } },
              { lastRoiUpdate: { $lt: new Date(now.getTime() - config.MIN_UPDATE_INTERVAL) } }
            ]
          }
        ]
      }).populate('userId', 'email firstName lastName').populate('planId', 'name');

      this.logger.log(`📊 Found ${activeInvestments.length} active investments that need ROI updates`);

      let updatedCount = 0;
      for (const investment of activeInvestments) {
        const investmentId = investment._id.toString();
        
        // Skip if already being processed
        if (processingInvestments.has(investmentId)) {
          this.logger.log(`⏭️ Skipping investment ${investmentId} - already being processed`);
          continue;
        }
        
        // Mark as being processed
        processingInvestments.add(investmentId);
        
        try {
          const needs24HourCycle = investment.nextRoiCycleDate && investment.nextRoiCycleDate <= now;
          const needsHourlyUpdate = investment.nextRoiUpdate && investment.nextRoiUpdate <= now;
          
          // ADD OVERDUE DETECTION: Check if investment is overdue for updates
          const lastUpdate = investment.lastRoiUpdate ? new Date(investment.lastRoiUpdate) : new Date(investment.startDate);
          const isOverdue = (now.getTime() - lastUpdate.getTime()) >= config.OVERDUE_THRESHOLD;
          
          this.logger.log(`Investment ${investment._id}: needs24HourCycle=${needs24HourCycle}, needsHourlyUpdate=${needsHourlyUpdate}, isOverdue=${isOverdue}`);
          
          if (needs24HourCycle) {
            this.logger.log(`💰 Processing 24-hour ROI cycle for investment ${investment._id}: ${investment.amount} ${investment.currency}`);
            
            // Calculate daily ROI amount for this investment (exact amount to be paid per 24-hour cycle)
            const dailyRoiAmount = (investment.amount * investment.dailyRoi) / 100;

            // Always pay the exact daily ROI amount for the 24-hour cycle
            const payoutAmount = dailyRoiAmount;

            // Transfer exact daily ROI to available balance (wallet)
            if (payoutAmount > 0) {
              // Ensure we have a valid userId string even when userId is populated
              const userIdString = (investment.userId && typeof investment.userId === 'object' && (investment.userId as any)._id)
                ? (investment.userId as any)._id.toString()
                : investment.userId.toString();
              
              try {
                if (investment.currency === 'naira') {
                  await this.walletService.deposit(userIdString, {
                    walletType: WalletType.MAIN,
                    amount: payoutAmount,
                    currency: 'naira',
                    description: `24-hour ROI cycle payment for investment ${investment._id}`,
                  });
                } else {
                  await this.walletService.deposit(userIdString, {
                    walletType: WalletType.MAIN,
                    amount: payoutAmount,
                    currency: 'usdt',
                    description: `24-hour ROI cycle payment for investment ${investment._id}`,
                  });
                }
                
                // Create ROI transaction record
                await this.createRoiTransaction(investment, payoutAmount, '24-hour-cycle');
                
                // Send comprehensive ROI notification using dedicated service
                try {
                  await this.roiNotificationsService.sendRoiCycleNotification(
                    investment._id.toString(),
                    payoutAmount,
                    '24-hour'
                  );
                } catch (notificationError) {
                  this.logger.error(`❌ Failed to send ROI notification for investment ${investment._id}:`, notificationError);
                  // Don't fail the ROI process if notifications fail
                }
                
                this.logger.log(`✅ Transferred ${payoutAmount} ${investment.currency} ROI to wallet for investment ${investment._id}`);
              } catch (walletError) {
                this.logger.error(`❌ Failed to transfer ROI to wallet for investment ${investment._id}:`, walletError);
                // Continue processing the investment even if wallet transfer fails
              }
            }
            
            // Update totalAccumulatedRoi with the exact daily ROI amount (never resets)
            investment.totalAccumulatedRoi = (investment.totalAccumulatedRoi || 0) + payoutAmount;
            
            // Reset earnedAmount to 0 for the start of the next 24-hour cycle
            investment.earnedAmount = 0;
            
            // FIXED TIMESTAMP LOGIC: Set timestamps relative to NOW, not to lastRoiUpdate
            investment.lastRoiUpdate = now;
            
            // Set next ROI cycle using configured interval from NOW
            const nextRoiCycleDate = new Date(now.getTime() + config.DAILY_CYCLE_INTERVAL);
            investment.nextRoiCycleDate = nextRoiCycleDate;
            
            // Set next hourly update using configured interval from NOW
            const nextRoiUpdate = new Date(now.getTime() + config.HOURLY_UPDATE_INTERVAL);
            investment.nextRoiUpdate = nextRoiUpdate;
            
            this.logger.log(`✅ Completed 24-hour ROI cycle for investment ${investment._id}. Total accumulated ROI: ${investment.totalAccumulatedRoi}`);
            
          } else if (needsHourlyUpdate || isOverdue) {
            // FIXED: Process hourly updates OR overdue investments
            this.logger.log(`💰 Processing ${isOverdue ? 'overdue ' : ''}hourly ROI accumulation for investment ${investment._id}: ${investment.amount} ${investment.currency}`);
            
            // Calculate hourly ROI
            const dailyRoiAmount = (investment.amount * investment.dailyRoi) / 100;
            const hourlyRoiAmount = dailyRoiAmount / 24;
            
            // Calculate current cycle earnings based on time elapsed since last 24-hour cycle
            const startDate = new Date(investment.startDate);
            const elapsed = now.getTime() - startDate.getTime();
            const hoursElapsed = elapsed / (1000 * 60 * 60);
            
            let currentCycleEarnings;
            if (hoursElapsed < 24) {
              // Investment is less than 24 hours old - first cycle
              currentCycleEarnings = hourlyRoiAmount * hoursElapsed;
            } else {
              // Investment is older than 24 hours
              const completeCycles = Math.floor(hoursElapsed / 24);
              const hoursInCurrentCycle = hoursElapsed % 24;
              currentCycleEarnings = hourlyRoiAmount * hoursInCurrentCycle;
            }
            
            // Update earnedAmount to reflect current cycle earnings
            investment.earnedAmount = Math.round(currentCycleEarnings * 10000) / 10000;
            
            // FIXED TIMESTAMP LOGIC: Set timestamps relative to NOW
            investment.lastRoiUpdate = now;
            
            // Set next hourly update using configured interval from NOW
            const nextRoiUpdate = new Date(now.getTime() + config.HOURLY_UPDATE_INTERVAL);
            investment.nextRoiUpdate = nextRoiUpdate;
            
            this.logger.log(`✅ Updated current cycle earnings to ${investment.earnedAmount.toFixed(4)} ${investment.currency} for investment ${investment._id}`);
          }
          
          // Check if investment is completed
          if (new Date() >= investment.endDate) {
            // Before completing, transfer any remaining earned amount
            if (investment.earnedAmount > 0) {
              this.logger.log(`💰 Final ROI transfer for completed investment ${investment._id}: ${investment.earnedAmount} ${investment.currency}`);
              
              const userIdString = investment.userId.toString();
              
              try {
                if (investment.currency === 'naira') {
                  await this.walletService.deposit(userIdString, {
                    walletType: WalletType.MAIN,
                    amount: investment.earnedAmount,
                    currency: 'naira',
                    description: `Final ROI payment for completed investment ${investment._id}`,
                  });
                } else {
                  await this.walletService.deposit(userIdString, {
                    walletType: WalletType.MAIN,
                    amount: investment.earnedAmount,
                    currency: 'usdt',
                    description: `Final ROI payment for completed investment ${investment._id}`,
                  });
                }
                
                // Create final ROI transaction record
                await this.createRoiTransaction(investment, investment.earnedAmount, 'completion');
                
                // Update totalAccumulatedRoi with the final amount
                investment.totalAccumulatedRoi = (investment.totalAccumulatedRoi || 0) + investment.earnedAmount;
                
                // Reset earnedAmount to 0
                investment.earnedAmount = 0;
                
                this.logger.log(`✅ Final ROI transfer completed for investment ${investment._id}`);
              } catch (walletError) {
                this.logger.error(`❌ Failed to transfer final ROI for completed investment ${investment._id}:`, walletError);
                // Continue with completion even if wallet transfer fails
              }
            }
            
            investment.status = InvestmentStatus.COMPLETED;
            this.logger.log(`🎉 Investment ${investment._id} completed!`);
            
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
                  totalRoi: investment.totalAccumulatedRoi,
                  completionDate: new Date(),
                  duration: investment.duration,
                  investmentId: investment._id.toString(),
                }
              );
            }
          }
          
          // Save the investment if any changes were made
          if (needs24HourCycle || needsHourlyUpdate || isOverdue) {
            await investment.save();
            updatedCount++;
          }
          
        } catch (error) {
          this.logger.error(`❌ Error updating ROI for investment ${investment._id}:`, error);
        } finally {
          // Remove from processing set after completion or error
          processingInvestments.delete(investmentId);
        }
      }
      
      this.logger.log(`🎯 ROI update completed: ${updatedCount}/${activeInvestments.length} investments updated`);
    } catch (error) {
      this.logger.error('❌ Error in updateInvestmentRoi task:', error);
    }
  }

  // Note: Hourly ROI accumulation is now handled in the main updateInvestmentRoi cron job
  // This eliminates the need for a separate hourly cron job and ensures consistency

  // New cron job to manage countdowns and ensure synchronization
  @Cron(CronExpression.EVERY_5_MINUTES, {
    name: 'manageCountdowns',
    timeZone: 'Africa/Lagos'
  })
  async manageCountdowns() {
    try {
      const config = await getTimingConfig(this.settingsService);
      const mode = config.IS_TESTING_MODE ? 'TESTING' : 'PRODUCTION';
      this.logger.log(`🔄 Starting countdown management task (${mode} MODE)`);
      
      const now = new Date();
      const activeInvestments = await this.investmentModel.find({
        status: InvestmentStatus.ACTIVE,
        endDate: { $gt: now }
      });

      this.logger.log(`📊 Found ${activeInvestments.length} active investments to check countdowns`);

      let updatedCount = 0;
      for (const investment of activeInvestments) {
        try {
          // FIXED: Handle cases where nextRoiUpdate might be null
          if (!investment.nextRoiUpdate) {
            // If nextRoiUpdate is not set, set it using configured interval
            const newNextRoiUpdate = new Date(now.getTime() + config.HOURLY_UPDATE_INTERVAL);
            investment.nextRoiUpdate = newNextRoiUpdate;
            await investment.save();
            
            this.logger.log(`⏰ Fixed missing nextRoiUpdate for investment ${investment._id}: ${newNextRoiUpdate.toISOString()}`);
            updatedCount++;
            continue;
          }
          
          const nextRoiUpdate = new Date(investment.nextRoiUpdate);
          const timeUntilNext = nextRoiUpdate.getTime() - now.getTime();
          
          // If nextRoiUpdate is in the past or very close (within configured threshold), update it
          if (timeUntilNext <= config.COUNTDOWN_UPDATE_THRESHOLD) {
            const newNextRoiUpdate = new Date(now.getTime() + config.HOURLY_UPDATE_INTERVAL);
            investment.nextRoiUpdate = newNextRoiUpdate;
            await investment.save();
            
            this.logger.log(`⏰ Updated countdown for investment ${investment._id}: ${nextRoiUpdate.toISOString()} → ${newNextRoiUpdate.toISOString()}`);
            updatedCount++;
          }
          
          // FIXED: Also check if investment is overdue and needs immediate processing
          const lastUpdate = investment.lastRoiUpdate ? new Date(investment.lastRoiUpdate) : new Date(investment.startDate);
          const isOverdue = (now.getTime() - lastUpdate.getTime()) >= config.OVERDUE_THRESHOLD;
          
          if (isOverdue) {
            this.logger.log(`⚠️ Investment ${investment._id} is overdue for ROI update (${Math.floor((now.getTime() - lastUpdate.getTime()) / (1000 * 60))} minutes overdue)`);
            // The main ROI update cron job will handle this in the next minute
          }
          
        } catch (error) {
          this.logger.error(`❌ Error managing countdown for investment ${investment._id}:`, error);
        }
      }
      
      this.logger.log(`🎯 Countdown management completed: ${updatedCount} countdowns updated`);
    } catch (error) {
      this.logger.error('❌ Error in manageCountdowns task:', error);
    }
  }

  @Cron(CronExpression.EVERY_5_MINUTES, {
    name: 'processPendingTransactions',
    timeZone: 'Africa/Lagos'
  })
  async processPendingTransactions() {
    this.logger.log('🔄 Starting pending transactions processing task');
    
    try {
      const pendingTransactions = await this.transactionModel.find({
        status: TransactionStatus.PENDING,
        createdAt: { $lt: new Date(Date.now() - 30 * 60 * 1000) }, // Older than 30 minutes
      }).populate('userId', 'email firstName lastName');

      this.logger.log(`📊 Found ${pendingTransactions.length} pending transactions to process`);

      let processedCount = 0;
      for (const transaction of pendingTransactions) {
        try {
          // Check if transaction is overdue
          if (transaction.isOverdue) {
            transaction.status = TransactionStatus.FAILED;
            transaction.failedAt = new Date();
            transaction.failureReason = 'Transaction timeout - overdue';
            await transaction.save();
            this.logger.warn(`⚠️ Marked overdue transaction ${transaction._id} as failed`);
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
              this.logger.warn(`⚠️ Unknown transaction type: ${transaction.type}`);
          }
          
          processedCount++;
        } catch (error) {
          this.logger.error(`❌ Error processing transaction ${transaction._id}:`, error);
        }
      }
      
      this.logger.log(`🎯 Transaction processing completed: ${processedCount}/${pendingTransactions.length} transactions processed`);
    } catch (error) {
      this.logger.error('❌ Error in processPendingTransactions task:', error);
    }
  }

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT, {
    name: 'cleanupOldData',
    timeZone: 'Africa/Lagos'
  })
  async cleanupOldData() {
    this.logger.log('🔄 Starting daily cleanup task');
    
    try {
      // Clean up old failed transactions (older than 30 days)
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const deletedTransactions = await this.transactionModel.deleteMany({
        status: TransactionStatus.FAILED,
        createdAt: { $lt: thirtyDaysAgo },
      });
      
      this.logger.log(`🧹 Cleaned up ${deletedTransactions.deletedCount} old failed transactions`);
    } catch (error) {
      this.logger.error('❌ Error in cleanupOldData task:', error);
    }
  }

  @Cron(CronExpression.EVERY_WEEK, {
    name: 'generateWeeklyReports',
    timeZone: 'Africa/Lagos'
  })
  async generateWeeklyReports() {
    this.logger.log('🔄 Starting weekly reports generation task');
    
    try {
      // Generate weekly investment reports
      const weeklyStats = await this.investmentModel.aggregate([
        {
          $match: {
            createdAt: {
              $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
            }
          }
        },
        {
          $group: {
            _id: null,
            totalInvestments: { $sum: 1 },
            totalAmount: { $sum: '$amount' },
            totalEarnings: { $sum: '$earnedAmount' },
            totalAccumulatedRoi: { $sum: '$totalAccumulatedRoi' },
            activeInvestments: {
              $sum: { $cond: [{ $eq: ['$status', InvestmentStatus.ACTIVE] }, 1, 0] }
            },
            completedInvestments: {
              $sum: { $cond: [{ $eq: ['$status', InvestmentStatus.COMPLETED] }, 1, 0] }
            }
          }
        }
      ]);
      
      this.logger.log('📊 Weekly investment stats:', weeklyStats[0] || {});
      
      // Also recalculate total ROI for all investments to ensure consistency
      await this.recalculateTotalRoiForAllInvestments();
      
    } catch (error) {
      this.logger.error('❌ Error in generateWeeklyReports task:', error);
    }
  }

  // New method to recalculate total ROI for all investments
  async recalculateTotalRoiForAllInvestments() {
    this.logger.log('🔄 Starting total ROI recalculation for all investments');
    
    try {
      // Get all investments that need total ROI recalculation
      const investments = await this.investmentModel.find({
        status: { $in: [InvestmentStatus.ACTIVE, InvestmentStatus.COMPLETED] }
      });
      
      let updatedCount = 0;
      for (const investment of investments) {
        try {
          // Get all ROI transactions for this investment
          const roiTransactions = await this.transactionModel.find({
            investmentId: investment._id,
            type: 'roi',
            status: TransactionStatus.SUCCESS
          });
          
          // Calculate total accumulated ROI from transaction history
          const totalRoiFromTransactions = roiTransactions.reduce((sum, tx) => sum + tx.amount, 0);
          
          // Update the investment's totalAccumulatedRoi if it differs
          if (Math.abs((investment.totalAccumulatedRoi || 0) - totalRoiFromTransactions) > 0.01) {
            const oldTotal = investment.totalAccumulatedRoi || 0;
            investment.totalAccumulatedRoi = totalRoiFromTransactions;
            await investment.save();
            
            this.logger.log(`✅ Updated total ROI for investment ${investment._id}: ${oldTotal} → ${totalRoiFromTransactions}`);
            updatedCount++;
          }
          
        } catch (error) {
          this.logger.error(`❌ Error recalculating ROI for investment ${investment._id}:`, error);
        }
      }
      
      this.logger.log(`🎯 Total ROI recalculation completed: ${updatedCount} investments updated`);
    } catch (error) {
      this.logger.error('❌ Error in recalculateTotalRoiForAllInvestments:', error);
    }
  }

  private async createRoiTransaction(investment: InvestmentDocument, amount: number, type: 'daily' | 'completion' | 'hourly' | '24-hour-cycle'): Promise<TransactionDocument> {
    // Check if a similar transaction already exists for this investment within the last 60 seconds
    // This prevents duplicate transactions when cron job runs every minute
    const sixtySecondsAgo = new Date(Date.now() - 60 * 1000);
    const existingTransaction = await this.transactionModel.findOne({
      userId: investment.userId,
      investmentId: investment._id,
      type: 'roi',
      status: TransactionStatus.SUCCESS,
      createdAt: { $gte: sixtySecondsAgo },
      // Use a range for amount to handle floating point precision issues
      amount: { $gte: amount * 0.99, $lte: amount * 1.01 },
      currency: investment.currency,
      description: { $regex: new RegExp(`${type}.*ROI.*investment.*${investment._id}`, 'i') }
    });

    if (existingTransaction) {
      this.logger.log(`⏭️ Skipping duplicate ROI transaction for investment ${investment._id} - transaction already exists within last 60 seconds`);
      this.logger.log(`   Existing: ${existingTransaction.amount} ${existingTransaction.currency} at ${existingTransaction.createdAt}`);
      this.logger.log(`   Attempted: ${amount} ${investment.currency} at ${new Date()}`);
      return existingTransaction;
    }

    // Additional check: Look for any ROI transaction in the last 5 minutes for this investment
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    const recentRoiTransaction = await this.transactionModel.findOne({
      userId: investment.userId,
      investmentId: investment._id,
      type: 'roi',
      status: TransactionStatus.SUCCESS,
      createdAt: { $gte: fiveMinutesAgo }
    });

    if (recentRoiTransaction) {
      this.logger.log(`⚠️ Recent ROI transaction found for investment ${investment._id} within last 5 minutes`);
      this.logger.log(`   Recent: ${recentRoiTransaction.amount} ${recentRoiTransaction.currency} at ${recentRoiTransaction.createdAt}`);
      this.logger.log(`   Current: ${amount} ${investment.currency} at ${new Date()}`);
    }

    const transaction = new this.transactionModel({
      userId: investment.userId,
      type: 'roi',
      status: TransactionStatus.SUCCESS,
      amount: amount,
      currency: investment.currency,
      description: `${type === 'completion' ? 'Final' : type === 'hourly' ? 'Hourly' : type === '24-hour-cycle' ? '24-Hour Cycle' : 'Daily'} ROI payment for investment ${investment._id}`,
      reference: `ROI-${investment._id}-${Date.now()}`,
      investmentId: investment._id,
      planId: investment.planId,
      processedAt: new Date(),
      isAutomated: true,
    });
    
    const savedTransaction = await transaction.save();
    this.logger.log(`✅ Created ROI transaction: ${savedTransaction._id} for investment ${investment._id} - ${amount} ${investment.currency} (${type})`);
    
    return savedTransaction;
  }

  private async processDepositTransaction(transaction: TransactionDocument): Promise<void> {
    // Only process FINTAVA virtual wallet transactions
    if (transaction.paymentMethod !== 'fintava_virtual_wallet') {
      this.logger.warn(`Skipping non-FINTAVA transaction: ${transaction.reference}`);
      return;
    }

    try {
      // Verify transaction with FINTAVA API
      const isTransactionPaid = await this.verifyFintavaTransaction(transaction);
      
      if (!isTransactionPaid) {
        this.logger.log(`Transaction ${transaction.reference} not yet paid, will retry later`);
        return;
      }

      // Transaction is confirmed, mark as successful
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

      this.logger.log(`Successfully processed deposit transaction: ${transaction.reference}`);
    } catch (error) {
      this.logger.error(`Error processing deposit transaction ${transaction.reference}:`, error);
      throw error;
    }
  }

  private async processWithdrawalTransaction(transaction: TransactionDocument): Promise<void> {
    this.logger.log(`Processing withdrawal transaction: ${transaction._id}`);

    try {
      // Validate withdrawal transaction
      if (transaction.type !== TransactionType.WITHDRAWAL) {
        throw new Error('Transaction is not a withdrawal');
      }

      if (transaction.status !== TransactionStatus.PENDING) {
        this.logger.warn(`Withdrawal transaction ${transaction._id} is not pending, skipping`);
        return;
      }

      // Check if withdrawal details exist
      if (!transaction.withdrawalDetails) {
        this.logger.error(`Withdrawal transaction ${transaction._id} missing withdrawal details`);
        await this.transactionsService.update(transaction._id.toString(), {
          status: TransactionStatus.FAILED,
          failureReason: 'Missing withdrawal details',
          failedAt: new Date(),
        });
        return;
      }

      // Check if manual approval is required
      if (transaction.withdrawalDetails.requiresManualApproval) {
        this.logger.log(`Withdrawal transaction ${transaction._id} requires manual approval`);
        
        // Create notification for admin
        await this.notificationsService.createTransactionNotification(
          'admin', // Admin notification
          'Manual Approval Required',
          `Withdrawal of ${transaction.currency === 'naira' ? '₦' : '$'}${transaction.amount.toLocaleString()} requires manual approval. Reason: ${transaction.withdrawalDetails.manualApprovalReason || 'High-risk transaction'}`,
          NotificationType.WARNING
        );

        // Update transaction status to indicate manual review needed
        await this.transactionsService.update(transaction._id.toString(), {
          status: TransactionStatus.PENDING, // Keep pending but flag for manual review
          metadata: {
            ...transaction.metadata,
            requiresManualApproval: true,
            manualApprovalReason: transaction.withdrawalDetails.manualApprovalReason,
          },
        });
        return;
      }

      // Check if auto-disbursement is eligible
      if (transaction.withdrawalDetails.isAutoDisburseEligible) {
        this.logger.log(`Attempting auto-disbursement for withdrawal transaction ${transaction._id}`);
        
        const autoDisburseSuccess = await this.attemptAutoDisbursement(transaction);
        
        if (autoDisburseSuccess) {
          // Auto-disbursement successful
          await this.transactionsService.update(transaction._id.toString(), {
            status: TransactionStatus.SUCCESS,
            processedAt: new Date(),
            metadata: {
              ...transaction.metadata,
              autoDisburseAttempted: true,
              autoDisburseSuccess: true,
              processedBy: 'system',
            },
          });

          // Create success notification
          await this.notificationsService.createTransactionNotification(
            transaction.userId.toString(),
            'Withdrawal Processed',
            `Your withdrawal of ${transaction.currency === 'naira' ? '₦' : '$'}${transaction.amount.toLocaleString()} has been processed successfully and sent to your bank account.`,
            NotificationType.SUCCESS
          );

          // Emit WebSocket event
          this.eventEmitter.emit('wallet:withdrawalCompleted', {
            userId: transaction.userId.toString(),
            transactionId: transaction._id.toString(),
            amount: transaction.amount,
            currency: transaction.currency,
            reference: transaction.reference,
          });

          this.logger.log(`Auto-disbursement successful for withdrawal transaction ${transaction._id}`);
        } else {
          // Auto-disbursement failed, flag for manual processing
          await this.transactionsService.update(transaction._id.toString(), {
            status: TransactionStatus.PENDING,
            metadata: {
              ...transaction.metadata,
              autoDisburseAttempted: true,
              autoDisburseSuccess: false,
              requiresManualProcessing: true,
            },
          });

          // Create notification for admin
          await this.notificationsService.createTransactionNotification(
            'admin',
            'Auto-disbursement Failed',
            `Auto-disbursement failed for withdrawal of ${transaction.currency === 'naira' ? '₦' : '$'}${transaction.amount.toLocaleString()}. Manual processing required.`,
            NotificationType.ERROR
          );

          this.logger.warn(`Auto-disbursement failed for withdrawal transaction ${transaction._id}`);
        }
      } else {
        // Not eligible for auto-disbursement, flag for manual processing
        this.logger.log(`Withdrawal transaction ${transaction._id} not eligible for auto-disbursement`);
        
        await this.transactionsService.update(transaction._id.toString(), {
          status: TransactionStatus.PENDING,
          metadata: {
            ...transaction.metadata,
            requiresManualProcessing: true,
            manualProcessingReason: 'Not eligible for auto-disbursement',
          },
        });

        // Create notification for admin
        await this.notificationsService.createTransactionNotification(
          'admin',
          'Manual Processing Required',
          `Withdrawal of ${transaction.currency === 'naira' ? '₦' : '$'}${transaction.amount.toLocaleString()} requires manual processing.`,
          NotificationType.INFO
        );
      }

    } catch (error) {
      this.logger.error(`Error processing withdrawal transaction ${transaction._id}:`, error.message);
      
      await this.transactionsService.update(transaction._id.toString(), {
        status: TransactionStatus.FAILED,
        failureReason: error.message,
        failedAt: new Date(),
      });

      // Create failure notification
      await this.notificationsService.createTransactionNotification(
        transaction.userId.toString(),
        'Withdrawal Failed',
        `Your withdrawal request failed. Please contact support for assistance.`,
        NotificationType.ERROR
      );
    }
  }

  private async attemptAutoDisbursement(transaction: TransactionDocument): Promise<boolean> {
    try {
      // This is where you would integrate with your payment provider
      // For now, we'll simulate the auto-disbursement process
      
      const withdrawalDetails = transaction.withdrawalDetails;
      
      if (!withdrawalDetails) {
        return false;
      }
      
      if (withdrawalDetails.withdrawalMethod === 'bank_transfer') {
        // Simulate bank transfer via payment provider
        this.logger.log(`Simulating bank transfer for transaction ${transaction._id}`);
        
        // In a real implementation, you would:
        // 1. Call your payment provider's API (e.g., Flutterwave, Paystack)
        // 2. Initiate the bank transfer
        // 3. Get the transfer reference
        // 4. Return success/failure based on API response
        
        // For simulation, we'll assume success for amounts under ₦50,000
        const simulatedSuccess = transaction.amount < 50000;
        
        if (simulatedSuccess) {
          // Update transaction with external reference
          await this.transactionsService.update(transaction._id.toString(), {
            externalReference: `AUTO_TRANSFER_${Date.now()}`,
          });
          
          return true;
        } else {
          return false;
        }
      } else if (withdrawalDetails.withdrawalMethod === 'crypto') {
        // Simulate crypto transfer
        this.logger.log(`Simulating crypto transfer for transaction ${transaction._id}`);
        
        // In a real implementation, you would:
        // 1. Connect to blockchain network
        // 2. Initiate the transfer
        // 3. Get transaction hash
        // 4. Return success/failure
        
        return true; // Simulate success
      }
      
      return false;
    } catch (error) {
      this.logger.error(`Auto-disbursement error for transaction ${transaction._id}:`, error.message);
      return false;
    }
  }

  private async processInvestmentTransaction(transaction: TransactionDocument): Promise<void> {
    // Investment transactions should not be automatically processed by the cronjob
    // They require proper verification that the user has sufficient funds
    this.logger.log(`Investment transaction ${transaction.reference} requires manual verification - skipping automatic processing`);
    
    // Investment transactions should be processed through the proper investment service
    // when the user actually makes an investment request
    return;
  }

  private async verifyFintavaTransaction(transaction: TransactionDocument): Promise<boolean> {
    try {
      // Use the transaction reference to check status with FINTAVA API
      const response = await this.fintavaClient.get(`/transaction/reference/${transaction.reference}`);
      
      if (response.data.status === 200 && response.data.data) {
        const transactionData = response.data.data;
        
        // Check if the transaction is successful/paid
        // Based on FINTAVA API documentation, check the payment status
        const isPaid = transactionData.paymentStatus === 'PAID' || 
                      transactionData.status === 'PAID' ||
                      transactionData.status === 'SUCCESS';
        
        if (isPaid) {
          // Update the transaction with external reference if available
          if (transactionData.id && !transaction.externalReference) {
            transaction.externalReference = transactionData.id;
            await transaction.save();
          }
          
          this.logger.log(`Transaction ${transaction.reference} verified as paid with FINTAVA`);
          return true;
        } else {
          this.logger.log(`Transaction ${transaction.reference} not yet paid. Status: ${transactionData.paymentStatus || transactionData.status}`);
          return false;
        }
      } else {
        this.logger.warn(`FINTAVA API returned status ${response.data.status} for transaction ${transaction.reference}`);
        return false;
      }
    } catch (error) {
      if (error.response?.status === 404) {
        this.logger.warn(`Transaction ${transaction.reference} not found in FINTAVA`);
        return false;
      }
      
      this.logger.error(`Error verifying transaction ${transaction.reference} with FINTAVA:`, error.message);
      
      // Don't throw error, just return false to retry later
      return false;
    }
  }
}