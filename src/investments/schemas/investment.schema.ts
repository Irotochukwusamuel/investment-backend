import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { ApiProperty } from '@nestjs/swagger';

export type InvestmentDocument = Investment & Document;

export enum InvestmentStatus {
  ACTIVE = 'active',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  SUSPENDED = 'suspended',
}

export enum InvestmentType {
  FIXED = 'fixed',
  FLEXIBLE = 'flexible',
}

@Schema({ timestamps: true })
export class Investment {
  @ApiProperty({ description: 'Investment ID' })
  _id: Types.ObjectId;

  @ApiProperty({ description: 'User ID who made the investment' })
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @ApiProperty({ description: 'Investment plan ID' })
  @Prop({ type: Types.ObjectId, ref: 'InvestmentPlan', required: true })
  planId: Types.ObjectId;

  @ApiProperty({ description: 'Investment amount' })
  @Prop({ required: true, min: 0 })
  amount: number;

  @ApiProperty({ description: 'Investment currency' })
  @Prop({ required: true, enum: ['naira', 'usdt'] })
  currency: 'naira' | 'usdt';

  @ApiProperty({ description: 'Daily ROI percentage' })
  @Prop({ required: true, min: 0, max: 100 })
  dailyRoi: number;

  @ApiProperty({ description: 'Total ROI percentage' })
  @Prop({ required: true, min: 0, max: 1000 })
  totalRoi: number;

  @ApiProperty({ description: 'Investment duration in days' })
  @Prop({ required: true, min: 1 })
  duration: number;

  @ApiProperty({ description: 'Investment start date' })
  @Prop({ required: true })
  startDate: Date;

  @ApiProperty({ description: 'Investment end date' })
  @Prop({ required: true })
  endDate: Date;

  @ApiProperty({ description: 'Current earned amount' })
  @Prop({ default: 0, min: 0 })
  earnedAmount: number;

  @ApiProperty({ description: 'Total expected return' })
  @Prop({ required: true, min: 0 })
  expectedReturn: number;

  @ApiProperty({ description: 'Investment status' })
  @Prop({ default: InvestmentStatus.ACTIVE, enum: InvestmentStatus })
  status: InvestmentStatus;

  @ApiProperty({ description: 'Investment type' })
  @Prop({ default: InvestmentType.FIXED, enum: InvestmentType })
  type: InvestmentType;

  @ApiProperty({ description: 'Auto-reinvest enabled' })
  @Prop({ default: false })
  autoReinvest: boolean;

  @ApiProperty({ description: 'Last ROI update timestamp' })
  @Prop({ default: Date.now })
  lastRoiUpdate: Date;

  @ApiProperty({ description: 'Next ROI update timestamp' })
  @Prop({ required: true })
  nextRoiUpdate: Date;

  @ApiProperty({ description: 'Welcome bonus amount' })
  @Prop({ default: 0, min: 0 })
  welcomeBonus: number;

  @ApiProperty({ description: 'Referral bonus amount' })
  @Prop({ default: 0, min: 0 })
  referralBonus: number;

  @ApiProperty({ description: 'Transaction ID for the investment' })
  @Prop({ type: Types.ObjectId, ref: 'Transaction' })
  transactionId?: Types.ObjectId;

  @ApiProperty({ description: 'Investment notes' })
  @Prop()
  notes?: string;

  @ApiProperty({ description: 'Investment created at timestamp' })
  createdAt: Date;

  @ApiProperty({ description: 'Investment updated at timestamp' })
  updatedAt: Date;
}

export const InvestmentSchema = SchemaFactory.createForClass(Investment);

// Indexes for better query performance
InvestmentSchema.index({ userId: 1, status: 1 });
InvestmentSchema.index({ planId: 1, status: 1 });
InvestmentSchema.index({ status: 1, nextRoiUpdate: 1 });
InvestmentSchema.index({ startDate: 1, endDate: 1 });
InvestmentSchema.index({ createdAt: -1 });

// Virtual for formatted earned amount
InvestmentSchema.virtual('earnedAmountFormatted').get(function() {
  const currency = this.currency === 'naira' ? '₦' : 'USDT';
  return `${currency}${this.earnedAmount.toLocaleString()}`;
});

// Virtual for formatted expected return
InvestmentSchema.virtual('expectedReturnFormatted').get(function() {
  const currency = this.currency === 'naira' ? '₦' : 'USDT';
  return `${currency}${this.expectedReturn.toLocaleString()}`;
});

// Virtual for formatted amount
InvestmentSchema.virtual('amountFormatted').get(function() {
  const currency = this.currency === 'naira' ? '₦' : 'USDT';
  return `${currency}${this.amount.toLocaleString()}`;
});

// Virtual for days remaining
InvestmentSchema.virtual('daysRemaining').get(function() {
  const now = new Date();
  const end = new Date(this.endDate);
  const diffTime = end.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return Math.max(0, diffDays);
});

// Virtual for progress percentage
InvestmentSchema.virtual('progressPercentage').get(function() {
  const now = new Date();
  const start = new Date(this.startDate);
  const end = new Date(this.endDate);
  const totalDuration = end.getTime() - start.getTime();
  const elapsed = now.getTime() - start.getTime();
  const percentage = (elapsed / totalDuration) * 100;
  return Math.min(100, Math.max(0, percentage));
});

// Ensure virtual fields are serialized
InvestmentSchema.set('toJSON', { virtuals: true });
InvestmentSchema.set('toObject', { virtuals: true }); 