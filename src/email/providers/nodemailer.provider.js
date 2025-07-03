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
var NodemailerEmailProvider_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.NodemailerEmailProvider = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const nodemailer = require("nodemailer");
const email_templates_1 = require("../email-templates");
let NodemailerEmailProvider = NodemailerEmailProvider_1 = class NodemailerEmailProvider {
    configService;
    logger = new common_1.Logger(NodemailerEmailProvider_1.name);
    transporter;
    senderEmail;
    senderName;
    isConfiguredFlag;
    constructor(configService) {
        this.configService = configService;
        const host = this.configService.get('SMTP_HOST');
        const port = this.configService.get('SMTP_PORT', 587);
        const secure = this.configService.get('SMTP_SECURE', false);
        const user = this.configService.get('SMTP_USER');
        const pass = this.configService.get('SMTP_PASS');
        this.senderEmail = this.configService.get('SMTP_SENDER_EMAIL', 'noreply@kltmines.com');
        this.senderName = this.configService.get('SMTP_SENDER_NAME', 'KLT Mines Investment Platform');
        if (!host || !user || !pass) {
            this.logger.warn('SMTP configuration not found in environment variables');
            this.isConfiguredFlag = false;
            this.transporter = nodemailer.createTransport({});
            return;
        }
        try {
            this.transporter = nodemailer.createTransport({
                host,
                port,
                secure,
                auth: {
                    user,
                    pass,
                },
            });
            this.isConfiguredFlag = true;
            this.logger.log('Nodemailer email provider configured successfully');
        }
        catch (error) {
            this.logger.error('Failed to configure Nodemailer email provider:', error);
            this.isConfiguredFlag = false;
            this.transporter = nodemailer.createTransport({});
        }
    }
    async sendEmail(to, subject, htmlContent, from) {
        if (!this.isConfiguredFlag) {
            this.logger.warn('Nodemailer email provider not configured, skipping email send');
            return;
        }
        try {
            const mailOptions = {
                from: `"${from?.name || this.senderName}" <${from?.email || this.senderEmail}>`,
                to,
                subject,
                html: htmlContent,
            };
            await this.transporter.sendMail(mailOptions);
            this.logger.log(`Email sent successfully to ${to} via Nodemailer`);
        }
        catch (error) {
            this.logger.error(`Failed to send email to ${to} via Nodemailer:`, error);
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
        return 'Nodemailer';
    }
};
exports.NodemailerEmailProvider = NodemailerEmailProvider;
exports.NodemailerEmailProvider = NodemailerEmailProvider = NodemailerEmailProvider_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], NodemailerEmailProvider);
//# sourceMappingURL=nodemailer.provider.js.map