import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EmailProvider } from './email-provider.interface';
import { BrevoEmailProvider } from './providers/brevo.provider';
import { NodemailerEmailProvider } from './providers/nodemailer.provider';
import { ConsoleEmailProvider } from './providers/console.provider';
import { emailTemplates, EmailTemplateData } from './email-templates';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly activeProvider: EmailProvider;
  private readonly fallbackProvider: EmailProvider;

  constructor(
    private readonly configService: ConfigService,
    private readonly brevoProvider: BrevoEmailProvider,
    private readonly nodemailerProvider: NodemailerEmailProvider,
    private readonly consoleProvider: ConsoleEmailProvider,
  ) {
    const preferredProvider = this.configService.get<string>('EMAIL_PROVIDER', 'brevo');
    
    // Set up the active provider based on configuration
    switch (preferredProvider.toLowerCase()) {
      case 'brevo':
        this.activeProvider = this.brevoProvider;
        this.fallbackProvider = this.nodemailerProvider;
        break;
      case 'nodemailer':
        this.activeProvider = this.nodemailerProvider;
        this.fallbackProvider = this.brevoProvider;
        break;
      case 'console':
        this.activeProvider = this.consoleProvider;
        this.fallbackProvider = this.consoleProvider;
        break;
      default:
        this.activeProvider = this.brevoProvider;
        this.fallbackProvider = this.nodemailerProvider;
    }

    this.logger.log(`Email service initialized with ${this.activeProvider.getProviderName()} as primary provider`);
    
    if (!this.activeProvider.isConfigured()) {
      this.logger.warn(`Primary email provider (${this.activeProvider.getProviderName()}) is not configured`);
      if (this.fallbackProvider.isConfigured()) {
        this.logger.log(`Fallback to ${this.fallbackProvider.getProviderName()}`);
      } else {
        this.logger.warn('No email providers are configured, emails will not be sent');
      }
    }
  }

  /**
   * Send a custom email
   */
  async sendEmail(
    to: string, 
    subject: string, 
    htmlContent: string, 
    from?: { name: string; email: string }
  ): Promise<void> {
    try {
      if (this.activeProvider.isConfigured()) {
        await this.activeProvider.sendEmail(to, subject, htmlContent, from);
      } else if (this.fallbackProvider.isConfigured()) {
        this.logger.warn(`Primary provider failed, using fallback: ${this.fallbackProvider.getProviderName()}`);
        await this.fallbackProvider.sendEmail(to, subject, htmlContent, from);
      } else {
        this.logger.error('No email providers are configured');
        throw new Error('No email providers are configured');
      }
    } catch (error) {
      this.logger.error(`Failed to send email to ${to}:`, error);
      throw error;
    }
  }

  /**
   * Send an email using a template
   */
  async sendTemplateEmail(
    to: string, 
    templateName: string, 
    templateData: EmailTemplateData, 
    from?: { name: string; email: string }
  ): Promise<void> {
    try {
      if (this.activeProvider.isConfigured()) {
        await this.activeProvider.sendTemplateEmail(to, templateName, templateData, from);
      } else if (this.fallbackProvider.isConfigured()) {
        this.logger.warn(`Primary provider failed, using fallback: ${this.fallbackProvider.getProviderName()}`);
        await this.fallbackProvider.sendTemplateEmail(to, templateName, templateData, from);
      } else {
        this.logger.error('No email providers are configured');
        throw new Error('No email providers are configured');
      }
    } catch (error) {
      this.logger.error(`Failed to send template email to ${to}:`, error);
      throw error;
    }
  }

  /**
   * Send welcome email
   */
  async sendWelcomeEmail(userEmail: string, userName: string): Promise<void> {
    const dashboardUrl = this.configService.get<string>('FRONTEND_URL', 'http://localhost:3000') + '/dashboard';
    
    await this.sendTemplateEmail(userEmail, 'welcome', {
      userName,
      userEmail,
      dashboardUrl,
    });
  }

  /**
   * Send password reset email
   */
  async sendPasswordResetEmail(userEmail: string, userName: string, otpCode: string): Promise<void> {
    const resetUrl = `${this.configService.get('FRONTEND_URL')}/reset-password`;
    
    await this.sendTemplateEmail(userEmail, 'passwordReset', {
      userName,
      userEmail,
      otpCode,
      resetUrl,
    });
  }

  /**
   * Send investment confirmation email
   */
  async sendInvestmentConfirmation(
    userEmail: string, 
    userName: string, 
    investmentData: any
  ): Promise<void> {
    const dashboardUrl = this.configService.get<string>('FRONTEND_URL', 'http://localhost:3000') + '/dashboard/investments';
    
    await this.sendTemplateEmail(userEmail, 'investmentConfirmation', {
      userName,
      userEmail,
      dashboardUrl,
      planName: investmentData.planName,
      amount: investmentData.amount,
      currency: investmentData.currency,
      dailyRoi: investmentData.dailyRoi,
      duration: investmentData.duration,
      startDate: investmentData.startDate,
      expectedTotalRoi: investmentData.expectedTotalRoi,
      investmentId: investmentData.investmentId,
    });
  }

  /**
   * Send ROI payment notification email
   */
  async sendRoiPaymentNotification(
    userEmail: string, 
    userName: string, 
    roiData: any
  ): Promise<void> {
    const dashboardUrl = this.configService.get<string>('FRONTEND_URL', 'http://localhost:3000') + '/dashboard/wallet';
    
    await this.sendTemplateEmail(userEmail, 'roiPayment', {
      userName,
      userEmail,
      dashboardUrl,
      amount: roiData.amount,
      currency: roiData.currency,
      investmentName: roiData.investmentName,
      paymentDate: roiData.paymentDate,
      paymentType: roiData.paymentType,
      transactionId: roiData.transactionId,
    });
  }

  /**
   * Send transaction confirmation email
   */
  async sendTransactionConfirmation(
    userEmail: string, 
    userName: string, 
    transactionData: any
  ): Promise<void> {
    const dashboardUrl = this.configService.get<string>('FRONTEND_URL', 'http://localhost:3000') + '/dashboard';
    
    await this.sendTemplateEmail(userEmail, 'transactionConfirmation', {
      userName,
      userEmail,
      dashboardUrl,
      status: transactionData.status,
      type: transactionData.type,
      amount: transactionData.amount,
      currency: transactionData.currency,
      reference: transactionData.reference,
      date: transactionData.date,
      description: transactionData.description,
    });
  }

  /**
   * Send investment completion email
   */
  async sendInvestmentCompletion(
    userEmail: string, 
    userName: string, 
    investmentData: any
  ): Promise<void> {
    const dashboardUrl = this.configService.get<string>('FRONTEND_URL', 'http://localhost:3000') + '/dashboard/wallet';
    
    await this.sendTemplateEmail(userEmail, 'investmentCompletion', {
      userName,
      userEmail,
      dashboardUrl,
      planName: investmentData.planName,
      initialAmount: investmentData.initialAmount,
      totalRoi: investmentData.totalRoi,
      currency: investmentData.currency,
      completionDate: investmentData.completionDate,
      duration: investmentData.duration,
      investmentId: investmentData.investmentId,
    });
  }

  /**
   * Send referral bonus email
   */
  async sendReferralBonusEmail(
    userEmail: string, 
    userName: string, 
    referralData: any
  ): Promise<void> {
    const dashboardUrl = this.configService.get<string>('FRONTEND_URL', 'http://localhost:3000') + '/dashboard/wallet';
    
    await this.sendTemplateEmail(userEmail, 'referralBonus', {
      userName,
      userEmail,
      dashboardUrl,
      bonusAmount: referralData.bonusAmount,
      currency: referralData.currency,
      referredUserName: referralData.referredUserName,
      referredInvestmentAmount: referralData.referredInvestmentAmount,
      bonusPercentage: referralData.bonusPercentage,
      dateEarned: referralData.dateEarned,
      referralId: referralData.referralId,
    });
  }

  /**
   * Send welcome bonus email
   */
  async sendWelcomeBonusEmail(
    userEmail: string, 
    userName: string, 
    bonusData: any
  ): Promise<void> {
    const dashboardUrl = this.configService.get<string>('FRONTEND_URL', 'http://localhost:3000') + '/dashboard/wallet';
    
    await this.sendTemplateEmail(userEmail, 'welcomeBonus', {
      userName,
      userEmail,
      dashboardUrl,
      bonusAmount: bonusData.bonusAmount,
      currency: bonusData.currency,
      availableDate: bonusData.availableDate,
      userId: bonusData.userId,
    });
  }

  /**
   * Send account verification email
   */
  async sendAccountVerificationEmail(
    userEmail: string, 
    userName: string, 
    verificationCode: string
  ): Promise<void> {
    const verificationUrl = `${this.configService.get('FRONTEND_URL')}/verify-email`;
    
    await this.sendTemplateEmail(userEmail, 'accountVerification', {
      userName,
      userEmail,
      verificationCode,
      verificationUrl,
    });
  }

  /**
   * Send login OTP email
   */
  async sendLoginOtpEmail(
    userEmail: string, 
    userName: string, 
    otpCode: string,
    ipAddress?: string,
    device?: string
  ): Promise<void> {
    const loginUrl = `${this.configService.get('FRONTEND_URL')}/login`;
    
    await this.sendTemplateEmail(userEmail, 'loginOtp', {
      userName,
      userEmail,
      otpCode,
      loginUrl,
      ipAddress,
      device,
    });
  }

  /**
   * Send security alert email
   */
  async sendSecurityAlertEmail(
    userEmail: string, 
    userName: string, 
    alertData: any
  ): Promise<void> {
    const securityUrl = `${this.configService.get('FRONTEND_URL')}/dashboard/security`;
    
    await this.sendTemplateEmail(userEmail, 'securityAlert', {
      userName,
      userEmail,
      securityUrl,
      alertType: alertData.alertType,
      alertDate: alertData.alertDate,
      ipAddress: alertData.ipAddress,
      location: alertData.location,
      device: alertData.device,
      alertId: alertData.alertId,
    });
  }

  /**
   * Send withdrawal request email
   */
  async sendWithdrawalRequestEmail(
    userEmail: string, 
    userName: string, 
    withdrawalData: any
  ): Promise<void> {
    const dashboardUrl = this.configService.get<string>('FRONTEND_URL', 'http://localhost:3000') + '/dashboard/withdrawals';
    
    await this.sendTemplateEmail(userEmail, 'withdrawalRequest', {
      userName,
      userEmail,
      dashboardUrl,
      amount: withdrawalData.amount,
      currency: withdrawalData.currency,
      withdrawalMethod: withdrawalData.withdrawalMethod,
      reference: withdrawalData.reference,
      requestDate: withdrawalData.requestDate,
      accountDetails: withdrawalData.accountDetails,
    });
  }

  /**
   * Send withdrawal completed email
   */
  async sendWithdrawalCompletedEmail(
    userEmail: string, 
    userName: string, 
    withdrawalData: any
  ): Promise<void> {
    const dashboardUrl = this.configService.get<string>('FRONTEND_URL', 'http://localhost:3000') + '/dashboard/withdrawals';
    
    await this.sendTemplateEmail(userEmail, 'withdrawalCompleted', {
      userName,
      userEmail,
      dashboardUrl,
      amount: withdrawalData.amount,
      currency: withdrawalData.currency,
      withdrawalMethod: withdrawalData.withdrawalMethod,
      reference: withdrawalData.reference,
      completionDate: withdrawalData.completionDate,
      accountDetails: withdrawalData.accountDetails,
      transactionHash: withdrawalData.transactionHash,
    });
  }

  /**
   * Send deposit request email
   */
  async sendDepositRequestEmail(
    userEmail: string, 
    userName: string, 
    depositData: any
  ): Promise<void> {
    const dashboardUrl = this.configService.get<string>('FRONTEND_URL', 'http://localhost:3000') + '/dashboard/wallet';
    
    await this.sendTemplateEmail(userEmail, 'depositRequest', {
      userName,
      userEmail,
      dashboardUrl,
      amount: depositData.amount,
      currency: depositData.currency,
      paymentMethod: depositData.paymentMethod,
      reference: depositData.reference,
      requestDate: depositData.requestDate,
      accountDetails: depositData.accountDetails,
    });
  }

  /**
   * Send deposit confirmed email
   */
  async sendDepositConfirmedEmail(
    userEmail: string, 
    userName: string, 
    depositData: any
  ): Promise<void> {
    const dashboardUrl = this.configService.get<string>('FRONTEND_URL', 'http://localhost:3000') + '/dashboard/wallet';
    
    await this.sendTemplateEmail(userEmail, 'depositConfirmed', {
      userName,
      userEmail,
      dashboardUrl,
      amount: depositData.amount,
      currency: depositData.currency,
      paymentMethod: depositData.paymentMethod,
      reference: depositData.reference,
      confirmationDate: depositData.confirmationDate,
      transactionHash: depositData.transactionHash,
    });
  }

  /**
   * Get the current active provider name
   */
  getActiveProviderName(): string {
    return this.activeProvider.getProviderName();
  }

  /**
   * Get the fallback provider name
   */
  getFallbackProviderName(): string {
    return this.fallbackProvider.getProviderName();
  }

  /**
   * Check if the active provider is configured
   */
  isActiveProviderConfigured(): boolean {
    return this.activeProvider.isConfigured();
  }

  /**
   * Check if the fallback provider is configured
   */
  isFallbackProviderConfigured(): boolean {
    return this.fallbackProvider.isConfigured();
  }

  /**
   * Get available email templates
   */
  getAvailableTemplates(): string[] {
    return Object.keys(emailTemplates);
  }
} 