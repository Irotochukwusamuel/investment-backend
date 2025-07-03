import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { ApiProperty } from '@nestjs/swagger';

export type TransactionDocument = Transaction & Document;

export enum TransactionStatus {
  PENDING = 'pending',
  SUCCESS = 'success',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

export enum TransactionType {
  DEPOSIT = 'deposit',
  WITHDRAWAL = 'withdrawal',
  INVESTMENT = 'investment',
  ROI = 'roi',
  REFERRAL = 'referral',
  BONUS = 'bonus',
  TRANSFER = 'transfer',
  ADJUSTMENT = 'adjustment',
}

@Schema({ timestamps: true })
export class Transaction {
  @ApiProperty({ description: 'Transaction ID' })
  _id: Types.ObjectId;

  @ApiProperty({ description: 'User ID' })
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @ApiProperty({ description: 'Transaction type' })
  @Prop({ required: true, enum: TransactionType })
  type: TransactionType;

  @ApiProperty({ description: 'Transaction status' })
  @Prop({ required: true, enum: TransactionStatus, default: TransactionStatus.PENDING })
  status: TransactionStatus;

  @ApiProperty({ description: 'Transaction amount' })
  @Prop({ required: true })
  amount: number;

  @ApiProperty({ description: 'Transaction currency' })
  @Prop({ required: true, enum: ['naira', 'usdt'] })
  currency: 'naira' | 'usdt';

  @ApiProperty({ description: 'Transaction description' })
  @Prop({ required: true })
  description: string;

  @ApiProperty({ description: 'Transaction reference' })
  @Prop({ default: null })
  reference?: string;

  @ApiProperty({ description: 'External transaction reference' })
  @Prop({ default: null })
  externalReference?: string;

  @ApiProperty({ description: 'Related investment ID' })
  @Prop({ type: Types.ObjectId, ref: 'Investment' })
  investmentId?: Types.ObjectId;

  @ApiProperty({ description: 'Related investment plan ID' })
  @Prop({ type: Types.ObjectId, ref: 'InvestmentPlan' })
  planId?: Types.ObjectId;

  @ApiProperty({ description: 'Related transaction ID' })
  @Prop({ type: Types.ObjectId, ref: 'Transaction' })
  relatedTransactionId?: Types.ObjectId;

  @ApiProperty({ description: 'Transaction fee' })
  @Prop({ default: null })
  fee?: number;

  @ApiProperty({ description: 'Transaction fee percentage' })
  @Prop({ default: null })
  feePercentage?: number;

  @ApiProperty({ description: 'Net transaction amount' })
  @Prop({ default: null })
  netAmount?: number;

  @ApiProperty({ description: 'Transaction exchange rate' })
  @Prop({ default: null })
  exchangeRate?: number;

  @ApiProperty({ description: 'Converted transaction amount' })
  @Prop({ default: null })
  convertedAmount?: number;

  @ApiProperty({ description: 'Converted transaction currency' })
  @Prop({ default: null })
  convertedCurrency?: string;

  @ApiProperty({ description: 'Payment method' })
  @Prop({ default: null })
  paymentMethod?: string;

  @ApiProperty({ description: 'Payment provider' })
  @Prop({ default: null })
  paymentProvider?: string;

  @ApiProperty({ description: 'Payment details' })
  @Prop({ type: Object, default: null })
  paymentDetails?: {
    bankName?: string;
    accountNumber?: string;
    accountName?: string;
    walletAddress?: string;
    network?: string;
    transactionHash?: string;
  };

  @ApiProperty({ description: 'Transaction metadata' })
  @Prop({ type: Object, default: null })
  metadata?: {
    ip?: string;
    userAgent?: string;
    location?: string;
    device?: string;
    [key: string]: any;
  };

  @ApiProperty({ description: 'Processing date' })
  @Prop({ default: null })
  processedAt?: Date;

  @ApiProperty({ description: 'Processed by' })
  @Prop({ type: Types.ObjectId, ref: 'User' })
  processedBy?: Types.ObjectId;

  @ApiProperty({ description: 'Failed date' })
  @Prop({ default: null })
  failedAt?: Date;

