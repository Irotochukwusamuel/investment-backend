import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type BankDetailsDocument = BankDetails & Document;

@Schema({ timestamps: true })
export class BankDetails {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ required: true })
  bankName: string;

  @Prop({ required: true })
  bankCode: string;

  @Prop({ required: true })
  sortCode: string;

  @Prop({ required: true })
  accountNumber: string;

  @Prop({ required: true })
  accountName: string;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ default: false })
  isVerified: boolean;

  @Prop()
  verifiedAt?: Date;

  @Prop({ type: Object })
  verificationData?: any;
}

export const BankDetailsSchema = SchemaFactory.createForClass(BankDetails); 