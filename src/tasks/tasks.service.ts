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
import { NotificationType } from '../notifications/schemas/notification.schema';
import { EventEmitter2 } from '@nestjs/event-emitter';

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

  @Cron(CronExpression.EVERY_10_SECONDS, {
    name: 'updateInvestmentRoi',
    timeZone: 'Africa/Lagos'
  })
  async updateInvestmentRoi() {
    this.logger.log('🔄 Starting 24-hour ROI cycle check task');
    
    // Use a Set to track investments being processed to prevent concurrent processing
    const processingInvestments = new Set<string>();
    
    try {
      const activeInvestments = await this.investmentModel.find({
        status: InvestmentStatus.ACTIVE,
        endDate: { $gt: new Date() },
        nextRoiCycleDate: { $lte: new Date() }, // Check if 24-hour cycle is due
        // Prevent processing investments that were updated in the last 2 minutes
        $or: [
          { lastRoiUpdate: { $exists: false } },
          { lastRoiUpdate: { $lt: new Date(Date.now() - 2 * 60 * 1000) } }
        ]
      }).populate('userId', 'email firstName lastName').populate('planId', 'name');

      this.logger.log(`📊 Found ${activeInvestments.length} active investments that need 24-hour ROI cycle updates`);

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
          this.logger.log(`💰 Processing 24-hour ROI cycle for investment ${investment._id}: ${investment.amount} ${investment.currency}`);
          
          // Calculate daily ROI amount for this investment
          const dailyRoiAmount = (investment.amount * investment.dailyRoi) / 100;
          
          // Get the current accumulated ROI (this is what shows in the green highlighted area)
          const currentAccumulatedRoi = investment.earnedAmount || 0;
          
          // Transfer accumulated ROI to available balance (wallet)
          if (currentAccumulatedRoi > 0) {
            const userIdString = investment.userId.toString();
            
            if (investment.currency === 'naira') {
              await this.walletService.deposit(userIdString, {
                walletType: WalletType.MAIN,
                amount: currentAccumulatedRoi,
                currency: 'naira',
                description: `24-hour ROI cycle payment for investment`,
              });
            } else {
              await this.walletService.deposit(userIdString, {
                walletType: WalletType.MAIN,
                amount: currentAccumulatedRoi,
                currency: 'usdt',
                description: `24-hour ROI cycle payment for investment`,
              });
            }
            
            // Create ROI transaction record
            await this.createRoiTransaction(investment, currentAccumulatedRoi, '24-hour-cycle');
            
            this.logger.log(`✅ Transferred ${currentAccumulatedRoi} ${investment.currency} ROI to wallet for investment ${investment._id}`);
          }
          
          // Reset earnedAmount to 0 for the start of the next 24-hour cycle
          investment.earnedAmount = 0;
          
          // Update totalAccumulatedRoi (this tracks total ROI earned, never resets)
          investment.totalAccumulatedRoi += currentAccumulatedRoi;
          
          // Update timestamps
          investment.lastRoiUpdate = new Date();
          
          // Set next ROI cycle to 24 hours from now
          const nextRoiCycleDate = new Date(Date.now() + 24 * 60 * 60 * 1000);
          investment.nextRoiCycleDate = nextRoiCycleDate;
          
          // Check if investment is completed
          if (new Date() >= investment.endDate) {
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
          
          await investment.save();
          updatedCount++;
          
          this.logger.log(`✅ Successfully completed 24-hour ROI cycle for investment ${investment._id}`);
          
        } catch (error) {
          this.logger.error(`❌ Error updating ROI for investment ${investment._id}:`, error);
        } finally {
          // Remove from processing set after completion or error
          processingInvestments.delete(investmentId);
        }
      }
      
      this.logger.log(`🎯 24-hour ROI cycle update completed: ${updatedCount}/${activeInvestments.length} investments updated`);
    } catch (error) {
      this.logger.error('❌ Error in updateInvestmentRoi task:', error);
    }
  }

  // New cron job to accumulate ROI during the 24-hour cycle
  @Cron(CronExpression.EVERY_HOUR, {
    name: 'accumulateRoiDuringCycle',
    timeZone: 'Africa/Lagos'
  })
  async accumulateRoiDuringCycle() {
    this.logger.log('🔄 Starting hourly ROI accumulation task');
    
    try {
      const activeInvestments = await this.investmentModel.find({
        status: InvestmentStatus.ACTIVE,
        endDate: { $gt: new Date() },
        // Only accumulate ROI for investments that haven't reached their 24-hour cycle yet
        nextRoiCycleDate: { $gt: new Date() }
      }).populate('planId', 'dailyRoi');

      this.logger.log(`📊 Found ${activeInvestments.length} active investments accumulating ROI`);

      let updatedCount = 0;
      for (const investment of activeInvestments) {
        try {
          // Calculate hourly ROI (daily ROI divided by 24 hours)
          const dailyRoiAmount = (investment.amount * investment.dailyRoi) / 100;
          const hourlyRoiAmount = dailyRoiAmount / 24;
          
          // Add hourly ROI to earnedAmount (this is what shows in the green highlighted area)
          investment.earnedAmount = (investment.earnedAmount || 0) + hourlyRoiAmount;
          
          // Update lastRoiUpdate timestamp
          investment.lastRoiUpdate = new Date();
          
          await investment.save();
          updatedCount++;
          
          this.logger.log(`💰 Accumulated ${hourlyRoiAmount.toFixed(4)} ${investment.currency} ROI for investment ${investment._id} (Total: ${investment.earnedAmount.toFixed(4)})`);
          
        } catch (error) {
          this.logger.error(`❌ Error accumulating ROI for investment ${investment._id}:`, error);
        }
      }
      
      this.logger.log(`🎯 ROI accumulation completed: ${updatedCount}/${activeInvestments.length} investments updated`);
    } catch (error) {
      this.logger.error('❌ Error in accumulateRoiDuringCycle task:', error);
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
    } catch (error) {
      this.logger.error('❌ Error in generateWeeklyReports task:', error);
    }
  }

  private async createRoiTransaction(investment: InvestmentDocument, amount: number, type: 'daily' | 'completion' | 'hourly' | '24-hour-cycle'): Promise<TransactionDocument> {
    // Check if a similar transaction already exists for this investment within the last 5 minutes
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    const existingTransaction = await this.transactionModel.findOne({
      userId: investment.userId,
      investmentId: investment._id,
      type: 'roi',
      status: TransactionStatus.SUCCESS,
      createdAt: { $gte: fiveMinutesAgo },
      // Use a range for amount to handle floating point precision issues
      amount: { $gte: amount * 0.99, $lte: amount * 1.01 },
      currency: investment.currency
    });

    if (existingTransaction) {
      this.logger.log(`Skipping duplicate ROI transaction for investment ${investment._id} - transaction already exists within last 5 minutes`);
      return existingTransaction;
    }

    // Additional check: Look for any ROI transaction for this investment in the last minute
    const oneMinuteAgo = new Date(Date.now() - 60 * 1000);
    const recentTransaction = await this.transactionModel.findOne({
      userId: investment.userId,
      investmentId: investment._id,
      type: 'roi',
      status: TransactionStatus.SUCCESS,
      createdAt: { $gte: oneMinuteAgo }
    });

    if (recentTransaction) {
      this.logger.log(`Skipping ROI transaction for investment ${investment._id} - recent transaction exists within last minute`);
      return recentTransaction;
    }

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