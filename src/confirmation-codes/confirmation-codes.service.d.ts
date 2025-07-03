import { Model } from 'mongoose';
import { ConfirmationCodeDocument } from './schemas/confirmation-code.schema';
export declare class ConfirmationCodesService {
    private confirmationCodeModel;
    constructor(confirmationCodeModel: Model<ConfirmationCodeDocument>);
    generateCode(identifier: string, type: 'email_verification' | 'password_reset' | 'login' | 'phone_verification', options?: {
        expirationMinutes?: number;
        codeLength?: number;
        ipAddress?: string;
        userAgent?: string;
        metadata?: Record<string, any>;
    }): Promise<string>;
    verifyCode(identifier: string, code: string, type: 'email_verification' | 'password_reset' | 'login' | 'phone_verification'): Promise<{
        valid: boolean;
        confirmationCode?: ConfirmationCodeDocument;
    }>;
    canResendCode(identifier: string, type: 'email_verification' | 'password_reset' | 'login' | 'phone_verification', cooldownMinutes?: number): Promise<boolean>;
    getCodeStats(identifier?: string, type?: string, hours?: number): Promise<{
        totalGenerated: number;
        totalVerified: number;
        totalFailed: number;
        averageAttempts: number;
    }>;
    cleanupExpiredCodes(): Promise<number>;
    private generateRandomCode;
    private invalidateExistingCodes;
}
