import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type NotificationDocument = Notification & Document;

export enum NotificationType {
  SUCCESS = 'success',
  WARNING = 'warning',
  INFO = 'info',
  ERROR = 'error',
}

export enum NotificationCategory {
  INVESTMENT = 'investment',
  TRANSACTION = 'transaction',
  ACCOUNT = 'account',
  SECURITY = 'security',
  SYSTEM = 'system',
  BONUS = 'bonus',
  WITHDRAWAL = 'withdrawal',
  DEPOSIT = 'deposit',
}

@Schema({ timestamps: true })
export class Notification {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  message: string;

  @Prop({ enum: NotificationType, required: true })
  type: NotificationType;

  @Prop({ enum: NotificationCategory, required: true })
  category: NotificationCategory;

  @Prop({ default: false })
  read: boolean;

  @Prop({ type: Date })
  readAt?: Date;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  readBy?: Types.ObjectId;

  @Prop({ type: Object })
  metadata?: Record<string, any>;

  @Prop({ type: String })
  actionUrl?: string;

  @Prop({ type: String })
  actionText?: string;

  @Prop({ type: Types.ObjectId })
  relatedId?: Types.ObjectId;

  @Prop({ type: String })
  relatedType?: string;

  @Prop({ default: Date.now })
  createdAt: Date;

  @Prop({ default: Date.now })
  updatedAt: Date;
}

export const NotificationSchema = SchemaFactory.createForClass(Notification);

// Add indexes for better performance
NotificationSchema.index({ userId: 1, createdAt: -1 });
NotificationSchema.index({ userId: 1, read: 1 });
NotificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60 }); // Auto-delete after 30 days 