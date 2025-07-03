import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { ApiProperty } from '@nestjs/swagger';

export type ConfirmationCodeDocument = ConfirmationCode & Document;

@Schema({ timestamps: true })
export class ConfirmationCode {
  @ApiProperty({ description: 'Email or phone number' })
  @Prop({ required: true, index: true })
  identifier: string;

  @ApiProperty({ description: 'The OTP code' })
  @Prop({ required: true })
  code: string;

  @ApiProperty({ description: 'Type of confirmation', enum: ['email_verification', 'password_reset', 'login', 'phone_verification'] })
  @Prop({ required: true, enum: ['email_verification', 'password_reset', 'login', 'phone_verification'] })
  type: 'email_verification' | 'password_reset' | 'login' | 'phone_verification';

  @ApiProperty({ description: 'Expiration date' })
  @Prop({ required: true, index: { expireAfterSeconds: 0 } })
  expiresAt: Date;

  @ApiProperty({ description: 'Number of verification attempts' })
  @Prop({ default: 0 })
  attempts: number;

  @ApiProperty({ description: 'Maximum allowed attempts' })
  @Prop({ default: 3 })
  maxAttempts: number;

  @ApiProperty({ description: 'Whether the code has been used' })
  @Prop({ default: false })
  isUsed: boolean;

  @ApiProperty({ description: 'IP address of the requester' })
  @Prop()
  ipAddress?: string;

  @ApiProperty({ description: 'User agent of the requester' })
  @Prop()
  userAgent?: string;

  @ApiProperty({ description: 'Additional metadata' })
  @Prop({ type: Object })
  metadata?: Record<string, any>;

  @ApiProperty({ description: 'Creation timestamp' })
  createdAt: Date;

  @ApiProperty({ description: 'Last update timestamp' })
  updatedAt: Date;
}

export const ConfirmationCodeSchema = SchemaFactory.createForClass(ConfirmationCode);

// Create compound index for efficient querying
ConfirmationCodeSchema.index({ identifier: 1, type: 1, isUsed: 1 });
ConfirmationCodeSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); 