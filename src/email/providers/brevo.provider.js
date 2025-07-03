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
var BrevoEmailProvider_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.BrevoEmailProvider = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const SibApiV3Sdk = require("@sendinblue/client");
const email_templates_1 = require("../email-templates");
let BrevoEmailProvider = BrevoEmailProvider_1 = class BrevoEmailProvider {
    configService;
    logger = new common_1.Logger(BrevoEmailProvider_1.name);
    apiInstance;
    senderEmail;
    senderName;
    isConfiguredFlag;
    constructor(configService) {
        this.configService = configService;
        const apiKey = this.configService.get('BREVO_API_KEY');
        this.senderEmail = this.configService.get('BREVO_SENDER_EMAIL', 'noreply@kltmines.com');
        this.senderName = this.configService.get('BREVO_SENDER_NAME', 'KLT Mines Investment Platform');
        if (!apiKey) {
            this.logger.warn('BREVO_API_KEY not found in environment variables');
            this.isConfiguredFlag = false;
            this.apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();
            return;
        }
        try {
            const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();
            apiInstance.setApiKey(SibApiV3Sdk.TransactionalEmailsApiApiKeys.apiKey, apiKey);
            this.apiInstance = apiInstance;
            this.isConfiguredFlag = true;
            this.logger.log('Brevo email provider configured successfully');
        }
        catch (error) {
            this.logger.error('Failed to configure Brevo email provider:', error);
            this.isConfiguredFlag = false;
            this.apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();
        }
    }
    async sendEmail(to, subject, htmlContent, from) {
        if (!this.isConfiguredFlag) {
            this.logger.warn('Brevo email provider not configured, skipping email send');
            return;
        }
        try {
            const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();
            sendSmtpEmail.subject = subject;
            sendSmtpEmail.htmlContent = htmlContent;
            sendSmtpEmail.sender = {
                name: from?.name || this.senderName,
                email: from?.email || this.senderEmail
            };
            sendSmtpEmail.to = [{ email: to }];
            const response = await this.apiInstance.sendTransacEmail(sendSmtpEmail);
            this.logger.log(`Email sent successfully to ${to} via Brevo. Message ID: ${response.body?.messageId}`);
        }
        catch (error) {
            this.logger.error(`Failed to send email to ${to} via Brevo:`, error);
            throw error;
        }
    }
    async sendTemplateEmail(to, templateName, templateData, from) {
        const template = email_templates_1.emailTemplates[templateName];
        if (!template) {
            throw new Error(`Email template '${templateName}' not found`);
        }
        const subject = template.subject.replace(/\${(\w+)}/g, (match, key) => {
            return templateData[key] || match;
        });
        const htmlContent = template.html(templateData);
        await this.sendEmail(to, subject, htmlContent, from);
    }
    isConfigured() {
        return this.isConfiguredFlag;
    }
    getProviderName() {
        return 'Brevo';
    }
};
exports.BrevoEmailProvider = BrevoEmailProvider;
exports.BrevoEmailProvider = BrevoEmailProvider = BrevoEmailProvider_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], BrevoEmailProvider);
//# sourceMappingURL=brevo.provider.js.map