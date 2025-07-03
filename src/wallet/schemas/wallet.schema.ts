import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { ApiProperty } from '@nestjs/swagger';

export type WalletDocument = Wallet & Document;

export enum WalletType {
  MAIN = 'main',
  PROFIT = 'profit',
  BONUS = 'bonus',
}

@Schema({ timestamps: true })
export class Wallet {
  @ApiProperty({ description: 'Wallet ID' })
  _id: Types.ObjectId;

  @ApiProperty({ description: 'User ID' })
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @ApiProperty({ description: 'Wallet type' })
  @Prop({ required: true, enum: WalletType, default: WalletType.MAIN })
  type: WalletType;

  @ApiProperty({ description: 'Naira balance' })
  @Prop({ default: 0, min: 0 })
  nairaBalance: number;

  @ApiProperty({ description: 'USDT balance' })
  @Prop({ default: 0, min: 0 })
  usdtBalance: number;

  @ApiProperty({ description: 'Total deposits' })
  @Prop({ default: 0, min: 0 })
  totalDeposits: number;

  @ApiProperty({ description: 'Total withdrawals' })
  @Prop({ default: 0, min: 0 })
  totalWithdrawals: number;

  @ApiProperty({ description: 'Total investments' })
  @Prop({ default: 0, min: 0 })
  totalInvestments: number;

  @ApiProperty({ description: 'Total earnings' })
  @Prop({ default: 0, min: 0 })
  totalEarnings: number;

  @ApiProperty({ description: 'Total bonuses' })
  @Prop({ default: 0, min: 0 })
  totalBonuses: number;

  @ApiProperty({ description: 'Total referral earnings' })
  @Prop({ default: 0, min: 0 })
  totalReferralEarnings: number;

  @ApiProperty({ description: 'Last transaction date' })
  @Prop({ default: null })
  lastTransactionDate?: Date;

  @ApiProperty({ description: 'Wallet status' })
  @Prop({ default: 'active', enum: ['active', 'suspended', 'locked'] })
  status: 'active' | 'suspended' | 'locked';

  @ApiProperty({ description: 'Wallet created at timestamp' })
  createdAt: Date;

  @ApiProperty({ description: 'Wallet updated at timestamp' })
  updatedAt: Date;
}

export const WalletSchema = SchemaFactory.createForClass(Wallet);

// Indexes for better query performance
WalletSchema.index({ userId: 1, type: 1 });
WalletSchema.index({ userId: 1, status: 1 });
WalletSchema.index({ type: 1, status: 1 });

// Virtual for formatted naira balance
WalletSchema.virtual('nairaBalanceFormatted').get(function() {
  return `₦${this.nairaBalance.toLocaleString()}`;
});

// Virtual for formatted USDT balance
WalletSchema.virtual('usdtBalanceFormatted').get(function() {
  return `USDT ${this.usdtBalance.toLocaleString()}`;
});

// Virtual for total balance in naira
WalletSchema.virtual('totalBalanceNaira').get(function() {
  // Assuming 1 USDT = 1500 Naira (you can make this dynamic)
  const usdtInNaira = this.usdtBalance * 1500;
  return this.nairaBalance + usdtInNaira;
});

// Virtual for total balance in USDT
WalletSchema.virtual('totalBalanceUsdt').get(function() {
  // Assuming 1 USDT = 1500 Naira (you can make this dynamic)
  const nairaInUsdt = this.nairaBalance / 1500;
  return this.usdtBalance + nairaInUsdt;
});

// Ensure virtual fields are serialized
WalletSchema.set('toJSON', { virtuals: true });
WalletSchema.set('toObject', { virtuals: true }); 