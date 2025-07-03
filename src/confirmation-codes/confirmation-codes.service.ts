import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ConfirmationCode, ConfirmationCodeDocument } from './schemas/confirmation-code.schema';
@Injectable()
export class ConfirmationCodesService {
  constructor(
    @InjectModel(ConfirmationCode.name)
    private confirmationCodeModel: Model<ConfirmationCodeDocument>,
  ) {}

  /**
   * Generate and store a new confirmation code
   */
  async generateCode(
    identifier: string,
    type: 'email_verification' | 'password_reset' | 'login' | 'phone_verification',
    options?: {
      expirationMinutes?: number;
      codeLength?: number;
      ipAddress?: string;
      userAgent?: string;
      metadata?: Record<string, any>;
    }
  ): Promise<string> {
    const {
      expirationMinutes = 10,
      codeLength = 6,
      ipAddress,
      userAgent,
      metadata
    } = options || {};

    // Generate random OTP code
    const code = this.generateRandomCode(codeLength);
    
    // Set expiration time
    const expiresAt = new Date(Date.now() + expirationMinutes * 60 * 1000);

    // Invalidate any existing codes for this identifier and type
    await this.invalidateExistingCodes(identifier, type);

    // Create new confirmation code
    const confirmationCode = new this.confirmationCodeModel({
      identifier: identifier.toLowerCase(),
      code,
      type,
      expiresAt,
      attempts: 0,
      maxAttempts: 3,
      isUsed: false,
      ipAddress,
      userAgent,
      metadata,
    });

    await confirmationCode.save();

    return code;
  }

  /**
   * Verify a confirmation code
   */
  async verifyCode(
    identifier: string,
    code: string,
    type: 'email_verification' | 'password_reset' | 'login' | 'phone_verification'
  ): Promise<{ valid: boolean; confirmationCode?: ConfirmationCodeDocument }> {
    const confirmationCode = await this.confirmationCodeModel.findOne({
      identifier: identifier.toLowerCase(),
      type,
      isUsed: false,
    }).sort({ createdAt: -1 });

    if (!confirmationCode) {
      throw new BadRequestException('Confirmation code not found or expired');
    }

    // Check if code has expired
    if (confirmationCode.expiresAt < new Date()) {
      await this.confirmationCodeModel.deleteOne({ _id: confirmationCode._id });
      throw new BadRequestException('Confirmation code has expired');
    }

    // Check if maximum attempts exceeded
    if (confirmationCode.attempts >= confirmationCode.maxAttempts) {
      await this.confirmationCodeModel.deleteOne({ _id: confirmationCode._id });
      throw new BadRequestException('Too many failed attempts');
    }

    // Increment attempts
    confirmationCode.attempts += 1;
    await confirmationCode.save();

    // Verify code
    if (confirmationCode.code !== code) {
      throw new BadRequestException('Invalid confirmation code');
    }

    // Mark as used
    confirmationCode.isUsed = true;
    await confirmationCode.save();

    return { valid: true, confirmationCode };
  }

  /**
   * Check if a code can be resent (rate limiting)
   */
  async canResendCode(
    identifier: string,
    type: 'email_verification' | 'password_reset' | 'login' | 'phone_verification',
    cooldownMinutes: number = 1
  ): Promise<boolean> {
    const recentCode = await this.confirmationCodeModel.findOne({
      identifier: identifier.toLowerCase(),
      type,
    }).sort({ createdAt: -1 });

    if (!recentCode) {
      return true;
    }

    const cooldownTime = new Date(Date.now() - cooldownMinutes * 60 * 1000);
    return recentCode.createdAt < cooldownTime;
  }

  /**
   * Get confirmation code statistics for monitoring
   */
  async getCodeStats(
    identifier?: string,
    type?: string,
    hours: number = 24
  ): Promise<{
    totalGenerated: number;
    totalVerified: number;
    totalFailed: number;
    averageAttempts: number;
  }> {
    const since = new Date(Date.now() - hours * 60 * 60 * 1000);
    
    const matchStage: any = { createdAt: { $gte: since } };
    if (identifier) matchStage.identifier = identifier.toLowerCase();
    if (type) matchStage.type = type;

    const stats = await this.confirmationCodeModel.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: null,
          totalGenerated: { $sum: 1 },
          totalVerified: { $sum: { $cond: ['$isUsed', 1, 0] } },
          totalFailed: { 
            $sum: { 
              $cond: [
                { $and: [{ $not: '$isUsed' }, { $gte: ['$attempts', '$maxAttempts'] }] },
                1,
                0
              ]
            }
          },
          averageAttempts: { $avg: '$attempts' }
        }
      }
    ]);

    return stats[0] || {
      totalGenerated: 0,
      totalVerified: 0,
      totalFailed: 0,
      averageAttempts: 0
    };
  }

  /**
   * Clean up expired codes (called by cron job)
   */
  async cleanupExpiredCodes(): Promise<number> {
    const result = await this.confirmationCodeModel.deleteMany({
      expiresAt: { $lt: new Date() }
    });

    return result.deletedCount;
  }

  /**
   * Generate a random numeric code
   */
  private generateRandomCode(length: number): string {
    const min = Math.pow(10, length - 1);
    const max = Math.pow(10, length) - 1;
    return Math.floor(Math.random() * (max - min + 1) + min).toString();
  }

  /**
   * Invalidate existing codes for identifier and type
   */
  private async invalidateExistingCodes(
    identifier: string,
    type: 'email_verification' | 'password_reset' | 'login' | 'phone_verification'
  ): Promise<void> {
    await this.confirmationCodeModel.updateMany(
      {
        identifier: identifier.toLowerCase(),
        type,
        isUsed: false,
      },
      {
        isUsed: true,
        metadata: { invalidatedAt: new Date(), reason: 'new_code_generated' }
      }
    );
  }
} 