  @ApiProperty({ description: 'Failure reason' })
  @Prop({ default: null })
  failureReason?: string;

  @ApiProperty({ description: 'Cancelled date' })
  @Prop({ default: null })
  cancelledAt?: Date;

  @ApiProperty({ description: 'Cancelled by' })
  @Prop({ type: Types.ObjectId, ref: 'User' })
  cancelledBy?: Types.ObjectId;

  @ApiProperty({ description: 'Cancellation reason' })
  @Prop({ default: null })
  cancellationReason?: string;

  @ApiProperty({ description: 'Retry count' })
  @Prop({ default: 0 })
  retryCount: number;

  @ApiProperty({ description: 'Next retry date' })
  @Prop({ default: null })
  nextRetryAt?: Date;

  @ApiProperty({ description: 'Is reversed' })
  @Prop({ default: false })
  isReversed: boolean;

  @ApiProperty({ description: 'Reversal transaction ID' })
  @Prop({ type: Types.ObjectId, ref: 'Transaction' })
  reversalTransactionId?: Types.ObjectId;

  @ApiProperty({ description: 'Reversed date' })
  @Prop({ default: null })
  reversedAt?: Date;

  @ApiProperty({ description: 'Reversed by' })
  @Prop({ type: Types.ObjectId, ref: 'User' })
  reversedBy?: Types.ObjectId;

  @ApiProperty({ description: 'Reversal reason' })
  @Prop({ default: null })
  reversalReason?: string;

  @ApiProperty({ description: 'Transaction notes' })
  @Prop({ default: [] })
  notes: string[];

  @ApiProperty({ description: 'Transaction tags' })
  @Prop({ default: null })
  tags?: string[];

  @ApiProperty({ description: 'Transaction priority' })
  @Prop({ default: 0 })
  priority: number;

  @ApiProperty({ description: 'Is automated' })
  @Prop({ default: false })
  isAutomated: boolean;

  @ApiProperty({ description: 'Scheduled date' })
  @Prop({ default: null })
  scheduledAt?: Date;

  @ApiProperty({ description: 'Executed date' })
  @Prop({ default: null })
  executedAt?: Date;

  @ApiProperty({ description: 'Transaction created at timestamp' })
  createdAt: Date;

  @ApiProperty({ description: 'Transaction updated at timestamp' })
  updatedAt: Date;

  // Virtual for is overdue
  get isOverdue(): boolean {
    if (this.status !== 'pending') return false;
    const hoursSinceCreation = (Date.now() - this.createdAt.getTime()) / (1000 * 60 * 60);
    return hoursSinceCreation > 24; // Overdue after 24 hours
  }

  // Virtual for can be retried
  get canBeRetried(): boolean {
    return this.status === 'failed' && this.retryCount < 3;
  }

  // Virtual for can be cancelled
  get canBeCancelled(): boolean {
    return this.status === 'pending' && !this.isAutomated;
  }

  // Virtual for can be reversed
  get canBeReversed(): boolean {
    return this.status === TransactionStatus.SUCCESS && !this.isReversed;
  }

  // Virtual for is high priority
  get isHighPriority(): boolean {
    return this.priority >= 8 || this.amount > 1000000; // High amount or priority
  }

  // Virtual for formatted amount
  get formattedAmount(): string {
    const symbol = this.currency === 'naira' ? '₦' : 'USDT';
    return `${symbol}${this.amount.toLocaleString()}`;
  }

