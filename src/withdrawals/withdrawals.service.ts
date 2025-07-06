import { Injectable, NotFoundException, BadRequestException, ForbiddenException, Inject, forwardRef } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Withdrawal, WithdrawalDocument } from './schemas/withdrawal.schema';
import { CreateWithdrawalDto } from './dto/create-withdrawal.dto';
import { WalletService } from '../wallet/wallet.service';
import { TransactionsService } from '../transactions/transactions.service';
import { UsersService } from '../users/users.service';
import { WithdrawalStatus, WithdrawalMethod, WithdrawalPriority } from './schemas/withdrawal.schema';
import { TransactionType, TransactionStatus } from '../transactions/schemas/transaction.schema';
import { WalletType } from '../wallet/schemas/wallet.schema';
import { AdminService } from '../admin/admin.service';
import { PaymentsService } from '../payments/payments.service';
import { InvestmentsService } from '../investments/investments.service';

@Injectable()
export class WithdrawalsService {
  constructor(
    @InjectModel(Withdrawal.name) private withdrawalModel: Model<WithdrawalDocument>,
    private readonly walletService: WalletService,
    private readonly transactionsService: TransactionsService,
    private readonly usersService: UsersService,
    @Inject(forwardRef(() => AdminService)) private readonly adminService: AdminService,
    private readonly paymentsService: PaymentsService,
    @Inject(forwardRef(() => InvestmentsService)) private readonly investmentsService: InvestmentsService,
  ) {}

  async createWithdrawal(userId: string, createWithdrawalDto: CreateWithdrawalDto) {
    const { amount, currency, notes } = createWithdrawalDto;

    // Fetch withdrawal settings
    const settings = await this.adminService.getWithdrawalSettings();
    if (amount < settings.minWithdrawalAmount || amount > settings.maxWithdrawalAmount) {
      throw new BadRequestException(
        `Withdrawal amount must be between ₦${settings.minWithdrawalAmount} and ₦${settings.maxWithdrawalAmount}`
      );
    }

    // Check withdrawal policy (ROI only toggle)
    const withdrawalPolicy = await this.adminService.getWithdrawalPolicy();
    const enforceRoiOnly = withdrawalPolicy?.roiOnly !== false;

    if (enforceRoiOnly) {
      // Check if user has active investments
      const activeInvestments = await this.investmentsService.findActiveInvestmentsByUser(userId);
      if (activeInvestments.length === 0) {
        throw new BadRequestException(
          'You must have at least one active investment to withdraw funds. Only ROI earnings can be withdrawn.'
        );
      }

      // Get user's wallet to check available earnings
      const wallet = await this.walletService.findByUserAndType(userId, WalletType.MAIN);
      if (!wallet) {
        throw new BadRequestException('Wallet not found');
      }

      // Check if user has sufficient earnings (not deposits)
      const availableEarnings = currency === 'naira' ? wallet.totalEarnings : wallet.totalEarnings;
      if (availableEarnings < amount) {
        throw new BadRequestException(
          `Insufficient earnings. You can only withdraw your ROI earnings (₦${availableEarnings.toLocaleString()}), not your deposited amounts.`
        );
      }
    }

    // Check if user has sufficient balance
    const hasBalance = await this.walletService.checkBalance(userId, amount, currency);
    if (!hasBalance) {
      throw new BadRequestException(`Insufficient ${currency} balance`);
    }

    // Get user's active bank details
    const bankDetails = await this.usersService.getActiveBankDetails(userId);
    if (!bankDetails) {
      throw new BadRequestException('No active bank details found. Please add your bank details first.');
    }

    // Calculate withdrawal fee using settings.withdrawalFee
    const fee = amount * (settings.withdrawalFee / 100);
    const netAmount = amount - fee;

    // Generate unique reference
    const reference = this.generateReference();

    // Create transaction record
    const transaction = await this.transactionsService.create({
      userId,
      type: TransactionType.WITHDRAWAL,
      amount: -amount, // Negative amount for withdrawal
      currency,
      description: `ROI Withdrawal to ${bankDetails.bankName} - ${bankDetails.accountNumber}`,
      status: TransactionStatus.PENDING,
      reference,
    });

    // Create withdrawal record
    const withdrawal = new this.withdrawalModel({
      userId: new Types.ObjectId(userId),
      amount,
      currency,
      fee,
      netAmount,
      status: WithdrawalStatus.PENDING,
      withdrawalMethod: WithdrawalMethod.BANK_TRANSFER,
      bankDetails: {
        bankName: bankDetails.bankName,
        accountNumber: bankDetails.accountNumber,
        accountName: bankDetails.accountName,
        bankCode: bankDetails.bankCode,
        sortCode: bankDetails.sortCode,
      },
      reference,
      transactionId: transaction._id,
      priority: WithdrawalPriority.NORMAL,
      isAutoDisburseEligible: true,
      notes: notes ? [notes] : [],
      ipAddress: '127.0.0.1', // TODO: Get from request
      userAgent: 'API Request', // TODO: Get from request
      deviceInfo: {
        type: 'web',
        os: 'unknown',
        browser: 'unknown',
      },
    });

    const savedWithdrawal = await withdrawal.save();

    // Deduct amount from wallet
    await this.walletService.withdraw(userId, {
      walletType: WalletType.MAIN,
      amount,
      currency,
      description: `ROI Withdrawal - ${reference}`,
    });

    // Check auto payout setting and process accordingly
    const autoPayout = settings.autoPayout || false;
    
    if (autoPayout) {
      // Auto payout: Call FintavaPay API immediately
      try {
        await this.processPayout(savedWithdrawal);
      } catch (error) {
        // If payout fails, keep withdrawal as pending for manual processing
        console.error('Auto payout failed:', error);
        // Update withdrawal status to indicate auto payout failed
        savedWithdrawal.status = WithdrawalStatus.PENDING;
        savedWithdrawal.autoPayoutFailed = true;
        savedWithdrawal.autoPayoutError = error.message;
        await savedWithdrawal.save();
      }
    }

    return {
      success: true,
      message: autoPayout ? 'ROI withdrawal request created and payout initiated' : 'ROI withdrawal request created successfully',
      data: {
        withdrawalId: savedWithdrawal._id,
        reference: savedWithdrawal.reference,
        amount: savedWithdrawal.amount,
        currency: savedWithdrawal.currency,
        fee: savedWithdrawal.fee,
        netAmount: savedWithdrawal.netAmount,
        status: savedWithdrawal.status,
        bankDetails: savedWithdrawal.bankDetails ? {
          bankName: savedWithdrawal.bankDetails.bankName,
          accountNumber: savedWithdrawal.bankDetails.accountNumber,
          accountName: savedWithdrawal.bankDetails.accountName,
        } : null,
        estimatedProcessingTime: autoPayout ? '2-4 hours' : '24-48 hours',
        createdAt: savedWithdrawal.createdAt,
      },
    };
  }

