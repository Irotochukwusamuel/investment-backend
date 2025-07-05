import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type VirtualWalletDocument = VirtualWallet & Document;

export enum VirtualWalletStatus {
  PENDING = 'PENDING',
  ACTIVE = 'ACTIVE',
  PAID = 'PAID',
  EXPIRED = 'EXPIRED',
  CANCELLED = 'CANCELLED',
}

@Schema({ timestamps: true })
export class VirtualWallet {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ required: true })
  customerName: string;

  @Prop({ required: true })
  email: string;

  @Prop({ required: true })
  phone: string;

  @Prop({ required: true })
  amount: number;

  @Prop({ required: true })
  merchantReference: string;

  @Prop({ required: true })
  description: string;

  @Prop({ required: true })
  expireTimeInMin: number;

  @Prop({ required: true })
  expiresAt: Date;

  @Prop({ enum: VirtualWalletStatus, default: VirtualWalletStatus.PENDING })
  status: VirtualWalletStatus;

  @Prop()
  fintavaId?: string;

  @Prop()
  bank?: string;

  @Prop()
  virtualAcctName?: string;

  @Prop()
  virtualAcctNo?: string;

  @Prop()
  paymentStatus?: string;

  @Prop()
  requestTime?: Date;

  @Prop()
  paymentTime?: Date;

  @Prop({ type: Object })
  metadata?: Record<string, any>;

  @Prop({ type: Object })
  webhookData?: Record<string, any>;

  @Prop({ default: Date.now })
  createdAt: Date;

  @Prop({ default: Date.now })
  updatedAt: Date;
}

export const VirtualWalletSchema = SchemaFactory.createForClass(VirtualWallet);

// Add indexes for better performance
VirtualWalletSchema.index({ userId: 1, createdAt: -1 });
VirtualWalletSchema.index({ merchantReference: 1 }, { unique: true });
VirtualWalletSchema.index({ fintavaId: 1 });
VirtualWalletSchema.index({ status: 1 });
VirtualWalletSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // Auto-delete expired wallets 