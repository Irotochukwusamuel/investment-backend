"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var EmailService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmailService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const brevo_provider_1 = require("./providers/brevo.provider");
const nodemailer_provider_1 = require("./providers/nodemailer.provider");
const console_provider_1 = require("./providers/console.provider");
const email_templates_1 = require("./email-templates");
let EmailService = EmailService_1 = class EmailService {
    configService;
    brevoProvider;
    nodemailerProvider;
    consoleProvider;
    logger = new common_1.Logger(EmailService_1.name);
    activeProvider;
    fallbackProvider;
    constructor(configService, brevoProvider, nodemailerProvider, consoleProvider) {
        this.configService = configService;
        this.brevoProvider = brevoProvider;
        this.nodemailerProvider = nodemailerProvider;
        this.consoleProvider = consoleProvider;
        const preferredProvider = this.configService.get('EMAIL_PROVIDER', 'brevo');
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
            }
            else {
                this.logger.warn('No email providers are configured, emails will not be sent');
            }
        }
    }
    async sendEmail(to, subject, htmlContent, from) {
        try {
            if (this.activeProvider.isConfigured()) {
                await this.activeProvider.sendEmail(to, subject, htmlContent, from);
            }
            else if (this.fallbackProvider.isConfigured()) {
                this.logger.warn(`Primary provider failed, using fallback: ${this.fallbackProvider.getProviderName()}`);
                await this.fallbackProvider.sendEmail(to, subject, htmlContent, from);
            }
            else {
                this.logger.error('No email providers are configured');
                throw new Error('No email providers are configured');
            }
        }
        catch (error) {
            this.logger.error(`Failed to send email to ${to}:`, error);
            throw error;
        }
    }
    async sendTemplateEmail(to, templateName, templateData, from) {
        try {
            if (this.activeProvider.isConfigured()) {
                await this.activeProvider.sendTemplateEmail(to, templateName, templateData, from);
            }
            else if (this.fallbackProvider.isConfigured()) {
                this.logger.warn(`Primary provider failed, using fallback: ${this.fallbackProvider.getProviderName()}`);
                await this.fallbackProvider.sendTemplateEmail(to, templateName, templateData, from);
            }
            else {
                this.logger.error('No email providers are configured');
                throw new Error('No email providers are configured');
            }
        }
        catch (error) {
            this.logger.error(`Failed to send template email to ${to}:`, error);
            throw error;
        }
    }
    async sendWelcomeEmail(userEmail, userName) {
        const dashboardUrl = this.configService.get('FRONTEND_URL', 'http://localhost:3000') + '/dashboard';
        await this.sendTemplateEmail(userEmail, 'welcome', {
            userName,
            userEmail,
            dashboardUrl,
        });
    }
    async sendPasswordResetEmail(userEmail, userName, otpCode) {
        const resetUrl = `${this.configService.get('FRONTEND_URL')}/reset-password`;
        await this.sendTemplateEmail(userEmail, 'passwordReset', {
            userName,
            userEmail,
            otpCode,
            resetUrl,
        });
    }
    async sendInvestmentConfirmation(userEmail, userName, investmentData) {
        const dashboardUrl = this.configService.get('FRONTEND_URL', 'http://localhost:3000') + '/dashboard/investments';
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
    async sendRoiPaymentNotification(userEmail, userName, roiData) {
        const dashboardUrl = this.configService.get('FRONTEND_URL', 'http://localhost:3000') + '/dashboard/wallet';
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
    async sendTransactionConfirmation(userEmail, userName, transactionData) {
        const dashboardUrl = this.configService.get('FRONTEND_URL', 'http://localhost:3000') + '/dashboard';
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
    async sendInvestmentCompletion(userEmail, userName, investmentData) {
        const dashboardUrl = this.configService.get('FRONTEND_URL', 'http://localhost:3000') + '/dashboard/wallet';
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
    async sendReferralBonusEmail(userEmail, userName, referralData) {
        const dashboardUrl = this.configService.get('FRONTEND_URL', 'http://localhost:3000') + '/dashboard/wallet';
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
    async sendWelcomeBonusEmail(userEmail, userName, bonusData) {
        const dashboardUrl = this.configService.get('FRONTEND_URL', 'http://localhost:3000') + '/dashboard/wallet';
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
    async sendAccountVerificationEmail(userEmail, userName, verificationCode) {
        const verificationUrl = `${this.configService.get('FRONTEND_URL')}/verify-email`;
        await this.sendTemplateEmail(userEmail, 'accountVerification', {
            userName,
            userEmail,
            verificationCode,
            verificationUrl,
        });
    }
    async sendLoginOtpEmail(userEmail, userName, otpCode, ipAddress, device) {
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
    async sendSecurityAlertEmail(userEmail, userName, alertData) {
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
    async sendWithdrawalRequestEmail(userEmail, userName, withdrawalData) {
        const dashboardUrl = this.configService.get('FRONTEND_URL', 'http://localhost:3000') + '/dashboard/withdrawals';
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
    async sendWithdrawalCompletedEmail(userEmail, userName, withdrawalData) {
        const dashboardUrl = this.configService.get('FRONTEND_URL', 'http://localhost:3000') + '/dashboard/withdrawals';
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
    async sendDepositRequestEmail(userEmail, userName, depositData) {
        const dashboardUrl = this.configService.get('FRONTEND_URL', 'http://localhost:3000') + '/dashboard/wallet';
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
    async sendDepositConfirmedEmail(userEmail, userName, depositData) {
        const dashboardUrl = this.configService.get('FRONTEND_URL', 'http://localhost:3000') + '/dashboard/wallet';
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
    getActiveProviderName() {
        return this.activeProvider.getProviderName();
    }
    getFallbackProviderName() {
        return this.fallbackProvider.getProviderName();
    }
    isActiveProviderConfigured() {
        return this.activeProvider.isConfigured();
    }
    isFallbackProviderConfigured() {
        return this.fallbackProvider.isConfigured();
    }
    getAvailableTemplates() {
        return Object.keys(email_templates_1.emailTemplates);
    }
};
exports.EmailService = EmailService;
exports.EmailService = EmailService = EmailService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService,
        brevo_provider_1.BrevoEmailProvider,
        nodemailer_provider_1.NodemailerEmailProvider,
        console_provider_1.ConsoleEmailProvider])
], EmailService);
//# sourceMappingURL=email.service.js.map