  /**
   * Process payout for a withdrawal via FintavaPay
   */
  async processPayout(withdrawal: WithdrawalDocument) {
    try {
      if (!withdrawal.bankDetails) {
        throw new BadRequestException('Bank details not found for withdrawal');
      }

      const payoutResponse = await this.paymentsService.merchantTransfer({
        amount: withdrawal.netAmount,
        sortCode: withdrawal.bankDetails.sortCode,
        accountNumber: withdrawal.bankDetails.accountNumber,
        accountName: withdrawal.bankDetails.accountName,
        narration: `Withdrawal payout - ${withdrawal.reference}`,
        customerReference: withdrawal.reference,
        currency: withdrawal.currency === 'naira' ? 'NGN' : withdrawal.currency.toUpperCase(),
        metadata: {
          withdrawalId: withdrawal._id.toString(),
          userId: withdrawal.userId.toString(),
          originalAmount: withdrawal.amount,
          fee: withdrawal.fee,
        },
      });

      // Update withdrawal status to processing
      withdrawal.status = WithdrawalStatus.PROCESSING;
      withdrawal.payoutInitiatedAt = new Date();
      withdrawal.payoutReference = payoutResponse.data?.reference || withdrawal.reference;
      withdrawal.payoutResponse = payoutResponse;
      await withdrawal.save();

      // Update transaction status
      await this.transactionsService.update(withdrawal.transactionId.toString(), {
        status: TransactionStatus.PROCESSING,
        externalReference: payoutResponse.data?.reference || withdrawal.reference,
      });

      return payoutResponse;
    } catch (error) {
      throw new BadRequestException(`Payout processing failed: ${error.message}`);
    }
  }

  /**
   * Admin method to trigger payout for a pending withdrawal
   */
  async triggerPayout(withdrawalId: string) {
    const withdrawal = await this.withdrawalModel.findById(withdrawalId);
    if (!withdrawal) {
      throw new NotFoundException('Withdrawal not found');
    }

    if (withdrawal.status !== WithdrawalStatus.PENDING) {
      throw new BadRequestException('Only pending withdrawals can be processed');
    }

    return await this.processPayout(withdrawal);
  }

  /**
   * Find withdrawal by reference
   */
  async findWithdrawalByReference(reference: string) {
    return await this.withdrawalModel.findOne({ reference });
  }

  private generateReference(): string {
    const timestamp = Date.now().toString();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `WTH${timestamp}${random}`;
  }

