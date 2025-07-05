import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { ApiProperty } from '@nestjs/swagger';

export type WithdrawalDocument = Withdrawal & Document;

export enum WithdrawalStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

export enum WithdrawalMethod {
  BANK_TRANSFER = 'bank_transfer',
  CRYPTO = 'crypto',
}

export enum WithdrawalPriority {
  LOW = 0,
  NORMAL = 1,
  HIGH = 2,
  URGENT = 3,
}

@Schema({ timestamps: true })
export class Withdrawal {
  @ApiProperty({ description: 'Withdrawal ID' })
  _id: Types.ObjectId;

  @ApiProperty({ description: 'User ID' })
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @ApiProperty({ description: 'Withdrawal amount' })
  @Prop({ required: true })
  amount: number;

  @ApiProperty({ description: 'Withdrawal currency' })
  @Prop({ required: true, enum: ['naira', 'usdt'] })
  currency: 'naira' | 'usdt';

  @ApiProperty({ description: 'Withdrawal fee' })
  @Prop({ required: true })
  fee: number;

  @ApiProperty({ description: 'Net amount to be disbursed' })
  @Prop({ required: true })
  netAmount: number;

  @ApiProperty({ description: 'Withdrawal status' })
  @Prop({ required: true, enum: WithdrawalStatus, default: WithdrawalStatus.PENDING })
  status: WithdrawalStatus;

  @ApiProperty({ description: 'Withdrawal method' })
  @Prop({ required: true, enum: WithdrawalMethod })
  withdrawalMethod: WithdrawalMethod;

  @ApiProperty({ description: 'Bank transfer details' })
  @Prop({ type: Object, default: null })
  bankDetails?: {
    bankName: string;
    accountNumber: string;
    accountName: string;
    bankCode: string;
    sortCode: string;
  };

  @ApiProperty({ description: 'Crypto transfer details' })
  @Prop({ type: Object, default: null })
  cryptoDetails?: {
    walletAddress: string;
    network: string;
  };

  @ApiProperty({ description: 'Withdrawal reference' })
  @Prop({ required: true, unique: true })
  reference: string;

  @ApiProperty({ description: 'External reference from payment provider' })
  @Prop({ default: null })
  externalReference?: string;

  @ApiProperty({ description: 'Related transaction ID' })
  @Prop({ type: Types.ObjectId, ref: 'Transaction', required: true })
  transactionId: Types.ObjectId;

  @ApiProperty({ description: 'Withdrawal priority for processing' })
  @Prop({ default: WithdrawalPriority.NORMAL })
  priority: WithdrawalPriority;

  @ApiProperty({ description: 'Is eligible for auto-disbursement' })
  @Prop({ default: false })
  isAutoDisburseEligible: boolean;

  @ApiProperty({ description: 'Auto-disbursement attempted' })
  @Prop({ default: false })
  autoDisburseAttempted: boolean;

  @ApiProperty({ description: 'Auto-disbursement failure reason' })
  @Prop({ default: null })
  autoDisburseFailureReason?: string;

  @ApiProperty({ description: 'Auto payout failed flag' })
  @Prop({ default: false })
  autoPayoutFailed?: boolean;

  @ApiProperty({ description: 'Auto payout error message' })
  @Prop({ default: null })
  autoPayoutError?: string;

  @ApiProperty({ description: 'Payout initiated timestamp' })
  @Prop({ default: null })
  payoutInitiatedAt?: Date;

  @ApiProperty({ description: 'Payout reference from payment provider' })
  @Prop({ default: null })
  payoutReference?: string;

  @ApiProperty({ description: 'Payout response from payment provider' })
  @Prop({ type: Object, default: null })
  payoutResponse?: any;

  @ApiProperty({ description: 'Webhook data from payment provider' })
  @Prop({ type: Object, default: null })
  webhookData?: any;

  @ApiProperty({ description: 'Completed timestamp' })
  @Prop({ default: null })
  completedAt?: Date;

  @ApiProperty({ description: 'Requires manual approval' })
  @Prop({ default: false })
  requiresManualApproval: boolean;

  @ApiProperty({ description: 'Manual approval reason' })
  @Prop({ default: null })
  manualApprovalReason?: string;

  @ApiProperty({ description: 'Processing started date' })
  @Prop({ default: null })
  processingStartedAt?: Date;

  @ApiProperty({ description: 'Processing completed date' })
  @Prop({ default: null })
  processedAt?: Date;

  @ApiProperty({ description: 'Processed by admin user ID' })
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

  @ApiProperty({ description: 'Cancelled by user ID' })
  @Prop({ type: Types.ObjectId, ref: 'User' })
  cancelledBy?: Types.ObjectId;

  @ApiProperty({ description: 'Cancellation reason' })
  @Prop({ default: null })
  cancellationReason?: string;

  @ApiProperty({ description: 'Retry count for failed auto-disbursements' })
  @Prop({ default: 0 })
  retryCount: number;

  @ApiProperty({ description: 'Next retry date' })
  @Prop({ default: null })
  nextRetryAt?: Date;

  @ApiProperty({ description: 'Maximum retry attempts' })
  @Prop({ default: 3 })
  maxRetries: number;

  @ApiProperty({ description: 'Processing notes' })
  @Prop({ default: [] })
  notes: string[];

  @ApiProperty({ description: 'Admin tags for categorization' })
  @Prop({ default: [] })
  tags: string[];

