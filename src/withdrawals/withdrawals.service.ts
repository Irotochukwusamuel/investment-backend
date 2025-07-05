import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
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

@Injectable()
export class WithdrawalsService {
  constructor(
    @InjectModel(Withdrawal.name) private withdrawalModel: Model<WithdrawalDocument>,
    private readonly walletService: WalletService,
    private readonly transactionsService: TransactionsService,
    private readonly usersService: UsersService,
  ) {}

  async createWithdrawal(userId: string, createWithdrawalDto: CreateWithdrawalDto) {
    const { amount, currency, notes } = createWithdrawalDto;

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

    // Calculate withdrawal fee
    const fee = this.calculateWithdrawalFee(amount, currency);
    const netAmount = amount - fee;

    // Generate unique reference
    const reference = this.generateReference();

    // Create transaction record
    const transaction = await this.transactionsService.create({
      userId,
      type: TransactionType.WITHDRAWAL,
      amount: -amount, // Negative amount for withdrawal
      currency,
      description: `Withdrawal to ${bankDetails.bankName} - ${bankDetails.accountNumber}`,
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
      description: `Withdrawal - ${reference}`,
    });

    return {
      success: true,
      message: 'Withdrawal request created successfully',
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
        estimatedProcessingTime: '24-48 hours',
        createdAt: savedWithdrawal.createdAt,
      },
    };
  }

  private calculateWithdrawalFee(amount: number, currency: string): number {
    // Different fee structures for different currencies
    switch (currency) {
      case 'naira':
        return Math.max(100, amount * 0.01); // 1% fee, minimum ₦100
      case 'usdt':
        return Math.max(1, amount * 0.02); // 2% fee, minimum $1
      default:
        return 0;
    }
  }

  private generateReference(): string {
    const timestamp = Date.now().toString();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `WTH${timestamp}${random}`;
  }
} 