  async getUserWithdrawals(userId: string) {
    const withdrawals = await this.withdrawalModel
      .find({ userId: new Types.ObjectId(userId) })
      .sort({ createdAt: -1 });

    return {
      success: true,
      data: withdrawals,
    };
  }

  async getUserWithdrawal(userId: string, withdrawalId: string) {
    const withdrawal = await this.withdrawalModel.findOne({
      _id: withdrawalId,
      userId: new Types.ObjectId(userId),
    });

    if (!withdrawal) {
      throw new NotFoundException('Withdrawal not found');
    }

    return {
      success: true,
      data: withdrawal,
    };
  }

  async cancelWithdrawal(userId: string, withdrawalId: string) {
    const withdrawal = await this.withdrawalModel.findOne({
      _id: withdrawalId,
      userId: new Types.ObjectId(userId),
    });

    if (!withdrawal) {
      throw new NotFoundException('Withdrawal not found');
    }

    if (!withdrawal.canBeCancelled) {
      throw new BadRequestException('This withdrawal cannot be cancelled');
    }

    // Update withdrawal status
    withdrawal.status = WithdrawalStatus.CANCELLED;
    withdrawal.cancelledAt = new Date();
    withdrawal.cancelledBy = new Types.ObjectId(userId);
    withdrawal.cancellationReason = 'Cancelled by user';

    await withdrawal.save();

    // Refund the amount to user's wallet
    await this.walletService.deposit(userId, {
      walletType: WalletType.MAIN,
      amount: withdrawal.amount,
      currency: withdrawal.currency,
      description: `Refund for cancelled withdrawal - ${withdrawal.reference}`,
    });

    // Update transaction status
    await this.transactionsService.update(withdrawal.transactionId.toString(), { status: TransactionStatus.CANCELLED });

    return {
      success: true,
      message: 'Withdrawal cancelled successfully',
      data: {
        withdrawalId: withdrawal._id,
        reference: withdrawal.reference,
        status: withdrawal.status,
        refundedAmount: withdrawal.amount,
        currency: withdrawal.currency,
      },
    };
  }

  async bulkTriggerPayout(withdrawalIds: string[]): Promise<{ processed: string[]; failed: { id: string; error: string }[] }> {
    const processed: string[] = [];
    const failed: { id: string; error: string }[] = [];

    for (const id of withdrawalIds) {
      try {
        const withdrawal = await this.withdrawalModel.findById(id);
        if (!withdrawal) throw new Error('Not found');
        if (![WithdrawalStatus.PENDING, WithdrawalStatus.PROCESSING].includes(withdrawal.status)) {
          throw new Error('Not pending or processing');
        }
        await this.processPayout(withdrawal);
        processed.push(id);
      } catch (error: any) {
        failed.push({ id, error: error.message });
      }
    }
    return { processed, failed };
  }

  async getPendingOrProcessingWithdrawalIds(): Promise<string[]> {
    const withdrawals = await this.withdrawalModel.find({
      status: { $in: [WithdrawalStatus.PENDING, WithdrawalStatus.PROCESSING] }
    }).select('_id');
    return withdrawals.map(w => w._id.toString());
  }

  /**
   * Handle payout webhook from payment provider (FintavaPay)
   */
  async handlePayoutWebhook(reference: string, status: string, webhookData: any) {
    const withdrawal = await this.withdrawalModel.findOne({ reference });
    if (!withdrawal) {
      throw new NotFoundException('Withdrawal not found for webhook');
    }
    // Only update if not already completed/failed
    if ([WithdrawalStatus.COMPLETED, WithdrawalStatus.FAILED, WithdrawalStatus.CANCELLED].includes(withdrawal.status)) {
      return;
    }
    withdrawal.webhookData = webhookData;
    if (status === 'SUCCESS') {
      withdrawal.status = WithdrawalStatus.COMPLETED;
      withdrawal.completedAt = new Date();
      await this.transactionsService.update(withdrawal.transactionId.toString(), {
        status: TransactionStatus.SUCCESS,
        processedAt: new Date(),
        externalReference: webhookData.data.reference,
      });
    } else if (status === 'FAILED') {
      withdrawal.status = WithdrawalStatus.FAILED;
      withdrawal.failedAt = new Date();
      withdrawal.failureReason = webhookData.data.description || 'Payout failed';
      await this.transactionsService.update(withdrawal.transactionId.toString(), {
        status: TransactionStatus.FAILED,
        processedAt: new Date(),
        externalReference: webhookData.data.reference,
      });
      // Refund the amount to user's wallet
      await this.walletService.deposit(withdrawal.userId.toString(), {
        walletType: WalletType.MAIN,
        amount: withdrawal.amount,
        currency: withdrawal.currency,
        description: `Refund for failed withdrawal - ${withdrawal.reference}`,
      });
    }
    await withdrawal.save();
  }
} 