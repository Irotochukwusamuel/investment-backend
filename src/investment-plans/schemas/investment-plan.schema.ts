import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { ApiProperty } from '@nestjs/swagger';

export type InvestmentPlanDocument = InvestmentPlan & Document;

export enum InvestmentPlanStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
}

@Schema({ timestamps: true })
export class InvestmentPlan {
  @ApiProperty({ description: 'Investment plan ID' })
  _id: Types.ObjectId;

  @ApiProperty({ description: 'Plan name' })
  @Prop({ required: true, unique: true, trim: true })
  name: string;

  @ApiProperty({ description: 'Plan description' })
  @Prop({ required: true })
  description: string;

  @ApiProperty({ description: 'Plan currency (naira or usdt)' })
  @Prop({ required: true, enum: ['naira', 'usdt'] })
  currency: 'naira' | 'usdt';

  @ApiProperty({ description: 'Minimum investment amount' })
  @Prop({ required: true, min: 0 })
  minAmount: number;

  @ApiProperty({ description: 'Maximum investment amount' })
  @Prop({ required: true, min: 0 })
  maxAmount: number;

  @ApiProperty({ description: 'Daily ROI percentage' })
  @Prop({ required: true, min: 0, max: 100 })
  dailyRoi: number;

  @ApiProperty({ description: 'Total ROI percentage' })
  @Prop({ required: true, min: 0, max: 1000 })
  totalRoi: number;

  @ApiProperty({ description: 'Investment duration in days' })
  @Prop({ required: true, min: 1 })
  duration: number;

  @ApiProperty({ description: 'Welcome bonus percentage' })
  @Prop({ default: 0, min: 0, max: 100 })
  welcomeBonus: number;

  @ApiProperty({ description: 'Referral bonus percentage' })
  @Prop({ default: 0, min: 0, max: 100 })
  referralBonus: number;

  @ApiProperty({ description: 'Plan features' })
  @Prop({ type: [String], default: [] })
  features: string[];

  @ApiProperty({ description: 'Plan popularity score' })
  @Prop({ default: 0, min: 0, max: 100 })
  popularity: number;

  @ApiProperty({ description: 'Total number of investors' })
  @Prop({ default: 0, min: 0 })
  totalInvestors: number;

  @ApiProperty({ description: 'Total investment volume' })
  @Prop({ default: 0, min: 0 })
  totalVolume: number;

  @ApiProperty({ description: 'Plan status' })
  @Prop({ default: InvestmentPlanStatus.ACTIVE, enum: InvestmentPlanStatus })
  status: InvestmentPlanStatus;

  @ApiProperty({ description: 'Plan priority for display' })
  @Prop({ default: 0 })
  priority: number;

  @ApiProperty({ description: 'Plan icon or image URL' })
  @Prop()
  icon?: string;

  @ApiProperty({ description: 'Plan color theme' })
  @Prop()
  color?: string;

  @ApiProperty({ description: 'Auto-reinvest enabled' })
  @Prop({ default: true })
  autoReinvestEnabled: boolean;

  @ApiProperty({ description: 'Early withdrawal penalty percentage' })
  @Prop({ default: 0, min: 0, max: 100 })
  earlyWithdrawalPenalty: number;

  @ApiProperty({ description: 'Minimum withdrawal amount' })
  @Prop({ default: 0, min: 0 })
  minWithdrawalAmount: number;

  @ApiProperty({ description: 'Maximum withdrawal amount' })
  @Prop({ default: 0, min: 0 })
  maxWithdrawalAmount: number;

  @ApiProperty({ description: 'Withdrawal processing time in hours' })
  @Prop({ default: 24, min: 0 })
  withdrawalProcessingTime: number;

  @ApiProperty({ description: 'Plan created at timestamp' })
  createdAt: Date;

  @ApiProperty({ description: 'Plan updated at timestamp' })
  updatedAt: Date;

  @Prop({ default: 0 })
  currentTotalInvestment: number;

  @Prop({ default: 0 })
  maxTotalInvestment: number;

  @Prop({ default: false })
  featured: boolean;
}

export const InvestmentPlanSchema = SchemaFactory.createForClass(InvestmentPlan);

// Indexes for better query performance
InvestmentPlanSchema.index({ currency: 1, status: 1 });
InvestmentPlanSchema.index({ status: 1, priority: -1 });
InvestmentPlanSchema.index({ minAmount: 1, maxAmount: 1 });
InvestmentPlanSchema.index({ dailyRoi: -1 });
InvestmentPlanSchema.index({ popularity: -1 });
InvestmentPlanSchema.index({ name: 1 });

// Virtual for formatted daily ROI
InvestmentPlanSchema.virtual('dailyRoiFormatted').get(function() {
  return `${this.dailyRoi}%`;
});

// Virtual for formatted total ROI
InvestmentPlanSchema.virtual('totalRoiFormatted').get(function() {
  return `${this.totalRoi}%`;
});

// Virtual for formatted amount range
InvestmentPlanSchema.virtual('amountRange').get(function() {
  const currency = this.currency === 'naira' ? '₦' : 'USDT';
  return `${currency}${this.minAmount.toLocaleString()} - ${currency}${this.maxAmount.toLocaleString()}`;
});

// Virtual for formatted duration
InvestmentPlanSchema.virtual('durationFormatted').get(function() {
  return `${this.duration} days`;
});

// Ensure virtual fields are serialized
InvestmentPlanSchema.set('toJSON', { virtuals: true });
InvestmentPlanSchema.set('toObject', { virtuals: true }); 