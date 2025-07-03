import { ConfigService } from '@nestjs/config';
import { BrevoEmailProvider } from './providers/brevo.provider';
import { NodemailerEmailProvider } from './providers/nodemailer.provider';
import { ConsoleEmailProvider } from './providers/console.provider';
import { EmailTemplateData } from './email-templates';
export declare class EmailService {
    private readonly configService;
    private readonly brevoProvider;
    private readonly nodemailerProvider;
    private readonly consoleProvider;
    private readonly logger;
    private readonly activeProvider;
    private readonly fallbackProvider;
    constructor(configService: ConfigService, brevoProvider: BrevoEmailProvider, nodemailerProvider: NodemailerEmailProvider, consoleProvider: ConsoleEmailProvider);
    sendEmail(to: string, subject: string, htmlContent: string, from?: {
        name: string;
        email: string;
    }): Promise<void>;
    sendTemplateEmail(to: string, templateName: string, templateData: EmailTemplateData, from?: {
        name: string;
        email: string;
    }): Promise<void>;
    sendWelcomeEmail(userEmail: string, userName: string): Promise<void>;
    sendPasswordResetEmail(userEmail: string, userName: string, otpCode: string): Promise<void>;
    sendInvestmentConfirmation(userEmail: string, userName: string, investmentData: any): Promise<void>;
    sendRoiPaymentNotification(userEmail: string, userName: string, roiData: any): Promise<void>;
    sendTransactionConfirmation(userEmail: string, userName: string, transactionData: any): Promise<void>;
    sendInvestmentCompletion(userEmail: string, userName: string, investmentData: any): Promise<void>;
    sendReferralBonusEmail(userEmail: string, userName: string, referralData: any): Promise<void>;
    sendWelcomeBonusEmail(userEmail: string, userName: string, bonusData: any): Promise<void>;
    sendAccountVerificationEmail(userEmail: string, userName: string, verificationCode: string): Promise<void>;
    sendLoginOtpEmail(userEmail: string, userName: string, otpCode: string, ipAddress?: string, device?: string): Promise<void>;
    sendSecurityAlertEmail(userEmail: string, userName: string, alertData: any): Promise<void>;
    sendWithdrawalRequestEmail(userEmail: string, userName: string, withdrawalData: any): Promise<void>;
    sendWithdrawalCompletedEmail(userEmail: string, userName: string, withdrawalData: any): Promise<void>;
    sendDepositRequestEmail(userEmail: string, userName: string, depositData: any): Promise<void>;
    sendDepositConfirmedEmail(userEmail: string, userName: string, depositData: any): Promise<void>;
    getActiveProviderName(): string;
    getFallbackProviderName(): string;
    isActiveProviderConfigured(): boolean;
    isFallbackProviderConfigured(): boolean;
    getAvailableTemplates(): string[];
}