  // Virtual for formatted net amount
  get formattedNetAmount(): string {
    if (!this.netAmount) return this.formattedAmount;
    const symbol = this.currency === 'naira' ? '₦' : 'USDT';
    return `${symbol}${this.netAmount.toLocaleString()}`;
  }
}

export const TransactionSchema = SchemaFactory.createForClass(Transaction);

// Indexes for better query performance
TransactionSchema.index({ userId: 1, status: 1 });
TransactionSchema.index({ type: 1, status: 1 });
TransactionSchema.index({ status: 1, createdAt: -1 });
TransactionSchema.index({ reference: 1 });
TransactionSchema.index({ externalReference: 1 });
TransactionSchema.index({ investmentId: 1 });
TransactionSchema.index({ processedAt: 1 });
TransactionSchema.index({ scheduledAt: 1 });
TransactionSchema.index({ priority: -1, createdAt: 1 });

// Virtual fields
TransactionSchema.virtual('isOverdue').get(function() {
  if (this.status !== 'pending') return false;
  const hoursSinceCreation = (Date.now() - this.createdAt.getTime()) / (1000 * 60 * 60);
  return hoursSinceCreation > 24;
});

TransactionSchema.virtual('canBeRetried').get(function() {
  return this.status === 'failed' && this.retryCount < 3;
});

TransactionSchema.virtual('canBeCancelled').get(function() {
  return this.status === 'pending' && !this.isAutomated;
});

TransactionSchema.virtual('canBeReversed').get(function() {
  return this.status === TransactionStatus.SUCCESS && !this.isReversed;
});

TransactionSchema.virtual('isHighPriority').get(function() {
  return this.priority >= 8 || this.amount > 1000000;
});

TransactionSchema.virtual('formattedAmount').get(function() {
  const symbol = this.currency === 'naira' ? '₦' : 'USDT';
  return `${symbol}${this.amount.toLocaleString()}`;
});

TransactionSchema.virtual('formattedNetAmount').get(function() {
  if (!this.netAmount) return this.formattedAmount;
  const symbol = this.currency === 'naira' ? '₦' : 'USDT';
  return `${symbol}${this.netAmount.toLocaleString()}`;
});

// Ensure virtual fields are serialized
TransactionSchema.set('toJSON', { virtuals: true });
TransactionSchema.set('toObject', { virtuals: true });

// Pre-save middleware to calculate derived fields
TransactionSchema.pre('save', function(next) {
  // Calculate net amount if fee is present
  if (this.fee && this.fee > 0) {
    this.netAmount = this.amount - this.fee;
  } else if (this.feePercentage && this.feePercentage > 0) {
    this.fee = (this.amount * this.feePercentage) / 100;
    this.netAmount = this.amount - this.fee;
  } else {
    this.netAmount = this.amount;
  }

  // Set priority based on type and amount
  if (this.type === 'withdrawal' && this.amount > 500000) {
    this.priority = 10; // High priority for large withdrawals
  } else if (this.type === 'deposit' && this.amount > 1000000) {
    this.priority = 9; // High priority for large deposits
  } else if (this.type === 'roi') {
    this.priority = 8; // High priority for ROI payments
  } else if (this.type === 'investment') {
    this.priority = 7; // Medium-high priority for investments
  } else {
    this.priority = 5; // Default priority
  }

  next();
});

// Method to mark as processed
TransactionSchema.methods.markAsProcessed = function(processedBy: Types.ObjectId) {
  this.status = 'completed';
  this.processedAt = new Date();
  this.processedBy = processedBy;
  return this.save();
};

// Method to mark as failed
TransactionSchema.methods.markAsFailed = function(reason: string) {
  this.status = 'failed';
  this.failedAt = new Date();
  this.failureReason = reason;
  return this.save();
};

// Method to retry
TransactionSchema.methods.retry = function() {
  if (this.canBeRetried) {
    this.status = 'pending';
    this.retryCount += 1;
    this.nextRetryAt = new Date(Date.now() + (this.retryCount * 30 * 60 * 1000)); // 30 min intervals
    return this.save();
  }
  throw new Error('Transaction cannot be retried');
};

// Method to cancel
TransactionSchema.methods.cancel = function(cancelledBy: Types.ObjectId, reason: string) {
  if (this.canBeCancelled) {
    this.status = 'cancelled';
    this.cancelledAt = new Date();
    this.cancelledBy = cancelledBy;
    this.cancellationReason = reason;
    return this.save();
  }
  throw new Error('Transaction cannot be cancelled');
};

// Method to reverse
TransactionSchema.methods.reverse = function(reversedBy: Types.ObjectId, reason: string) {
  if (this.canBeReversed) {
    this.isReversed = true;
    this.reversedAt = new Date();
    this.reversedBy = reversedBy;
    this.reversalReason = reason;
    return this.save();
  }
  throw new Error('Transaction cannot be reversed');
}; 