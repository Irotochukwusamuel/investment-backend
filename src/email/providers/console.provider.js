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
var ConsoleEmailProvider_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConsoleEmailProvider = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const email_templates_1 = require("../email-templates");
let ConsoleEmailProvider = ConsoleEmailProvider_1 = class ConsoleEmailProvider {
    configService;
    logger = new common_1.Logger(ConsoleEmailProvider_1.name);
    isConfiguredFlag;
    constructor(configService) {
        this.configService = configService;
        this.isConfiguredFlag = this.configService.get('CONSOLE_EMAIL_ENABLED', true);
        if (this.isConfiguredFlag) {
            this.logger.log('Console email provider enabled for development/testing');
        }
    }
    async sendEmail(to, subject, htmlContent, from) {
        if (!this.isConfiguredFlag) {
            this.logger.warn('Console email provider not enabled, skipping email send');
            return;
        }
        this.logger.log('=== CONSOLE EMAIL ===');
        this.logger.log(`From: ${from?.name || 'KLT Mines'} <${from?.email || 'noreply@kltmines.com'}>`);
        this.logger.log(`To: ${to}`);
        this.logger.log(`Subject: ${subject}`);
        this.logger.log('Content:');
        this.logger.log(htmlContent);
        this.logger.log('=== END CONSOLE EMAIL ===');
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
        return 'Console';
    }
};
exports.ConsoleEmailProvider = ConsoleEmailProvider;
exports.ConsoleEmailProvider = ConsoleEmailProvider = ConsoleEmailProvider_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], ConsoleEmailProvider);
//# sourceMappingURL=console.provider.js.map