  @ApiProperty({ description: 'IP address of request' })
  @Prop({ default: null })
  ipAddress?: string;

  @ApiProperty({ description: 'User agent of request' })
  @Prop({ default: null })
  userAgent?: string;

  @ApiProperty({ description: 'Device info' })
  @Prop({ type: Object, default: null })
  deviceInfo?: {
    type: string;
    os: string;
    browser: string;
  };

  @ApiProperty({ description: 'Fraud check status' })
  @Prop({ default: null })
  fraudCheckStatus?: 'pending' | 'passed' | 'failed' | 'manual_review';

  @ApiProperty({ description: 'Fraud check score' })
  @Prop({ default: null })
  fraudScore?: number;

  @ApiProperty({ description: 'Fraud check details' })
  @Prop({ type: Object, default: null })
  fraudCheckDetails?: {
    riskLevel: 'low' | 'medium' | 'high';
    reasons: string[];
    checkedAt: Date;
  };

  @ApiProperty({ description: 'Compliance check status' })
  @Prop({ default: null })
  complianceCheckStatus?: 'pending' | 'passed' | 'failed' | 'manual_review';

  @ApiProperty({ description: 'Compliance notes' })
  @Prop({ default: null })
  complianceNotes?: string;

  @ApiProperty({ description: 'Withdrawal created at timestamp' })
  createdAt: Date;

  @ApiProperty({ description: 'Withdrawal updated at timestamp' })
  updatedAt: Date;

  // Virtual getters
  get isProcessable(): boolean {
    return this.status === WithdrawalStatus.PENDING && 
           !this.requiresManualApproval &&
           (this.fraudCheckStatus === 'passed' || this.fraudCheckStatus === null) &&
           (this.complianceCheckStatus === 'passed' || this.complianceCheckStatus === null);
  }

  get canBeAutoProcessed(): boolean {
    return this.isAutoDisburseEligible && 
           !this.autoDisburseAttempted &&
           this.isProcessable &&
           this.retryCount < this.maxRetries;
  }

  get canBeRetried(): boolean {
    return this.status === WithdrawalStatus.FAILED &&
           this.retryCount < this.maxRetries &&
           (!this.nextRetryAt || this.nextRetryAt <= new Date());
  }

  get canBeCancelled(): boolean {
    return this.status === WithdrawalStatus.PENDING || 
           this.status === WithdrawalStatus.PROCESSING;
  }

  get isHighPriority(): boolean {
    return this.priority >= WithdrawalPriority.HIGH;
  }

  get processingTimeHours(): number {
    if (!this.processingStartedAt || !this.processedAt) return 0;
    return (this.processedAt.getTime() - this.processingStartedAt.getTime()) / (1000 * 60 * 60);
  }

  get formattedAmount(): string {
    const symbol = this.currency === 'naira' ? '₦' : '$';
    return `${symbol}${this.amount.toLocaleString()}`;
  }

  get formattedNetAmount(): string {
    const symbol = this.currency === 'naira' ? '₦' : '$';
    return `${symbol}${this.netAmount.toLocaleString()}`;
  }
}

export const WithdrawalSchema = SchemaFactory.createForClass(Withdrawal);

// Indexes
WithdrawalSchema.index({ userId: 1, status: 1 });
WithdrawalSchema.index({ status: 1, priority: -1, createdAt: 1 });
WithdrawalSchema.index({ transactionId: 1 });
WithdrawalSchema.index({ isAutoDisburseEligible: 1, autoDisburseAttempted: 1 });
WithdrawalSchema.index({ nextRetryAt: 1 });
WithdrawalSchema.index({ createdAt: -1 });

// Add virtual getters to schema
WithdrawalSchema.virtual('isProcessable').get(function() {
  return this.status === WithdrawalStatus.PENDING && 
         !this.requiresManualApproval &&
         (this.fraudCheckStatus === 'passed' || this.fraudCheckStatus === null) &&
         (this.complianceCheckStatus === 'passed' || this.complianceCheckStatus === null);
});

WithdrawalSchema.virtual('canBeAutoProcessed').get(function() {
  return this.isAutoDisburseEligible && 
         !this.autoDisburseAttempted &&
         this.isProcessable &&
         this.retryCount < this.maxRetries;
});

WithdrawalSchema.virtual('canBeRetried').get(function() {
  return this.status === WithdrawalStatus.FAILED &&
         this.retryCount < this.maxRetries &&
         (!this.nextRetryAt || this.nextRetryAt <= new Date());
});

WithdrawalSchema.virtual('canBeCancelled').get(function() {
  return this.status === WithdrawalStatus.PENDING || 
         this.status === WithdrawalStatus.PROCESSING;
});

WithdrawalSchema.virtual('isHighPriority').get(function() {
  return this.priority >= WithdrawalPriority.HIGH;
});

WithdrawalSchema.virtual('processingTimeHours').get(function() {
  if (!this.processingStartedAt || !this.processedAt) return 0;
  return (this.processedAt.getTime() - this.processingStartedAt.getTime()) / (1000 * 60 * 60);
});

WithdrawalSchema.virtual('formattedAmount').get(function() {
  const symbol = this.currency === 'naira' ? '₦' : '$';
  return `${symbol}${this.amount.toLocaleString()}`;
});

WithdrawalSchema.virtual('formattedNetAmount').get(function() {
  const symbol = this.currency === 'naira' ? '₦' : '$';
  return `${symbol}${this.netAmount.toLocaleString()}`;
}); 