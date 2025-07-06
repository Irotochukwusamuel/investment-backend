import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ReferralDocument = Referral & Document;

@Schema({ timestamps: true })
export class Referral {
  _id: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  referrerId: Types.ObjectId; // The user who made the referral

  @Prop({ type: Types.ObjectId, ref: 'User', required: true, unique: true })
  referredUserId: Types.ObjectId; // The user who was referred

  @Prop({ required: true })
  referralCode: string; // The referral code used

  @Prop({ default: false })
  isActive: boolean; // Whether the referred user is active

  @Prop({ default: 0 })
  totalEarnings: number; // Total earnings from this referral

  @Prop({ default: 0 })
  totalInvestments: number; // Total investments made by referred user

  @Prop({ default: 0 })
  referralBonus: number; // Bonus earned by referrer

  @Prop({ default: false })
  bonusPaid: boolean; // Whether bonus has been paid to referrer

  @Prop()
  bonusPaidAt?: Date; // When bonus was paid

  @Prop({ default: false })
  welcomeBonusPaid: boolean; // Whether welcome bonus was paid to referred user

  @Prop()
  welcomeBonusPaidAt?: Date; // When welcome bonus was paid

  @Prop({ default: 'pending' })
  status: 'pending' | 'active' | 'inactive' | 'completed'; // Referral status

  @Prop()
  firstInvestmentAt?: Date; // When referred user made first investment

  @Prop()
  lastActivityAt?: Date; // Last activity from referred user

  @Prop()
  notes?: string; // Additional notes about the referral

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

export const ReferralSchema = SchemaFactory.createForClass(Referral);

// Indexes for efficient queries
ReferralSchema.index({ referrerId: 1 }); // Find all referrals by a user
ReferralSchema.index({ referredUserId: 1 }); // Find referral by referred user
ReferralSchema.index({ referralCode: 1 }); // Find referrals by code
ReferralSchema.index({ status: 1 }); // Find referrals by status
ReferralSchema.index({ createdAt: -1 }); // Sort by creation date
ReferralSchema.index({ referrerId: 1, status: 1 }); // Compound index for active referrals

// Virtual for referrer details
ReferralSchema.virtual('referrer', {
  ref: 'User',
  localField: 'referrerId',
  foreignField: '_id',
  justOne: true,
});

// Virtual for referred user details
ReferralSchema.virtual('referredUser', {
  ref: 'User',
  localField: 'referredUserId',
  foreignField: '_id',
  justOne: true,
});

// Ensure virtual fields are serialized
ReferralSchema.set('toJSON', { virtuals: true });
ReferralSchema.set('toObject', { virtuals: true }); 